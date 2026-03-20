import { describe, expect, test } from "bun:test";
import { nextCursor, toConnectionPage } from "../src/graphql/pagination";
import { getKillmailCreatedEventType } from "../src/queries/killmail";

describe("frontier-client", () => {
  test("returns the next cursor only when another page exists", () => {
    expect(nextCursor(toConnectionPage([{ id: "1" }], { hasNextPage: true, endCursor: "cursor-1" }))).toBe("cursor-1");
    expect(nextCursor(toConnectionPage([{ id: "1" }], { hasNextPage: false, endCursor: "cursor-1" }))).toBeNull();
  });

  test("builds the killmail created event type from a package id", () => {
    expect(getKillmailCreatedEventType("0xpackage")).toBe("0xpackage::killmail::KillmailCreatedEvent");
  });
});
