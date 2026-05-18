import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/auth/server", () => ({
  auth: { getSession: () => getSessionMock() },
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

beforeEach(() => {
  getSessionMock.mockReset();
  redirectMock.mockReset();
});

describe("requireUser", () => {
  it("redirects to /sign-in?next=… when no session", async () => {
    const { requireUser } = await import("@/lib/auth/guards");
    getSessionMock.mockResolvedValue({ data: null });
    await expect(requireUser("/account")).rejects.toThrow("REDIRECT:/sign-in?next=%2Faccount");
  });

  it("returns the user when session exists", async () => {
    const { requireUser } = await import("@/lib/auth/guards");
    getSessionMock.mockResolvedValue({
      data: { user: { id: "u_1", email: "a@b.c", role: "user" } },
    });
    const user = await requireUser("/account");
    expect(user.id).toBe("u_1");
  });
});

describe("requireAdmin", () => {
  it("redirects to / when user is not admin", async () => {
    const { requireAdmin } = await import("@/lib/auth/guards");
    getSessionMock.mockResolvedValue({
      data: { user: { id: "u_1", email: "a@b.c", role: "user" } },
    });
    await expect(requireAdmin("/admin")).rejects.toThrow("REDIRECT:/");
  });

  it("returns the user when role is admin", async () => {
    const { requireAdmin } = await import("@/lib/auth/guards");
    getSessionMock.mockResolvedValue({
      data: { user: { id: "u_admin", email: "a@b.c", role: "admin" } },
    });
    const user = await requireAdmin("/admin");
    expect(user.role).toBe("admin");
  });
});
