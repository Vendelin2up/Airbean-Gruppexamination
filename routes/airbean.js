import express, { Router } from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import bodyParser from "body-parser";
import session from "express-session"; // for handling user sessions - login status

import homeRouter from "./home.js";
import aboutRouter from "./about.js";
import orderRouter from './order.js'
import cartRouter from './cart.js'
import authRouter from './auth.js'

import sessionMiddleware from "../middlewares/session.js";

const router = Router();
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
router.use(sessionMiddleware);

// Routes
router.use('/', homeRouter)
router.use('/about', aboutRouter)
router.use('/order', orderRouter)
router.use('/cart', cartRouter)
router.use('/account', authRouter)


export default router;
