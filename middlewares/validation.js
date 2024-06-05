import menu from "../models/coffeeMenu.js";
const validateUserCreation = (req, res, next) => {
  //Funktionen validateUserCreation tar tre argument: req (request), res (response) och next.
  const { username } = req.body;
  //Destructuring används för att plocka ut username från req.body.

  if (!username || typeof username !== "string" || username.trim() === "") {
    // Funktionen kontrollerar om username är giltigt (inte tomt, är en sträng, och inte bara mellanslag).
    return res.status(400).json({ error: "Invalid username" });
    // Om username inte är giltigt: returnerar ett felmeddelande.
  }

  next();
  // Om username är giltigt: går vidare till nästa middleware eller funktion med next().
};

export const validateMenu = (req, res, next) => {
  const isValid = menu.every((item) => {
    return typeof item.title === "string" && typeof item.price === "number";
  });

  if (!isValid) {
    return res.status(400).json({
      error:
        "Invalid menu data. Each item must have a title (string) and a price (number).",
    });
  }
  next();
};

export const validateAboutData = (req, res, next) => {
  const { company, description, coffeeProduction } = req.body;
  if (
    typeof company !== "string" ||
    typeof description !== "string" ||
    typeof coffeeProduction !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Invalid about data. All fields must be strings." });
  }
  next();
};

const validatePrice = (req, res, next) => {
  const { id } = req.body;
  const selectedProduct = menu.find((product) => product.id === id);

  if (!selectedProduct) {
    return res.status(404).send("The requested product could not be found");
  }

  if (typeof selectedProduct.price !== "number" || selectedProduct.price <= 0) {
    return res.status(400).send("Invalid product price");
  }

  next();
};
export { validateUserCreation, validatePrice };
