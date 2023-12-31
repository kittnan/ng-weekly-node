let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let app = express();
let morgan = require("morgan");
let mongoose = require("mongoose");
let compression = require("compression");
let apicache = require("apicache-plus");

mongoose.set("strictQuery", false);

const dotenv = require("dotenv");

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
console.log("PORT:", process.env.PORT);
let mongooseConnect = require("./connect");
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log("Listening on  port " + server.address().port);
});

app.use(morgan("tiny"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
app.use(cors());
app.use(compression());

// app.use(apicache("5 minutes"));

let NG_REF = require("./src/routes/ngRef");
app.use("/ng-ref", NG_REF);

let GROUP_TARGET = require("./src/routes/group-target");
app.use("/group-target", GROUP_TARGET);

let CALCULATE = require("./src/routes/calculate");
app.use("/calculate", CALCULATE);

let CALENDAR = require("./src/routes/calendar");
app.use("/calendar", CALENDAR);

// let d = require("./src/routes/cal");
// app.use("/d", d);

let CHART = require("./src/routes/chart");
app.use("/chart", CHART);

let AUTOMATIC = require("./src/routes/automatic");

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST ,PUT ,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-with,Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

module.exports = app;
