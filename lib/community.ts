import type {
  DisagreementType,
  EchoCircle,
  EchoNotification,
  EchoPost,
  EchoProfile,
  EchoReply,
} from "@/lib/types";

export const seedReplies: EchoReply[] = [
  {
    id: "reply-quiet-1",
    postId: "post-quiet-room",
    author: {
      name: "树下读书",
      avatar: "树",
      badges: ["本地信息可靠"],
    },
    body: "北小河南岸有一段木平台，中午十二点半以前人不多。树荫够，但没有插座。",
    createdAt: "8分钟前",
    helpful: 7,
  },
  {
    id: "reply-quiet-2",
    postId: "post-quiet-room",
    author: {
      name: "一杯温水",
      avatar: "水",
      badges: [],
    },
    body: "方恒购物中心北门外侧也有长椅，但一点以后会晒，建议十二点前去。",
    createdAt: "4分钟前",
    helpful: 3,
  },
  {
    id: "reply-commute-1",
    postId: "post-commute",
    author: {
      name: "路过的禾",
      avatar: "禾",
      badges: [],
    },
    body: "这个信息刚刚仍然有效。我从 C 口进站，排队大约六分钟。",
    createdAt: "5分钟前",
    helpful: 12,
  },
  {
    id: "reply-career-1",
    postId: "post-career",
    author: {
      name: "做过三次转型",
      avatar: "转",
      badges: ["经常提供有效回答"],
    },
    body: "不要隐藏供应链经验，把它翻译成产品能力：复杂流程拆解、跨部门推进、异常处理。面试官需要的是迁移证据。",
    createdAt: "38分钟前",
    helpful: 26,
  },
];

export const seedCircles: EchoCircle[] = [
  {
    id: "circle-wangjing",
    name: "望京声场",
    description: "午餐、通勤、园区服务与下班后的真实信息",
    type: "place",
    memberCount: 2840,
    activeNow: 128,
    subscribed: true,
    color: "#3c6651",
    icon: "望",
  },
  {
    id: "circle-career",
    name: "职业互助",
    description: "不卖课，认真讨论转型、面试与工作选择",
    type: "topic",
    memberCount: 12600,
    activeNow: 342,
    subscribed: true,
    color: "#e9784c",
    icon: "职",
  },
  {
    id: "circle-quiet",
    name: "城市静音室",
    description: "收集城市里适合喘口气的公开空间",
    type: "topic",
    memberCount: 4310,
    activeNow: 67,
    subscribed: true,
    color: "#697b6b",
    icon: "静",
  },
  {
    id: "circle-commute",
    name: "通勤接力",
    description: "聚合延误、拥挤与替代路线，不展示个人轨迹",
    type: "place",
    memberCount: 7820,
    activeNow: 219,
    subscribed: false,
    color: "#d0a944",
    icon: "行",
  },
  {
    id: "circle-afterwork",
    name: "下班一小时",
    description: "低压力、小规模、公开场所的下班活动",
    type: "event",
    memberCount: 1930,
    activeNow: 45,
    subscribed: false,
    color: "#7d637d",
    icon: "晚",
  },
];

export const seedNotifications: EchoNotification[] = [
  {
    id: "notification-1",
    type: "reply",
    title: "你的收藏有了新回应",
    body: "“城市静音室”新增了 2 个仍然有效的地点。",
    createdAt: "10分钟前",
    read: false,
    postId: "post-quiet-room",
  },
  {
    id: "notification-2",
    type: "thanks",
    title: "你的回应帮助了别人",
    body: "3 人感谢了你关于简历转型的回答。",
    createdAt: "1小时前",
    read: false,
  },
  {
    id: "notification-3",
    type: "circle",
    title: "望京声场今日摘要",
    body: "通勤接力、午间散步和 4 个新问题值得看看。",
    createdAt: "3小时前",
    read: false,
  },
  {
    id: "notification-4",
    type: "system",
    title: "位置保护检查完成",
    body: "没有发现精确位置或移动轨迹被公开。",
    createdAt: "昨天",
    read: true,
  },
];

export const defaultProfile: EchoProfile = {
  nickname: "晚风有信",
  avatar: "风",
  bio: "在城市里认真生活，也认真听别人说话。",
  area: "望京声场",
  verified: true,
};

export function createReply(
  postId: string,
  body: string,
  profile: EchoProfile,
): EchoReply {
  return {
    id: `reply-${Date.now()}`,
    postId,
    author: {
      name: profile.nickname,
      avatar: profile.avatar,
      badges: ["新回应"],
    },
    body: body.trim(),
    createdAt: "刚刚",
    helpful: 0,
    isMine: true,
  };
}

export function createDisagreement(
  postId: string,
  body: string,
  understoodPoint: string,
  type: DisagreementType,
  profile: EchoProfile,
): EchoReply {
  return {
    ...createReply(postId, body, profile),
    disagreement: {
      type,
      understoodPoint: understoodPoint.trim(),
    },
  };
}

export function countUnread(notifications: EchoNotification[]): number {
  return notifications.filter((notification) => !notification.read).length;
}

export function togglePostFlag(
  post: EchoPost,
  flag: "saved" | "userAgreed" | "userThanked" | "joined",
): EchoPost {
  const active = Boolean(post[flag]);
  const next = { ...post, [flag]: !active };

  if (flag === "userAgreed") {
    next.agree = Math.max(0, post.agree + (active ? -1 : 1));
  }
  if (flag === "userThanked") {
    next.thank = Math.max(0, post.thank + (active ? -1 : 1));
  }
  if (flag === "joined") {
    next.attendees = Math.max(0, (post.attendees ?? 0) + (active ? -1 : 1));
  }

  return next;
}
