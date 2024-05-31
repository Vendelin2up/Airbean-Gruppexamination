
const validateUserCreation = (req, res, next) => {
   //Funktionen validateUserCreation tar tre argument: req (request), res (response) och next.
    const { username } = req.body;
  //Destructuring används för att plocka ut username från req.body.

    if (!username || typeof username !== "string" || username.trim() === "") {
      return res.status(400).json({ error: "Invalid username" });
    }

    next();
  };

  // Funktionen kontrollerar om username är giltigt (inte tomt, är en sträng, och inte bara mellanslag).
  // Om username inte är giltigt, skickar den tillbaka ett felmeddelande.
  // Om username är giltigt, går den vidare till nästa middleware eller funktion med next().
 
  
  export { validateUserCreation };
  