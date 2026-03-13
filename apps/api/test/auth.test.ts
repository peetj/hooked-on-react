import { beforeEach, describe, expect, it, vi } from "vitest";

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn()
}));

vi.mock("../src/models/User.js", () => ({
  User: {
    findById: findByIdMock
  }
}));

import { getAuth, requireAuth, requireRole, signToken } from "../src/lib/auth.js";

function mockUserQuery(user: { email: string; role: "user" | "mod" | "admin"; banned: boolean } | null) {
  const lean = vi.fn().mockResolvedValue(user);
  const select = vi.fn().mockReturnValue({ lean });
  return { select, lean };
}

function createRequest(token: string) {
  return {
    header(name: string) {
      return name === "authorization" ? `Bearer ${token}` : undefined;
    }
  } as any;
}

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as any;
}

describe("requireAuth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    findByIdMock.mockReset();
  });

  it("uses the current database role instead of stale token claims", async () => {
    findByIdMock.mockReturnValue(
      mockUserQuery({
        email: "current@example.com",
        role: "user",
        banned: false
      })
    );

    const token = signToken({
      sub: "507f1f77bcf86cd799439011",
      email: "stale@example.com",
      role: "admin"
    });

    const req = createRequest(token);
    const res = createResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(getAuth(req)).toEqual({
      sub: "507f1f77bcf86cd799439011",
      email: "current@example.com",
      role: "user"
    });
  });

  it("rejects banned users even with a valid token", async () => {
    findByIdMock.mockReturnValue(
      mockUserQuery({
        email: "banned@example.com",
        role: "admin",
        banned: true
      })
    );

    const token = signToken({
      sub: "507f1f77bcf86cd799439012",
      email: "admin@example.com",
      role: "admin"
    });

    const req = createRequest(token);
    const res = createResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "banned" });
  });
});

describe("requireRole", () => {
  it("blocks lower-privileged users", () => {
    const req = {
      auth: {
        sub: "user-1",
        email: "user@example.com",
        role: "user"
      }
    } as any;
    const res = createResponse();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "forbidden" });
  });
});
