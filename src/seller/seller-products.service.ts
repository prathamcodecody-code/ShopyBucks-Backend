type ProductSizeInput = {
  size: string;
  stock: number;
};

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class SellerProductsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

  // ================= CREATE =================
 async create(body: any, files: any, seller: any) {
  if (seller.role !== "SELLER") {
    throw new BadRequestException("Not a seller");
  }

  // ---------- IMAGES ----------
  const images = {
    img1: files?.image1?.[0]?.filename || null,
    img2: files?.image2?.[0]?.filename || null,
    img3: files?.image3?.[0]?.filename || null,
    img4: files?.image4?.[0]?.filename || null,
  };

  // ---------- SIZES ----------
  let sizesRaw: unknown;

  try {
    sizesRaw = body.sizes ? JSON.parse(body.sizes) : [];
  } catch {
    throw new BadRequestException("Invalid sizes format");
  }

  const hasSizes = Array.isArray(sizesRaw) && sizesRaw.length > 0;

let price = 0;
let stock = 0;
let sizes: ProductSizeInput[] = [];

if (hasSizes) {
  // VARIANT PRODUCT
  sizes = (sizesRaw as any[]).map((item) => {
    if (
      typeof item !== "object" ||
      typeof item.size !== "string" ||
      typeof item.stock !== "number" ||
      item.stock < 0
    ) {
      throw new BadRequestException("Invalid size entry");
    }

    return {
      size: item.size,
      stock: item.stock,
    };
  });
} else {
  // SIMPLE PRODUCT
  price = Number(body.price);
  stock = Number(body.stock);

  if (
    isNaN(price) ||
    isNaN(stock) ||
    price < 0 ||
    stock < 0
  ) {
    throw new BadRequestException("Invalid price or stock");
  }
}

  // ---------- SLUG ----------
  const slugBase = body.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  const exists = await this.prisma.product.findFirst({
    where: { slug: slugBase },
  });

  const slug = exists ? `${slugBase}-${Date.now()}` : slugBase;

  // ---------- TRANSACTION ----------
  return this.prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        title: body.title,
        description: body.description || "",
        slug,
        price,
        stock,
        sellerId: seller.id,
        categoryId: Number(body.categoryId),
        typeId: Number(body.typeId),
        subtypeId: Number(body.subtypeId),
        isActive: true,
        status: "DRAFT",
        updatedAt: new Date(),
        ...images,
      },
    });

    if (hasSizes) {
      await tx.productSize.createMany({
        data: sizes.map((s) => ({
          productId: product.id,
          size: s.size,
          stock: s.stock,
        })),
      });
    }

    return product;
  });
}

  // ================= LIST =================
async findMyProducts(sellerId: number, query: any) {
  const {
    page = 1,
    limit = 10,
    categoryId,
    typeId,
    subtypeId,
    minPrice,
    maxPrice,
    sort,
    stock,
    search,
  } = query;

  const where: any = {
    AND: [
      { isActive: true },
      { sellerId }, // 🔒 seller isolation
    ],
  };

  if (categoryId) where.AND.push({ categoryId: Number(categoryId) });
  if (typeId) where.AND.push({ typeId: Number(typeId) });
  if (subtypeId) where.AND.push({ subtypeId: Number(subtypeId) });

  if (minPrice || maxPrice) {
    where.AND.push({
      price: {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      },
    });
  }

  if (stock === "in") where.AND.push({ stock: { gt: 0 } });
  if (stock === "out") where.AND.push({ stock: 0 });

  if (search) {
    where.AND.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "low_to_high") orderBy = { price: "asc" };
  if (sort === "high_to_low") orderBy = { price: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        category: true,
        producttype: true,
        productsubtype: true,
        productsize: {
          select: {
            id: true,
            size: true,
            stock: true,
            price: true,
          },
        },
      },
    }),
    this.prisma.product.count({ where }),
  ]);

  return {
    products, // ✅ RETURN DIRECTLY
    total,
    page: Number(page),
    pages: Math.ceil(total / take),
  };
}


  // ================= GET ONE =================
async findOne(id: number, sellerId: number) {
  const product = await this.prisma.product.findFirst({
    where: {
      id,
      sellerId,
      isActive: true,
    },
    include: {
      category: true,
      producttype: true,
      productsubtype: true,
      productsize: true,
    },
  });

  if (!product) {
    throw new NotFoundException("Product not found");
  }

  return {
    ...product,
    productsize: {
        select: {
          id: true,
          size: true,
          stock: true,
          price: true,
        },
      },
  };
}

async findBySlug(slug: string, sellerId: number) {
  const product = await this.prisma.product.findFirst({
    where: {
      slug,
      sellerId,
      isActive: true,
    },
    include: {
      category: true,
      producttype: true,
      productsubtype: true,
      productsize: true,
    },
  });

  if (!product) {
    throw new NotFoundException("Product not found");
  }

  return {
    ...product,
    productsize: {
        select: {
          id: true,
          size: true,
          stock: true,
          price: true,
        },
      },
  };
}


  // ================= UPDATE =================
async update(
  id: number,
  sellerId: number,
  body: any,
  files?: any
) {
  const product = await this.findOne(id, sellerId);

  const images: any = {};

  if (files?.image1?.[0]) images.img1 = files.image1[0].filename;
  if (files?.image2?.[0]) images.img2 = files.image2[0].filename;
  if (files?.image3?.[0]) images.img3 = files.image3[0].filename;
  if (files?.image4?.[0]) images.img4 = files.image4[0].filename;

  for (let i = 1; i <= 4; i++) {
    if (body[`remove_image_${i}`] === "true") {
      images[`img${i}`] = null;
    }
  }

  const data: any = {};

  if (body.title !== undefined) {
    data.title = body.title;
    data.slug = this.generateSlug(body.title);
  }

  if (body.description !== undefined)
    data.description = body.description;

  if (body.price !== undefined)
    data.price = Number(body.price);

  if (body.stock !== undefined)
    data.stock = Number(body.stock);

  if (body.categoryId !== undefined)
    data.categoryId = Number(body.categoryId);

  if (body.typeId !== undefined)
    data.typeId = Number(body.typeId);

  if (body.subtypeId !== undefined)
    data.subtypeId = Number(body.subtypeId);

  // ✅ SEO ALLOWED
  if (body.metaTitle !== undefined)
    data.metaTitle = body.metaTitle;

  if (body.metaDescription !== undefined)
    data.metaDescription = body.metaDescription;

  if (body.metaKeywords !== undefined)
    data.metaKeywords = body.metaKeywords;

  Object.assign(data, images);

  // ---------- SIZES (REPLACE STRATEGY) ----------
  if (body.sizes) {
    const parsed = JSON.parse(body.sizes);

    await this.prisma.productSize.deleteMany({
      where: { productId: product.id },
    });

    await this.prisma.productSize.createMany({
      data: parsed.map((s: any) => ({
        productId: product.id,
        size: s.size,
        stock: s.stock,
      })),
    });
  }

  return this.prisma.product.update({
    where: { id: product.id },
    data,
  });
}

// ================= DELETE =================
  async deleteMyProduct(sellerId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }
}
