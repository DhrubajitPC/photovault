import { PhotoUploadError } from "../errors/PhotoUploadError";
import {
  createTestPhoto as createTestPhotoService,
  listPhotos,
  uploadPhoto as uploadPhotoService,
} from "../services/photosService";

import type { Request, Response } from "express";

export async function getPhotos(_req: Request, res: Response): Promise<void> {
  try {
    const photos = await listPhotos();
    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
}

export async function createTestPhoto(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const photo = await createTestPhotoService();

    res.status(201).json({ photo });
  } catch (error) {
    console.error("Failed to create test photo ", error);
    res.status(500).json({ error: "Failed to create photo record" });
  }
}

export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'No photo file uploaded. Use form field "photo".',
      });
      return;
    }

    const photo = await uploadPhotoService(req.file);

    res.status(201).json({ photo });
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    console.error("Failed to upload photo ", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
}
