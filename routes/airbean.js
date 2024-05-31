import { Router } from "express";
import menu from "../models/coffeeMenu.js";
import { createUser, getUserById } from "../models/user.js";
import { validateUserCreation } from "../middlewares/validation.js";

const router = Router();

// Get menu
router.get("/menu", (req, res) => {
  res.json(menu);
});

// Skapar användaren och returnerar användar-ID
router.post("/users", validateUserCreation, (req, res) => {
  const { username } = req.body;
  createUser(username, (err, user) => {// Skapar användaren
    if (err) { // Om det uppstår ett fel
      return res.status(500).json({ error: "Failed to create user" });// Skicka ett felmeddelande
    }
    res.status(201).json({ userId: user.userId });// Skicka användar-ID om inget fel uppstår
  });
});
//Middleware-funktionen validateUserCreation används för att validera inkommande data innan användaren skapas.
//Om användaren skapas framgångsrikt, returnerar den ett svar med användar-ID
//Annars returnerar den ett felmeddelande.

//Hämtar användaren med det specificerade användar-ID:t
router.get ("/users/:userId", (req, res) => {
  const { userId } = req.params;
  getUserById(userId, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });
})

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



