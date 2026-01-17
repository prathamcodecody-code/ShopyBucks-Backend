import { IsDecimal, IsOptional, IsString } from "class-validator";

export class RequestPayoutDto {
  @IsDecimal({ decimal_digits: "0,2" })
  amount: string;

  @IsOptional()
  @IsString()
  method?: string; // bank / upi / wallet

  @IsOptional()
  @IsString()
  note?: string;
}
