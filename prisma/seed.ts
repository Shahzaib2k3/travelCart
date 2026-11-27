import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345", 12);
const agentHash = await bcrypt.hash(process.env.SEED_AGENT_PASSWORD ?? "Agent@12345", 12);

  await prisma.user.upsert({
    where: { email: "admin@travelcart.test" },
    update: {},
    create: {
      fullName: "Demo Admin",
      email: "admin@travelcart.test",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@travelcart.test" },
    update: {},
    create: {
      fullName: "Demo Agent",
      email: "agent@travelcart.test",
      passwordHash: agentHash,
      role: "AGENT",
    },
  });

  console.log("Seeded admin and agent users");
}

main().finally(() => prisma.$disconnect());