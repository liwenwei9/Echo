"use client";

import {
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  CircleCheck,
  Compass,
  EyeOff,
  Feather,
  Flag,
  HeartHandshake,
  Home,
  ImagePlus,
  ListFilter,
  LoaderCircle,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Pencil,
  Plus,
  Radio,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
  LogOut,
  Smartphone,
  MessageSquareMore,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  countUnread,
  createDisagreement,
  createReply,
  defaultProfile,
  seedCircles,
  seedNotifications,
  seedReplies,
  togglePostFlag,
} from "@/lib/community";
import { createPost, rankPosts, seedPosts } from "@/lib/posts";
import {
  MAX_POST_IMAGES,
  sanitizeImage,
  validateImageFile,
} from "@/lib/media";
import {
  defaultLocationSettings,
  locationSafetyCopy,
  publicLocationLabel,
  type LocationPermission,
  type LocationSettings,
} from "@/lib/privacy";
import type {
  AppView,
  DisagreementType,
  DraftPost,
  EchoAction,
  EchoCircle,
  EchoNotification,
  EchoPost,
  EchoProfile,
  EchoReply,
  FeedMode,
  PostKind,
} from "@/lib/types";

const STORAGE_KEY = "echo-mvp-v2-posts";
const LOCATION_KEY = "echo-mvp-v2-location";
const REPLIES_KEY = "echo-mvp-v2-replies";
const CIRCLES_KEY = "echo-mvp-v2-circles";
const NOTIFICATIONS_KEY = "echo-mvp-v2-notifications";
const PROFILE_KEY = "echo-mvp-v2-profile";
const AUTH_KEY = "echo-mvp-v2-auth";

const feedLabels: Record<FeedMode, string> = {
  field: "声场",
  discover: "发现",
  subscribed: "订阅",
};

const kindLabels: Record<PostKind, { label: string; icon: string }> = {
  question: { label: "问一下", icon: "?" },
  discussion: { label: "聊一聊", icon: "≈" },
  meetup: { label: "约一下", icon: "+" },
};

const emptyDraft: DraftPost = {
  kind: "question",
  title: "",
  body: "",
  topic: "职业互助",
  distanceBand: "3km内",
  media: [],
};

