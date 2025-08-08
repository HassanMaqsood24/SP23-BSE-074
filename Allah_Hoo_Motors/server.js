const express = require ("express");
const path = require('path');
const mongoose = require ("mongoose");
const multer = require('multer');


const server = express();

// View engine setup
server.set ("view engine","ejs");
server.use(express.static(path.join(__dirname, 'public')));
server.use(express.static("uploads"));
server.use("/uploads", express.static("uploads"));

// Body parsers
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

const session = require('express-session');

server.use(session({
  secret: 'yourSecretKey',       // Replace with a strong secret
  resave: false,
  saveUninitialized: false
}));


// Models
let Product = require("./models/productsmodel");
let User= require("./models/usersmodel");
let Complain= require("./models/complainmodel");

// Multer file upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Admin routes
const admincontrollerRouter = require("./routes/admin/admincontroller");
server.use(admincontrollerRouter);

// User routes
const usercontrollerRouter = require("./routes/user/usercontroller");
server.use( usercontrollerRouter);


// Landing page
server.get("/", async (req, res) => {
  const user = req.session?.user || null;
  const success = req.query.success;
  res.render("landingpage", {success, user });
});

server.get("/complain", (req, res) => {
  res.render("complain"); // If you're using EJS or another templating engine
});

// POST: Submit a complaint
server.post('/complain', async (req, res) => {
  const { fullName, email, phone, type, orderId, message } = req.body;

  if (!fullName || !email || !type || !message) {
    return res.status(400).send('All required fields must be filled out.');
  }

  try {
    const newComplaint = new Complain({
      fullName,
      email,
      phone,
      type,
      orderId,
      message,
    });

    await newComplaint.save();
   res.redirect('/?success=1');
  } catch (err) {
    console.error('❌ Error saving complaint:', err); // Add this line
    res.status(500).send('Something went wrong. Please try again later.');
  }
});

// MongoDB connection
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1/Allah_Hoo_Motors";
mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB Error:", error.message));

// Start server
server.listen(1000, () => {
  console.log(" Server started at http://localhost:1000");
});