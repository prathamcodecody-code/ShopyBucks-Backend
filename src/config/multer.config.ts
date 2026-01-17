import { diskStorage } from "multer";
import { extname } from "path";

export const productImageStorage = diskStorage({
  destination: "./uploads/products",
  filename: (_, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extname(file.originalname);

    cb(null, uniqueName);
  },
});
