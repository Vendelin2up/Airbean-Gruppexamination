// npm init -y
// npm i express
// npm i joi
// npm install --save-dev nodemon
// npm i nedb-promise
import express from "express";
import menu from "./models/coffeeMenu.js";
// import bodyParser from "body-parser";
// import router from "./routes/airbean.js";

const app = express();
const PORT = 8080;

//Middlewares
app.use(express.json());

// Routes
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use("/menu", router);
app.get("/menu", (req, res) => {
  res.json(menu);
  console.log(menu);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
//ANN testar 