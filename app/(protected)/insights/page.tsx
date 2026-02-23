"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchStats, StatsResponse } from "@/app/shared/client";
import BarChart from "@/components/BarChart";

export default function InsightsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<"views" | "clicks">("views");

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => {
        console.warn("Failed to fetch stats", err);
        setError("Unable to load live statistics.");
      });
  }, []);

  const totalClicks =
    stats?.clicksByBanner.reduce((sum, b) => sum + b.clicks, 0) ?? 0;
  const ctr =
    stats && stats.totalViews > 0
      ? (totalClicks / stats.totalViews) * 100
      : 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-5 pb-10 pt-10 text-white">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl font-semibold">Analytics Dashboard</h1>
        <p className="text-sm text-white/60">
          Real-time views, clicks, and per-link performance from JSONL storage.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Views</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {stats ? stats.totalViews.toLocaleString() : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Clicks</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {stats ? totalClicks.toLocaleString() : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">CTR</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {stats ? `${ctr.toFixed(1)}%` : "—"}
          </p>
        </div>
      </section>

      {/* Time Series Chart */}
      {stats && stats.timeSeries.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">28-Day Trend</h2>
            <div className="flex gap-1">
              {(["views", "clicks"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setChartMetric(m)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    chartMetric === m
                      ? "bg-white/20 text-white"
                      : "text-white/50 hover:text-white/80"
                  ].join(" ")}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <BarChart data={stats.timeSeries} metric={chartMetric} height={100} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40">
            <span>{stats.timeSeries[0]?.date.slice(5)}</span>
            <span>{stats.timeSeries[stats.timeSeries.length - 1]?.date.slice(5)}</span>
          </div>
        </motion.section>
      ) : null}

      {/* Per-Banner Click Tracking */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-semibold text-white">Per-Link Performance</h2>
        {stats && stats.clicksByBanner.length > 0 ? (
          <div className="mt-3 space-y-3">
            {stats.clicksByBanner.map((banner) => {
              const pct =
                stats.totalViews > 0
                  ? (banner.clicks / stats.totalViews) * 100
                  : 0;
              return (
                <div key={banner.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{banner.id}</span>
                    <span className="text-white/60">
                      {banner.clicks} clicks · {pct.toFixed(1)}% CTR
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400/60 transition-all"
                      style={{ width: `${Math.min(pct * 2, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/50">No click data recorded yet.</p>
        )}
      </section>

      {/* Device & Referrer Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white">Devices</h2>
          {stats && stats.devices.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {stats.devices.map((d) => (
                <li key={d.device} className="flex justify-between text-white/80">
                  <span className="capitalize">{d.device}</span>
                  <span>{d.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-white/50">No device data yet.</p>
          )}
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white">Top Referrers</h2>
          {stats && stats.topReferrers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {stats.topReferrers.map((r) => (
                <li key={r.referrer} className="flex justify-between text-white/80">
                  <span className="truncate">{r.referrer}</span>
                  <span>{r.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-white/50">No referral data yet.</p>
          )}
        </section>
      </div>

      {/* Unique Visitors */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
          Unique Visitors
        </p>
        <p className="mt-1 text-3xl font-semibold text-white">
          {stats ? stats.uniqueVisitors.toLocaleString() : "—"}
        </p>
      </section>
    </main>
  );
}
