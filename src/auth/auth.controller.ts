import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./strategies/jwt-auth.guard.js";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
} from "class-validator";

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiConsumes,
} from "@nestjs/swagger";

// ================= DTOs =================

class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// ========================================

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ================= SEND OTP =================

  @ApiOperation({
    summary: "Send OTP to phone number",
    description: "Sends OTP for login or signup using phone number",
  })
  @ApiConsumes("application/json")
  @ApiBody({ type: SendOtpDto })
  @ApiOkResponse({ description: "OTP sent successfully" })
  @ApiBadRequestResponse({ description: "Invalid phone number" })
  @Post("send-otp")
  sendOtp(@Body() body: SendOtpDto) {
    const { phone, name, email } = body;
    return this.authService.sendOtp(phone, name, email);
  }

  // ================= VERIFY OTP =================

  @ApiOperation({
    summary: "Verify OTP and login/signup",
    description: "Verifies OTP and returns JWT token",
  })
  @ApiConsumes("application/json")
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({ description: "OTP verified successfully" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired OTP" })
  @Post("verify-otp")
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  // ================= USER LOGIN =================

  @ApiOperation({ summary: "Login using email & password" })
  @ApiConsumes("application/json")
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: "Login successful" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  // ================= ADMIN LOGIN =================

  @ApiOperation({
    summary: "Admin login",
    description: "Login as admin using email & password",
  })
  @ApiConsumes("application/json")
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ description: "Admin login successful" })
  @ApiUnauthorizedResponse({ description: "Invalid admin credentials" })
  @Post("admin/login")
  adminLogin(@Body() body: AdminLoginDto) {
    return this.authService.validateAdmin(body.email, body.password);
  }

  // ================= CURRENT USER =================

  @ApiOperation({ summary: "Get logged-in user profile" })
  @ApiBearerAuth("JWT-auth")
  @ApiOkResponse({ description: "Authenticated user returned" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: any) {
    return req.user;
  }
}
