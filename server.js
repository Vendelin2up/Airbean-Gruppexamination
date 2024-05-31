// npm init -y
// npm i express
// npm i joi
// npm install --save-dev nodemon
// npm i nedb-promise
// npm install 
import express from "express";
import menu from "./models/coffeeMenu.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import bodyParser from "body-parser";
// import router from "./routes/airbean.js";
import bodyParser from "body-parser"; //Utkommenterat av Ann
import router from "./routes/airbean.js"; //Utkommenterat av Ann

const app = express();
const PORT = 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); //Tillagt av Ann
app.use(bodyParser.json()); //Tillagt av Ann

// Routes
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use("/menu", router);

app.use("/api", router); //Tillagt av Ann
//Alla rutter som är definierade i router ska föregås av /api i URL

app.get("/menu", (req, res) => {
  const coffeMenu = menu.map((item) => {
    return {
      title: item.title,
      price: item.price,
    };
  });
  res.json(coffeMenu);
});

// En about route
app.get("/about", (req, res) => {
  const aboutInfo = {
    company: "Airbean Coffee",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    coffeeProduction:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  };
  res.json(aboutInfo);
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

