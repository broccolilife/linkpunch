"use client";

import { CSSProperties } from "react";

/**
 * Pure CSS skeleton loader — no JS animation runtime needed.
 * Uses the shimmer gradient technique from modern design systems.
 */

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  count?: number;
  gap?: string;
}

const shimmerStyle: CSSProperties = {
  background:
    "linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-hover) 50%, var(--color-surface) 75%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-shimmer 1.5s ease-in-out infinite",
  borderRadius: "var(--radius-md)",
};

export default function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius,
  className = "",
  count = 1,
  gap = "0.5rem",
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={className}
      style={{
        ...shimmerStyle,
        width,
        height,
        ...(borderRadius ? { borderRadius } : {}),
      }}
      aria-hidden="true"
    />
  ));

  if (count === 1) return items[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }} role="status" aria-label="Loading">
      {items}
    </div>
  );
}
