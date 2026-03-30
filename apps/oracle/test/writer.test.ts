import { describe, expect, test } from "bun:test";
import { isSafeToSkipOracleWriteFailure } from "../src/writer";

describe("oracle writer error classification", () => {
  test("classifies terminal on-chain state transitions as safe skips", () => {
    expect(isSafeToSkipOracleWriteFailure("Single bounty is already settled")).toBe(true);
    expect(isSafeToSkipOracleWriteFailure("Killmail item id was already used for this bounty")).toBe(true);
    expect(isSafeToSkipOracleWriteFailure("Object 0xabc has been deleted")).toBe(true);
    expect(isSafeToSkipOracleWriteFailure("Failed to execute transaction: version mismatch on input object")).toBe(true);
  });

  test("keeps transport and transient failures retryable", () => {
    expect(isSafeToSkipOracleWriteFailure("connect ETIMEDOUT 1.2.3.4:443")).toBe(false);
    expect(isSafeToSkipOracleWriteFailure("429 Too Many Requests")).toBe(false);
    expect(isSafeToSkipOracleWriteFailure("object is reserved for another transaction")).toBe(false);
  });
});
