import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { EVENT_DATES } from "../lib/event";
import { allocatePasses, sellPasses } from "../lib/inventory";

async function main() {
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";

  await prisma.user.upsert({
    where: { username: adminUser },
    update: {},
    create: { name: "Admin", username: adminUser, passwordHash: await bcrypt.hash(adminPass, 10), role: "ADMIN" },
  });
  console.log(`Admin ready  ->  username: ${adminUser}  password: ${adminPass}`);

  if (process.env.SKIP_DEMO === "1") return;
  if ((await prisma.user.count({ where: { role: "TEAM" } })) > 0) {
    console.log("Team members already exist - skipping demo data.");
    return;
  }

  const demo = [
    { name: "Rahul", username: "rahul", mobile: "9000000001" },
    { name: "Amit", username: "amit", mobile: "9000000002" },
    { name: "Rohit", username: "rohit", mobile: "9000000003" },
    { name: "Vikas", username: "vikas", mobile: "9000000004" },
  ];
  const hash = await bcrypt.hash("pass123", 10);
  const users = [];
  for (const d of demo) users.push(await prisma.user.create({ data: { ...d, passwordHash: hash, role: "TEAM" } }));

  for (const u of users)
    for (const date of EVENT_DATES) await allocatePasses({ userId: u.id, eventDate: date, quantity: 10 });

  // A few demo sales so dashboards have something to show
  const sales: [number, string, number, number][] = [
    [0, "2026-10-11", 3, 900], [0, "2026-10-11", 2, 600], [0, "2026-10-12", 5, 1500],
    [1, "2026-10-11", 7, 2100], [1, "2026-10-13", 4, 1200],
    [2, "2026-10-12", 2, 600], [2, "2026-10-14", 6, 1800],
    [3, "2026-10-11", 1, 300], [3, "2026-10-15", 3, 900],
  ];
  let n = 0;
  for (const [ui, eventDate, quantity, amount] of sales)
    await sellPasses({ userId: users[ui].id, eventDate, quantity, amount, requestId: `demo-seed-${n++}-${Date.now()}` });

  console.log("Demo team members created (password for all: pass123): rahul, amit, rohit, vikas");
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
