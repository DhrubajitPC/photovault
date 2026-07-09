import { Router } from "express";
import multer from "multer";
import {
  createTestPhoto,
  getPhotos,
  uploadPhoto,
} from "../controllers/photosController";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

router.get("/", getPhotos);
router.post("/test", createTestPhoto);
router.post("/", upload.single("photo"), uploadPhoto);

export default router;
