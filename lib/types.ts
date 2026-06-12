export type PostKind = "question" | "discussion" | "meetup";
export type FeedMode = "field" | "discover" | "subscribed";
export type EchoAction = "agree" | "thank" | "disagree";
export type AppView =
  | "home"
  | "explore"
  | "saved"
  | "notifications"
  | "profile";
export type DisagreementType = "fact" | "reasoning" | "values" | "experience";

export type EchoMedia = {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
};

export type EchoPost = {
  id: string;
  kind: PostKind;
  author: {
    name: string;
    avatar: string;
    badges: string[];
  };
  area: string;
  distanceBand: "500m内" | "3km内" | "同城";
  createdAt: string;
  title: string;
  body: string;
  topic: string;
  replies: number;
  agree: number;
  thank: number;
  disagree: number;
  solved?: boolean;
  subscribed?: boolean;
  quality: number;
  freshness: number;
  localRelevance: number;
  image?: string;
  media?: EchoMedia[];
  attendees?: number;
  attendeeLimit?: number;
  joined?: boolean;
  saved?: boolean;
  userAgreed?: boolean;
  userThanked?: boolean;
  isMine?: boolean;
  hidden?: boolean;
};

export type DraftPost = {
  kind: PostKind;
  title: string;
  body: string;
  topic: string;
  distanceBand: EchoPost["distanceBand"];
  media: EchoMedia[];
};

export type EchoReply = {
  id: string;
  postId: string;
  author: EchoPost["author"];
  body: string;
  createdAt: string;
  helpful: number;
  userHelpful?: boolean;
  isMine?: boolean;
  disagreement?: {
    type: DisagreementType;
    understoodPoint: string;
  };
};

export type EchoCircle = {
  id: string;
  name: string;
  description: string;
  type: "place" | "topic" | "event";
  memberCount: number;
  activeNow: number;
  subscribed: boolean;
  color: string;
  icon: string;
};

export type EchoNotification = {
  id: string;
  type: "reply" | "thanks" | "circle" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  postId?: string;
};

export type EchoProfile = {
  nickname: string;
  avatar: string;
  bio: string;
  area: string;
  verified: boolean;
};
