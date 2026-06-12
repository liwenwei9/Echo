import { describe, expect, it, vi } from "vitest";

import {
  countUnread,
  createDisagreement,
  defaultProfile,
  seedNotifications,
  togglePostFlag,
} from "@/lib/community";
import { seedPosts } from "@/lib/posts";

describe("community interactions", () => {
  it("toggles reactions without allowing negative counts", () => {
    const agreed = togglePostFlag(seedPosts[0], "userAgreed");
    const removed = togglePostFlag(agreed, "userAgreed");

    expect(agreed.agree).toBe(seedPosts[0].agree + 1);
    expect(removed.agree).toBe(seedPosts[0].agree);
  });

  it("tracks unread notifications", () => {
    expect(countUnread(seedNotifications)).toBe(3);
  });

  it("creates a structured disagreement", () => {
    vi.spyOn(Date, "now").mockReturnValue(88);
    const reply = createDisagreement(
      "post-1",
      "这个结论忽略了晚高峰。",
      "我理解你认为 C 口始终更快。",
      "experience",
      defaultProfile,
    );

    expect(reply.id).toBe("reply-88");
    expect(reply.disagreement?.type).toBe("experience");
  });
});
