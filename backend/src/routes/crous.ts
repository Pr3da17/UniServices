import { Router } from "express";
import axios from "axios";

const router = Router();

// Cache simple pour respecter les 200 requêtes/minute et améliorer les perfs
const cache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const API_BASE_URL = "https://api.croustillant.menu/v1";

const getCachedData = async (url: string) => {
  const now = Date.now();
  if (cache[url] && cache[url].expiry > now) {
    console.log(`[CROUS] Serving from cache: ${url}`);
    return cache[url].data;
  }

  try {
    console.log(`[CROUS] Fetching from API: ${url}`);
    const response = await axios.get(url);
    cache[url] = {
      data: response.data,
      expiry: now + CACHE_TTL,
    };
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[CROUS] API error for ${url}:`, error.response?.status, error.message);
      throw new Error(`API Error: ${error.response?.status || "Unknown"}`);
    }
    throw error;
  }
};

// 1. Liste des régions (CROUS)
router.get("/regions", async (req, res) => {
  try {
    const data = await getCachedData(`${API_BASE_URL}/regions`);
    res.json(data);
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
});

// 2. Liste des restaurants d'une région
router.get("/regions/:code/restaurants", async (req, res) => {
  try {
    const { code } = req.params;
    const data = await getCachedData(`${API_BASE_URL}/regions/${code}/restaurants`);
    res.json(data);
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
});

// 3. Détails d'un restaurant (Horaires/Status)
router.get("/restaurants/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const data = await getCachedData(`${API_BASE_URL}/restaurants/${code}`);
    res.json(data);
  } catch (error: any) {
    res.status(502).json({ success: false, error: error.message });
  }
});

// 4. Menu pour aujourd'hui
router.get("/restaurants/:code/menu", async (req, res) => {
  try {
    const { code } = req.params;
    // Format JJ-MM-AAAA
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const data = await getCachedData(`${API_BASE_URL}/restaurants/${code}/menu/${dateStr}`);
    res.json(data);
  } catch (error: any) {
    res.status(502).json({ success: false, error: "Pas de menu disponible pour aujourd'hui." });
  }
});

export default router;
