import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Fairfield Voice database...");

  // Create sample events
  const events = [
    {
      title: "Town Hall Meeting - Budget Discussion",
      startsAt: new Date("2024-11-15T19:00:00"),
      location: "Fairfield Community Center, 123 Main St",
      details: "Join us for an open discussion about the proposed 2025 city budget. Your voice matters!"
    },
    {
      title: "Ward Representatives Q&A Session",
      startsAt: new Date("2024-11-22T18:30:00"),
      location: "City Hall Council Chambers",
      details: "Ask questions directly to your ward representatives. Light refreshments provided."
    }
  ];

  for (const eventData of events) {
    // Check if event already exists by title
    const existing = await prisma.event.findFirst({
      where: { title: eventData.title }
    });
    
    if (!existing) {
      await prisma.event.create({ data: eventData });
    }
  }

  // Create sample invites for testing QR codes
  const invites = [
    { slug: "ward-1-demo", inviterDid: "demo-issuer-1", ward: "W-1" },
    { slug: "ward-2-demo", inviterDid: "demo-issuer-2", ward: "W-2" },
    { slug: "ward-3-demo", inviterDid: "demo-issuer-3", ward: "W-3" },
    { slug: "ward-4-demo", inviterDid: "demo-issuer-4", ward: "W-4" }
  ];

  for (const inviteData of invites) {
    await prisma.invite.upsert({
      where: { slug: inviteData.slug },
      update: inviteData,
      create: inviteData
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`📅 Created ${events.length} events`);
  console.log(`🎫 Created ${invites.length} demo invites`);
  
  console.log("\nDemo invite URLs:");
  invites.forEach(invite => {
    console.log(`  ${invite.ward}: http://localhost:3000/join?ref=${invite.slug}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });