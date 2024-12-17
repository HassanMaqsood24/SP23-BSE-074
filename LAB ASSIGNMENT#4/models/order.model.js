const mongoose = require("mongoose");

let orderSchema = mongoose.Schema({
  name: String,
  email: String,
  number: Number,
  address: String,
  paymentMethod: { type: String, enum: ["Cash"], default: "Cash"},
  products: [
    {
        productId: {type: mongoose.Schema.Types.ObjectId,ref: 'Product',},
        title: { type: String } 
    },
],
});
let OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;