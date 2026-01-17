import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding categories, product types & subtypes...");

  // -----------------------------
  // CATEGORIES
  // -----------------------------
  async function getOrCreateCategory(name: string) {
    const existing = await prisma.category.findFirst({
      where: { name },
    });

    if (existing) return existing;

    return prisma.category.create({ data: { name } });
  }

  const women = await getOrCreateCategory("Women");
  const men = await getOrCreateCategory("Men");

  // -----------------------------
  // PRODUCT TYPES
  // -----------------------------
  async function getOrCreateType(
    name: string,
    categoryId: number
  ) {
    const existing = await prisma.productType.findFirst({
      where: { name, categoryId },
    });

    if (existing) return existing;

    return prisma.productType.create({
      data: { name, categoryId },
    });
  }

  const ethnic = await getOrCreateType("Ethnic", women.id);
  const western = await getOrCreateType("Western", women.id);
  const casualMen = await getOrCreateType("Casual", men.id);

  // -----------------------------
  // PRODUCT SUBTYPES
  // -----------------------------
  async function getOrCreateSubtype(
    name: string,
    typeId: number
  ) {
    const existing = await prisma.productSubtype.findFirst({
      where: { name, typeId },
    });

    if (existing) return existing;

    return prisma.productSubtype.create({
      data: { name, typeId },
    });
  }

  await getOrCreateSubtype("Kurti", ethnic.id);
  await getOrCreateSubtype("Saree", ethnic.id);
  await getOrCreateSubtype("Jeans", western.id);
  await getOrCreateSubtype("Top", western.id);
  await getOrCreateSubtype("T-Shirt", casualMen.id);
  await getOrCreateSubtype("Shirt", casualMen.id);

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
