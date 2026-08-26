/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer storage setup for direct video uploads
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.mp4';
      const cleanName = `storytime_interview_${Date.now()}${ext}`;
      cb(null, cleanName);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 } // Support up to 1GB video upload
  });

  // Support large payloads (up to 50MB) to allow multiple high-resolution base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Static route for uploaded videos and assets
  app.use('/uploads', express.static(uploadsDir));

  const DB_FILE = path.join(process.cwd(), 'db.json');

  // Helper to load db
  const loadDb = () => {
    const DEFAULT_VIDEO = {
      title: "Intervista a StoryTime • Radio Canale Italia",
      subtitle: "Divulgazione scientifica, Gamification nella didattica e Intelligenza Artificiale",
      description: "Francesco Rocco, formatore e divulgatore, ospite negli studi di StoryTime (Radio Canale Italia - Bologna) con Damiano. Un confronto su come avvicinare giovani e adulti alla scienza e alle STEM, l'efficacia della gamification, il contrasto a fake news e clickbait, e il valore dell'IA Generativa nella preparazione di lezioni e materiali didattici.",
      videoUrl: "https://www.youtube.com/watch?v=yEveLtaHpHQ",
      eventDate: "Studi di Bologna",
      organizer: "StoryTime • Radio Canale Italia",
      posterImage: "https://i.ytimg.com/vi/yEveLtaHpHQ/hqdefault.jpg"
    };

    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          // Normalize videoInterview
          let v = parsed.videoInterview;
          if (!v || typeof v !== 'object') {
            v = { ...DEFAULT_VIDEO };
          }
          if (!v.title || v.title === "StoryTime • Radio Canale Italia: Intervista a Francesco Rocco" || v.title.includes("Intervista a Francesco Rocco")) {
            v.title = DEFAULT_VIDEO.title;
          }
          if (!v.videoUrl || v.videoUrl.startsWith('blob:') || v.videoUrl.startsWith('data:') || v.videoUrl.includes('drive.google.com')) {
            v.videoUrl = DEFAULT_VIDEO.videoUrl;
            v.posterImage = v.posterImage || DEFAULT_VIDEO.posterImage;
          }
          parsed.videoInterview = v;
          return parsed;
        }
      } catch (err) {
        console.error("Errore nella lettura del database db.json, reimposto defaults...", err);
      }
    }
    // Default initial data if file doesn't exist or is corrupted
    const defaults = {
      percorsi: [],
      collaborations: [],
      videoInterview: DEFAULT_VIDEO
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
    return defaults;
  };

  // API Route - Get all data
  app.get("/api/data", (_req, res) => {
    const data = loadDb();
    res.json(data);
  });

  // API Route - Save all data
  app.post("/api/data", (req, res) => {
    try {
      const { percorsi, collaborations, videoInterview } = req.body;
      let cleanVideo = videoInterview || null;
      if (cleanVideo && typeof cleanVideo === 'object') {
        if (!cleanVideo.title || cleanVideo.title === "StoryTime • Radio Canale Italia: Intervista a Francesco Rocco" || cleanVideo.title.includes("Intervista a Francesco Rocco")) {
          cleanVideo.title = "Intervista a StoryTime • Radio Canale Italia";
        }
        if (cleanVideo.videoUrl) {
          if (cleanVideo.videoUrl.startsWith('blob:') || cleanVideo.videoUrl.startsWith('data:') || cleanVideo.videoUrl.includes('drive.google.com')) {
            cleanVideo.videoUrl = "https://www.youtube.com/watch?v=yEveLtaHpHQ";
          }
        }
      }
      const data = {
        percorsi: percorsi || [],
        collaborations: collaborations || [],
        videoInterview: cleanVideo
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true, message: "Dati salvati con successo!" });
    } catch (err: any) {
      console.error("Errore nel salvare il database", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route - Direct Video Upload
  app.post("/api/upload-video", upload.single('video'), (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "Nessun file inviato" });
        return;
      }
      const videoUrl = `/uploads/${req.file.filename}`;
      
      // Auto-save in db.json if exists
      const currentDb = loadDb();
      if (currentDb.videoInterview) {
        currentDb.videoInterview.videoUrl = videoUrl;
        fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');
      }

      res.json({
        success: true,
        videoUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (err: any) {
      console.error("Errore durante il caricamento del video", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware setup for Development, otherwise serve static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
