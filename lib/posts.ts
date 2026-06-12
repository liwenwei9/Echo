import type { EchoPost, FeedMode } from "@/lib/types";

export const seedPosts: EchoPost[] = [
  {
    id: "post-quiet-room",
    kind: "question",
    author: {
      name: "纸飞机",
      avatar: "纸",
      badges: ["常给出有效回答"],
    },
    area: "望京声场",
    distanceBand: "500m内",
    createdAt: "12分钟前",
    title: "望京 SOHO 附近，有没有适合午休发呆的安静角落？",
    body: "不需要咖啡馆，最好有树荫、能坐十几分钟。最近午休总被会议切碎，想找个不必消费的地方喘口气。",
    topic: "城市静音室",
    replies: 2,
    agree: 31,
    thank: 46,
    disagree: 0,
    solved: false,
    subscribed: true,
    quality: 96,
    freshness: 94,
    localRelevance: 100,
  },
  {
    id: "post-commute",
    kind: "discussion",
    author: {
      name: "北纬四十度",
      avatar: "北",
      badges: ["本地信息可靠"],
    },
    area: "望京声场",
    distanceBand: "3km内",
    createdAt: "26分钟前",
    title: "今天 14 号线的拥挤不是错觉",
    body: "阜通到望京南方向临时限流。刚走完一遍，A 口排队更慢，绕到 C 口大约能省十分钟。后面路过的人可以更新一下。",
    topic: "通勤接力",
    replies: 1,
    agree: 54,
    thank: 83,
    disagree: 1,
    subscribed: true,
    quality: 98,
    freshness: 99,
    localRelevance: 96,
  },
  {
    id: "post-lunch",
    kind: "meetup",
    author: {
      name: "午间散步组",
      avatar: "走",
      badges: ["活动记录良好"],
    },
    area: "望京声场",
    distanceBand: "500m内",
    createdAt: "41分钟前",
    title: "12:35，河边慢走 25 分钟",
    body: "从麒麟社门口出发，不打卡、不团建、不聊 KPI。下雨自动取消，最多 8 人，走完各自回去上班。",
    topic: "午间窗",
    replies: 0,
    agree: 22,
    thank: 16,
    disagree: 0,
    attendees: 5,
    attendeeLimit: 8,
    quality: 91,
    freshness: 88,
    localRelevance: 100,
  },
  {
    id: "post-career",
    kind: "question",
    author: {
      name: "暂时不想改简历",
      avatar: "问",
      badges: ["已验证职场人士"],
    },
    area: "北京职场",
    distanceBand: "同城",
    createdAt: "1小时前",
    title: "工作五年后转产品，还有必要强调原行业经验吗？",
    body: "原来做供应链运营，最近拿到一家 SaaS 公司的产品面试。担心讲太多旧经验显得不够互联网，也担心完全不讲又没有差异。",
    topic: "职业互助",
    replies: 1,
    agree: 48,
    thank: 72,
    disagree: 4,
    solved: true,
    subscribed: true,
    quality: 95,
    freshness: 74,
    localRelevance: 55,
  },
  {
    id: "post-building",
    kind: "discussion",
    author: {
      name: "一层靠窗",
      avatar: "窗",
      badges: [],
    },
    area: "望京声场",
    distanceBand: "3km内",
    createdAt: "2小时前",
    title: "写字楼一层新开的共享会议室，实测没有宣传得那么吵",
    body: "午后去了 40 分钟。插座够，电话间只有两个，普通座位不强制消费。周三下午人少，周五可能不行。",
    topic: "附近实测",
    replies: 0,
    agree: 19,
    thank: 38,
    disagree: 2,
    quality: 88,
    freshness: 68,
    localRelevance: 92,
    image:
      "linear-gradient(135deg, #d9ddd2 0%, #aab7a5 45%, #647564 100%)",
  },
];

export function scorePost(post: EchoPost, mode: FeedMode): number {
  const depthScore = post.replies * 1.8 + post.thank * 1.5 + post.agree;
  const base =
    post.quality * 0.4 +
    post.freshness * 0.25 +
    post.localRelevance * 0.25 +
    Math.min(depthScore, 100) * 0.1;

  if (mode === "field") {
    return base + post.localRelevance * 0.35;
  }

  if (mode === "subscribed") {
    return base + (post.subscribed ? 80 : -100);
  }

  return base;
}

export function rankPosts(posts: EchoPost[], mode: FeedMode): EchoPost[] {
  return [...posts]
    .filter((post) => mode !== "subscribed" || post.subscribed)
    .sort((a, b) => scorePost(b, mode) - scorePost(a, mode));
}

export function createPost(
  input: Pick<
    EchoPost,
    "kind" | "title" | "body" | "topic" | "distanceBand"
  > & { media?: EchoPost["media"] },
): EchoPost {
  return {
    id: `local-${Date.now()}`,
    ...input,
    author: {
      name: "晚风有信",
      avatar: "风",
      badges: ["新声"],
    },
    area: "望京声场",
    createdAt: "刚刚",
    replies: 0,
    agree: 0,
    thank: 0,
    disagree: 0,
    quality: 72,
    freshness: 100,
    localRelevance: input.distanceBand === "同城" ? 58 : 100,
    isMine: true,
    media: input.media ?? [],
  };
}
