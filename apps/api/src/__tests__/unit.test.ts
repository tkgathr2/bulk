import { describe, it, expect } from "vitest";
import { getToken, setToken, removeToken, getConnectionStatus } from "../store/tokens.js";
import { searchServiceReal } from "../connectors/index.js";
import type { Request } from "express";
import type { ServiceId } from "../types/index.js";

const mockReq = (tokens?: Record<string, unknown>): Request =>
  ({ session: { tokens } }) as unknown as Request;

describe("store/tokens", () => {
  it("getToken returns null when no tokens exist", () => {
    expect(getToken(mockReq(), "slack")).toBeNull();
  });
  it("setToken stores and getToken retrieves", () => {
    const req = mockReq();
    setToken(req, "gmail", { access_token: "abc", token_type: "Bearer" });
    expect(getToken(req, "gmail")!.access_token).toBe("abc");
  });
  it("removeToken deletes a stored token", () => {
    const req = mockReq();
    setToken(req, "slack", { access_token: "x", token_type: "Bearer" });
    removeToken(req, "slack");
    expect(getToken(req, "slack")).toBeNull();
  });
  it("getConnectionStatus returns disconnected/expired/connected", () => {
    expect(getConnectionStatus(mockReq(), "slack")).toBe("disconnected");
    const req = mockReq();
    setToken(req, "drive", { access_token: "t", token_type: "Bearer", expires_at: Date.now() - 1000 });
    expect(getConnectionStatus(req, "drive")).toBe("expired");
    setToken(req, "drive", { access_token: "t", token_type: "Bearer", expires_at: Date.now() + 99999 });
    expect(getConnectionStatus(req, "drive")).toBe("connected");
  });
});

describe("connectors/index", () => {
  it("returns error for unknown service", async () => {
    const result = await searchServiceReal("unknown" as ServiceId, { access_token: "t", token_type: "Bearer" }, { query: "q" });
    expect(result.status).toBe("error");
    expect(result.error_code).toBe("unknown_error");
    expect(result.error_message).toContain("Unknown service");
  });
});
