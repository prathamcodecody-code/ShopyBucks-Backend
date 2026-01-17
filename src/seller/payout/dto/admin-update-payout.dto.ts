import { IsEnum, IsOptional, IsString } from "class-validator";
import { PayoutStatus } from "@prisma/client";

export class AdminUpdatePayoutDto {
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  method? : string;

  @IsOptional()
  @IsString()
  note?: string;
}
