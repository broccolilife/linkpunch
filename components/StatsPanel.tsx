"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BannerData } from "@/components/Banner3D";
import { fetchStats, StatsResponse } from "@/app/shared/client";

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  banners: BannerData[];
}

export default function StatsPanel({ isOpen, onClose, banners }: StatsPanelProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setError(null);
    fetchStats()
      .then((response) => {
        if (mounted) setStats(response);
      })
      .catch((err) => {
        console.warn("Failed to fetch stats", err);
        if (mounted) {
          setError("Unable to load statistics.");
          setStats(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const totalViews = stats?.totalViews ?? 0;
  const bannerLookup = useMemo(() => {
    const map = new Map<string, BannerData>();
    banners.forEach((banner) => map.set(banner.id, banner));
    return map;
  }, [banners]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8" role="dialog" aria-modal="true" data-slot="stats-panel">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Creator statistics</h2>
            <p className="text-sm text-white/60">Real-time telemetry from local JSONL storage.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Total views</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats ? stats.totalViews.toLocaleString() : "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Unique visitors</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats ? stats.uniqueVisitors.toLocaleString() : "—"}
                </p>
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-lg font-semibold text-white">Per-banner performance</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <table className="w-full text-sm">
                  <thead className="bg-white/10 text-white/70">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Banner</th>
                      <th className="px-4 py-2 text-right font-semibold">Clicks</th>
                      <th className="px-4 py-2 text-right font-semibold">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner) => {
                      const clicks = stats?.clicksByBanner.find((item) => item.id === banner.id)?.clicks ?? 0;
                      const ctr = totalViews ? (clicks / totalViews) * 100 : 0;
                      return (
                        <tr key={banner.id} className="border-t border-white/5 text-white/80">
                          <td className="px-4 py-2">
                            <div className="font-semibold text-white">{banner.title}</div>
                            {banner.description ? (
                              <div className="text-xs text-white/60">{banner.description}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-2 text-right">{clicks.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{ctr.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                    {stats && stats.clicksByBanner.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-sm text-white/60">
                          No clicks recorded yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">Devices</h3>
                <table className="mt-2 w-full text-sm text-white/80">
                  <tbody>
                    {(stats?.devices ?? []).map((device) => (
                      <tr key={device.device} className="border-t border-white/5">
                        <td className="py-2 capitalize">{device.device}</td>
                        <td className="py-2 text-right">{device.count.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!stats || stats.devices.length === 0) ? (
                      <tr>
                        <td className="py-2 text-sm text-white/60">No device data yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-white">Top referrers</h3>
                <table className="mt-2 w-full text-sm text-white/80">
                  <tbody>
                    {(stats?.topReferrers ?? []).map((referrer) => (
                      <tr key={referrer.referrer} className="border-t border-white/5">
                        <td className="py-2">{referrer.referrer}</td>
                        <td className="py-2 text-right">{referrer.count.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!stats || stats.topReferrers.length === 0) ? (
                      <tr>
                        <td className="py-2 text-sm text-white/60">No referral data yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
