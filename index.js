let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let app = express();
let morgan = require("morgan");
let mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const dotenv = require("dotenv");

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
console.log(process.env.PORT);
let mongooseConnect = require("./connect");
const port = process.env.PORT ;
const server = app.listen(port, () => {
  console.log("Listening on  port " + server.address().port);
});


app.use(morgan("tiny"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
app.use(cors());

let NG_REF = require("./src/routes/ngRef");
app.use("/ng-ref", NG_REF);

let GROUP_TARGET = require("./src/routes/group-target");
app.use("/group-target", GROUP_TARGET);

let CALCULATE = require("./src/routes/calculate");
app.use("/calculate", CALCULATE);


app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST ,PUT ,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-with,Content-Type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

module.exports = app;
