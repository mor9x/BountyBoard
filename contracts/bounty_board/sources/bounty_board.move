module bounty_board::bounty_board;

use std::string::{Self, String};
use sui::event;

const E_EMPTY_NAME: u64 = 0;

public struct Board has key, store {
    id: UID,
    name: String,
}

public struct BoardInitializedEvent has copy, drop {
    board_id: ID,
    name: String,
}

public fun initialize(name: String, ctx: &mut TxContext) {
    assert!(!string::is_empty(&name), E_EMPTY_NAME);

    let board = Board {
        id: object::new(ctx),
        name,
    };
    let board_id = object::id(&board);
    let board_name = copy board.name;

    event::emit(BoardInitializedEvent {
        board_id,
        name: board_name,
    });

    transfer::share_object(board);
}
