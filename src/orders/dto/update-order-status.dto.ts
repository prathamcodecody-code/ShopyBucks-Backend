import { IsEnum } from "class-validator";
import { Order_Status } from "@prisma/client";

export class UpdateOrderStatusDto {
  @IsEnum(Order_Status, {
    message: "Invalid order status",
  })
  status: Order_Status;
}
