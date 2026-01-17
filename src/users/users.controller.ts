import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ---------------- GET PROFILE ----------------
  @Get("profile")
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  // ---------------- UPDATE PROFILE ----------------
  @Patch("profile")
  updateProfile(
    @Req() req: any,
    @Body() body: { name?: string; email?: string }
  ) {
    if (!body.name && !body.email) {
      throw new BadRequestException("Nothing to update");
    }

    return this.usersService.updateProfile(
      req.user.id,
      body
    );
  }
}
