const prisma = require("../src/prisma");

async function main() {
  console.log("Seeding database.");
  await prisma.authorizedService.upsert({
    where: { api_key: "webshop-secret-key-2026" },
    update: {},
    create: {
      name: "Main Webshop",
      api_key: "webshop-secret-key-2026",
      can_tokenize: true,
      can_fetch: false,
      can_manage: false,
      is_active: true,
    },
  });

  await prisma.authorizedService.upsert({
    where: { api_key: "admin-super-secret-key" },
    update: {},
    create: {
      name: "Payment Processor Admin",
      api_key: "admin-super-secret-key",
      can_tokenize: true,
      can_fetch: true,
      can_manage: true,
      is_active: true,
    },
  });

  console.log("Seeding finished.");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
