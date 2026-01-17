import { Global, Module } from "@nestjs/common";
import { KafkaProducer } from "./kafka.producer.js";
import { OrderConsumer } from "./consumers/order-created.consumer.js";
import { SellerConsumer } from "./consumers/seller.consumer.js";
import { PayoutConsumer } from "./consumers/payout.consumer.js";

@Global()
@Module({
  providers: [
    KafkaProducer,
    OrderConsumer,
    SellerConsumer,
    PayoutConsumer,
  ],
  exports: [KafkaProducer],
})
export class KafkaModule {}
