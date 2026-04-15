// Large benchmark input: 100 resources × 50 route patterns = 5000 routes.
// Resources span the full alphabet so the trie has wide root-level branching.

export const LARGE_RESOURCES = [
  // a
  "accounts",
  "addresses",
  "alerts",
  "analytics",
  "archives",
  "assets",
  "attachments",
  "audits",
  "automation",
  // b
  "badges",
  "billing",
  "blogs",
  "bookmarks",
  "builds",
  // c
  "campaigns",
  "categories",
  "certificates",
  "channels",
  "clusters",
  "comments",
  "connections",
  "contacts",
  "content",
  "coupons",
  // d
  "dashboards",
  "deployments",
  "devices",
  "documents",
  "domains",
  // e
  "emails",
  "endpoints",
  "environments",
  "events",
  "exports",
  // f
  "feeds",
  "files",
  "filters",
  "forms",
  // g
  "groups",
  // h
  "hooks",
  // i
  "identities",
  "imports",
  "integrations",
  "invitations",
  // j
  "jobs",
  // k
  "keys",
  // l
  "labels",
  "logs",
  // m
  "media",
  "members",
  "messages",
  "metrics",
  "milestones",
  "modules",
  // n
  "namespaces",
  "nodes",
  "notifications",
  // o
  "orders",
  "organizations",
  // p
  "pages",
  "payments",
  "permissions",
  "pipelines",
  "plans",
  "plugins",
  "policies",
  "posts",
  "profiles",
  "projects",
  // q
  "queries",
  "queues",
  // r
  "ratings",
  "releases",
  "reports",
  "reviews",
  "roles",
  "rules",
  // s
  "schedules",
  "services",
  "sessions",
  "settings",
  "shipments",
  "snapshots",
  "spaces",
  "subscriptions",
  // t
  "tags",
  "tasks",
  "teams",
  "templates",
  "tokens",
  "topics",
  "transactions",
  // u
  "users",
  // v
  "variables",
  "versions",
  "views",
  // w
  "webhooks",
  "workers",
  "workflows",
  // z
  "zones",
] as const;

// 53 patterns per resource → 100 resources × 53 = 5300 routes
const PATTERNS: ReadonlyArray<{ method: string; suffix: string }> = [
  // 10 static routes (no params)
  { method: "GET", suffix: "" },
  { method: "POST", suffix: "" },
  { method: "GET", suffix: "/count" },
  { method: "GET", suffix: "/search" },
  { method: "GET", suffix: "/export" },
  { method: "POST", suffix: "/import" },
  { method: "GET", suffix: "/schema" },
  { method: "GET", suffix: "/stats" },
  { method: "GET", suffix: "/recent" },
  { method: "GET", suffix: "/popular" },
  // 14 single-param routes (/:id)
  { method: "GET", suffix: "/:id" },
  { method: "PUT", suffix: "/:id" },
  { method: "PATCH", suffix: "/:id" },
  { method: "DELETE", suffix: "/:id" },
  { method: "GET", suffix: "/:id/meta" },
  { method: "GET", suffix: "/:id/history" },
  { method: "GET", suffix: "/:id/related" },
  { method: "POST", suffix: "/:id/archive" },
  { method: "POST", suffix: "/:id/restore" },
  { method: "POST", suffix: "/:id/clone" },
  { method: "POST", suffix: "/:id/activate" },
  { method: "POST", suffix: "/:id/deactivate" },
  { method: "GET", suffix: "/:id/status" },
  { method: "GET", suffix: "/:id/preview" },
  // 26 two-level nested routes (/:id/sub and /:id/sub/:subId)
  { method: "GET", suffix: "/:id/tags" },
  { method: "POST", suffix: "/:id/tags" },
  { method: "GET", suffix: "/:id/tags/:subId" },
  { method: "DELETE", suffix: "/:id/tags/:subId" },
  { method: "GET", suffix: "/:id/comments" },
  { method: "POST", suffix: "/:id/comments" },
  { method: "GET", suffix: "/:id/comments/:subId" },
  { method: "PUT", suffix: "/:id/comments/:subId" },
  { method: "DELETE", suffix: "/:id/comments/:subId" },
  { method: "GET", suffix: "/:id/attachments" },
  { method: "POST", suffix: "/:id/attachments" },
  { method: "GET", suffix: "/:id/attachments/:subId" },
  { method: "DELETE", suffix: "/:id/attachments/:subId" },
  { method: "GET", suffix: "/:id/members" },
  { method: "POST", suffix: "/:id/members" },
  { method: "GET", suffix: "/:id/members/:subId" },
  { method: "PUT", suffix: "/:id/members/:subId" },
  { method: "DELETE", suffix: "/:id/members/:subId" },
  { method: "GET", suffix: "/:id/versions" },
  { method: "POST", suffix: "/:id/versions" },
  { method: "GET", suffix: "/:id/versions/:subId" },
  { method: "PUT", suffix: "/:id/versions/:subId" },
  { method: "DELETE", suffix: "/:id/versions/:subId" },
  { method: "GET", suffix: "/:id/activities" },
  { method: "GET", suffix: "/:id/activities/:subId" },
  { method: "GET", suffix: "/:id/permissions" },
  // 3 wildcard routes
  { method: "GET", suffix: "/**" },
  { method: "GET", suffix: "/:id/**" },
  { method: "GET", suffix: "/:id/files/**" },
];

