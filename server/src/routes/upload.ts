import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../middleware/auth.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { saveImageBuffer } from "../lib/storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) cb(new Error("Only images are allowed"));
    else cb(null, true);
  },
});

export const uploadRouter = Router();
uploadRouter.use(requireAdmin);

uploadRouter.post("/", upload.array("files", 8), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (!files.length) throw new HttpError(400, "No files uploaded");
    const urls = [];
    for (const file of files) {
      const url = await saveImageBuffer(file.buffer, file.originalname);
      urls.push({ url, name: file.originalname });
    }
    res.json(ok(urls));
  } catch (error) {
    next(error);
  }
});
