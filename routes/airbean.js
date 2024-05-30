import { Router } from "express";
import menu from "../models/coffeeMenu.js";

const router = Router();

// Get menu
router.get("/menu", (req, res) => {
  res.json(menu);
});

export default router;
