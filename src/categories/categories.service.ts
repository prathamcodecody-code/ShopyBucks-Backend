import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class CategoriesService {
  constructor(
  private prisma: PrismaService,
  private redis: RedisService
) {}
  private slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}


 async create(dto: CreateCategoryDto) {
  const slug = this.slugify(dto.name);

  const category = await this.prisma.category.create({
    data: {
      name: dto.name,
      slug,
    },
  });

  // 🔥 invalidate cache
  await this.redis.del("categories:all");

  return category;
}


async findAll() {
  const cacheKey = "categories:all";

  const cached = await this.redis.get<any[]>(cacheKey);
  if (cached) return cached;

  const categories = await this.prisma.category.findMany({
    orderBy: { id: "asc" },
  });

  await this.redis.set(cacheKey, categories, 300); // 5 min
  return categories;
}


  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) throw new NotFoundException('Category not found');

    return category;
  }

async update(id: number, dto: UpdateCategoryDto) {
  await this.findOne(id);

  const category = await this.prisma.category.update({
    where: { id },
    data: {
      ...dto,
      ...(dto.name && { slug: this.slugify(dto.name) }),
    },
  });

  // 🔥 invalidate cache
  await this.redis.del("categories:all");

  return category;
}

async remove(id: number) {
  await this.findOne(id);

  const category = await this.prisma.category.delete({
    where: { id },
  });

  // 🔥 invalidate cache
  await this.redis.del("categories:all");

  return category;
}};