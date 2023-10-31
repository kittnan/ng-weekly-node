let express = require("express");
let router = express.Router();
const apicache = require("apicache-plus");
let cache = apicache.middleware;
let XLSX = require("xlsx");
const NG_REF = require("../models/ngRef");
const cacheStr = "ngRef";

// router.get("/", apicache.middleware("10 minutes"), async (req, res, next) => {
//   try {
//     req.apicacheGroup = cacheStr;
//     const usersQuery = await NG_REF.aggregate([{ $match: {} }]);
//     res.json(usersQuery);
//   } catch (error) {
//     console.log("🚀 ~ error:", error);
//     res.sendStatus(500);
//   }
// });
router.get("/", async (req, res, next) => {
  try {
    // req.apicacheGroup = cacheStr;
    const usersQuery = await NG_REF.aggregate([{ $match: {} }]);
    res.json(usersQuery);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.get("/download", async (req, res, next) => {
  try {
    const dataPNL = await NG_REF.aggregate([
      {
        $match: {
          type: "PNL",
        },
      },
      {
        $unset: ["_id", "createdAt", "updatedAt", "type"],
      },
    ]);
    const dataMDL = await NG_REF.aggregate([
      {
        $match: {
          type: "MDL",
        },
      },
      {
        $unset: ["_id", "createdAt", "updatedAt", "type"],
      },
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet1 = XLSX.utils.json_to_sheet(dataPNL);
    const worksheet2 = XLSX.utils.json_to_sheet(dataMDL);
    XLSX.utils.book_append_sheet(workbook, worksheet1, "PNL");
    XLSX.utils.book_append_sheet(workbook, worksheet2, "MDL");

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
    const statusDelete = await NG_REF.deleteMany({});
    console.log("delete NG ref", statusDelete);
    const usersQuery = await NG_REF.insertMany(req.body);
    console.log("create NG ref ->", usersQuery.length);
    res.json(usersQuery);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
