import { describe, expect, it, vi } from "vitest";

import { createPost, rankPosts, seedPosts } from "@/lib/posts";

describe("rankPosts", () => {
  it("prioritizes highly local content in the field feed", () => {
    const ranked = rankPosts(seedPosts, "field");
    expect(ranked[0].distanceBand).not.toBe("同城");
  });

  it("only returns subscribed content in the subscribed feed", () => {
    const ranked = rankPosts(seedPosts, "subscribed");
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((post) => post.subscribed)).toBe(true);
  });
});

describe("createPost", () => {
  it("creates a fresh local post without fabricated engagement", () => {
    vi.spyOn(Date, "now").mockReturnValue(42);
    const post = createPost({
      kind: "question",
      title: "哪里适合午休？",
      body: "想找一个不需要消费的安静地方。",
      topic: "城市静音室",
      distanceBand: "500m内",
    });

    expect(post.id).toBe("local-42");
    expect(post.createdAt).toBe("刚刚");
    expect(post.replies + post.agree + post.thank).toBe(0);
  });
});
