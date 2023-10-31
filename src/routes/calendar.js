let express = require("express");
let router = express.Router();
const apicache = require("apicache-plus");
let cache = apicache.middleware;
let XLSX = require("xlsx");
const CALENDAR = require("../models/calendar");
const cacheStr = "calendar";

router.get("/", async (req, res, next) => {
  // router.get("/", apicache.middleware("10 minutes"), async (req, res, next) => {
  try {
    // req.apicacheGroup = cacheStr;
    const usersQuery = await CALENDAR.aggregate([{ $match: {} }]).sort({ date: -1 });
    res.json(usersQuery);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.get("/download", async (req, res, next) => {
  try {
    const data = await CALENDAR.aggregate([
      {
        $match: {},
      },
      {
        $unset: ["_id", "createdAt", "updatedAt"],
      },
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet1 = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Sheet");

    // XLSX.writeFile(workbook, "./example.xlsx");
    // const arrayBuffer = XLSX.write(res, { type: 'array', bookType: 'xlsx' });
    // const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.json(workbook);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});
router.post("/create", async (req, res, next) => {
  try {
    // apicache.clear(cacheStr);
    const statusDelete = await CALENDAR.deleteMany({});
    console.log("delete group target", statusDelete);
    const usersQuery = await CALENDAR.insertMany(req.body);
    console.log("create group target ->", usersQuery.length);
    res.json(usersQuery);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
