import express from 'express'
import { Router } from "express";
import menu from "../models/coffeeMenu.js";
import nedb from 'nedb-promise'

const router = Router();

// Homepage
router.get('/', (req, res) => {
  res.send('<h1>This is the landing page</h1>')
})
// Get menu
router.get("/menu", (req, res) => {
  res.send(menu);
});

// POST menu
router.post('/menu', (req, res) => {
  const orderId = req.body.id;
  const selectedProduct = menu.filter((product) => product.id === orderId)
  //Kontroll om man har konto eller vill forsätta som gäst?
  if(selectedProduct){
    const cart = new nedb({filename: 'models/cart.db', autoload: true})
    const productTitle = selectedProduct[0].title
    const productPrice = selectedProduct[0].price
    cart.insert(selectedProduct)
    res.send(`${productTitle} was successfully added to cart`)
    return
  } else {
    res.status(404).send('The requested product could not be found')
  }

})

export default router;
