/**
 * JSONL-based analytics persistence layer.
 * Events are appended as newline-delimited JSON to data/events.jsonl.
 * No database required — reads parse the full file for aggregation.
 */
import { promises as fs } from "fs";
import path from "path";

/** Resolve paths relative to project root */
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

export interface StatsSummary {
  totalViews: number;
  uniqueVisitors: number;
  clicksByBanner: Array<{ id: string; clicks: number }>;
  devices: Array<{ device: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}

/** Create data directory and events file if they don't exist yet */
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

/** Convert a Map<string, number> to a sorted-descending array of {key, count} objects. */
function mapToSortedArray<K extends string>(
  map: Map<string, number>,
  keyName: K
): Array<Record<K, string> & { count: number }> {
  return Array.from(map.entries())
    .map(([key, count]) => ({ [keyName]: key, count } as Record<K, string> & { count: number }))
    .sort((a, b) => b.count - a.count);
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

  // Use shared utility to eliminate repeated Map→sorted-array boilerplate
  const clicksByBanner = mapToSortedArray(clicksMap, "id").map(({ id, count }) => ({ id, clicks: count }));
  const devices = mapToSortedArray(deviceMap, "device");
  const topReferrers = mapToSortedArray(referrerMap, "referrer").slice(0, 10);

  return {
    totalViews,
    uniqueVisitors: uniqueVisitors.size,
    clicksByBanner,
    devices,
    topReferrers
  };
}
