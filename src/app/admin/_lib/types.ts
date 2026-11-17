export type Totals = {
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  sessions: number;
  pageviews: number;
  interactions: number;
  avgEngagementMs: number;
  engagementRate: number;
  bounceRate: number;
  pagesPerSession: number;
};

export type DayRow = { day: string; visitors: number; sessions: number; pageviews: number; new_visitors: number; returning_visitors: number };

export type Overview = { current: Totals; previous: Totals; series: DayRow[]; prevSeries: DayRow[] };
export type VisitorsReport = { current: Totals; previous: Totals; series: DayRow[]; depth: { bucket: string; sessions: number }[] };

export type SourceRow = { source: string; medium: string; campaign: string; visitors: number; sessions: number; engaged: number; avg_engagement_ms: number };
export type SourcesReport = { rows: SourceRow[]; previous: SourceRow[] };

export type GeoReport = {
  countries: { country: string; visitors: number; sessions: number; pageviews: number }[];
  regions: { country: string; region: string; visitors: number }[];
  trend: { day: string; country: string; visitors: number }[];
  previous: { country: string; visitors: number }[];
};

export type Dim = { name: string; visitors: number; sessions: number };
export type DevicesReport = { device: Dim[]; os: Dim[]; browser: Dim[]; screen: Dim[] };

export type PagesReport = {
  top: { path: string; pageviews: number; visitors: number; avg_engagement_ms: number }[];
  entries: { path: string; sessions: number }[];
  exits: { path: string; sessions: number }[];
  projects: { slug: string; views: number; visitors: number; avg_engagement_ms: number }[];
  projectClicks: { slug: string; clicks: number; visitors: number }[];
};

export type BehaviorReport = {
  events: { name: string; count: number; visitors: number }[];
  targets: { name: string; target: string; count: number }[];
  series: { day: string; count: number }[];
  previous: { name: string; count: number }[];
};

export type Realtime = {
  now: number;
  windowMinutes: number;
  active: number;
  pages: { path: string; visitors: number }[];
  breakdown: { device: string; country: string | null; visitors: number }[];
  recent: { ts: number; path: string; country: string | null; region: string | null; device: string; browser: string; source: string | null }[];
  perMinute: { ts: number; pageviews: number }[];
};
