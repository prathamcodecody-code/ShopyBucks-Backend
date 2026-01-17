import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SellerGuard } from "./seller.guard.js";

export function SellerOnly() {
  return applyDecorators(
    UseGuards(AuthGuard("jwt"), SellerGuard),
  );
}
