import express, { Router } from "express";
import nedb from "nedb-promise";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import bodyParser from "body-parser";
import session from "express-session"; // for handling user sessions - login status

import menu from "../models/coffeeMenu.js";
import { createUser, getUserById, validateUser } from "../models/user.js";
import {
  validateUserCreation,
  validateMenu,
  validateAboutData,
  validatePrice,
} from "../middlewares/validation.js";
import requireLogin from "../middlewares/requireLogin.js"; // Login middleware to check status, reuse as needed

const router = Router();
const cart = new nedb({ filename: "models/cart.db", autoload: true });
const orders = new nedb({ filename: "models/orders.db", autoload: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Session configuration - needed for login functionality
router.use(
  session({
    secret: "this is the key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Middleware to make session variables accessible
router.use((req, res, next) => {
  if (typeof req.session.isOnline === "undefined") {
    req.session.isOnline = false;
  }
  next();
});

// Homepage
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// About
router.get("/about", (req, res) => {
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
  const coffeeMenu = menu.map((item) => ({
    title: item.title,
    price: item.price,
    id: item.id,
  }));
  res.json(coffeeMenu);
});

// Menu - order
router.post("/menu", validatePrice, async (req, res) => {
  try {
    const orderId = req.body.id;
    const selectedProduct = menu.find((product) => product.id === orderId);
    const productTitle = selectedProduct.title;
    const productPrice = selectedProduct.price;
    //kontroll om varan finns i menyn
    if (!selectedProduct) {
      return res.status(404).send("The requested product could not be found");
    }

    await cart.insert({
      userId: req.session.currentUser || "guest", //sparar användarId
      productId: selectedProduct.id,
      title: selectedProduct.title,
      price: selectedProduct.price,
      date: new Date().toJSON().slice(0, 10).replace(/-/g, "/"), //sparar datum för beställning
    });

    //oavsett om man är inloggad eller inte sparas varan till cart.db
    // await cart.insert(selectedProduct)
    //svaret som skickas till användaren
    res.send(
      `${productTitle} (${productPrice} kr) was successfully added to cart`
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Cart/Varukorg - användaren får en överblick över vad som beställts

router.get("/cart", async (req, res) => {
  try {
    const cartItems = await cart.find(
      //hämtar det som finns i cart som är har användarid på den som är inloggad eller 'guest' om man inte är inloggad
      { userId: req.session.currentUser || 'guest'},
      (err, docs) => {}
    );

    let cartSummary = "Cart:\n";
    const itemPrice = cartItems.map((item) => item.price);
    const sum = itemPrice.reduce((partialSum, a) => partialSum + a, 0);
    // kontroll om order.db är tom, i så fall får man ett felmeddelande
    if (cartItems.length === 0) {
      return res.send("No orders found");
    }

    cartItems.forEach((cartItem) => {
      const productName = cartItem.title;
      const cartDate = cartItem.date;
      const cartPrice = cartItem.price;

      cartSummary += `<li>${cartDate}: ${productName}, ${cartPrice} kr</li>`;
    });

    res.send(cartSummary + `<p>Total: ${sum}kr</p>`);

    //kontroll om cart är tom, i så fall får man ett felmeddelande
    if (cartItems.length === 0) {
      return res.status(404).send("Cart is empty");
    }

    return cartItems;
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Place an order and store in order history
router.post("/account/orders", async (req, res) => {
  try {
    const currentUserCart = await cart.find({
      userId: req.session.currentUser || 'guest',
    });

    // Check if the cart is empty
    if (currentUserCart.length === 0) {
      return res.status(404).send("Cart is empty");
    }
   
    const estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Create an order
    const order = {
      userId: req.session.currentUser || 'guest',
      items: currentUserCart,
      estimatedDeliveryTime,
    };

    // Insert the order into the orders database
    await orders.insert(order);

    // Clear the cart for the current user
    await cart.remove({ userId: req.session.currentUser || 'guest'}, { multi: true });

    const currentOrder = await orders.find(
      //hämtar det som finns i orders.db som är har användarid på den som är inloggad eller 'guest' om man inte är inloggad
      { userId: req.session.currentUser || 'guest'},
      (err, docs) => {}
    );
    const orderId = currentOrder.map((order) => order._id);
    const orderItems = currentOrder.map((order) => order.items);
    const result = orderItems.flat().map(item => {
      return {
        title: item.title,
        price: item.price,
        date: item.date
      };
    });
    // Send the order details and estimated delivery time to the client
    // let orderSummary = 'Order placed successfully:\n'
    const formattedResult = result.map(item => 
      `${item.date}: ${item.title} (${item.price}kr)<br>`
    ).join('\n');

    res.send(`Order placed successfully:<br><ul>${formattedResult}</ul><br><h5>Orderid: ${orderId} </h5>`);
    // 
    // res.json({ message: "Order placed successfully", order });
     
    // orderItems.forEach((cartItem) => {
    //   const productName = cartItem.title;
    //   const cartDate = cartItem.date;
    //   const cartPrice = cartItem.price;
      
    //   orderSummary += `<li>${cartDate}: ${productName}, ${cartPrice} kr</li>`;
    // })

    // res.json(orderId + orderItems)
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Bekräftelsesida med hur långt det är kvar tills ordern kommer
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orders.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const items = order.items
      .map((item) => `<li>${item.title} (${item.price} kr)</li>`)
      .join("");
    const estimatedDeliveryTime = order.estimatedDeliveryTime;

    res.send(
      `<p>Order confirmation</p><ul>${items}</ul><p>Estimated delivery time: ${estimatedDeliveryTime}</p>`
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// Helper function to delete an item from the cart
async function deleteItem(id) {
  return cart.remove({ productId: parseInt(id, 10)}, {}); //ändrade från id till productId
}

// Delete item from cart endpoint
router.delete("/cart/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const numRemoved = await deleteItem(itemId);

    if (numRemoved === 0) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({ message: "Deleted coffee" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

//Orders - användaren kan se tidigare orderhistorik om inloggad
router.get("/account/orders", requireLogin, async (req, res) => {
  try {
    const currentUserOrders = await orders.find({ userId: req.session.currentUser });

    if (!currentUserOrders) {
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

// Denna funktion fanns redan så kommenterade bort den
// Get user's orders by user ID
// router.get("/users/:userId/orders", (req, res) => {
//   const { userId } = req.params;
//   getUserById(userId, (err, user) => {
//     if (err || !user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     res.json({ orders: user.orders });
//   });
// });

// Rensa användarens kundvagn baserat på det specifikicerade användar-ID:t

router.delete("/cart/:userId", (req, res) => {
  const { userId } = req.params;

  cart.remove({ userId: userId }, { multi: true }, (err, numRemoved) => {
    if (err) {
      return res.status(500).json({ error: "Failed to clear cart" });
    }
    res.json({ message: "User's cart cleared successfully", numRemoved });
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
