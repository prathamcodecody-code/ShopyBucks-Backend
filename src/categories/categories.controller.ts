import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { AdminGuard } from "../auth/admin.guard.js";

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ---------------- CREATE CATEGORY ----------------

  @ApiOperation({ summary: "Create category (Admin only)" })
  @ApiBearerAuth("JWT-auth")
  @ApiBody({ type: CreateCategoryDto })
  @ApiOkResponse({ description: "Category created successfully" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // ---------------- GET ALL CATEGORIES ----------------

  @ApiOperation({ summary: "Get all categories" })
  @ApiOkResponse({ description: "Categories fetched successfully" })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // ---------------- GET CATEGORY BY ID ----------------

  @ApiOperation({ summary: "Get category by ID" })
  @ApiParam({
    name: "id",
    description: "Category ID",
    example: 1,
  })
  @ApiOkResponse({ description: "Category fetched successfully" })
  @ApiBadRequestResponse({ description: "Invalid category ID" })
  @ApiNotFoundResponse({ description: "Category not found" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  // ---------------- UPDATE CATEGORY ----------------

  @ApiOperation({ summary: "Update category (Admin only)" })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "id",
    description: "Category ID",
    example: 1,
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: "Category updated successfully" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  @ApiNotFoundResponse({ description: "Category not found" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  // ---------------- DELETE CATEGORY ----------------

  @ApiOperation({ summary: "Delete category (Admin only)" })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "id",
    description: "Category ID",
    example: 1,
  })
  @ApiOkResponse({ description: "Category deleted successfully" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  @ApiNotFoundResponse({ description: "Category not found" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