export function EchoApp() {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [view, setView] = useState<AppView>("home");
  const [feedMode, setFeedMode] = useState<FeedMode>("field");
  const [posts, setPosts] = useState<EchoPost[]>(seedPosts);
  const [replies, setReplies] = useState<EchoReply[]>(seedReplies);
  const [circles, setCircles] = useState<EchoCircle[]>(seedCircles);
  const [notifications, setNotifications] =
    useState<EchoNotification[]>(seedNotifications);
  const [profile, setProfile] = useState<EchoProfile>(defaultProfile);
  const [draft, setDraft] = useState<DraftPost>(emptyDraft);
  const [composerOpen, setComposerOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [disagreementPostId, setDisagreementPostId] = useState<string | null>(
    null,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<PostKind | "all">("all");
  const [location, setLocation] =
    useState<LocationSettings>(defaultLocationSettings);
  const [expandedPost, setExpandedPost] = useState<string | null>(
    "post-quiet-room",
  );
  const [toast, setToast] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedPosts = window.localStorage.getItem(STORAGE_KEY);
    const savedLocation = window.localStorage.getItem(LOCATION_KEY);
    const savedReplies = window.localStorage.getItem(REPLIES_KEY);
    const savedCircles = window.localStorage.getItem(CIRCLES_KEY);
    const savedNotifications = window.localStorage.getItem(NOTIFICATIONS_KEY);
    const savedProfile = window.localStorage.getItem(PROFILE_KEY);
    const savedAuth = window.localStorage.getItem(AUTH_KEY);

    queueMicrotask(() => {
      try {
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts) as EchoPost[]);
        }
        if (savedLocation) {
          const parsed = JSON.parse(savedLocation) as LocationSettings;
          setLocation(parsed);
          if (parsed.permission === "off") {
            setFeedMode("discover");
          }
        }
        if (savedReplies) {
          setReplies(JSON.parse(savedReplies) as EchoReply[]);
        }
        if (savedCircles) {
          setCircles(JSON.parse(savedCircles) as EchoCircle[]);
        }
        if (savedNotifications) {
          setNotifications(
            JSON.parse(savedNotifications) as EchoNotification[],
          );
        }
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile) as EchoProfile);
        }
        setSignedIn(savedAuth === "true");
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LOCATION_KEY);
        window.localStorage.removeItem(REPLIES_KEY);
        window.localStorage.removeItem(CIRCLES_KEY);
        window.localStorage.removeItem(NOTIFICATIONS_KEY);
        window.localStorage.removeItem(PROFILE_KEY);
        window.localStorage.removeItem(AUTH_KEY);
      } finally {
        setAuthReady(true);
      }
    });
  }, []);

  const rankedPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rankPosts(
      posts.filter((post) => {
        if (post.hidden) return false;
        if (kindFilter !== "all" && post.kind !== kindFilter) return false;
        if (!query) return true;
        return [post.title, post.body, post.topic, post.area, post.author.name]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }),
      feedMode,
    );
  }, [feedMode, kindFilter, posts, searchQuery]);

  const unreadCount = countUnread(notifications);

  function persistPosts(nextPosts: EchoPost[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosts));
      setPosts(nextPosts);
    } catch {
      showToast("图片占用空间过大，请减少图片数量后重试");
    }
  }

  function persistReplies(nextReplies: EchoReply[]) {
    setReplies(nextReplies);
    window.localStorage.setItem(REPLIES_KEY, JSON.stringify(nextReplies));
  }

  function persistCircles(nextCircles: EchoCircle[]) {
    setCircles(nextCircles);
    window.localStorage.setItem(CIRCLES_KEY, JSON.stringify(nextCircles));
  }

  function persistNotifications(nextNotifications: EchoNotification[]) {
    setNotifications(nextNotifications);
    window.localStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(nextNotifications),
    );
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function handlePublish() {
    if (
      !draft.title.trim() ||
      (!draft.body.trim() && draft.media.length === 0)
    ) {
      showToast("请填写标题，并补充文字或图片");
      return;
    }

    const nextPost = createPost({
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
    });
    persistPosts([
      {
        ...nextPost,
        author: {
          name: profile.nickname,
          avatar: profile.avatar,
          badges: ["新声"],
        },
      },
      ...posts,
    ]);
    setView("home");
    setFeedMode("field");
    setExpandedPost(nextPost.id);
    setDraft(emptyDraft);
    setComposerOpen(false);
    showToast("已进入小范围声场，等待第一轮回应");
  }

  function handleAction(postId: string, action: EchoAction) {
    if (action === "disagree") {
      setDisagreementPostId(postId);
      return;
    }

    const flag = action === "agree" ? "userAgreed" : "userThanked";
    const target = posts.find((post) => post.id === postId);
    if (!target) return;
    const wasActive = Boolean(target[flag]);
    persistPosts(
      posts.map((post) =>
        post.id === postId ? togglePostFlag(post, flag) : post,
      ),
    );
    showToast(
      wasActive
        ? action === "thank"
          ? "已收回感谢"
          : "已取消赞同"
        : action === "thank"
          ? "这份感谢已送达"
          : "已赞同这条回声",
    );
  }

  function submitReply(postId: string, body: string) {
    if (!body.trim()) return;
    persistReplies([createReply(postId, body, profile), ...replies]);
    persistPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, replies: post.replies + 1 } : post,
      ),
    );
    showToast("回应已发出");
  }

  function submitDisagreement(
    postId: string,
    body: string,
    understoodPoint: string,
    type: DisagreementType,
  ) {
    persistReplies([
      createDisagreement(postId, body, understoodPoint, type, profile),
      ...replies,
    ]);
    persistPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: post.replies + 1,
              disagree: post.disagree + 1,
            }
          : post,
      ),
    );
    setDisagreementPostId(null);
    showToast("异议已公开发布，讨论观点而不是攻击个人");
  }

  function toggleSaved(postId: string) {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    persistPosts(
      posts.map((item) =>
        item.id === postId ? togglePostFlag(item, "saved") : item,
      ),
    );
    showToast(post.saved ? "已取消收藏" : "已收藏");
  }

  function toggleJoined(postId: string) {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    if (
      !post.joined &&
      post.attendeeLimit &&
      (post.attendees ?? 0) >= post.attendeeLimit
    ) {
      showToast("活动人数已满");
      return;
    }
    persistPosts(
      posts.map((item) =>
        item.id === postId ? togglePostFlag(item, "joined") : item,
      ),
    );
    showToast(post.joined ? "已退出活动" : "报名成功，活动仅限公开场所");
  }

  function updatePost(
    postId: string,
    update: Partial<EchoPost>,
    message: string,
  ) {
    persistPosts(
      posts.map((post) => (post.id === postId ? { ...post, ...update } : post)),
    );
    showToast(message);
  }

  function openNotification(notification: EchoNotification) {
    persistNotifications(
      notifications.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
    if (notification.postId) {
      setView("home");
      setDetailPostId(notification.postId);
    }
  }

  function saveProfile(next: EchoProfile) {
    setProfile(next);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfileOpen(false);
    showToast("个人资料已更新");
  }

  function signIn(nickname: string) {
    const nextProfile = {
      ...profile,
      nickname: nickname.trim() || profile.nickname,
      avatar: nickname.trim().slice(0, 1) || profile.avatar,
    };
    setProfile(nextProfile);
    setSignedIn(true);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    window.localStorage.setItem(AUTH_KEY, "true");
    showToast("欢迎来到回声");
  }

  function signOut() {
    setSignedIn(false);
    setView("home");
    window.localStorage.setItem(AUTH_KEY, "false");
  }

  function saveLocation(next: LocationSettings) {
    setLocation(next);
    if (next.permission === "off") {
      setFeedMode("discover");
    }
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    setLocationOpen(false);
    showToast(
      next.permission === "off"
        ? "已切换为纯线上模式"
        : "声场设置已更新，不会展示精确位置",
    );
  }

  function navigate(nextView: AppView) {
    setView(nextView);
    setSearchOpen(false);
    if (nextView === "notifications") {
      persistNotifications(
        notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    }
  }

  return (
    <main className="app-shell">
      <aside className="desktop-rail">
        <Brand />
        <nav className="rail-nav" aria-label="主要导航">
          <RailItem
            icon={<Home size={19} />}
            label="首页"
            active={view === "home"}
            onClick={() => navigate("home")}
          />
          <RailItem
            icon={<Compass size={19} />}
            label="探索声场"
            active={view === "explore"}
            onClick={() => navigate("explore")}
          />
          <RailItem
            icon={<Bookmark size={19} />}
            label="我的收藏"
            active={view === "saved"}
            onClick={() => navigate("saved")}
          />
          <RailItem
            icon={<Bell size={19} />}
            label="通知"
            active={view === "notifications"}
            badge={unreadCount ? String(unreadCount) : undefined}
            onClick={() => navigate("notifications")}
          />
        </nav>
        <button className="rail-compose" onClick={() => setComposerOpen(true)}>
          <Feather size={18} />
          发出回声
        </button>
        <button className="rail-profile" onClick={() => navigate("profile")}>
          <div className="avatar avatar-dark">{profile.avatar}</div>
          <div>
            <strong>{profile.nickname}</strong>
            <span>{profile.area}</span>
          </div>
          <MoreHorizontal size={18} />
        </button>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <EchoGlyph />
            <span>回声</span>
          </div>
          <button
            className="location-pill"
            onClick={() => setLocationOpen(true)}
            aria-label="设置声场位置"
          >
            <Navigation size={14} />
            <span>{publicLocationLabel(location)}</span>
            <ChevronDown size={14} />
          </button>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label="搜索"
            >
              <Search size={20} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="通知"
              onClick={() => navigate("notifications")}
            >
              <Bell size={20} />
              {unreadCount > 0 && <i />}
            </button>
          </div>
        </header>

        {searchOpen && (
          <div className="search-panel">
            <Search size={18} />
            <input
              autoFocus
              placeholder="搜索问题、地点或话题"
              aria-label="搜索回声"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setView("home");
              }}
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              取消
            </button>
          </div>
        )}

        {view === "home" && (
          <>
            <section className="hero">
              <div>
                <span className="eyebrow">GOOD AFTERNOON</span>
                <h1>
                  附近正在
                  <br />
                  <em>认真讨论</em>什么
                </h1>
              </div>
              <div className="field-orbit" aria-hidden="true">
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
                <span className="orbit-dot" />
                <span className="orbit-copy">2.4k</span>
                <small>今日声场回应</small>
              </div>
            </section>

            <div className="feed-tabs" role="tablist" aria-label="信息流">
              {(Object.keys(feedLabels) as FeedMode[]).map((mode) => (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={feedMode === mode}
                  disabled={mode === "field" && location.permission === "off"}
                  title={
                    mode === "field" && location.permission === "off"
                      ? "开启位置验证后查看附近声场"
                      : undefined
                  }
                  className={feedMode === mode ? "active" : ""}
                  onClick={() => setFeedMode(mode)}
                >
                  {feedLabels[mode]}
                </button>
              ))}
              <button
                className="feed-filter"
                aria-label="筛选内容"
                onClick={() => setFilterOpen((active) => !active)}
              >
                <Settings2 size={16} />
              </button>
            </div>

            {filterOpen && (
              <FilterBar value={kindFilter} onChange={setKindFilter} />
            )}

            <div className="field-context">
              <div>
                <Radio size={16} />
                <strong>
                  {searchQuery
                    ? `搜索“${searchQuery}”`
                    : feedMode === "field"
                      ? "望京附近，过去 3 小时"
                      : feedMode === "discover"
                        ? "为你探索的新话题"
                        : "你订阅的圈子与话题"}
                </strong>
              </div>
              <span>{rankedPosts.length} 条值得回应</span>
            </div>

            <PostList
              posts={rankedPosts}
              replies={replies}
              expandedPost={expandedPost}
              onExpand={(postId) =>
                setExpandedPost(expandedPost === postId ? null : postId)
              }
              onAction={handleAction}
              onReply={submitReply}
              onDetail={setDetailPostId}
              onSave={toggleSaved}
              onJoin={toggleJoined}
              onUpdate={updatePost}
            />
          </>
        )}

        {view === "explore" && (
          <ExploreView
            circles={circles}
            posts={rankedPosts}
            onToggle={(circleId) => {
              const target = circles.find((circle) => circle.id === circleId);
              const nextSubscribed = !target?.subscribed;
              persistCircles(
                circles.map((circle) =>
                  circle.id === circleId
                    ? { ...circle, subscribed: !circle.subscribed }
                  : circle,
                ),
              );
              if (target) {
                persistPosts(
                  posts.map((post) =>
                    post.topic === target.name || post.area === target.name
                      ? { ...post, subscribed: nextSubscribed }
                      : post,
                  ),
                );
              }
              showToast(target?.subscribed ? "已取消订阅" : "已订阅声场");
            }}
            onOpenPost={setDetailPostId}
          />
        )}

        {view === "saved" && (
          <SavedView
            posts={posts.filter((post) => post.saved && !post.hidden)}
            replies={replies}
            onAction={handleAction}
            onReply={submitReply}
            onDetail={setDetailPostId}
            onSave={toggleSaved}
            onJoin={toggleJoined}
            onUpdate={updatePost}
          />
        )}

        {view === "notifications" && (
          <NotificationsView
            notifications={notifications}
            onOpen={openNotification}
            onClear={() => {
              persistNotifications([]);
              showToast("通知已清空");
            }}
          />
        )}

        {view === "profile" && (
          <ProfileView
            profile={profile}
            posts={posts.filter((post) => post.isMine)}
            replies={replies.filter((reply) => reply.isMine)}
            savedCount={posts.filter((post) => post.saved).length}
            subscribedCount={circles.filter((circle) => circle.subscribed).length}
            onEdit={() => setProfileOpen(true)}
            onOpenPost={setDetailPostId}
            onSignOut={signOut}
          />
        )}
      </section>

      <aside className={`right-panel ${view !== "home" ? "context-panel" : ""}`}>
        <FieldPulse />
        <DailyPrompt
          onJoin={() => {
            setDraft({
              ...emptyDraft,
              kind: "discussion",
              title: "今天附近哪一刻，让你觉得这里有人情味？",
              topic: "每日一声",
            });
            setComposerOpen(true);
          }}
        />
        <SafetyCard onOpen={() => setLocationOpen(true)} location={location} />
      </aside>

      <nav className="bottom-nav" aria-label="移动端导航">
        <button
          className={view === "home" ? "active" : ""}
          onClick={() => navigate("home")}
        >
          <Home size={21} />
          <span>声场</span>
        </button>
        <button
          className={view === "explore" ? "active" : ""}
          onClick={() => navigate("explore")}
        >
          <Compass size={21} />
          <span>发现</span>
        </button>
        <button
          className="mobile-compose"
          onClick={() => setComposerOpen(true)}
          aria-label="发出回声"
        >
          <Plus size={24} />
        </button>
        <button
          className={view === "notifications" ? "active" : ""}
          onClick={() => navigate("notifications")}
        >
          <Bell size={21} />
          <span>通知</span>
        </button>
        <button
          className={view === "profile" ? "active" : ""}
          onClick={() => navigate("profile")}
        >
          <div className="nav-avatar">{profile.avatar}</div>
          <span>我的</span>
        </button>
      </nav>

      {composerOpen && (
        <Composer
          draft={draft}
          location={location}
          onChange={setDraft}
          onClose={() => setComposerOpen(false)}
          onPublish={handlePublish}
        />
      )}

      {locationOpen && (
        <LocationSheet
          value={location}
          onClose={() => setLocationOpen(false)}
          onSave={saveLocation}
        />
      )}

      {detailPostId && (
        <PostDetail
          post={posts.find((post) => post.id === detailPostId)}
          replies={replies.filter((reply) => reply.postId === detailPostId)}
          onClose={() => setDetailPostId(null)}
          onReply={submitReply}
          onHelpful={(replyId) => {
            persistReplies(
              replies.map((reply) =>
                reply.id === replyId
                  ? {
                      ...reply,
                      helpful: Math.max(
                        0,
                        reply.helpful + (reply.userHelpful ? -1 : 1),
                      ),
                      userHelpful: !reply.userHelpful,
                    }
                  : reply,
              ),
            );
          }}
        />
      )}

      {disagreementPostId && (
        <DisagreementSheet
          post={posts.find((post) => post.id === disagreementPostId)}
          onClose={() => setDisagreementPostId(null)}
          onSubmit={(body, understoodPoint, type) =>
            submitDisagreement(
              disagreementPostId,
              body,
              understoodPoint,
              type,
            )
          }
        />
      )}

      {profileOpen && (
        <ProfileSheet
          value={profile}
          onClose={() => setProfileOpen(false)}
          onSave={saveProfile}
        />
      )}

      {authReady && !signedIn && <AuthSheet onSignIn={signIn} />}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Brand() {
  return (
    <div className="brand">
      <EchoGlyph />
      <div>
        <strong>回声</strong>
        <span>ECHO</span>
      </div>
    </div>
  );
}

function EchoGlyph() {
  return (
    <span className="echo-glyph" aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

function RailItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {badge && <b>{badge}</b>}
    </button>
  );
}

function PostList({
  posts,
  replies,
  expandedPost,
  onExpand,
  onAction,
  onReply,
  onDetail,
  onSave,
  onJoin,
  onUpdate,
}: {
  posts: EchoPost[];
  replies: EchoReply[];
  expandedPost?: string | null;
  onExpand?: (postId: string) => void;
  onAction: (postId: string, action: EchoAction) => void;
  onReply: (postId: string, body: string) => void;
  onDetail: (postId: string) => void;
  onSave: (postId: string) => void;
  onJoin: (postId: string) => void;
  onUpdate: (
    postId: string,
    update: Partial<EchoPost>,
    message: string,
  ) => void;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Search size={23} />}
        title="这里暂时没有回声"
        copy="换个筛选条件，或者发出第一条内容。"
      />
    );
  }

  return (
    <section className="feed" aria-live="polite">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          replies={replies.filter((reply) => reply.postId === post.id)}
          expanded={expandedPost === post.id}
          onExpand={() => onExpand?.(post.id)}
          onAction={(action) => onAction(post.id, action)}
          onReply={(body) => onReply(post.id, body)}
          onDetail={() => onDetail(post.id)}
          onSave={() => onSave(post.id)}
          onJoin={() => onJoin(post.id)}
          onUpdate={(update, message) => onUpdate(post.id, update, message)}
        />
      ))}
    </section>
  );
}

