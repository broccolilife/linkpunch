import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Lightweight A/B testing for banner variants
 * 
 * Devil's advocate: Client-side A/B with hash-based assignment can be
 * gamed by clearing cookies or using incognito. Server-side assignment
 * with persistent storage would be more rigorous. But for a link-in-bio
 * tool, statistical rigor matters less than quick iteration speed.
 */

export interface Variant {
  id: string;
  weight: number;  // 0-100, all variants should sum to 100
  config: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  name: string;
  status: "draft" | "running" | "completed";
  variants: Variant[];
  startedAt?: string;
  endedAt?: string;
  results: Record<string, { impressions: number; clicks: number }>;
}

const experimentsFile = path.join(process.cwd(), "data", "experiments.json");

async function loadExperiments(): Promise<Experiment[]> {
  try {
    const data = await fs.readFile(experimentsFile, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveExperiments(experiments: Experiment[]): Promise<void> {
  await fs.mkdir(path.dirname(experimentsFile), { recursive: true });
  await fs.writeFile(experimentsFile, JSON.stringify(experiments, null, 2));
}

/**
 * Deterministic variant assignment based on visitor ID
 * Ensures same visitor always sees same variant (no flicker)
 */
export function assignVariant(visitorId: string, experiment: Experiment): Variant {
  const hash = crypto
    .createHash("md5")
    .update(`${experiment.id}:${visitorId}`)
    .digest("hex");
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;
  
  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant;
  }
  return experiment.variants[experiment.variants.length - 1];
}

/**
 * Record an impression or click for statistical analysis
 */
export async function recordEvent(
  experimentId: string,
  variantId: string,
  eventType: "impression" | "click"
): Promise<void> {
  const experiments = await loadExperiments();
  const exp = experiments.find(e => e.id === experimentId);
  if (!exp || exp.status !== "running") return;

  if (!exp.results[variantId]) {
    exp.results[variantId] = { impressions: 0, clicks: 0 };
  }
  
  if (eventType === "impression") exp.results[variantId].impressions++;
  else exp.results[variantId].clicks++;

  await saveExperiments(experiments);
}

/**
 * Calculate conversion rate + confidence interval
 * Devil's advocate: Using normal approximation for CI breaks down at
 * small sample sizes (<30). Wilson score interval would be more accurate.
 * Shipping normal approx now, TODO switch to Wilson when it matters.
 */
export function calculateStats(impressions: number, clicks: number) {
  const rate = impressions > 0 ? clicks / impressions : 0;
  const z = 1.96; // 95% confidence
  const se = Math.sqrt((rate * (1 - rate)) / Math.max(impressions, 1));
  
  return {
    conversionRate: rate,
    confidenceInterval: [Math.max(0, rate - z * se), Math.min(1, rate + z * se)],
    sampleSize: impressions,
  };
}
