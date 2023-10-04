let express = require("express");
let router = express.Router();
const apicache = require("apicache-plus");
let cache = apicache.middleware
let XLSX = require("xlsx");
const GROUP_TARGET = require("../models/group-target");

router.get("/", apicache.middleware("10 minutes"),async (req, res, next) => {
  try {
    req.apicacheGroup  = "groupTarget"
    const usersQuery = await GROUP_TARGET.aggregate([{$match:{}}])
    res.json(usersQuery);
  } catch (error) {
    res.sendStatus(500);
  }
});

router.get("/download", async (req, res, next) => {
  try {
    
    const data = await GROUP_TARGET.aggregate([
      {
        $match: {
          
        },
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
    apicache.clear('groupTarget')
    const statusDelete = await GROUP_TARGET.deleteMany({})
    console.log("delete group target", statusDelete)
    const usersQuery = await GROUP_TARGET.insertMany(req.body)
    console.log('create group target ->',usersQuery.length);
    res.json(usersQuery);
  } catch (error) {
    res.sendStatus(500);
  }
});

module.exports = router;
