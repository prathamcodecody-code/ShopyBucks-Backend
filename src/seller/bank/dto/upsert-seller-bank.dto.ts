import { IsString, IsOptional } from "class-validator";

export class UpsertSellerBankDto {
  @IsString()
  accountHolder: string;

  @IsString()
  accountNumber: string;

  @IsString()
  ifscCode: string;

  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  upiId?: string;
}
