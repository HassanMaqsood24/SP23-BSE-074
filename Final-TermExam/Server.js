const express = require("express");
const mongoose = require("mongoose");
let server = express();

let Product = require("./models/product.model");
let User = require("./models/user.model");

let cookieParser = require("cookie-parser");
server.use(cookieParser());

let session = require("express-session");
server.use(session({ secret: "my session secret" }));

let siteMiddleware = require("./middlewares/site-middleware");
let authMiddleware = require("./middlewares/auth-middleware");
server.use(siteMiddleware);

var expressLayouts = require("express-ejs-layouts");
server.use(expressLayouts);

server.set("view engine", "ejs");
server.use(express.static("public"));
server.use(express.static("uploads"));

server.use(express.urlencoded());

let shoppingCartRouter = require("./routes/user/shopping.controller");
//server.use(shoppingCartRouter);
let adminProductsRouter = require("./routes/admin/products.controller");
//server.use(adminProductsRouter);

server.get("/about-me", authMiddleware, (req, res) => {
  return res.render("about-me");
});
server.get("/logout", async (req, res) => {
  req.session.user = null;
  return res.redirect("/login");
});
server.get("/login", async (req, res) => {
  return res.render("auth/login");
});

server.post("/login", async (req, res) => {
  let data = req.body;
  let user = await User.findOne({ email: data.email });
  if (!user) return res.redirect("/register");
 isValid = user.password == data.password;
  if (!isValid) return res.redirect("/login");
  req.session.user = user;
  return res.redirect("/Bootstrap");
});


server.get("/register", async (req, res) => {
  return res.render("auth/register");
});


server.post("/register", async (req, res) => {
  let data = req.body;
  let user = await User.findOne({ email: data.email });
  if (user) return res.redirect("/register");
  user = new User(data);
  await user.save();
  return res.redirect("/login");
});


/*
server.get("/add-to-cart/:id", (req, res) => {
  let cart = req.cookies.cart;
  cart = cart ? cart : [];
  cart.push(req.params.id);
  res.cookie("cart", cart);
  return res.redirect("/Bootstrap");
});

server.get("/cart", async (req, res) => {
  let cart = req.cookies.cart;
  cart = cart ? cart : [];
  let products = await Product.find({ _id: { $in: cart } });
  return res.render("cart", { products });
});*/

let adminMiddleware = require("./middlewares/admin-middleware");

server.use("/", authMiddleware, (req, res, next) => {
  if (req.session.user?.role.includes("admin")) {
    return adminMiddleware(req, res, () => {
      adminProductsRouter(req, res, next); 
    });
  }
  next(); 
});

server.use("/", authMiddleware, (req, res, next) => {
  if (!req.session.user?.role.includes("admin")) {
    // If the user does not have the 'admin' role, apply user functionality
    return shoppingCartRouter(req, res, next);
  }
  next(); // If admin, skip this middleware
});

server.get("/checkout",(req,res)=>{
  return res.render("checkout");
});

server.get("/Bootstrap", (req, res) => {
    return res.render("Bootstrap");
  });
  server.get("/Portfolio", (req, res) => {
    return res.send(res.render("Portfolio"));
  });

  let connectionString = "mongodb://localhost/myproducts";
  mongoose
    .connect(connectionString, { useNewUrlParser: true })
    .then(() => console.log("Connected to Mongo DB Server: " + connectionString))
    .catch((error) => console.log(error.message));

  server.listen(2010, () => {
    console.log(`Server Started at localhost:2010`);
  });