function PostCard({
  post,
  replies,
  expanded,
  onExpand,
  onAction,
  onReply,
  onDetail,
  onSave,
  onJoin,
  onUpdate,
}: {
  post: EchoPost;
  replies: EchoReply[];
  expanded: boolean;
  onExpand: () => void;
  onAction: (action: EchoAction) => void;
  onReply: (body: string) => void;
  onDetail: () => void;
  onSave: () => void;
  onJoin: () => void;
  onUpdate: (update: Partial<EchoPost>, message: string) => void;
}) {
  const kind = kindLabels[post.kind];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className={`post-card ${expanded ? "expanded" : ""}`}>
      <header className="post-meta">
        <div className="author-row">
          <div className="avatar">{post.author.avatar}</div>
          <div>
            <div className="author-name">
              <strong>{post.author.name}</strong>
              {post.author.badges[0] && <span>{post.author.badges[0]}</span>}
            </div>
            <small>
              {post.area} · {post.distanceBand} · {post.createdAt}
            </small>
          </div>
        </div>
        <button
          aria-label="更多操作"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal size={18} />
        </button>
        {menuOpen && (
          <div className="post-menu">
            <button
              onClick={() => {
                onSave();
                setMenuOpen(false);
              }}
            >
              <Bookmark size={15} />
              {post.saved ? "取消收藏" : "收藏"}
            </button>
            {post.isMine && post.kind === "question" && (
              <button
                onClick={() => {
                  onUpdate(
                    { solved: !post.solved },
                    post.solved ? "已重新打开问题" : "问题已标记为解决",
                  );
                  setMenuOpen(false);
                }}
              >
                <CircleCheck size={15} />
                {post.solved ? "重新打开" : "标记已解决"}
              </button>
            )}
            {!post.isMine && (
              <>
                <button
                  onClick={() => {
                    onUpdate({ hidden: true }, "已隐藏这条内容");
                    setMenuOpen(false);
                  }}
                >
                  <EyeOff size={15} />
                  不感兴趣
                </button>
                <button
                  onClick={() => {
                    onUpdate({}, "举报已提交，将进入审核队列");
                    setMenuOpen(false);
                  }}
                >
                  <Flag size={15} />
                  举报
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <button className="post-content" onClick={onExpand}>
        <div className="post-tags">
          <span className={`kind-tag kind-${post.kind}`}>
            <i>{kind.icon}</i>
            {kind.label}
          </span>
          <span>#{post.topic}</span>
          {post.solved && (
            <span className="solved-tag">
              <Check size={12} /> 已解决
            </span>
          )}
        </div>
        <h2>{post.title}</h2>
        <p>{post.body}</p>
        {post.image && (
          <div className="post-image" style={{ background: post.image }}>
            <span>午后实测</span>
            <small>来自附近贡献者</small>
          </div>
        )}
        {post.media && post.media.length > 0 && (
          <MediaGallery media={post.media} title={post.title} />
        )}
      </button>

      {post.kind === "meetup" && (
        <div className="meetup-status">
          <div className="mini-avatars">
            <span>叶</span>
            <span>林</span>
            <span>+{post.attendees}</span>
          </div>
          <p>还有 3 个位置 · 仅限公开场所</p>
          <button className={post.joined ? "joined" : ""} onClick={onJoin}>
            {post.joined ? "已报名" : "报名参加"}
          </button>
        </div>
      )}

      <footer className="post-actions">
        <button
          className={post.userAgreed ? "active" : ""}
          onClick={() => onAction("agree")}
        >
          <ThumbsUp size={17} />
          <span>赞同</span>
          <b>{post.agree || ""}</b>
        </button>
        <button
          className={post.userThanked ? "active" : ""}
          onClick={() => onAction("thank")}
        >
          <HeartHandshake size={18} />
          <span>感谢</span>
          <b>{post.thank || ""}</b>
        </button>
        <button onClick={onExpand}>
          <MessageCircle size={17} />
          <span>回应</span>
          <b>{post.replies || ""}</b>
        </button>
        <button
          className="disagree-action"
          onClick={() => onAction("disagree")}
        >
          提出异议
        </button>
      </footer>

      {expanded && (
        <ReplyPreview
          post={post}
          replies={replies}
          onReply={onReply}
          onDetail={onDetail}
        />
      )}
    </article>
  );
}

function ReplyPreview({
  post,
  replies,
  onReply,
  onDetail,
}: {
  post: EchoPost;
  replies: EchoReply[];
  onReply: (body: string) => void;
  onDetail: () => void;
}) {
  const [body, setBody] = useState("");
  const preview = [...replies].sort((a, b) => b.helpful - a.helpful)[0];

  return (
    <section className="reply-preview">
      <div className="reply-heading">
        <strong>{post.replies ? "最有帮助的回应" : "成为第一个回应的人"}</strong>
        {post.replies > 0 && (
          <button onClick={onDetail}>查看全部 {post.replies} 条</button>
        )}
      </div>
      {preview && (
        <div className="reply-item">
          <div className="avatar avatar-small">{preview.author.avatar}</div>
          <div>
            <strong>{preview.author.name}</strong>
            <p>{preview.body}</p>
            <span>
              <HeartHandshake size={13} /> {preview.helpful} 人觉得有帮助
            </span>
          </div>
        </div>
      )}
      <div className="reply-box">
        <div className="avatar avatar-small avatar-dark">风</div>
        <input
          placeholder="写下一个具体、有帮助的回应…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && body.trim()) {
              onReply(body);
              setBody("");
            }
          }}
        />
        <button
          aria-label="发送回应"
          disabled={!body.trim()}
          onClick={() => {
            onReply(body);
            setBody("");
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </section>
  );
}

function MediaGallery({
  media,
  title,
  detail = false,
}: {
  media: NonNullable<EchoPost["media"]>;
  title: string;
  detail?: boolean;
}) {
  return (
    <div
      className={`media-gallery media-count-${Math.min(media.length, 4)} ${
        detail ? "media-gallery-detail" : ""
      }`}
    >
      {media.map((item, index) => (
        <div className="media-item" key={item.id}>
          <Image
            src={item.dataUrl}
            alt={`${title}，图片 ${index + 1}`}
            width={item.width}
            height={item.height}
            sizes={detail ? "(max-width: 700px) 100vw, 640px" : "(max-width: 820px) 90vw, 620px"}
            unoptimized
          />
          {index === 3 && media.length > 4 && (
            <span className="media-more">+{media.length - 4}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldPulse() {
  return (
    <section className="side-card pulse-card">
      <header>
        <div>
          <Radio size={17} />
          <strong>声场温度</strong>
        </div>
        <button>
          <MoreHorizontal size={17} />
        </button>
      </header>
      <div className="pulse-visual">
        <span className="pulse-ring ring-one" />
        <span className="pulse-ring ring-two" />
        <span className="pulse-center">
          <i />
        </span>
        <b>活跃</b>
      </div>
      <div className="pulse-stats">
        <div>
          <strong>128</strong>
          <span>人正在回应</span>
        </div>
        <div>
          <strong>6 min</strong>
          <span>平均首个回应</span>
        </div>
      </div>
      <p>达到人数阈值后才展示聚合状态，不显示任何人的实时位置。</p>
    </section>
  );
}

function DailyPrompt({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="side-card prompt-card">
      <span className="eyebrow">每日一声 · 06/12</span>
      <Sparkles size={22} />
      <h3>今天附近哪一刻，让你觉得这里有人情味？</h3>
      <div className="prompt-avatars">
        <span>芒</span>
        <span>山</span>
        <span>岸</span>
        <small>已有 46 个回答</small>
      </div>
      <button onClick={onJoin}>留下我的一声</button>
    </section>
  );
}

function SafetyCard({
  onOpen,
  location,
}: {
  onOpen: () => void;
  location: LocationSettings;
}) {
  return (
    <button className="side-card safety-card" onClick={onOpen}>
      <span>
        <ShieldCheck size={19} />
      </span>
      <div>
        <strong>位置保护已开启</strong>
        <p>{locationSafetyCopy(location)}</p>
      </div>
      <ChevronDown size={16} />
    </button>
  );
}

function FilterBar({
  value,
  onChange,
}: {
  value: PostKind | "all";
  onChange: (value: PostKind | "all") => void;
}) {
  const options: { id: PostKind | "all"; label: string }[] = [
    { id: "all", label: "全部" },
    { id: "question", label: "问一下" },
    { id: "discussion", label: "聊一聊" },
    { id: "meetup", label: "约一下" },
  ];

  return (
    <div className="filter-bar">
      <span>
        <ListFilter size={15} /> 内容类型
      </span>
      {options.map((option) => (
        <button
          key={option.id}
          className={value === option.id ? "active" : ""}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ExploreView({
  circles,
  posts,
  onToggle,
  onOpenPost,
}: {
  circles: EchoCircle[];
  posts: EchoPost[];
  onToggle: (circleId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  return (
    <section className="page-view">
      <PageHeading
        eyebrow="EXPLORE FIELDS"
        title="探索声场"
        copy="按地点和兴趣订阅，不需要关注任何人的粉丝关系。"
      />

      <div className="circle-grid">
        {circles.map((circle) => (
          <article className="circle-card" key={circle.id}>
            <span
              className="circle-icon"
              style={{ backgroundColor: circle.color }}
            >
              {circle.icon}
            </span>
            <div>
              <span className="circle-type">
                {circle.type === "place"
                  ? "地点声场"
                  : circle.type === "event"
                    ? "活动声场"
                    : "话题声场"}
              </span>
              <h3>{circle.name}</h3>
              <p>{circle.description}</p>
              <small>
                {circle.memberCount.toLocaleString()} 名成员 · {circle.activeNow}{" "}
                人正在回应
              </small>
            </div>
            <button
              className={circle.subscribed ? "subscribed" : ""}
              onClick={() => onToggle(circle.id)}
            >
              {circle.subscribed ? <Check size={14} /> : <Plus size={14} />}
              {circle.subscribed ? "已订阅" : "订阅"}
            </button>
          </article>
        ))}
      </div>

      <section className="page-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">TRENDING NOW</span>
            <h2>正在扩散的回声</h2>
          </div>
          <span>内容热度不等于作者粉丝数</span>
        </div>
        <div className="compact-posts">
          {posts.slice(0, 3).map((post, index) => (
            <button key={post.id} onClick={() => onOpenPost(post.id)}>
              <b>0{index + 1}</b>
              <div>
                <span>
                  #{post.topic} · {post.area}
                </span>
                <strong>{post.title}</strong>
                <small>{post.replies} 条有效回应</small>
              </div>
              <ChevronDown size={17} />
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function SavedView({
  posts,
  replies,
  onAction,
  onReply,
  onDetail,
  onSave,
  onJoin,
  onUpdate,
}: {
  posts: EchoPost[];
  replies: EchoReply[];
  onAction: (postId: string, action: EchoAction) => void;
  onReply: (postId: string, body: string) => void;
  onDetail: (postId: string) => void;
  onSave: (postId: string) => void;
  onJoin: (postId: string) => void;
  onUpdate: (
    postId: string,
    update: Partial<EchoPost>,
    message: string,
  ) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="page-view">
      <PageHeading
        eyebrow="PRIVATE LIBRARY"
        title="我的收藏"
        copy="收藏完全私密，不会给作者制造公开粉丝数。"
      />
      {posts.length ? (
        <PostList
          posts={posts}
          replies={replies}
          expandedPost={expanded}
          onExpand={(postId) =>
            setExpanded(expanded === postId ? null : postId)
          }
          onAction={onAction}
          onReply={onReply}
          onDetail={onDetail}
          onSave={onSave}
          onJoin={onJoin}
          onUpdate={onUpdate}
        />
      ) : (
        <EmptyState
          icon={<Bookmark size={24} />}
          title="还没有收藏"
          copy="在帖子右上角菜单中收藏，方便以后查看余音和更新。"
        />
      )}
    </section>
  );
}

function NotificationsView({
  notifications,
  onOpen,
  onClear,
}: {
  notifications: EchoNotification[];
  onOpen: (notification: EchoNotification) => void;
  onClear: () => void;
}) {
  return (
    <section className="page-view">
      <PageHeading
        eyebrow="YOUR SIGNALS"
        title="通知"
        copy="只推送与你有关的回应、感谢、声场摘要和安全提醒。"
        action={
          notifications.length ? (
            <button className="text-button" onClick={onClear}>
              清空通知
            </button>
          ) : undefined
        }
      />
      {notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              className={notification.read ? "" : "unread"}
              onClick={() => onOpen(notification)}
            >
              <span className={`notification-icon type-${notification.type}`}>
                {notification.type === "reply" ? (
                  <MessageCircle size={18} />
                ) : notification.type === "thanks" ? (
                  <HeartHandshake size={18} />
                ) : notification.type === "circle" ? (
                  <Radio size={18} />
                ) : (
                  <ShieldCheck size={18} />
                )}
              </span>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small>{notification.createdAt}</small>
              </div>
              {!notification.read && <i />}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={24} />}
          title="通知已经清空"
          copy="有新的有效回应时，会在这里告诉你。"
        />
      )}
    </section>
  );
}

function ProfileView({
  profile,
  posts,
  replies,
  savedCount,
  subscribedCount,
  onEdit,
  onOpenPost,
  onSignOut,
}: {
  profile: EchoProfile;
  posts: EchoPost[];
  replies: EchoReply[];
  savedCount: number;
  subscribedCount: number;
  onEdit: () => void;
  onOpenPost: (postId: string) => void;
  onSignOut: () => void;
}) {
  return (
    <section className="page-view">
      <div className="profile-hero">
        <div className="avatar profile-avatar">{profile.avatar}</div>
        <div>
          <span className="eyebrow">MY ECHO</span>
          <h1>{profile.nickname}</h1>
          <p>{profile.bio}</p>
          <span className="profile-area">
            <MapPin size={13} /> {profile.area}
            {profile.verified && (
              <>
                <ShieldCheck size={13} /> 已验证职场人士
              </>
            )}
          </span>
        </div>
        <button className="outline-button" onClick={onEdit}>
          <Pencil size={15} /> 编辑资料
        </button>
      </div>

      <div className="profile-stats">
        <div>
          <strong>{posts.length}</strong>
          <span>发出的回声</span>
        </div>
        <div>
          <strong>{replies.length}</strong>
          <span>有效回应</span>
        </div>
        <div>
          <strong>{savedCount}</strong>
          <span>私密收藏</span>
        </div>
        <div>
          <strong>{subscribedCount}</strong>
          <span>订阅声场</span>
        </div>
      </div>

      <section className="page-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">CONTRIBUTIONS</span>
            <h2>我的内容</h2>
          </div>
        </div>
        {posts.length ? (
          <div className="compact-posts">
            {posts.map((post) => (
              <button key={post.id} onClick={() => onOpenPost(post.id)}>
                <span className={`profile-kind kind-${post.kind}`}>
                  {kindLabels[post.kind].icon}
                </span>
                <div>
                  <span>
                    #{post.topic} · {post.createdAt}
                  </span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.replies} 回应 · {post.thank} 感谢
                  </small>
                </div>
                {post.solved && <CircleCheck size={18} />}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Feather size={24} />}
            title="还没有发出回声"
            copy="你的个人页是贡献记录，不展示粉丝数量。"
          />
        )}
      </section>
      <button className="sign-out-button" onClick={onSignOut}>
        <LogOut size={15} /> 退出当前演示账号
      </button>
    </section>
  );
}

function PageHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </header>
  );
}

function EmptyState({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}

function PostDetail({
  post,
  replies,
  onClose,
  onReply,
  onHelpful,
}: {
  post?: EchoPost;
  replies: EchoReply[];
  onClose: () => void;
  onReply: (postId: string, body: string) => void;
  onHelpful: (replyId: string) => void;
}) {
  const [body, setBody] = useState("");
  if (!post) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="sheet detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="回声详情"
      >
        <header className="sheet-header detail-header">
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
          <div>
            <span className="eyebrow">ECHO THREAD</span>
            <h2>完整讨论</h2>
          </div>
          <span />
        </header>
        <article className="detail-post">
          <div className="author-row">
            <div className="avatar">{post.author.avatar}</div>
            <div>
              <strong>{post.author.name}</strong>
              <small>
                {post.area} · {post.distanceBand} · {post.createdAt}
              </small>
            </div>
          </div>
          <span className={`kind-tag kind-${post.kind}`}>
            {kindLabels[post.kind].label}
          </span>
          <h1>{post.title}</h1>
          <p>{post.body}</p>
          {post.media && post.media.length > 0 && (
            <MediaGallery media={post.media} title={post.title} detail />
          )}
        </article>

        <div className="detail-replies">
          <header>
            <strong>{replies.length} 条回应</strong>
            <span>按最有帮助排序</span>
          </header>
          {[...replies]
            .sort((a, b) => b.helpful - a.helpful)
            .map((reply) => (
              <article key={reply.id}>
                <div className="avatar avatar-small">{reply.author.avatar}</div>
                <div>
                  <header>
                    <strong>{reply.author.name}</strong>
                    <small>{reply.createdAt}</small>
                  </header>
                  {reply.disagreement && (
                    <div className="understanding-box">
                      <span>我理解原观点是</span>
                      {reply.disagreement.understoodPoint}
                    </div>
                  )}
                  <p>{reply.body}</p>
                  <button
                    className={reply.userHelpful ? "active" : ""}
                    onClick={() => onHelpful(reply.id)}
                  >
                    <HeartHandshake size={14} />
                    有帮助 {reply.helpful || ""}
                  </button>
                </div>
              </article>
            ))}
        </div>

        <div className="detail-reply-box">
          <textarea
            value={body}
            placeholder="写下一个具体、有帮助的回应…"
            onChange={(event) => setBody(event.target.value)}
          />
          <button
            disabled={!body.trim()}
            onClick={() => {
              onReply(post.id, body);
              setBody("");
            }}
          >
            <Send size={16} /> 发送回应
          </button>
        </div>
      </section>
    </div>
  );
}

function DisagreementSheet({
  post,
  onClose,
  onSubmit,
}: {
  post?: EchoPost;
  onClose: () => void;
  onSubmit: (
    body: string,
    understoodPoint: string,
    type: DisagreementType,
  ) => void;
}) {
  const [understoodPoint, setUnderstoodPoint] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<DisagreementType>("reasoning");
  if (!post) return null;

  const labels: Record<DisagreementType, string> = {
    fact: "事实",
    reasoning: "推理",
    values: "价值判断",
    experience: "个人经验",
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="sheet disagreement-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="提出异议"
      >
        <header className="sheet-header">
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
          <div>
            <span className="eyebrow">CONSTRUCTIVE DISAGREEMENT</span>
            <h2>提出异议</h2>
          </div>
          <button
            className="publish-button"
            disabled={!understoodPoint.trim() || body.trim().length < 10}
            onClick={() => onSubmit(body, understoodPoint, type)}
          >
            发布
          </button>
        </header>

        <div className="quoted-post">
          <span>你正在回应</span>
          <strong>{post.title}</strong>
        </div>

        <label className="structured-field">
          <span>先确认你理解的观点</span>
          <textarea
            value={understoodPoint}
            placeholder="我理解你的核心观点是……"
            onChange={(event) => setUnderstoodPoint(event.target.value)}
          />
        </label>

        <div className="disagreement-types">
          <span>你不同意的是</span>
          <div>
            {(Object.keys(labels) as DisagreementType[]).map((item) => (
              <button
                key={item}
                className={type === item ? "active" : ""}
                onClick={() => setType(item)}
              >
                {labels[item]}
              </button>
            ))}
          </div>
        </div>

        <label className="structured-field">
          <span>说明你的理由</span>
          <textarea
            value={body}
            placeholder="至少 10 个字。讨论观点、证据和经验，不攻击个人。"
            onChange={(event) => setBody(event.target.value)}
          />
          <small>{body.length}/500</small>
        </label>
      </section>
    </div>
  );
}

function ProfileSheet({
  value,
  onClose,
  onSave,
}: {
  value: EchoProfile;
  onClose: () => void;
  onSave: (profile: EchoProfile) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="sheet profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="编辑个人资料"
      >
        <header className="sheet-header">
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
          <div>
            <span className="eyebrow">PUBLIC IDENTITY</span>
            <h2>编辑资料</h2>
          </div>
          <button
            className="publish-button"
            disabled={!draft.nickname.trim()}
            onClick={() => onSave(draft)}
          >
            保存
          </button>
        </header>
        <div className="avatar-editor">
          <div className="avatar profile-avatar">{draft.avatar}</div>
          <div>
            <strong>公开身份</strong>
            <p>真实身份只用于平台风控，不会展示给其他用户。</p>
          </div>
        </div>
        <label className="structured-field">
          <span>昵称</span>
          <input
            value={draft.nickname}
            maxLength={20}
            onChange={(event) =>
              setDraft({
                ...draft,
                nickname: event.target.value,
                avatar: event.target.value.trim().slice(0, 1) || "声",
              })
            }
          />
        </label>
        <label className="structured-field">
          <span>简介</span>
          <textarea
            value={draft.bio}
            maxLength={100}
            onChange={(event) =>
              setDraft({ ...draft, bio: event.target.value })
            }
          />
        </label>
      </section>
    </div>
  );
}

function AuthSheet({ onSignIn }: { onSignIn: (nickname: string) => void }) {
  const [mode, setMode] = useState<"welcome" | "phone">("welcome");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("晚风有信");
  const phoneReady = /^1\d{10}$/.test(phone) && code.length >= 4;

  return (
    <div className="auth-backdrop">
      <section className="auth-card" role="dialog" aria-modal="true" aria-label="登录回声">
        <div className="auth-brand">
          <EchoGlyph />
          <span>回声</span>
        </div>
        <span className="eyebrow">WELCOME TO ECHO</span>
        <h1>附近有人认真说话，<br />也有人认真听。</h1>
        <p>只展示附近讨论，不展示附近的人。后台身份用于安全，公开身份由你决定。</p>

        {mode === "welcome" ? (
          <div className="auth-actions">
            <button className="wechat-button" onClick={() => onSignIn(nickname)}>
              <MessageSquareMore size={18} /> 微信快捷登录
            </button>
            <button className="phone-button" onClick={() => setMode("phone")}>
              <Smartphone size={18} /> 手机号登录
            </button>
          </div>
        ) : (
          <div className="phone-form">
            <label>
              <span>手机号</span>
              <input
                inputMode="tel"
                value={phone}
                maxLength={11}
                placeholder="请输入 11 位手机号"
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, ""))
                }
              />
            </label>
            <label>
              <span>验证码</span>
              <div>
                <input
                  inputMode="numeric"
                  value={code}
                  maxLength={6}
                  placeholder="演示环境输入任意 4 位"
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ""))
                  }
                />
                <button type="button">获取验证码</button>
              </div>
            </label>
            <label>
              <span>公开昵称</span>
              <input
                value={nickname}
                maxLength={20}
                onChange={(event) => setNickname(event.target.value)}
              />
            </label>
            <button
              className="auth-submit"
              disabled={!phoneReady || !nickname.trim()}
              onClick={() => onSignIn(nickname)}
            >
              进入回声
            </button>
            <button className="auth-back" onClick={() => setMode("welcome")}>
              返回其他登录方式
            </button>
          </div>
        )}

        <small>登录即表示同意社区规则与隐私说明。本演示不会发送手机号或验证码。</small>
      </section>
    </div>
  );
}

function Composer({
  draft,
  location,
  onChange,
  onClose,
  onPublish,
}: {
  draft: DraftPost;
  location: LocationSettings;
  onChange: (draft: DraftPost) => void;
  onClose: () => void;
  onPublish: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingImages, setProcessingImages] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const available = MAX_POST_IMAGES - draft.media.length;
    if (available <= 0) {
      setMediaError(`最多添加 ${MAX_POST_IMAGES} 张图片`);
      return;
    }

    const selected = Array.from(files).slice(0, available);
    const invalid = selected
      .map((file) => validateImageFile(file))
      .find((message) => message);
    if (invalid) {
      setMediaError(invalid);
      return;
    }

    setProcessingImages(true);
    setMediaError(null);
    try {
      const sanitized = [];
      for (const file of selected) {
        sanitized.push(await sanitizeImage(file));
      }
      onChange({ ...draft, media: [...draft.media, ...sanitized] });
      if (files.length > available) {
        setMediaError(`最多添加 ${MAX_POST_IMAGES} 张，已保留前 ${available} 张`);
      }
    } catch {
      setMediaError("这张图片暂时无法处理，请换一张 JPG、PNG 或 WebP");
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="sheet composer-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="发出回声"
      >
        <header className="sheet-header">
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
          <div>
            <span className="eyebrow">CREATE AN ECHO</span>
            <h2>发出回声</h2>
          </div>
          <button
            className="publish-button"
            onClick={onPublish}
            disabled={
              processingImages ||
              !draft.title.trim() ||
              (!draft.body.trim() && draft.media.length === 0)
            }
          >
            发布
          </button>
        </header>

        <div className="kind-picker" role="radiogroup" aria-label="内容类型">
          {(Object.keys(kindLabels) as PostKind[]).map((kind) => (
            <button
              key={kind}
              role="radio"
              aria-checked={draft.kind === kind}
              className={draft.kind === kind ? "active" : ""}
              onClick={() => onChange({ ...draft, kind })}
            >
              <i>{kindLabels[kind].icon}</i>
              <span>{kindLabels[kind].label}</span>
              <small>
                {kind === "question"
                  ? "获得具体答案"
                  : kind === "discussion"
                    ? "交换真实观点"
                    : "发起公开活动"}
              </small>
            </button>
          ))}
        </div>

        <label className="composer-field">
          <span>标题</span>
          <input
            value={draft.title}
            maxLength={60}
            placeholder={
              draft.kind === "question"
                ? "你想从附近获得什么具体答案？"
                : draft.kind === "meetup"
                  ? "简单说清时间、地点和活动"
                  : "你想认真聊聊什么？"
            }
            onChange={(event) =>
              onChange({ ...draft, title: event.target.value })
            }
          />
          <small>{draft.title.length}/60</small>
        </label>

        <label className="composer-field composer-body">
          <span>补充</span>
          <textarea
            value={draft.body}
            maxLength={500}
            placeholder="补充背景、已经尝试过什么，或你期待怎样的回应…"
            onChange={(event) =>
              onChange({ ...draft, body: event.target.value })
            }
          />
          <small>{draft.body.length}/500</small>
        </label>

        <section className="media-composer">
          <div className="media-composer-heading">
            <div>
              <strong>图片</strong>
              <span>
                {draft.media.length}/{MAX_POST_IMAGES} · 上传时自动清理 EXIF
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              aria-label="选择图片"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <button
              type="button"
              disabled={
                processingImages || draft.media.length >= MAX_POST_IMAGES
              }
              onClick={() => fileInputRef.current?.click()}
            >
              {processingImages ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <ImagePlus size={16} />
              )}
              {processingImages ? "正在处理" : "添加图片"}
            </button>
          </div>

          {draft.media.length > 0 && (
            <div className="media-preview-grid">
              {draft.media.map((item, index) => (
                <div key={item.id}>
                  <Image
                    src={item.dataUrl}
                    alt={`待发布图片 ${index + 1}`}
                    width={item.width}
                    height={item.height}
                    unoptimized
                  />
                  <button
                    type="button"
                    aria-label={`删除图片 ${index + 1}`}
                    onClick={() =>
                      onChange({
                        ...draft,
                        media: draft.media.filter(
                          (media) => media.id !== item.id,
                        ),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
          )}
          {mediaError && <p className="media-error">{mediaError}</p>}
        </section>

        <div className="composer-options">
          <label>
            <span>
              <Radio size={17} /> 发布到
            </span>
            <select
              value={draft.distanceBand}
              onChange={(event) =>
                onChange({
                  ...draft,
                  distanceBand: event.target
                    .value as DraftPost["distanceBand"],
                })
              }
            >
              <option>500m内</option>
              <option>3km内</option>
              <option>同城</option>
            </select>
          </label>
          <label>
            <span>
              <Bookmark size={17} /> 话题
            </span>
            <select
              value={draft.topic}
              onChange={(event) =>
                onChange({ ...draft, topic: event.target.value })
              }
            >
              <option>职业互助</option>
              <option>城市静音室</option>
              <option>通勤接力</option>
              <option>午间窗</option>
              <option>附近实测</option>
              <option>每日一声</option>
            </select>
          </label>
        </div>

        <div className="composer-safety">
          <ShieldCheck size={18} />
          <p>
            <strong>{publicLocationLabel(location)}</strong>
            {locationSafetyCopy(location)}。图片会自动清理位置信息。
          </p>
        </div>
      </section>
    </div>
  );
}

function LocationSheet({
  value,
  onClose,
  onSave,
}: {
  value: LocationSettings;
  onClose: () => void;
  onSave: (value: LocationSettings) => void;
}) {
  const [draft, setDraft] = useState(value);
  const permissions: {
    id: LocationPermission;
    title: string;
    copy: string;
  }[] = [
    {
      id: "once",
      title: "仅验证一次",
      copy: "加入声场时验证，之后不持续获取位置",
    },
    {
      id: "while-using",
      title: "使用期间",
      copy: "打开声场时更新区域，但不保存移动轨迹",
    },
    {
      id: "off",
      title: "纯线上模式",
      copy: "关闭附近内容，只保留发现与订阅",
    },
  ];

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="sheet location-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="位置与声场"
      >
        <header className="sheet-header">
          <button onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
          <div>
            <span className="eyebrow">LOCATION PRIVACY</span>
            <h2>位置与声场</h2>
          </div>
          <button className="publish-button" onClick={() => onSave(draft)}>
            保存
          </button>
        </header>

        <div className="privacy-hero">
          <span>
            <ShieldCheck size={24} />
          </span>
          <div>
            <h3>只展示附近讨论，不展示附近的人</h3>
            <p>回声只用位置验证你属于哪个声场，不显示坐标、精确距离或移动方向。</p>
          </div>
        </div>

        <div className="permission-list">
          {permissions.map((permission) => (
            <button
              key={permission.id}
              className={draft.permission === permission.id ? "active" : ""}
              onClick={() =>
                setDraft({ ...draft, permission: permission.id })
              }
            >
              <span className="radio-dot">
                {draft.permission === permission.id && <i />}
              </span>
              <div>
                <strong>{permission.title}</strong>
                <small>{permission.copy}</small>
              </div>
            </button>
          ))}
        </div>

        {draft.permission !== "off" && (
          <div className="radius-picker">
            <div>
              <MapPin size={18} />
              <span>
                <strong>公开范围</strong>
                <small>其他人只能看到范围，不会看到距离</small>
              </span>
            </div>
            <div className="segmented-control">
              {(["500m内", "3km内", "同城"] as const).map((band) => (
                <button
                  key={band}
                  className={draft.distanceBand === band ? "active" : ""}
                  onClick={() => setDraft({ ...draft, distanceBand: band })}
                >
                  {band}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="privacy-list">
          <p>
            <Check size={15} /> 不公开实时位置和在线状态
          </p>
          <p>
            <Check size={15} /> 不用历史帖子拼接行动轨迹
          </p>
          <p>
            <Check size={15} /> 图片上传时自动清理 EXIF
          </p>
        </div>
      </section>
    </div>
  );
}
