const mongoose = require("mongoose");

let productSchema = mongoose.Schema({
  title: String,
  description: String,
  picture: String,
  price: Number,
});

let ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
