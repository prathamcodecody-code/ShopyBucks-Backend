import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { kafka } from "../kafka.client.js";

@Injectable()
export class PayoutConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private consumer = kafka.consumer({
    groupId: "payout-service-group",
  });

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({ topic: "payout.requested" });
    await this.consumer.subscribe({ topic: "payout.approved" });
    await this.consumer.subscribe({ topic: "payout.paid" });
    await this.consumer.subscribe({ topic: "payout.rejected" });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());

        console.log(`💰 ${topic.toUpperCase()}:`, payload);

        // FUTURE:
        // - accounting
        // - finance reports
        // - notifications
      },
    });

    console.log("✅ PayoutConsumer started");
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
