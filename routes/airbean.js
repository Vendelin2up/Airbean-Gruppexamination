import express, { Router } from "express";
import nedb from "nedb-promise";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import bodyParser from "body-parser";

import menu from "../models/coffeeMenu.js";
import { createUser, getUserById } from "../models/user.js";
import { validateUserCreation } from "../middlewares/validation.js";
import { validateMenu, validateAboutData } from "../middlewares/validation.js";

const router = Router();
const cart = new nedb({ filename: "models/cart.db", autoload: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Homepage
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// About
router.get("/about", validateAboutData, (req, res) => {
  const aboutInfo = {
    company: "Airbean Coffee",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    coffeeProduction:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  };
  res.json(aboutInfo);
});

// Menu
router.get("/menu", validateMenu, (req, res) => {
  const coffeeMenu = menu.map((item) => {
    return {
      title: item.title,
      price: item.price,
      id: item.id,
    };
  });
  res.json(coffeeMenu);
});

// Menu - order
router.post("/menu", async (req, res) => {
  try {
    const orderId = req.body.id;
    console.log(orderId);
    const selectedProduct = menu.find((product) => product.id === orderId);

    if (!selectedProduct) {
      res.status(404).send("The requested product could not be found");
    }

    await cart.insert(selectedProduct);
    const productTitle = selectedProduct.title;
    const productPrice = selectedProduct.price;
    res.send(
      `${productTitle} costing ${productPrice} kr was successfully added to cart`
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Skapar användaren och returnerar användar-ID
router.post("/register", validateUserCreation, (req, res) => {
  const { username, password } = req.body;
  createUser(username, password, (err, user) => {
    // Skapar användaren
    if (err) {
      // Om det uppstår ett fel
      return res.status(500).json({ error: "Failed to create user" }); // Skicka ett felmeddelande, false
    }
    res.status(201).json({ userId: user.userId }); // Skicka användar-ID om inget fel uppstår, true
  });
});
//Middleware-funktionen validateUserCreation används för att validera inkommande data innan användaren skapas.
//Om användaren skapas framgångsrikt, returnerar den ett svar med användar-ID
//Annars returnerar den ett felmeddelande.

//Hämtar användaren med det specificerade användar-ID:t
router.get("/users/:userId", (req, res) => {
  const { userId } = req.params;
  getUserById(userId, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });
});

// // Hämtar användarens beställningar baserat på det specificerade användar-ID:t
router.get("/users/:userId/orders", (req, res) => {
  const { userId } = req.params;
  getUserById(userId, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ orders: user.orders });
  });
});
export default router;
