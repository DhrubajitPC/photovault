import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getAllPhotos, createPhotoRecord } from "../services/photosService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const photos = await getAllPhotos();
    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

router.post("/test", async (req, res) => {
  try {
    const id = randomUUID();

    const { body } = req;
    const photo = await createPhotoRecord({
      id,
      original_filename: "sample-photo.jpg",
      s3Key: `photos/${id}-sample-photo.jpg`,
      contentType: "image/jpeg",
      sizeBytes: 123456,
      status: "uploaded",
    });

    res.status(201).json({ photo });
  } catch (error) {
    console.error("Failed to create test photo ", error);
    res.status(500).json({ error: "Failed to create photo record" });
  }
});

export default router;