export const largeRoutes = LARGE_RESOURCES.flatMap((resource) =>
  PATTERNS.map(({ method, suffix }) => ({
    method,
    path: `/${resource}${suffix}`,
  })),
) as Array<{ method: string; path: string }>;

// Representative requests: early (accounts), mid (messages), late (zones) positions.
// Covers static, single-param, and two-param patterns for breadth.
export const largeRequests = [
  // early resource
  {
    name: "large – early static",
    method: "GET",
    path: "/accounts",
    data: "[GET] /accounts",
  },
  {
    name: "large – early 1-param",
    method: "GET",
    path: "/accounts/abc123",
    params: { id: "abc123" },
    data: "[GET] /accounts/:id",
  },
  {
    name: "large – early 2-param",
    method: "GET",
    path: "/accounts/abc123/comments/def456",
    params: { id: "abc123", subId: "def456" },
    data: "[GET] /accounts/:id/comments/:subId",
  },
  // mid resource (messages, index 52)
  {
    name: "large – mid static",
    method: "GET",
    path: "/messages",
    data: "[GET] /messages",
  },
  {
    name: "large – mid 1-param",
    method: "GET",
    path: "/messages/abc123",
    params: { id: "abc123" },
    data: "[GET] /messages/:id",
  },
  {
    name: "large – mid 2-param",
    method: "GET",
    path: "/messages/abc123/members/def456",
    params: { id: "abc123", subId: "def456" },
    data: "[GET] /messages/:id/members/:subId",
  },
  // late resource (zones, last)
  {
    name: "large – late static",
    method: "GET",
    path: "/zones",
    data: "[GET] /zones",
  },
  {
    name: "large – late 1-param",
    method: "GET",
    path: "/zones/abc123",
    params: { id: "abc123" },
    data: "[GET] /zones/:id",
  },
  {
    name: "large – late 2-param",
    method: "GET",
    path: "/zones/abc123/versions/def456",
    params: { id: "abc123", subId: "def456" },
    data: "[GET] /zones/:id/versions/:subId",
  },
  // wildcard routes (/:id/**)
  {
    name: "large – early nested wildcard",
    method: "GET",
    path: "/accounts/abc123/foo/bar",
    params: { id: "abc123", _: "foo/bar" },
    data: "[GET] /accounts/:id/**",
  },
  {
    name: "large – mid nested wildcard",
    method: "GET",
    path: "/messages/abc123/foo/bar",
    params: { id: "abc123", _: "foo/bar" },
    data: "[GET] /messages/:id/**",
  },
  {
    name: "large – late nested wildcard",
    method: "GET",
    path: "/zones/abc123/foo/bar",
    params: { id: "abc123", _: "foo/bar" },
    data: "[GET] /zones/:id/**",
  },
  // static-prefix wildcard routes (/:id/files/**): static "files" beats param /:id, so
  // these always fire before /:id/** for paths like /resource/:id/files/...
  {
    name: "large – early static-prefix wildcard",
    method: "GET",
    path: "/accounts/abc123/files/report.pdf",
    params: { id: "abc123", _: "report.pdf" },
    data: "[GET] /accounts/:id/files/**",
  },
  {
    name: "large – mid static-prefix wildcard",
    method: "GET",
    path: "/messages/abc123/files/img/photo.png",
    params: { id: "abc123", _: "img/photo.png" },
    data: "[GET] /messages/:id/files/**",
  },
  {
    name: "large – late static-prefix wildcard",
    method: "GET",
    path: "/zones/abc123/files/config.yaml",
    params: { id: "abc123", _: "config.yaml" },
    data: "[GET] /zones/:id/files/**",
  },
] as Array<{
  name: string;
  method: string;
  path: string;
  params?: Record<string, string>;
  data: string;
}>;
