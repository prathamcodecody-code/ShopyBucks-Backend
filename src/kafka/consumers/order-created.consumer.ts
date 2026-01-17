import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { kafka } from "../kafka.client.js";
import { KAFKA_TOPICS } from "../topics.js";

@Injectable()
export class OrderConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private consumer = kafka.consumer({
    groupId: "order-service-group",
  });

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: KAFKA_TOPICS.ORDER_CREATED,
    });

    await this.consumer.subscribe({
      topic: "order.item.status.updated",
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());

        switch (topic) {
          case KAFKA_TOPICS.ORDER_CREATED:
            await this.handleOrderCreated(payload);
            break;

          case "order.item.status.updated":
            await this.handleItemStatusUpdated(payload);
            break;
        }
      },
    });

    console.log("✅ OrderConsumer started");
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async handleOrderCreated(payload: any) {
    console.log("📦 ORDER_CREATED:", payload);

    // FUTURE:
    // - create sellerOrder rows
    // - initialize analytics counters
    // - send notifications
  }

  private async handleItemStatusUpdated(payload: any) {
    console.log("🔄 ORDER_ITEM_STATUS_UPDATED:", payload);

    // FUTURE:
    // - update seller analytics
    // - delivery notifications
  }
}
