const express = require("express");
const mongoose = require("mongoose");
let server = express();
var expressLayouts = require("express-ejs-layouts");
server.use(expressLayouts);

server.use(express.urlencoded());
server.set("view engine", "ejs");
server.use(express.static("public"));
server.use(express.static("uploads"));


let adminProductsRouter = require("./routes/admin/products.controller");
server.use(adminProductsRouter);

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

  server.listen(2005, () => {
    console.log(`Server Started at localhost:2005`);
  });