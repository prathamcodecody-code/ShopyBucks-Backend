import { IsBoolean, IsOptional, IsNumber } from "class-validator";

export class AdminUpdateSellerSettingsDto {
  @IsOptional()
  @IsBoolean()
  payoutsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsNumber()
  minPayoutAmount?: number;
}
