import "dotenv/config";
import * as readline from "readline";
import { prisma } from "../lib/prisma";
import { clearTables, runSeed } from "./seed";

/**
 * Database wipe utility for NestPick.
 *
 * Supports two primary workflows:
 *   1. Wipe database only (truncates/deletes all records across all tables)
 *   2. Wipe and seed (wipes all records, then populates mock data)
 *
 * Usage:
 *   Interactive prompt:  npm run db:wipe
 *   Wipe only directly:  npm run db:wipe:only  (or npm run db:wipe -- --only)
 *   Wipe & seed directly: npm run db:wipe:seed  (or npm run db:wipe -- --seed)
 */
async function getTableCounts() {
  const [
    viewingLogs,
    contracts,
    priceHistories,
    listings,
    centerPoints,
    pipelineStatuses,
    propertyTypes,
  ] = await Promise.all([
    prisma.viewingLog.count(),
    prisma.contract.count(),
    prisma.priceHistory.count(),
    prisma.listing.count(),
    prisma.centerPoint.count(),
    prisma.pipelineStatus.count(),
    prisma.propertyType.count(),
  ]);

  return {
    viewingLogs,
    contracts,
    priceHistories,
    listings,
    centerPoints,
    pipelineStatuses,
    propertyTypes,
    total:
      viewingLogs +
      contracts +
      priceHistories +
      listings +
      centerPoints +
      pipelineStatuses +
      propertyTypes,
  };
}

function promptUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function performWipe() {
  const beforeCounts = await getTableCounts();
  console.log(`\n📊 Current database status: ${beforeCounts.total} total records`);
  console.log(`   - Listings: ${beforeCounts.listings}`);
  console.log(`   - Contracts: ${beforeCounts.contracts}`);
  console.log(`   - Viewing Logs: ${beforeCounts.viewingLogs}`);
  console.log(`   - Price History: ${beforeCounts.priceHistories}`);
  console.log(`   - Center Points: ${beforeCounts.centerPoints}`);
  console.log(`   - Pipeline Statuses: ${beforeCounts.pipelineStatuses}`);
  console.log(`   - Property Types: ${beforeCounts.propertyTypes}\n`);

  await clearTables();

  const afterCounts = await getTableCounts();
  console.log(`\n🧹 Wipe complete: ${afterCounts.total} records remaining in database.`);
}

async function performWipeAndSeed() {
  await performWipe();
  console.log("\n🌱 Starting database re-seeding with mock data...\n");
  await runSeed();
  const seededCounts = await getTableCounts();
  console.log(`\n✅ Database re-seeded successfully! (${seededCounts.total} total records)`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
NestPick Database Wipe Utility

Commands:
  npm run db:wipe            Interactive menu (Choose between Wipe Only or Wipe & Seed)
  npm run db:wipe:only       Wipe all database records without re-seeding
  npm run db:wipe:seed       Wipe all database records and re-seed with mock data

Flags:
  --only, -o                 Wipe all tables without seeding
  --seed, -s                 Wipe all tables and re-seed immediately
  --help, -h                 Show this help message
`);
    return;
  }

  // Check command-line flags
  if (args.includes("--seed") || args.includes("-s")) {
    console.log("⚡ Executing: Wipe Database AND Seed");
    await performWipeAndSeed();
    return;
  }

  if (args.includes("--only") || args.includes("-o") || args.includes("--wipe-only")) {
    console.log("⚡ Executing: Wipe Database Only");
    await performWipe();
    return;
  }

  // Interactive selection
  console.log("\n=======================================================");
  console.log("       🧹 NestPick Database Management Utility");
  console.log("=======================================================");
  console.log("\nPlease select an option:");
  console.log("  [1] Wipe database only (empty all tables)");
  console.log("  [2] Wipe and Seed (clean database & load mock data)");
  console.log("  [0] Cancel / Exit\n");

  const choice = await promptUser("Enter your choice (0, 1, or 2): ");

  switch (choice) {
    case "1":
      console.log("\n⚠️  Proceeding with WIPE ONLY...");
      await performWipe();
      break;

    case "2":
      console.log("\n🔄 Proceeding with WIPE AND SEED...");
      await performWipeAndSeed();
      break;

    case "0":
    default:
      console.log("\n❌ Operation canceled. No database changes were made.\n");
      break;
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Database wipe error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
