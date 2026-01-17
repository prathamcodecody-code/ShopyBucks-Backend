import { IsBoolean, IsOptional, IsNumber } from "class-validator";

export class UpdateSellerSettingsDto {
  @IsOptional()
  @IsNumber()
  minPayoutAmount?: number;

  @IsOptional()
  @IsBoolean()
  payoutsEnabled?: boolean;
}
