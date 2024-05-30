// npm init -y
// npm i express
// npm i joi
// npm install --save-dev nodemon
// npm i nedb-promise
import express from "express";
import menu from "./models/coffeeMenu.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import bodyParser from "body-parser";
// import router from "./routes/airbean.js";

const app = express();
const PORT = 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use("/menu", router);
app.get("/menu", (req, res) => {
  res.json(menu);
  console.log(menu);
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
