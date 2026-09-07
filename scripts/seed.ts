/**
 * Seeds the Neon Postgres database with the app's mock data
 * (mock-data/condos.ts) using Prisma Client.
 *
 * Usage:
 *   bun run db:seed
 */
import { prisma, Prisma } from "../lib/prisma";
import {
  propertyTypes,
  pipelineStatuses,
  initialCenterPoints,
  initialListings,
} from "../mock-data/condos";

async function clearTables() {
  console.log("Clearing existing rows...");
  await prisma.viewingLog.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.centerPoint.deleteMany();
  await prisma.pipelineStatus.deleteMany();
  await prisma.propertyType.deleteMany();
}

async function seedPropertyTypes() {
  console.log(`Seeding ${propertyTypes.length} property types...`);
  for (const p of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { id: p.id },
      update: { name: p.name, icon: p.icon, color: p.color },
      create: { id: p.id, name: p.name, icon: p.icon, color: p.color },
    });
  }
}

async function seedPipelineStatuses() {
  console.log(`Seeding ${pipelineStatuses.length} pipeline statuses...`);
  for (const s of pipelineStatuses) {
    await prisma.pipelineStatus.upsert({
      where: { id: s.id },
      update: { name: s.name, color: s.color, badge_class: s.badgeClass },
      create: { id: s.id, name: s.name, color: s.color, badge_class: s.badgeClass },
    });
  }
}

async function seedCenterPoints() {
  console.log(`Seeding ${initialCenterPoints.length} center points...`);
  for (const c of initialCenterPoints) {
    await prisma.centerPoint.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        category: c.category,
        icon: c.icon ?? null,
        color: c.color ?? null,
      },
      create: {
        id: c.id,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        category: c.category,
        icon: c.icon ?? null,
        color: c.color ?? null,
      },
    });
  }
}

async function seedListings() {
  console.log(`Seeding ${initialListings.length} listings...`);
  for (const listing of initialListings) {
    const amenitiesJson = listing.amenities as unknown as Prisma.InputJsonValue;

    await prisma.listing.upsert({
      where: { id: listing.id },
      update: {
        name: listing.name,
        address: listing.address,
        lat: listing.lat,
        lng: listing.lng,
        type: listing.type,
        size_sqm: listing.size_sqm,
        floor: listing.floor,
        view: listing.view,
        source_url: listing.source_url,
        contact_phone: listing.contact_phone,
        contact_line: listing.contact_line,
        status: listing.status,
        is_favorite: listing.is_favorite,
        created_at: new Date(listing.created_at),
        notes: listing.notes,
        amenities: amenitiesJson,
        photos: listing.photos,
      },
      create: {
        id: listing.id,
        name: listing.name,
        address: listing.address,
        lat: listing.lat,
        lng: listing.lng,
        type: listing.type,
        size_sqm: listing.size_sqm,
        floor: listing.floor,
        view: listing.view,
        source_url: listing.source_url,
        contact_phone: listing.contact_phone,
        contact_line: listing.contact_line,
        status: listing.status,
        is_favorite: listing.is_favorite,
        created_at: new Date(listing.created_at),
        notes: listing.notes,
        amenities: amenitiesJson,
        photos: listing.photos,
        priceHistory: {
          create: listing.price_history.map((ph) => ({
            id: ph.id,
            rent: ph.rent,
            deposit: ph.deposit,
            advance: ph.advance,
            common_fee: ph.common_fee,
            parking_fee: ph.parking_fee,
            internet_fee: ph.internet_fee,
            water_type: ph.water_type,
            water_rate: ph.water_rate,
            electric_type: ph.electric_type,
            electric_rate: ph.electric_rate,
            recorded_at: new Date(ph.recorded_at),
            note: ph.note ?? null,
          })),
        },
        ...(listing.contract
          ? {
              contract: {
                create: {
                  id: listing.contract.id,
                  start_date: new Date(listing.contract.start_date),
                  end_date: new Date(listing.contract.end_date),
                  duration_months: listing.contract.duration_months,
                  deposit_refund_terms: listing.contract.deposit_refund_terms,
                  pet_allowed: listing.contract.pet_allowed,
                  smoking_allowed: listing.contract.smoking_allowed,
                  guest_allowed: listing.contract.guest_allowed,
                  early_termination_penalty:
                    listing.contract.early_termination_penalty,
                  contract_file_url: listing.contract.contract_file_url ?? null,
                },
              },
            }
          : {}),
        viewingLogs: {
          create: listing.viewing_logs.map((v) => ({
            id: v.id,
            scheduled_at: new Date(v.scheduled_at),
            notes: v.notes,
            rating: v.rating,
            completed: v.completed ?? false,
          })),
        },
      },
    });
  }
}

async function main() {
  try {
    await clearTables();
    await seedPropertyTypes();
    await seedPipelineStatuses();
    await seedCenterPoints();
    await seedListings();
    console.log("✅ Seed complete via Prisma Client.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
