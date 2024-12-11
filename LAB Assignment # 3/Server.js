const express = require("express");
let server = express();
server.set("view engine", "ejs");
server.use(express.static("public"));


server.get("/Bootstrap", (req, res) => {
    return res.render("Bootstrap");
  });
  server.get("/Portfolio", (req, res) => {
    return res.send(res.render("Portfolio"));
  });

  server.listen(2002, () => {
    console.log(`Server Started at localhost:2002`);
  });