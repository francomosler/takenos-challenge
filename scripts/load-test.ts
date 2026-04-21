/**
 * Simple load test for the Champions League Draw API.
 *
 * Requires the server to be running (e.g. `npm start` or `npm run dev`).
 *
 * Usage:
 *   npx tsx scripts/load-test.ts                       # default profile
 *   BASE_URL=http://localhost:8000 DURATION=20 CONNECTIONS=50 npx tsx scripts/load-test.ts
 *
 * The script runs a short benchmark against every read endpoint and prints
 * a summary table.
 */

import autocannon, { Result } from "autocannon";

type Scenario = {
  name: string;
  path: string;
  method?: "GET" | "POST" | "DELETE";
};

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8000";
const DURATION = Number(process.env.DURATION ?? 10);
const CONNECTIONS = Number(process.env.CONNECTIONS ?? 20);
const PIPELINING = Number(process.env.PIPELINING ?? 1);

const scenarios: Scenario[] = [
  { name: "GET /health", path: "/health" },
  { name: "GET /draw", path: "/draw" },
  { name: "GET /draw/statistics", path: "/draw/statistics" },
  { name: "GET /matches", path: "/matches" },
  { name: "GET /matches (filtered)", path: "/matches?matchDay=1&limit=10" },
  { name: "GET /matches (sorted)", path: "/matches?sortBy=homeTeam&sortOrder=asc" },
  { name: "GET /matches/1", path: "/matches/1" },
  { name: "GET /teams", path: "/teams" },
  { name: "GET /teams/1", path: "/teams/1" },
];

async function runScenario(scenario: Scenario): Promise<Result> {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: `${BASE_URL}${scenario.path}`,
        method: scenario.method ?? "GET",
        connections: CONNECTIONS,
        pipelining: PIPELINING,
        duration: DURATION,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(digits);
}

async function main() {
  console.log(
    `Running load test against ${BASE_URL} — ${CONNECTIONS} connections, ${DURATION}s each\n`
  );

  const rows: Array<Record<string, string>> = [];
  for (const scenario of scenarios) {
    console.log(`> ${scenario.name}`);
    try {
      const result = await runScenario(scenario);
      rows.push({
        scenario: scenario.name,
        "req/s (avg)": fmt(result.requests.average),
        "latency p50 (ms)": fmt(result.latency.p50),
        "latency p99 (ms)": fmt(result.latency.p99),
        "2xx": String(result["2xx"] ?? 0),
        "non-2xx": String(result.non2xx ?? 0),
        errors: String(result.errors ?? 0),
      });
    } catch (err) {
      rows.push({
        scenario: scenario.name,
        "req/s (avg)": "-",
        "latency p50 (ms)": "-",
        "latency p99 (ms)": "-",
        "2xx": "-",
        "non-2xx": "-",
        errors: (err as Error).message,
      });
    }
  }

  console.log("\n=== Summary ===");
  console.table(rows);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
