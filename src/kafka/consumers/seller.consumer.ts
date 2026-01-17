import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { kafka } from "../kafka.client.js";
import { KAFKA_TOPICS } from "../topics.js";

@Injectable()
export class SellerConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private consumer = kafka.consumer({
    groupId: "seller-service-group",
  });

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: KAFKA_TOPICS.SELLER_APPROVED,
    });

    await this.consumer.subscribe({
      topic: "seller.rejected",
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());

        switch (topic) {
          case KAFKA_TOPICS.SELLER_APPROVED:
            console.log("✅ SELLER_APPROVED:", payload);
            break;

          case "seller.rejected":
            console.log("❌ SELLER_REJECTED:", payload);
            break;
        }
      },
    });

    console.log("✅ SellerConsumer started");
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
