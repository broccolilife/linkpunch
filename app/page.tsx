/**
 * Homepage — renders the full 3D Aerolinks scene.
 * Lays out an intro banner + platform link banners in a Canvas.
 * Tracks page views on mount and banner clicks on open.
 * Append ?creator=1 to access the analytics stats panel.
 */
"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Banner3D, { BannerData } from "@/components/Banner3D";
import StatsPanel from "@/components/StatsPanel";
import { trackBannerClick, trackPageView } from "@/app/shared/client";
import AvatarBadge from "@/components/AvatarBadge";

const introBanner: BannerData = {
  id: "aerolinks-intro",
  title: "Aerolinks",
  description: "Flip to reveal the latest drops, live tour dates, and tip jar.",
  url: "https://example.com/aerolinks",
  material: "glass",
  color: "#e0f2fe",
  flippable: true,
  emblem: { color: "#1d4ed8", label: "", imageUrl: "/avatar-placeholder.jpg" }
};

const platformBanners: BannerData[] = [
  {
    id: "onlyfans",
    title: "OnlyFans",
    description: "Nightly photo sets & live studio sessions.",
    url: "https://onlyfans.com/aerolinks",
    material: "glass",
    color: "#00aff0",
    emblem: { color: "#0c8bd6", label: "", imageUrl: "/logos/onlyfans.png" }
  },
  {
    id: "x-twitter",
    title: "X (Twitter)",
    description: "Real-time teasers and spicy replies.",
    url: "https://twitter.com/aerolinks",
    material: "glass",
    color: "#1d9bf0",
    emblem: { color: "#0f78c5", label: "", imageUrl: "/logos/twitter.png" }
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "BTS reels, mood boards, and stories.",
    url: "https://instagram.com/aerolinks",
    material: "glass",
    color: "#f56040",
    emblem: { color: "#fd8364", label: "", imageUrl: "/logos/instagram.png" }
  },
  {
    id: "tiktok",
    title: "TikTok",
    description: "Snappy choreo & thirst-trap edits.",
    url: "https://www.tiktok.com/@aerolinks",
    material: "glass",
    color: "#25f4ee",
    emblem: { color: "#3ee0ff", label: "", imageUrl: "/logos/tiktok.png" }
  },
  {
    id: "youtube",
    title: "YouTube",
    description: "Weekly ASMR vlogs & premiere watch parties.",
    url: "https://youtube.com/aerolinks",
    material: "glass",
    color: "#ff0033",
    emblem: { color: "#ff5c6c", label: "", imageUrl: "/youtube-logo.png" }
  },
  {
    id: "twitch",
    title: "Twitch",
    description: "Interactive build streams every Sunday.",
    url: "https://twitch.tv/aerolinks",
    material: "glass",
    color: "#9146ff",
    emblem: { color: "#a871ff", label: "", imageUrl: "/logos/twitch.png" }
  },
  {
    id: "patreon",
    title: "Patreon",
    description: "Behind-the-scenes devlogs & PSD files.",
    url: "https://patreon.com/aerolinks",
    material: "glass",
    color: "#f96854",
    emblem: { color: "#fb8a75", label: "PT" }
  },
  {
    id: "discord",
    title: "Discord",
    description: "Join the creator collective & daily prompts.",
    url: "https://discord.gg/aerolinks",
    material: "glass",
    color: "#5865f2",
    emblem: { color: "#7b8bff", label: "DS" }
  }
];

const banners: BannerData[] = [introBanner, ...platformBanners.slice(0, 6)];

interface SceneProps {
  items: BannerData[];
  onOpen: (banner: BannerData) => void;
  spacing: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
    radius: number;
    titleSize: number;
    descriptionSize: number;
    padding: number;
  };
  scale: number;
  avatarScale: number;
}

function Scene({ items, onOpen, spacing, dimensions, scale, avatarScale }: SceneProps) {
  const offset = ((items.length - 1) / 2) * spacing;
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 7, 5]} intensity={1.2} />
      <pointLight position={[0, 1.5, 2.8]} intensity={2.6} decay={1.4} />
      <pointLight position={[-2.2, -1.4, 3]} intensity={1.8} decay={1.6} />
      <Environment preset="city" />
      <group scale={[scale, scale, scale]}>
        {items.map((banner, index) => (
          <Banner3D
            key={banner.id}
            banner={banner}
            position={[0, offset - index * spacing, 0]}
            dimensions={dimensions}
            onOpen={onOpen}
          />
        ))}
      </group>
    </>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const isCreator = useMemo(() => searchParams?.get("creator") === "1", [searchParams]);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    void trackPageView();
  }, []);

  useEffect(() => {
    const checkWebGL = () => {
      if (typeof document === "undefined") return true;
      try {
        const canvas = document.createElement("canvas");
        return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    };
    setHasWebGL(checkWebGL());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isCreator) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        setStatsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isCreator]);

  const handleOpen = (banner: BannerData) => {
    void trackBannerClick(banner.id);
    if (typeof window !== "undefined") {
      window.open(banner.url, "_blank", "noopener,noreferrer");
    }
  };

  const isMobile = viewportWidth < 640;
  const bannerDimensions = {
    width: isMobile ? 1.9 : 2.45,
    height: isMobile ? 0.44 : 0.64,
    depth: 0.13,
    radius: isMobile ? 0.12 : 0.18,
    titleSize: isMobile ? 0.16 : 0.21,
    descriptionSize: isMobile ? 0.068 : 0.088,
    padding: isMobile ? 0.36 : 0.5
  };
  const baseSpacing = bannerDimensions.height + (isMobile ? 0.17 : 0.24);
  const groupScale = isMobile ? 0.78 : 0.86;
  const avatarScale = isMobile ? 0.95 : 1.05;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {hasWebGL ? (
        <Suspense
          fallback={
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
              <p className="animate-pulse text-sm text-white/50">Loading 3D experience…</p>
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl bg-white/5"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0.35, isMobile ? 6.8 : 6.1], fov: isMobile ? 52 : 44 }}
            style={{ height: "100vh", width: "100vw" }}
          >
            <Scene
              items={banners}
              onOpen={handleOpen}
              spacing={baseSpacing}
              dimensions={bannerDimensions}
              scale={groupScale}
              avatarScale={avatarScale}
            />
          </Canvas>
        </Suspense>
      ) : (
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16 text-white/80">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed">
            <p className="font-semibold text-white">WebGL not available—showing basic links.</p>
            <p className="mt-2 text-white/70">
              Your browser disabled 3D rendering. Tap any link below to explore the Aerolinks showcase.
            </p>
          </div>
          <ul className="space-y-4">
            {banners.map((banner) => (
              <li key={banner.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <a
                  href={banner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  onClick={() => handleOpen(banner)}
                >
                  <h2 className="text-lg font-semibold text-white">{banner.title}</h2>
                  {banner.description ? (
                    <p className="mt-2 text-sm text-white/70">{banner.description}</p>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCreator ? (
        <>
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="fixed bottom-5 left-5 z-50 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            Show statistics
          </button>
          <StatsPanel isOpen={statsOpen} onClose={() => setStatsOpen(false)} banners={banners} />
        </>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
          <p className="text-sm text-white/50">Initializing…</p>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
