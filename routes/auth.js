import express from 'express'
import requireLogin from '../middlewares/requireLogin.js';

import session from "express-session"; // for handling user sessions - login status
import {
    validateUserCreation
  } from "../middlewares/validation.js";
  import { createUser, getUserById, validateUser } from "../models/user.js";
import { orders } from './order.js'
import {cart} from './cart.js'

const router = express.Router()


//Orders - användaren kan se tidigare orderhistorik om inloggad
router.get("/orders", requireLogin, async (req, res) => {
    try {
      const currentUserOrders = await orders.find({ userId: req.session.currentUser });
      if (currentUserOrders.length === 0) { 
        return res.status(404).send("Orders not found");
      }

      const orderItems = currentUserOrders.map((order) => order.items).flatMap(items => items.map(item => ({
        date: item.date,
        title: item.title,
        price: item.price,
      })))
  
      let orderHistory = "Previous orders:\n";
      const orderIds = currentUserOrders.map(order => order._id).join("<br>")
  
      orderItems.forEach((order) => {
        const productName = order.title;
        const orderDate = order.date;
        const orderPrice = order.price;
        orderHistory += `<li>${orderDate}: ${productName} (${orderPrice} kr)</li>`;
      });
  
      res.send(`${orderHistory} <br>Order id's:<br>${orderIds}`);
  
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).send("Internal server error");
    }
  });
  

  // Skapar användaren och returnerar användar-ID
  router.post("/register", validateUserCreation, (req, res) => {
    const { username, password } = req.body;
    createUser(username, password, (err, user) => {
      if (err) {
        // Om det uppstår ett fel
        return res.status(500).json({ error: "Failed to create user" }); // Skicka ett felmeddelande: false
      }
      res.status(201).json({ userId: user.userId }); // Skicka användar-ID om inget fel uppstår: true
    });
  });
  

  //Om användaren skapas framgångsrikt, returneras ett svar med användar-ID. Annars returneras ett felmeddelande.
  // Get user by ID
  router.get("/users/:userId", (req, res) => {
    const { userId } = req.params;
    getUserById(userId, (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    });
  });
  
  // Login
  router.post("/login", (req, res) => {
    const { username, password } = req.body;
    validateUser(username, password, (err, user) => {
      if (!user) {
        res.status(401).send("Username or password was incorrect");
        return;
      }
  
      req.session.userId = user.userId; // Spara användarens ID i sessionen
  
      req.session.currentUser = user.userId; //sparar den aktuella användarens id så det går att nås från alla funktioner
      req.session.isOnline = true; //ändrar variabeln till true
  
      res.send(
        `User was successfully logged in. Login status is: ${req.session.isOnline}`
      );
    });
  });
  
  // Check login status
  router.get("/status", (req, res) => {
    res.send(`Login status is: ${req.session.isOnline}`);
  });
  
  // Logout och specifik användares varukorg rensas
  router.post("/logout", requireLogin, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(400).send("User ID is missing from session");
      }
  
      const numRemoved = await cart.remove({ userId: userId }, { multi: true });
      // Rensa användarens varukorg
  
      req.session.isOnline = false;
      req.session.userId = null;
      // Logga ut användaren
  
      res.send(
        `User was successfully logged out and cart cleared. Login status is: ${req.session.isOnline}, Items removed from cart: ${numRemoved}`
      );
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to log out and clear cart");
    }
  });

export default router;