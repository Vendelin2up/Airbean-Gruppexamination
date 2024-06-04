import express, { Router } from "express";
import nedb from "nedb-promise";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import bodyParser from "body-parser";
import session from "express-session"; // för att hantera användarsessioner - login status

import menu from "../models/coffeeMenu.js";
import { createUser, getUserById, validateUser } from "../models/user.js";
import { validateUserCreation } from "../middlewares/validation.js";
import { validateMenu, validateAboutData } from "../middlewares/validation.js";
import requireLogin from "../middlewares/requireLogin.js"; //Login middleware för att kolla status, återanvänd vid behov

const router = Router();
const cart = new nedb({ filename: "models/cart.db", autoload: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Session configuration - behövs för login funktionen
router.use(session({
  secret: 'this is the key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));


// Middleware to make session variables accessible
router.use((req, res, next) => {
  if (typeof req.session.isOnline === 'undefined') {
    req.session.isOnline = false;
  }
  next();
});

// Homepage
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// About
router.get("/about", (req, res) => {  // Jag tog bort "validateAboutData" från raden här för att det inte behövdes. I en GET-förfrågan behöver man inte validera någon BODY data eftersom det inte finns någon.
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

// Cart/Varukorg - användaren får en överblick över vad som beställts
router.get("/cart", async (req, res) => {
  try {
    //hämta cart och visa för användaren
    const cartItems = await cart.find( (err, docs) => { 
      return docs
    })
    
    //kontroll om cart är tom, i så fall får man ett felmeddelande
    if (cartItems.length === 0) {
      res.status(404).send("Cart is empty");
    }
    //skickar cart till användaren
    res.send(cartItems);
    return cartItems

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


// Rensa användarens kundvagn baserat på det specifikicerade användar-ID:t   NY ANN
router.delete("/cart/:userId", (req, res) => {
  const { userId } = req.params;

  cart.remove({ userId: userId }, { multi: true }, (err, numRemoved) => {
    if (err) {
      return res.status(500).json({ error: "Failed to clear cart" });
    }
    res.json({ message: "User's cart cleared successfully", numRemoved });
  });
});


export default router;

//Login
router.post('/login', (req, res) => {
  //hämtar användarnamn och lösenord från bodyn
  const { username, password } = req.body;
  //validerar användaren
  validateUser(username, password, (err, user) => {
  //kollar om funktionen returnerat user vilket den gör om användaren och lösenordet hittas, 
  //om inte får man ett felmeddelande
    if (!user) {
      res.status(401).send('Username or password was incorrect')
      return
    } 
    req.session.isOnline = true;
    res.send(`User was successfully logged in. Login status is: ${req.session.isOnline}`)
    
  })
})

// Check login status
router.get('/status', (req, res) => {
  res.send(`Login status is: ${req.session.isOnline}`);
})

// Logout
router.post('/logout', requireLogin, (req, res) => {
    req.session.isOnline = false;
    res.send(`User was successfully logged out. Login status is: ${req.session.isOnline}`);
})

export default router;

