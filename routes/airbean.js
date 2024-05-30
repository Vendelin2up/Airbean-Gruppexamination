import express from 'express'
import { Router } from "express";
import menu from "../models/coffeeMenu.js";
import nedb from 'nedb-promise'

const router = Router();
const cart = new nedb({filename: 'models/cart.db', autoload: true})

// Homepage
router.get('/', (req, res) => {
  res.send('<h1>This is the landing page</h1>')
})
// Get menu
router.get("/menu", (req, res) => {
  res.send(menu);
});

// POST menu
router.post('/menu', async(req, res) => {
  try {
    const orderId = req.body.id;
    const selectedProduct = menu.find((product) => product.id === orderId)

    if(!selectedProduct){
      res.status(404).send('The requested product could not be found')
    } 
      
    await cart.insert(selectedProduct)
    const productTitle = selectedProduct.title
    const productPrice = selectedProduct.price
    res.send(`${productTitle} was successfully added to cart`)
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error')
  }
})

export default router;
