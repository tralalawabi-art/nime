import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OtakudesuScraper } from "./src/services/otakudesuScraper";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const scraper = new OtakudesuScraper();

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Maounime API" });
  });

  app.get("/api/home", async (req, res) => {
    try {
      const data = await scraper.home();
      res.json(data);
    } catch (error: any) {
      console.error("API /api/home error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch home anime" });
    }
  });

  app.get("/api/ongoing", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    try {
      const data = await scraper.ongoing(page);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/ongoing page=${page} error:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch ongoing anime" });
    }
  });

  app.get("/api/complete", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    try {
      const data = await scraper.complete(page);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/complete page=${page} error:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch completed anime" });
    }
  });

  app.get("/api/genres", async (req, res) => {
    try {
      const data = await scraper.genreList();
      res.json(data);
    } catch (error: any) {
      console.error("API /api/genres error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch genre list" });
    }
  });

  app.get("/api/genres/:slug", async (req, res) => {
    const slug = req.params.slug;
    const page = parseInt(req.query.page as string) || 1;
    try {
      const data = await scraper.genre(slug, page);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/genres/${slug} page=${page} error:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch genre anime" });
    }
  });

  app.get("/api/schedule", async (req, res) => {
    try {
      const data = await scraper.jadwalRilis();
      res.json(data);
    } catch (error: any) {
      console.error("API /api/schedule error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch schedule" });
    }
  });

  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    try {
      const data = await scraper.search(query);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/search q=${query} error:`, error);
      res.status(500).json({ error: error.message || "Failed to search anime" });
    }
  });

  app.get("/api/anime/:slug", async (req, res) => {
    const slug = req.params.slug;
    try {
      const data = await scraper.detail(slug);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/anime/${slug} error:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch anime details" });
    }
  });

  app.get("/api/episode/:slug", async (req, res) => {
    const slug = req.params.slug;
    try {
      const data = await scraper.episode(slug);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/episode/${slug} error:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch episode data" });
    }
  });

  app.get("/api/batch/:slug", async (req, res) => {
    const slug = req.params.slug;
    try {
      const data = await scraper.batch(slug);
      res.json(data);
    } catch (error: any) {
      console.error(`API /api/batch/${slug} error:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch batch data" });
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
