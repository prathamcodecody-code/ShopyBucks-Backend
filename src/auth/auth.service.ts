import axios from "axios";
import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtService } from "@nestjs/jwt";
import { User_Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // ----------------------------------------------------------
  // CENTRAL SMS SENDER (TOKEN KEY API)
  // ----------------------------------------------------------
  private async sendSms(phone: string, otp: string) {
    try {
      const TOKEN = process.env.SMS_TOKEN_KEY;
      const SENDERID = process.env.SMS_SENDERID;
      const TEMPLATEID = process.env.SMS_TEMPLATEID;
      const ROUTE = process.env.SMS_ROUTE || 18;

      // Your approved DLT message format
      const message = `Dear User, Your OTP for login to The App is ${otp}. Valid for 5 minutes. Please do not share this OTP. Regards, AdoMobi`;

      const url = `http://sms.smsindori.com/http-tokenkeyapi.php?authentic-key=${TOKEN}&senderid=${SENDERID}&route=${ROUTE}&number=${phone}&message=${encodeURIComponent(
        message
      )}&templateid=${TEMPLATEID}`;

      console.log("SMS URL:", url);

      const response = await axios.get(url);
      console.log("SMS Sent Response:", response.data);

      return true;
    } catch (error) {
      console.error("SMS Failed:", error.message);
      return false;
    }
  }

  // ----------------------------------------------------------
  // SEND OTP (LOGIN)
  // ----------------------------------------------------------
  async sendOtp(phone: string, name?: string, email?: string) {
  if (!phone) throw new BadRequestException("Phone is required");

  phone = phone.replace(/\s+/g, "");
  if (!phone.startsWith("91")) phone = "91" + phone;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await this.prisma.otpCode.upsert({
    where: { phone },
    update: {
      otpCode: otp,
      expiresAt,
      tempData: JSON.stringify({ name, email }),
    },
    create: {
      phone,
      otpCode: otp,
      expiresAt,
      tempData: JSON.stringify({ name, email }),
    },
  });

  await this.sendSms(phone, otp);

  return { success: true };
}


  // ----------------------------------------------------------
  // VERIFY OTP (AUTO LOGIN / AUTO SIGNUP)
  // ----------------------------------------------------------
async verifyOtp(phone: string, otp: string) {
  if (!phone || !otp) throw new BadRequestException("Phone & OTP required");

  if (!phone.startsWith("91")) phone = "91" + phone;

  const record = await this.prisma.otpCode.findUnique({ where: { phone } });

  if (!record) throw new UnauthorizedException("OTP not found");
  if (record.otpCode !== otp) throw new UnauthorizedException("Invalid OTP");
  if (record.expiresAt < new Date()) throw new UnauthorizedException("OTP expired");

  const temp = record.tempData ? JSON.parse(record.tempData) : {};

  let user = await this.prisma.user.findUnique({ where: { phone } });

  if (!user) {
    // ✅ CREATE USER
    user = await this.prisma.user.create({
      data: {
        phone,
        name: temp.name ?? null,
        email: temp.email ?? null,
        isVerified: true,
        role: User_Role.USER,
      },
    });
  } else {
    // ✅ UPDATE USER IF DATA EXISTS
    user = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: temp.name || user.name,
        email: temp.email || user.email,
        isVerified: true,
      },
    });
  }

  const token = this.jwtService.sign({
  sub: user.id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  role: user.role,
  sellerStatus: user.sellerStatus, // ✅ CRITICAL
});

  return {
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sellerStatus: user.sellerStatus,
  },
};
}

  // ----------------------------------------------------------
  // EMAIL/PASSWORD LOGIN (OPTIONAL)
  // ----------------------------------------------------------
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("User not found");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException("Incorrect password");

    // Create token with consistent payload structure
    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,  // Include phone even if null
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { token, user };
  }

  // ----------------------------------------------------------
  // ADMIN LOGIN
  // ----------------------------------------------------------
  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.user.findUnique({ where: { email } });

    if (!admin || admin.role !== User_Role.ADMIN) {
      throw new UnauthorizedException("Invalid admin credentials");
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) throw new UnauthorizedException("Incorrect password");

    // Create token with consistent payload structure
    const token = this.jwtService.sign({
      sub: admin.id,
      phone: admin.phone,  // Include phone even if null
      email: admin.email,
      role: admin.role,
    });

    return { token, user: admin };
  }
}