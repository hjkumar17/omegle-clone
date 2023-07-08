const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));
app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));

app.use("/", require("./Server/routes/router"));

app.listen(PORT,() => {
  console.log(`Server started on port ${PORT}`);
});
