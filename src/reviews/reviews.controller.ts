import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
    Query,
} from "@nestjs/common";
import { ReviewsService } from "./reviews.service.js";
import { CreateReviewDto } from "./dto/create-review.dto.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /* -------- ADMIN: GET ALL REVIEWS -------- */
  @UseGuards(JwtAuthGuard)
@Get("admin")
getAllReviews(
  @Query("page") page = "1",
  @Query("limit") limit = "5",
) {
  return this.reviewsService.getAllPaginated(
    Number(page),
    Number(limit),
  );
}
  /* -------- CREATE REVIEW -------- */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, dto);
  }

  /* -------- GET PRODUCT REVIEWS -------- */
  @Get("product/:productId")
  getProductReviews(@Param("productId") productId: string) {
    return this.reviewsService.getProductReviews(Number(productId));
  }
}
