import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const eventsFile = path.join(dataDir, "events.jsonl");

export type EventInput =
  | {
      type: "page_view";
      visitorId: string;
      referrer?: string;
      device?: string;
    }
  | {
      type: "banner_click";
      bannerId: string;
      visitorId: string;
      referrer?: string;
      device?: string;
    };

export type StoredEvent = EventInput & { ts: number };

export interface TimeSeriesPoint {
  date: string;
  views: number;
  clicks: number;
}

export interface PerBannerTimeSeries {
  id: string;
  series: Array<{ date: string; clicks: number }>;
}

export interface StatsSummary {
  totalViews: number;
  uniqueVisitors: number;
  clicksByBanner: Array<{ id: string; clicks: number }>;
  devices: Array<{ device: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  timeSeries: TimeSeriesPoint[];
  perBannerTimeSeries: PerBannerTimeSeries[];
}

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(eventsFile);
  } catch {
    await fs.writeFile(eventsFile, "", "utf8");
  }
}

export async function appendEvent(event: EventInput) {
  await ensureStorage();
  const record: StoredEvent = { ...event, ts: Date.now() };
  await fs.appendFile(eventsFile, `${JSON.stringify(record)}\n`, "utf8");
}

async function readEvents(): Promise<StoredEvent[]> {
  await ensureStorage();
  const content = await fs.readFile(eventsFile, "utf8");
  if (!content.trim()) return [];
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as StoredEvent;
      } catch {
        return null;
      }
    })
    .filter((value): value is StoredEvent => Boolean(value));
}

function normalizeReferrer(referrer?: string): string {
  if (!referrer) return "(direct)";
  const trimmed = referrer.trim();
  if (!trimmed) return "(direct)";
  try {
    const url = new URL(trimmed);
    return url.host || "(direct)";
  } catch {
    return "(direct)";
  }
}

function normalizeDevice(device?: string): string {
  if (!device) return "unknown";
  const normalized = device.toLowerCase();
  switch (normalized) {
    case "desktop":
    case "mobile":
    case "tablet":
    case "wearable":
      return normalized;
    default:
      return "unknown";
  }
}

export async function getStats(): Promise<StatsSummary> {
  const events = await readEvents();
  let totalViews = 0;
  const uniqueVisitors = new Set<string>();
  const clicksMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const referrerMap = new Map<string, number>();

  for (const event of events) {
    uniqueVisitors.add(event.visitorId);

    const deviceKey = normalizeDevice(event.device);
    deviceMap.set(deviceKey, (deviceMap.get(deviceKey) ?? 0) + 1);

    const refKey = normalizeReferrer(event.referrer);
    referrerMap.set(refKey, (referrerMap.get(refKey) ?? 0) + 1);

    if (event.type === "page_view") {
      totalViews += 1;
    } else if (event.type === "banner_click") {
      clicksMap.set(event.bannerId, (clicksMap.get(event.bannerId) ?? 0) + 1);
    }
  }

  const clicksByBanner = Array.from(clicksMap.entries())
    .map(([id, clicks]) => ({ id, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  const devices = Array.from(deviceMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  const topReferrers = Array.from(referrerMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Build time series (last 28 days)
  const now = Date.now();
  const dayMs = 86400000;
  const timeSeriesMap = new Map<string, { views: number; clicks: number }>();
  const perBannerMap = new Map<string, Map<string, number>>();

  for (let i = 27; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    timeSeriesMap.set(key, { views: 0, clicks: 0 });
  }

  for (const event of events) {
    const key = new Date(event.ts).toISOString().slice(0, 10);
    const bucket = timeSeriesMap.get(key);
    if (!bucket) continue;

    if (event.type === "page_view") {
      bucket.views += 1;
    } else if (event.type === "banner_click") {
      bucket.clicks += 1;
      if (!perBannerMap.has(event.bannerId)) {
        perBannerMap.set(event.bannerId, new Map());
      }
      const bannerDayMap = perBannerMap.get(event.bannerId)!;
      bannerDayMap.set(key, (bannerDayMap.get(key) ?? 0) + 1);
    }
  }

  const timeSeries = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
    date,
    views: data.views,
    clicks: data.clicks
  }));

  const perBannerTimeSeries = Array.from(perBannerMap.entries()).map(([id, dayMap]) => ({
    id,
    series: Array.from(dayMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }));

  return {
    totalViews,
    uniqueVisitors: uniqueVisitors.size,
    clicksByBanner,
    devices,
    topReferrers,
    timeSeries,
    perBannerTimeSeries
  };
}
