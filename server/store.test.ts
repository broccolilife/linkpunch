import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { appendEvent, getStats, type EventInput } from "./store";

const dataDir = path.join(process.cwd(), "data");
const eventsFile = path.join(dataDir, "events.jsonl");

describe("store", () => {
  beforeEach(async () => {
    // Clear events file before each test
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(eventsFile, "", "utf8");
  });

  describe("appendEvent", () => {
    it("writes a page_view event as JSONL", async () => {
      await appendEvent({ type: "page_view", visitorId: "v1" });
      const content = await fs.readFile(eventsFile, "utf8");
      const lines = content.trim().split("\n");
      expect(lines).toHaveLength(1);
      const parsed = JSON.parse(lines[0]);
      expect(parsed.type).toBe("page_view");
      expect(parsed.visitorId).toBe("v1");
      expect(parsed.ts).toBeTypeOf("number");
    });

    it("appends multiple events", async () => {
      await appendEvent({ type: "page_view", visitorId: "v1" });
      await appendEvent({ type: "banner_click", bannerId: "b1", visitorId: "v2" });
      const content = await fs.readFile(eventsFile, "utf8");
      const lines = content.trim().split("\n");
      expect(lines).toHaveLength(2);
    });
  });

  describe("getStats", () => {
    it("returns zeros for empty file", async () => {
      const stats = await getStats();
      expect(stats.totalViews).toBe(0);
      expect(stats.uniqueVisitors).toBe(0);
      expect(stats.clicksByBanner).toEqual([]);
      expect(stats.devices).toEqual([]);
    });

    it("counts page views and unique visitors", async () => {
      await appendEvent({ type: "page_view", visitorId: "v1" });
      await appendEvent({ type: "page_view", visitorId: "v1" });
      await appendEvent({ type: "page_view", visitorId: "v2" });
      const stats = await getStats();
      expect(stats.totalViews).toBe(3);
      expect(stats.uniqueVisitors).toBe(2);
    });

    it("counts banner clicks", async () => {
      await appendEvent({ type: "banner_click", bannerId: "twitter", visitorId: "v1" });
      await appendEvent({ type: "banner_click", bannerId: "twitter", visitorId: "v2" });
      await appendEvent({ type: "banner_click", bannerId: "youtube", visitorId: "v3" });
      const stats = await getStats();
      expect(stats.clicksByBanner).toEqual([
        { id: "twitter", clicks: 2 },
        { id: "youtube", clicks: 1 },
      ]);
    });

    it("normalizes devices", async () => {
      await appendEvent({ type: "page_view", visitorId: "v1", device: "MOBILE" });
      await appendEvent({ type: "page_view", visitorId: "v2", device: "desktop" });
      await appendEvent({ type: "page_view", visitorId: "v3" }); // unknown
      const stats = await getStats();
      const deviceMap = Object.fromEntries(stats.devices.map((d) => [d.device, d.count]));
      expect(deviceMap["mobile"]).toBe(1);
      expect(deviceMap["desktop"]).toBe(1);
      expect(deviceMap["unknown"]).toBe(1);
    });

    it("normalizes referrers to hostname", async () => {
      await appendEvent({ type: "page_view", visitorId: "v1", referrer: "https://twitter.com/some/page" });
      await appendEvent({ type: "page_view", visitorId: "v2", referrer: "" });
      await appendEvent({ type: "page_view", visitorId: "v3" }); // direct
      const stats = await getStats();
      const refMap = Object.fromEntries(stats.topReferrers.map((r) => [r.referrer, r.count]));
      expect(refMap["twitter.com"]).toBe(1);
      expect(refMap["(direct)"]).toBe(2);
    });

    it("limits topReferrers to 10", async () => {
      for (let i = 0; i < 15; i++) {
        await appendEvent({ type: "page_view", visitorId: `v${i}`, referrer: `https://site${i}.com` });
      }
      const stats = await getStats();
      expect(stats.topReferrers.length).toBeLessThanOrEqual(10);
    });
  });
});
