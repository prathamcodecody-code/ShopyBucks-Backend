import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Req,
  Param,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { SellerProductsService } from "./seller-products.service.js";
import { SellerOnly } from "../auth/seller-only.decorator.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { UseInterceptors, UploadedFiles } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { productImageStorage } from "../config/multer.config.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Products")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@SellerOnly()
@Controller("seller/products")
export class SellerProductsController {
  constructor(private readonly service: SellerProductsService) {}

  // ================= CREATE =================

  @ApiOperation({ summary: "Create product (Seller)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        stock: { type: "number" },
        categoryId: { type: "number" },
        typeId: { type: "number" },
        subtypeId: { type: "number" },
        sizes: {
          type: "string",
          example: `[{"size":"S","stock":10},{"size":"M","stock":20}]`,
        },
        image1: { type: "string", format: "binary" },
        image2: { type: "string", format: "binary" },
        image3: { type: "string", format: "binary" },
        image4: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOkResponse({ description: "Product created" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
      ],
      { storage: productImageStorage },
    ),
  )
  create(
    @Req() req: any,
    @UploadedFiles() files: any,
    @Body() body: any,
  ) {
    return this.service.create(body, files, req.user);
  }

  // ================= LIST =================

  @ApiOperation({ summary: "List my products (Seller)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "typeId", required: false })
  @ApiQuery({ name: "subtypeId", required: false })
  @ApiQuery({ name: "minPrice", required: false })
  @ApiQuery({ name: "maxPrice", required: false })
  @ApiQuery({ name: "stock", required: false, enum: ["in", "out"] })
  @ApiQuery({ name: "sort", required: false })
  @ApiOkResponse({ description: "Products fetched" })
  @Get()
  findMyProducts(@Req() req: any, @Query() query: any) {
    return this.service.findMyProducts(req.user.id, query);
  }

  // ================= GET ONE =================

  @ApiOperation({ summary: "Get my product by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Product fetched" })
  @Get(":id")
  findOne(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id, req.user.id);
  }

  // ================= UPDATE =================

  @ApiOperation({ summary: "Update my product" })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Product updated" })
  @Patch(":id")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
      ],
      { storage: productImageStorage },
    ),
  )
  update(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @UploadedFiles() files: any,
    @Body() body: any,
  ) {
    return this.service.update(id, req.user.id, body, files);
  }

  // ================= DELETE =================

  @ApiOperation({ summary: "Delete my product" })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Product deleted" })
  @Delete(":id")
  delete(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.deleteMyProduct(req.user.id, id);
  }
}
