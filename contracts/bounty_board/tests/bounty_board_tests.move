#[test_only]
module bounty_board::bounty_board_tests;

use bounty_board::bounty_board::{Self, Board};
use std::string;
use sui::test_scenario as ts;

#[test]
fun initialize_board() {
    let mut scenario = ts::begin(@0xA);

    {
        bounty_board::initialize(string::utf8(b"Star Hunter Bounty Board"), ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, @0xA);
    {
        let board = ts::take_shared<Board>(&scenario);
        ts::return_shared(board);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure]
fun initialize_board_rejects_empty_name() {
    let mut scenario = ts::begin(@0xA);

    {
        bounty_board::initialize(string::utf8(b""), ts::ctx(&mut scenario));
    };

    ts::end(scenario);
}
