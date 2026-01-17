  import { Module } from '@nestjs/common';
  import { PrismaModule } from './prisma/prisma.module.js';
  import { AuthModule } from './auth/auth.module.js';
  import { CategoriesModule } from './categories/categories.module.js';
  import { ProductsTypesModule } from './products-types/products-types.module.js';
  import { ProductsSubtypesModule } from './products-subtypes/products-subtypes.module.js';
  import { ProductsModule } from './products/products.module.js';
  import { OrdersModule } from './orders/orders.module.js';
  import { SettingsModule } from './settings/settings.module.js';
  import { CartModule } from "./cart/cart.module.js";
  import { UsersModule } from "./users/users.module.js";
  import { AdminModule } from './admin/admin.module.js';
  import { ReviewsModule } from "./reviews/reviews.module.js";
  import { FeedbackModule } from "./feedback/feedback.module.js";
  import { PaymentsModule } from "./payment/payments.module.js";
  import { ContactModule } from './contact/contact.module.js';
  import { WishlistModule } from './wishlist/wishlist.module.js';
  import { SellerModule } from './seller/seller.module.js';
  import { ProductSizeModule } from './products-size/product-size.module.js';
  import {SellerProductsModule} from './seller/seller-products.module.js'
  import { JwtModule } from "@nestjs/jwt";
  import {KafkaModule} from "./kafka/kafka.module.js";
  
  import { SellerOrdersModule } from "./seller/seller-orders.module.js";
  import { SellerDashboardModule } from "./seller/dashboard/seller-dashboard.module.js";
import { PayoutsModule } from './payouts/payouts.module.js';
import { SellerPayoutModule } from './seller/payout/seller-payout.module.js';
import { SellerBankModule } from './seller/bank/seller-bank.module.js';
import { RedisModule } from './redis/redis.module.js';

  @Module({
    imports: [
      KafkaModule, 
      JwtModule.register({
        global: true,
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: "7d" },
      }),
      PrismaModule,
      OrdersModule,
      AuthModule,
      CartModule,
      UsersModule,
      AdminModule,
      ReviewsModule,
      SettingsModule,
      FeedbackModule,
      ProductsModule,
      CategoriesModule,
      WishlistModule,
      SellerModule,
       RedisModule,
      ProductSizeModule,
      ProductsTypesModule,
      ProductsSubtypesModule,
      ContactModule,
      SellerProductsModule,
      PaymentsModule,
      SellerOrdersModule,
      SellerDashboardModule,
      PayoutsModule,
      SellerPayoutModule,
      SellerBankModule,
    ],
  })
  export class AppModule {}
