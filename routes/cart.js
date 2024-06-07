import express from 'express'
import nedb from "nedb-promise";
import session from "express-session"; // for handling user sessions - login status
import { validatePrice } from '../middlewares/validation.js';
import menu from "../models/coffeeMenu.js";

const router = express.Router()
const cart = new nedb({ filename: "models/cart.db", autoload: true });

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

  //Användaren kan beställa
  router.post("/", validatePrice, async (req, res) => {
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
router.get("/", async (req, res) => {
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

  // Helper function to delete an item from the cart
async function deleteItem(id) {
    return cart.remove({ productId: parseInt(id, 10)}, {}); //ändrade från id till productId
  }
  
  // Delete item from cart endpoint
  router.delete("/:id", async (req, res) => {
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

// Rensa användarens kundvagn baserat på det specifikicerade användar-ID:t
router.delete("/delete/:userId", (req, res) => {
    const { userId } = req.params;
  
    cart.remove({ userId: userId }, { multi: true }, (err, numRemoved) => {
      if (err) {
        return res.status(500).json({ error: "Failed to clear cart" });
      }
      res.json({ message: "User's cart cleared successfully", numRemoved });
    });
  });
  
export {cart}
export default router;
