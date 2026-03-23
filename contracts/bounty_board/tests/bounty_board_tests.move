#[test_only]
module bounty_board::bounty_board_tests;

use bounty_board::bounty_board::{
    Self,
    Board,
    InsuranceOrder,
    MultiBountyPool,
    OracleCap,
    SingleBountyPool
};
use std::string::{Self, String};
use sui::{
    balance,
    coin::{Self, Coin},
    clock,
    test_scenario as ts
};
use world::{
    access::{Self, AdminACL},
    character::{Self, Character},
    object_registry::ObjectRegistry,
    world::GovernorCap
};

const GOVERNOR: address = @0xA;
const ADMIN: address = @0xB;
const USER_A: address = @0xC;
const USER_B: address = @0xD;
const USER_C: address = @0xE;
const TRIBE_ID: u32 = 100;
const INSURANCE_DEFAULT_NOTE_BYTES: u64 = 43;
const MILLIS_PER_DAY: u64 = 86_400_000;

public struct RewardToken has drop {}

fun tenant(): String {
    string::utf8(b"utopia")
}

fun empty_note(): String {
    string::utf8(b"")
}

fun long_note(): String {
    string::utf8(b"abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm")
}

fun test_coin(value: u64, ctx: &mut TxContext): Coin<RewardToken> {
    coin::from_balance(balance::create_for_testing<RewardToken>(value), ctx)
}

fun setup(ts: &mut ts::Scenario) {
    bounty_board::init_for_testing(ts::ctx(ts));
    ts::create_system_objects(ts);

    ts::next_tx(ts, GOVERNOR);
    {
        world::world::init_for_testing(ts::ctx(ts));
        access::init_for_testing(ts::ctx(ts));
        world::object_registry::init_for_testing(ts::ctx(ts));
    };

    ts::next_tx(ts, GOVERNOR);
    {
        let gov_cap = ts::take_from_sender<GovernorCap>(ts);
        let mut admin_acl = ts::take_shared<AdminACL>(ts);
        access::add_sponsor_to_acl(&mut admin_acl, &gov_cap, ADMIN);
        access::add_sponsor_to_acl(&mut admin_acl, &gov_cap, USER_A);
        access::add_sponsor_to_acl(&mut admin_acl, &gov_cap, USER_B);
        access::add_sponsor_to_acl(&mut admin_acl, &gov_cap, USER_C);
        ts::return_shared(admin_acl);
        ts::return_to_sender(ts, gov_cap);
    };
}

fun create_character(
    ts: &mut ts::Scenario,
    game_character_id: u32,
    owner: address,
    name: vector<u8>,
): ID {
    let character_id: ID;
    ts::next_tx(ts, ADMIN);
    {
        let admin_acl = ts::take_shared<AdminACL>(ts);
        let mut registry = ts::take_shared<ObjectRegistry>(ts);
        let character = character::create_character(
            &mut registry,
            &admin_acl,
            game_character_id,
            tenant(),
            TRIBE_ID,
            owner,
            string::utf8(name),
            ts::ctx(ts),
        );
        character_id = object::id(&character);
        character::share_character(character, &admin_acl, ts::ctx(ts));
        ts::return_shared(registry);
        ts::return_shared(admin_acl);
    };
    character_id
}

#[test]
fun init_creates_board_and_oracle_cap() {
    let mut ts = ts::begin(GOVERNOR);
    setup(&mut ts);

    ts::next_tx(&mut ts, GOVERNOR);
    {
        let board = ts::take_shared<Board>(&ts);
        let oracle = ts::take_from_sender<OracleCap>(&ts);
        assert!(bounty_board::board_schema_version(&board) == 1, 0);
        assert!(bounty_board::board_min_duration_days(&board) == 7, 1);
        assert!(bounty_board::board_max_duration_days(&board) == 365, 2);
        assert!(bounty_board::board_max_note_bytes(&board) == 64, 3);
        ts::return_shared(board);
        ts::return_to_sender(&ts, oracle);
    };

    ts::end(ts);
}

