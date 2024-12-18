const express = require("express");
let routers = express.Router();
let Product = require("../../models/product.model");
let Order = require("../../models/order.model");
const mongoose = require("mongoose");

routers.get("/cart", async (req, res) => {
  let cart = req.cookies.cart;
  cart = cart ? cart : [];

  // Filter out invalid ObjectId entries
  const validIds = cart.filter((id) => mongoose.Types.ObjectId.isValid(id));

  // Fetch products with valid IDs
  let products = await Product.find({ _id: { $in: validIds } });

  return res.render("cart", 
    {layout:"",
       products });
});


routers.get("/add-to-cart/:id", (req, res) => {
  const productId = req.params.id;

  // Validate the productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).send("Invalid product ID");
  }

  let cart = req.cookies.cart;
  cart = cart ? cart : [];

  // Avoid duplicates in the cart
  if (!cart.includes(productId)) {
    cart.push(productId);
    res.cookie("cart", cart);
  }

  return res.redirect("/homepage");
    
  });
routers.get("/remove-from-cart/:productId", (req, res) => {
  const productId = req.params.productId;
  let cart = req.cookies.cart;
  cart = cart ? cart : [];
  cart = cart.filter(id => id !== productId);
  res.cookie("cart", cart);
  return res.redirect("/cart");
});

routers.post("/checkout", async (req, res) => {
  try {
    const cartItems = req.cookies.cart || [];
    const { name, email, number, address, paymentMethod } = req.body;

    const productIds = cartItems.map(item => {
      if (mongoose.Types.ObjectId.isValid(item)) {
        return new mongoose.Types.ObjectId(item); 
      } else {
        console.error('Invalid productId:', item);
        return null;
      }
    }).filter(id => id !== null);
    if (productIds.length === 0) {
      return res.status(400).json({ message: "No valid products in the cart" });
    }
    const products = await Product.find({ '_id': { $in: productIds } });
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in the database" });
    }
    const newOrder = new Order({
      name,
      email,
      number,
      address,
      paymentMethod,
      products: products.map(product => ({
        productId: product._id,
        title: product.title 
      }))
    });
    await newOrder.save();
    res.clearCookie("cart");
    res.redirect('/Bootstrap');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error placing order" });
  }
});

  routers.get('/homepage', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
        res.render('homepage', { products }); // Pass products to EJS
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
  });

  module.exports = routers;