const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  pictures: { type: [String] },
  registrationCity: { type: String, required: true },
  engineType: { type: String, required: true },
  engineCapacity: { type: String, required: true },
  transmission: { type: String, required: true },
  condition: { type: String, required: true },
  features: { type: [String] }, // Array of strings from checkboxes
  isSold: { type: Boolean, default: false },
  wishlistedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
   // Ownership & Sales Info
  cost: { type: Number }, // Buying price (only for admin-owned)
  ownedBy: { type: String, required: true },// true if product is owned by your business
  commissionPercent: { type: Number }, // For non-owned cars: % commission on sale
addedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User", // or "Admin", depending on your model
  required: true
},
editedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User", // or "Admin"
  default: null,
},
  soldDate: { type: Date },
  soldByName: { type:String }, 
  buyDate: { type: Date, required: true },
    saleHistory: [
    {
      soldPrice: Number,
      cost: Number,
      commissionPercent: Number,
      date: Date,
      gross: Number,
      ownedBy: String,
      soldByName: { type:String }, 
    }
  ]
},
{
  timestamps: true // ✅ Correct placement here
});

module.exports = mongoose.model("Product", productSchema);