const express = require("express");
var expressLayouts = require("express-ejs-layouts");

let server = express();
server.set("view engine", "ejs");
server.use(expressLayouts);
server.use(express.static("public"));

let adminProductsRouter = require("./routes/admin/products.controller");
const expressEjsLayouts = require("express-ejs-layouts");
server.use(adminProductsRouter);

server.get("/admin/product/create", (req, res) => {
  res.render("admin/product-form", { 
    layout:"admin-layout",
    pageTitle: "Create New Product" });
});

server.get("/Bootstrap", (req, res) => {
    return res.render("Bootstrap");
  });
  server.get("/Portfolio", (req, res) => {
    return res.send(res.render("Portfolio"));
  });

  server.listen(2002, () => {
    console.log(`Server Started at localhost:2002`);
  });