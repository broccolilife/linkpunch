"use client";

import UAParser from "ua-parser-js";

export interface TimeSeriesPoint {
  date: string;
  views: number;
  clicks: number;
}

export interface PerBannerTimeSeries {
  id: string;
  series: Array<{ date: string; clicks: number }>;
}

export interface StatsResponse {
  totalViews: number;
  uniqueVisitors: number;
  clicksByBanner: Array<{ id: string; clicks: number }>;
  devices: Array<{ device: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  timeSeries: TimeSeriesPoint[];
  perBannerTimeSeries: PerBannerTimeSeries[];
}

const VISITOR_KEY = "aerolinks_visitor_id";

function createVisitorId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `visitor-${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") {
    return createVisitorId();
  }
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) {
    return existing;
  }
  const fresh = createVisitorId();
  localStorage.setItem(VISITOR_KEY, fresh);
  return fresh;
}

function detectDevice(): string {
  if (typeof window === "undefined") {
    return "unknown";
  }
  const parser = new UAParser(window.navigator.userAgent);
  const deviceType = parser.getDevice().type;
  if (!deviceType) {
    return "desktop";
  }
  switch (deviceType) {
    case "tablet":
    case "mobile":
    case "wearable":
      return deviceType;
    default:
      return "unknown";
  }
}

async function postEvent(body: Record<string, unknown>) {
  try {
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.warn("Failed to post analytics event", error);
  }
}

export async function trackPageView() {
  if (typeof window === "undefined") return;
  await postEvent({
    type: "page_view",
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
    device: detectDevice()
  });
}

export async function trackBannerClick(bannerId: string) {
  if (typeof window === "undefined") return;
  await postEvent({
    type: "banner_click",
    bannerId,
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
    device: detectDevice()
  });
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch("/api/stats", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load stats");
  }
  return res.json();
}
