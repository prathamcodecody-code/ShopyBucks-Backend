import {
  Controller,
  Get,
  Patch,
  Body,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { SettingsService } from "./settings.service.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";


@Controller("settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  async getAll() {
    return this.service.getSettings();
  }

  @Patch("profile")
  async updateProfile(@Body() body: any) {
    return this.service.updateProfile(body);
  }

  @Patch("store")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: diskStorage({
        destination: "./uploads/settings",
        filename: (req, file, callback) => {
          const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
          callback(null, unique + extname(file.originalname));
        },
      }),
    })
  )
  async updateStore(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.service.updateStore(body, file);
  }

  @Patch("general")
  async updateGeneral(@Body() body: any) {
    return this.service.updateGeneral(body);
  }
}
