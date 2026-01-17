import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Body,
  Query,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";

@UseGuards(JwtAuthGuard)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post("toggle")
  toggle(
    @Req() req,
    @Body() body: { productId: number }
  ) {
    return this.wishlistService.toggleWishlist(
      req.user.id,
      body.productId
    );
  }

  @Get()
  getMyWishlist(@Req() req: any) {
    return this.wishlistService.getUserWishlist(req.user.id);
  }

  @Get("check")
  check(
    @Req() req: any,
    @Query("productId") productId: string
  ) {
    return this.wishlistService.isWishlisted(
      req.user.id,
      Number(productId)
    );
  }
}