#[test]
fun single_bounty_settle_and_claim() {
    let mut ts = ts::begin(GOVERNOR);
    setup(&mut ts);
    let hunter_id = create_character(&mut ts, 1, USER_A, b"hunter");
    let target_id = create_character(&mut ts, 2, USER_B, b"target");

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let poster = ts::take_shared_by_id<Character>(&ts, hunter_id);
        let target = ts::take_shared_by_id<Character>(&ts, target_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::create_single_bounty(
            &mut board,
            &poster,
            &target,
            test_coin(1_000, ts::ctx(&mut ts)),
            7,
            bounty_board::any_loss(),
            empty_note(),
            &clock,
            ts::ctx(&mut ts),
        );

        assert!(bounty_board::active_single_bounty_count(&board) == 1, 4);
        clock.destroy_for_testing();
        ts::return_shared(target);
        ts::return_shared(poster);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, GOVERNOR);
    {
        let oracle = ts::take_from_sender<OracleCap>(&ts);
        let pool = ts::take_shared<SingleBountyPool<RewardToken>>(&ts);
        let hunter = ts::take_shared_by_id<Character>(&ts, hunter_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::settle_single_bounty<RewardToken>(
            &oracle,
            pool,
            &hunter,
            1001,
            &clock,
        );

        clock.destroy_for_testing();
        ts::return_shared(hunter);
        ts::return_to_sender(&ts, oracle);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let pool = ts::take_shared<SingleBountyPool<RewardToken>>(&ts);
        let hunter = ts::take_shared_by_id<Character>(&ts, hunter_id);

        assert!(bounty_board::single_claimable_amount(&pool, &hunter) == 1_000, 0);
        bounty_board::claim_single_bounty(&mut board, pool, &hunter, ts::ctx(&mut ts));

        ts::return_shared(hunter);
        assert!(bounty_board::active_single_bounty_count(&board) == 0, 5);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let payout = ts::take_from_sender<Coin<RewardToken>>(&ts);
        assert!(coin::value(&payout) == 1_000, 1);
        let reward_balance = coin::into_balance(payout);
        assert!(balance::destroy_for_testing(reward_balance) == 1_000, 2);
    };

    ts::end(ts);
}

#[test]
fun multi_bounty_records_claimable_reward_and_refunds() {
    let mut ts = ts::begin(GOVERNOR);
    setup(&mut ts);
    let poster_id = create_character(&mut ts, 1, USER_A, b"poster");
    let target_id = create_character(&mut ts, 2, USER_B, b"target");

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let poster = ts::take_shared_by_id<Character>(&ts, poster_id);
        let target = ts::take_shared_by_id<Character>(&ts, target_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::create_multi_bounty(
            &mut board,
            &poster,
            &target,
            test_coin(1_000, ts::ctx(&mut ts)),
            7,
            bounty_board::ship_only(),
            10,
            empty_note(),
            &clock,
            ts::ctx(&mut ts),
        );

        assert!(bounty_board::active_multi_bounty_count(&board) == 1, 6);
        clock.destroy_for_testing();
        ts::return_shared(target);
        ts::return_shared(poster);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, GOVERNOR);
    {
        let oracle = ts::take_from_sender<OracleCap>(&ts);
        let pool = ts::take_shared<MultiBountyPool<RewardToken>>(&ts);
        let hunter = ts::take_shared_by_id<Character>(&ts, poster_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::record_multi_kill<RewardToken>(
            &oracle,
            pool,
            &hunter,
            2001,
            &clock,
        );

        clock.destroy_for_testing();
        ts::return_shared(hunter);
        ts::return_to_sender(&ts, oracle);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let pool = ts::take_shared<MultiBountyPool<RewardToken>>(&ts);
        let hunter = ts::take_shared_by_id<Character>(&ts, poster_id);

        assert!(bounty_board::multi_recorded_kills(&pool) == 1, 3);
        assert!(bounty_board::multi_claimable_amount(&pool, &hunter) == 100, 4);
        bounty_board::claim_multi_bounty(&mut board, pool, &hunter, ts::ctx(&mut ts));

        ts::return_shared(hunter);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let payout = ts::take_from_sender<Coin<RewardToken>>(&ts);
        assert!(coin::value(&payout) == 100, 5);
        let reward_balance = coin::into_balance(payout);
        assert!(balance::destroy_for_testing(reward_balance) == 100, 6);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let pool = ts::take_shared<MultiBountyPool<RewardToken>>(&ts);
        let poster = ts::take_shared_by_id<Character>(&ts, poster_id);
        let mut clock = clock::create_for_testing(ts::ctx(&mut ts));
        clock.set_for_testing(8 * MILLIS_PER_DAY);

        bounty_board::refund_expired_multi_contribution(&mut board, pool, &poster, &clock, ts::ctx(&mut ts));

        clock.destroy_for_testing();
        ts::return_shared(poster);
        assert!(bounty_board::active_multi_bounty_count(&board) == 0, 7);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let refund = ts::take_from_sender<Coin<RewardToken>>(&ts);
        assert!(coin::value(&refund) == 900, 7);
        let refund_balance = coin::into_balance(refund);
        assert!(balance::destroy_for_testing(refund_balance) == 900, 8);
    };

    ts::end(ts);
}

#[test]
fun insurance_trigger_spawns_regular_bounty() {
    let mut ts = ts::begin(GOVERNOR);
    setup(&mut ts);
    let insured_id = create_character(&mut ts, 1, USER_A, b"insured");
    let killer_id = create_character(&mut ts, 2, USER_B, b"killer");
    let hunter_id = create_character(&mut ts, 3, USER_C, b"avenger");

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let insured = ts::take_shared_by_id<Character>(&ts, insured_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::create_insurance_order(
            &mut board,
            &insured,
            test_coin(2_000, ts::ctx(&mut ts)),
            7,
            bounty_board::any_loss(),
            bounty_board::spawn_single(),
            0,
            empty_note(),
            &clock,
            ts::ctx(&mut ts),
        );

        assert!(bounty_board::active_insurance_order_count(&board) == 1, 9);
        clock.destroy_for_testing();
        ts::return_shared(insured);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, USER_A);
    {
        let order = ts::take_shared<InsuranceOrder<RewardToken>>(&ts);
        assert!(bounty_board::insurance_note_length(&order) == INSURANCE_DEFAULT_NOTE_BYTES, 9);
        ts::return_shared(order);
    };

    ts::next_tx(&mut ts, GOVERNOR);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let oracle = ts::take_from_sender<OracleCap>(&ts);
        let order = ts::take_shared<InsuranceOrder<RewardToken>>(&ts);
        let killer = ts::take_shared_by_id<Character>(&ts, killer_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::trigger_insurance_order(
            &mut board,
            &oracle,
            order,
            &killer,
            3001,
            &clock,
            ts::ctx(&mut ts),
        );

        clock.destroy_for_testing();
        ts::return_shared(killer);
        assert!(bounty_board::active_insurance_order_count(&board) == 0, 10);
        assert!(bounty_board::active_single_bounty_count(&board) == 1, 11);
        ts::return_shared(board);
        ts::return_to_sender(&ts, oracle);
    };

    ts::next_tx(&mut ts, GOVERNOR);
    {
        let oracle = ts::take_from_sender<OracleCap>(&ts);
        let pool = ts::take_shared<SingleBountyPool<RewardToken>>(&ts);
        let hunter = ts::take_shared_by_id<Character>(&ts, hunter_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::settle_single_bounty(
            &oracle,
            pool,
            &hunter,
            3002,
            &clock,
        );

        clock.destroy_for_testing();
        ts::return_shared(hunter);
        ts::return_to_sender(&ts, oracle);
    };

    ts::next_tx(&mut ts, USER_C);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let pool = ts::take_shared<SingleBountyPool<RewardToken>>(&ts);
        let hunter = ts::take_shared_by_id<Character>(&ts, hunter_id);

        assert!(bounty_board::single_claimable_amount(&pool, &hunter) == 2_000, 12);
        bounty_board::claim_single_bounty(&mut board, pool, &hunter, ts::ctx(&mut ts));

        ts::return_shared(hunter);
        assert!(bounty_board::active_single_bounty_count(&board) == 0, 13);
        ts::return_shared(board);
    };

    ts::next_tx(&mut ts, USER_C);
    {
        let payout = ts::take_from_sender<Coin<RewardToken>>(&ts);
        assert!(coin::value(&payout) == 2_000, 11);
        let reward_balance = coin::into_balance(payout);
        assert!(balance::destroy_for_testing(reward_balance) == 2_000, 12);
    };

    ts::end(ts);
}

#[test]
#[expected_failure]
fun rejects_note_longer_than_sixty_four_bytes() {
    let mut ts = ts::begin(GOVERNOR);
    setup(&mut ts);
    let insured_id = create_character(&mut ts, 1, USER_A, b"insured");

    ts::next_tx(&mut ts, USER_A);
    {
        let mut board = ts::take_shared<Board>(&ts);
        let insured = ts::take_shared_by_id<Character>(&ts, insured_id);
        let clock = clock::create_for_testing(ts::ctx(&mut ts));

        bounty_board::create_insurance_order(
            &mut board,
            &insured,
            test_coin(500, ts::ctx(&mut ts)),
            7,
            bounty_board::any_loss(),
            bounty_board::spawn_single(),
            0,
            long_note(),
            &clock,
            ts::ctx(&mut ts),
        );

        clock.destroy_for_testing();
        ts::return_shared(insured);
        ts::return_shared(board);
        abort 999
    }
}
