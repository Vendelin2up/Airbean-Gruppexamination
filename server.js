// npm init -y
// npm i express
// npm i joi
// npm install --save-dev nodemon
// npm i nedb-promise
//npm install 
import express from "express";
import menu from "./models/coffeeMenu.js";
import bodyParser from "body-parser"; //Utkommenterat av Ann
import router from "./routes/airbean.js"; //Utkommenterat av Ann

const app = express();
const PORT = 8080;

//Middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); //Tillagt av Ann
app.use(bodyParser.json()); //Tillagt av Ann

// Routes
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use("/menu", router);

app.use("/api", router); //Tillagt av Ann
//Alla rutter som är definierade i router ska föregås av /api i URL

app.get("/menu", (req, res) => {
  res.json(menu);
  console.log(menu);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
//ANN testar 


