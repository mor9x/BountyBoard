import { describe, expect, test } from "bun:test";
import { requestGraphQL } from "../src/graphql/client";
import { nextCursor, toConnectionPage } from "../src/graphql/pagination";
import { getBountyBoardEventType, queryBountyBoardEvents } from "../src/queries/bounty-board";
import { getBoardRegistrySnapshot, getBoardState } from "../src/queries/board-state";
import { getKillmailCreatedEventType, queryKillmailEvents } from "../src/queries/killmail";

describe("frontier-client", () => {
  test("returns the next cursor only when another page exists", () => {
    expect(nextCursor(toConnectionPage([{ id: "1" }], { hasNextPage: true, endCursor: "cursor-1" }))).toBe("cursor-1");
    expect(nextCursor(toConnectionPage([{ id: "1" }], { hasNextPage: false, endCursor: "cursor-1" }))).toBeNull();
  });

  test("builds the killmail created event type from a package id", () => {
    expect(getKillmailCreatedEventType("0xpackage")).toBe("0xpackage::killmail::KillmailCreatedEvent");
  });

  test("builds a blood contract event type from a package id", () => {
    expect(getBountyBoardEventType("0xpackage", "SingleBountyCreatedEvent")).toBe(
      "0xpackage::bounty_board::SingleBountyCreatedEvent"
    );
  });

  test("maps killmail event fields out of GraphQL contents json", async () => {
    const data = await queryKillmailEvents(
      {
        endpoint: "https://example.com/graphql",
        fetch: async () =>
          new Response(
            JSON.stringify({
              data: {
                events: {
                  edges: [
                    {
                      cursor: "cursor-1",
                      node: {
                        timestamp: "2026-03-20T00:00:00Z",
                        contents: {
                          json: {
                            key: { item_id: "7001", tenant: "UTOPIA" },
                            killer_id: { item_id: "11", tenant: "UTOPIA" },
                            victim_id: { item_id: "22", tenant: "UTOPIA" },
                            reported_by_character_id: { item_id: "33", tenant: "UTOPIA" },
                            solar_system_id: { item_id: "44", tenant: "UTOPIA" },
                            loss_type: { "@variant": "SHIP" },
                            kill_timestamp: "1710892800"
                          }
                        },
                        transaction: {
                          digest: "0xdigest"
                        }
                      }
                    }
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: null
                  }
                }
              }
            })
          )
      },
      {
        packageId: "0xworld",
        first: 1
      }
    );

    expect(data.nodes[0]).toEqual({
      eventType: "0xworld::killmail::KillmailCreatedEvent",
      timestamp: "2026-03-20T00:00:00Z",
      digest: "0xdigest",
      killmailItemId: 7001,
      killerId: { itemId: 11, tenant: "UTOPIA" },
      victimId: { itemId: 22, tenant: "UTOPIA" },
      reportedByCharacterId: { itemId: 33, tenant: "UTOPIA" },
      solarSystemId: { itemId: 44, tenant: "UTOPIA" },
      lossType: "SHIP",
      killTimestamp: 1710892800,
      contentsJson: {
        key: { item_id: "7001", tenant: "UTOPIA" },
        killer_id: { item_id: "11", tenant: "UTOPIA" },
        victim_id: { item_id: "22", tenant: "UTOPIA" },
        reported_by_character_id: { item_id: "33", tenant: "UTOPIA" },
        solar_system_id: { item_id: "44", tenant: "UTOPIA" },
        loss_type: { "@variant": "SHIP" },
        kill_timestamp: "1710892800"
      }
    });
    expect(data.edges[0]?.cursor).toBe("cursor-1");
  });

  test("maps blood contract lifecycle event fields out of GraphQL contents json", async () => {
    const data = await queryBountyBoardEvents(
      {
        endpoint: "https://example.com/graphql",
        fetch: async () =>
          new Response(
            JSON.stringify({
              data: {
                events: {
                  edges: [
                    {
                      cursor: "cursor-created",
                      node: {
                        timestamp: "2026-03-20T00:00:00Z",
                        contents: {
                          json: {
                            bounty_id: "0xpool",
                            board_id: "0xboard",
                            target_key: { item_id: "22", tenant: "UTOPIA" },
                            loss_filter: "1",
                            coin_type: "0x2::sui::SUI",
                            expires_at_ms: "1711497600000",
                            note: "target acquired"
                          }
                        },
                        transaction: {
                          digest: "0xdigest"
                        }
                      }
                    }
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: null
                  }
                }
              }
            })
          )
      },
      {
        packageId: "0xbounty",
        eventName: "SingleBountyCreatedEvent",
        first: 1
      }
    );

    expect(data.nodes[0]).toEqual({
      kind: "SingleBountyCreatedEvent",
      eventType: "0xbounty::bounty_board::SingleBountyCreatedEvent",
      timestamp: "2026-03-20T00:00:00Z",
      digest: "0xdigest",
      bountyId: "0xpool",
      boardId: "0xboard",
      targetKey: { itemId: 22, tenant: "UTOPIA" },
      lossFilter: 1,
      coinType: "0x2::sui::SUI",
      expiresAtMs: 1711497600000,
      note: "target acquired"
    });
    expect(data.edges[0]?.cursor).toBe("cursor-created");
  });

  test("reads the current board registry state from object content", async () => {
    const data = await getBoardState(
      {
        getObject: async () => ({
          data: {
            content: {
              dataType: "moveObject",
              type: "0xbounty::bounty_board::Board",
              hasPublicTransfer: true,
              fields: {
                schema_version: "1",
                min_duration_days: "7",
                max_duration_days: "365",
                max_note_bytes: "64",
                active_single_bounty_ids: ["0xsingle1", "0xsingle2"],
                active_multi_bounty_ids: [{ id: "0xmulti1" }],
                active_insurance_order_ids: []
              }
            }
          }
        })
      },
      {
        boardId: "0xboard"
      }
    );

    expect(data).toEqual({
      objectId: "0xboard",
      schemaVersion: 1,
      minDurationDays: 7,
      maxDurationDays: 365,
      maxNoteBytes: 64,
      activeSingleBountyIds: ["0xsingle1", "0xsingle2"],
      activeMultiBountyIds: ["0xmulti1"],
      activeInsuranceOrderIds: []
    });
  });

  test("hydrates active board records from current registry object ids", async () => {
    const responses = new Map<string, unknown>([
      [
        "0xboard",
        {
          data: {
            content: {
              dataType: "moveObject",
              type: "0xbounty::bounty_board::Board",
              hasPublicTransfer: true,
              fields: {
                schema_version: "1",
                min_duration_days: "7",
                max_duration_days: "365",
                max_note_bytes: "64",
                active_single_bounty_ids: ["0xsingle1"],
                active_multi_bounty_ids: ["0xmulti1"],
                active_insurance_order_ids: ["0xinsurance1"]
              }
            }
          }
        }
      ],
      [
        "0xsingle1",
        {
          data: {
            content: {
              dataType: "moveObject",
              type: "0xbounty::bounty_board::SingleBountyPool<0x2::sui::SUI>",
              hasPublicTransfer: true,
              fields: {
                target_key: { item_id: "2002", tenant: "utopia" },
                loss_filter: "1",
                expires_at_ms: "1234"
              }
            }
          }
        }
      ],
      [
        "0xmulti1",
        {
          data: {
            content: {
              dataType: "moveObject",
              type: "0xbounty::bounty_board::MultiBountyPool<0x2::sui::SUI>",
              hasPublicTransfer: true,
              fields: {
                target_key: { item_id: "2002", tenant: "utopia" },
                loss_filter: "0",
                expires_at_ms: "2234",
                target_kills: "10",
                recorded_kills: "2",
                per_kill_reward: "100"
              }
            }
          }
        }
      ],
      [
        "0xinsurance1",
        {
          data: {
            content: {
              dataType: "moveObject",
              type: "0xbounty::bounty_board::InsuranceOrder<0x2::sui::SUI>",
              hasPublicTransfer: true,
              fields: {
                insured_key: { item_id: "2002", tenant: "utopia" },
                loss_filter: "2",
                expires_at_ms: "3234",
                spawn_mode: "2",
                spawn_target_kills: "5"
              }
            }
          }
        }
      ]
    ]);

    const snapshot = await getBoardRegistrySnapshot(
      {
        getObject: async ({ id }) => responses.get(id) as never
      },
      { boardId: "0xboard" }
    );

    expect(snapshot.singles).toEqual([
      {
        objectId: "0xsingle1",
        target: { itemId: 2002, tenant: "utopia" },
        lossFilter: 1,
        coinType: "0x2::sui::SUI",
        rewardAmount: 0,
        note: null,
        expiresAtMs: 1234,
        settled: false,
        claimableByHunter: [],
        contributions: []
      }
    ]);
    expect(snapshot.multis).toEqual([
      {
        objectId: "0xmulti1",
        target: { itemId: 2002, tenant: "utopia" },
        lossFilter: 0,
        coinType: "0x2::sui::SUI",
        rewardAmount: 0,
        note: null,
        expiresAtMs: 2234,
        targetKills: 10,
        recordedKills: 2,
        perKillReward: 100,
        settled: false,
        claimableByHunter: [],
        contributions: []
      }
    ]);
    expect(snapshot.insurances).toEqual([
      {
        objectId: "0xinsurance1",
        insured: { itemId: 2002, tenant: "utopia" },
        lossFilter: 2,
        coinType: "0x2::sui::SUI",
        rewardAmount: 0,
        note: null,
        expiresAtMs: 3234,
        spawnMode: 2,
        spawnTargetKills: 5
      }
    ]);
  });

  test("retries transient GraphQL connection resets", async () => {
    let attempts = 0;

    const data = await requestGraphQL<{ ok: boolean }>(
      {
        endpoint: "https://example.com/graphql",
        fetch: async () => {
          attempts += 1;

          if (attempts < 3) {
            const error = new Error("The socket connection was closed unexpectedly.");
            Object.assign(error, { code: "ECONNRESET" });
            throw error;
          }

          return new Response(JSON.stringify({ data: { ok: true } }));
        }
      },
      {
        query: "query Test { ok }",
        variables: {}
      }
    );

    expect(data).toEqual({ ok: true });
    expect(attempts).toBe(3);
  });

  test("passes an explicit proxy to fetch when proxy env is set", async () => {
    const previousHttpsProxy = process.env.HTTPS_PROXY;
    process.env.HTTPS_PROXY = "http://127.0.0.1:7890";

    try {
      let receivedProxy: string | undefined;

      await requestGraphQL<{ ok: boolean }>(
        {
          endpoint: "https://example.com/graphql",
          fetch: async (_input, init) => {
            receivedProxy = (init as RequestInit & { proxy?: string }).proxy;
            return new Response(JSON.stringify({ data: { ok: true } }));
          }
        },
        {
          query: "query Test { ok }",
          variables: {}
        }
      );

      expect(receivedProxy).toBe("http://127.0.0.1:7890");
    } finally {
      if (previousHttpsProxy === undefined) {
        delete process.env.HTTPS_PROXY;
      } else {
        process.env.HTTPS_PROXY = previousHttpsProxy;
      }
    }
  });
});
