let express = require("express");
let router = express.Router();
const apicache = require("apicache-plus");
let cache = apicache.middleware;
let XLSX = require("xlsx");
const axios = require("axios");
const CALCULATE = require("../models/calculate");
const GROUP_TARGET = require("../models/group-target");
const NG_REF = require("../models/ngRef");
const moment = require("moment/moment");
const cacheStr = "calculate";

const $cal = require("./calculate_fn");
// const $cal_group = require("./calculate_group_fn");
// const $cal_NoGroup = require("./calculate_nogroup_fn");

router.get("/", apicache.middleware("10 minutes"), async (req, res, next) => {
  try {
    req.apicacheGroup = cacheStr;
    const usersQuery = await CALCULATE.aggregate([{ $match: {} }]);
    res.json(usersQuery);
  } catch (error) {
    res.sendStatus(500);
  }
});
// router.get("/group", apicache.middleware("10 minutes"), async (req, res, next) => {
//   try {
//     req.apicacheGroup = cacheStr;
//     const usersQuery = await CALCULATE.aggregate([
//       { $match: {} },
//       {
//         $unset: "calResultNoGroup",
//       },
//       {
//         $unwind: "$calResultGroup",
//       },
//       // {
//       //   $unwind: "$calResultGroup.data",
//       // },
//       // {
//       //   $unset: "calResultGroup.data",
//       // },
//       // {
//       //   $project: {
//       //     date: "$date",
//       //     CW: "$CW",
//       //     calResultGroup: "$calResultGroup",
//       //     month: "$month",
//       //   },
//       // },
//       {
//         $replaceRoot: { newRoot: { $mergeObjects: ["$calResultGroup", "$$ROOT"] } },
//       },
//       {
//         $unset: "calResultGroup",
//       },
//       // {
//       //   $replaceRoot: { newRoot: { $mergeObjects: ["$data", "$$ROOT"] } },
//       // },
//       {
//         $unset: "data",
//       },
//       {
//         $replaceRoot: { newRoot: { $mergeObjects: ["$groupData", "$$ROOT"] } },
//       },
//       {
//         $unset: "groupData",
//       },
//       {
//         $unset: "yieldData",
//       },
//       // { $project: { calResultGroup: 0 } },
//     ]);
//     res.json(usersQuery);
//   } catch (error) {
//     console.log("🚀 ~ error:", error);
//     res.sendStatus(500);
//   }
// });
// router.get("/noGroup", apicache.middleware("10 minutes"), async (req, res, next) => {
//   try {
//     req.apicacheGroup = cacheStr;
//     const usersQuery = await CALCULATE.aggregate([
//       { $match: {} },
//       {
//         $unset: "calResultGroup",
//       },
//       {
//         $unwind: "$calResultNoGroup",
//       },
//       // {
//       //   $unset: "calResultGroup.data",
//       // },
//       // {
//       //   $project: {
//       //     date: "$date",
//       //     CW: "$CW",
//       //     calResultGroup: "$calResultGroup",
//       //     month: "$month",
//       //   },
//       // },
//       {
//         $replaceRoot: { newRoot: { $mergeObjects: ["$calResultNoGroup", "$$ROOT"] } },
//       },
//       {
//         $unset: "calResultNoGroup",
//       },
//       // { $project: { calResultGroup: 0 } },
//     ]);
//     res.json(usersQuery);
//   } catch (error) {
//     console.log("🚀 ~ error:", error);
//     res.sendStatus(500);
//   }
// });
router.get("/lastCalWeek", async (req, res, next) => {
  try {
    const nextFriday = moment().day("Friday").startOf("day").toDate();
    console.log("วันศุกร์ถัดไป:", nextFriday);
    const data = await CALCULATE.aggregate([
      {
        $match: {
          date: nextFriday,
        },
      },
    ]);
    res.json(data);

    // let { date } = req.query;
    // if (date) {
    //   date = moment(date).startOf("day").toDate();
    //   const nextFriday = moment().day("Friday");
    //   console.log("วันศุกร์ถัดไป:", nextFriday.format("YYYY-MM-DD"));
    //   const lastSaturday = moment(nextFriday).subtract(6, "day");
    //   console.log("วันเสาร์ที่ผ่านมา:", lastSaturday.format("YYYY-MM-DD"));

    //   let sd = moment(lastSaturday).startOf("day").format("YYYY-MM-DD")
    //   let ed = moment(nextFriday).endOf('day').format("YYYY-MM-DD")
    //   const foo =  await axios.get('http://10.200.90.152:4042/dataDaily',{
    //     params:{
    //       start: sd,
    //       end:ed
    //     }
    //   })
    //   res.json(foo.data);
    // }
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});
router.get("/calculate", async (req, res, next) => {
  try {
    apicache.clear(cacheStr);
    const { ngRef, haveGroup, notHaveGroup, weekData } = await $cal.calculate();
    const calResultGroup = await $cal_group.calculate(ngRef, haveGroup);
    const calResultNoGroup = await $cal_NoGroup.calculate(ngRef, notHaveGroup);
    const insertCalculateData = {
      calResultGroup: calResultGroup,
      calResultNoGroup: calResultNoGroup,
      ...weekData,
    };
    const resultInsertCal = await CALCULATE.insertMany(insertCalculateData);
    res.json(resultInsertCal);
  } catch (error) {
    console.log("🚀 ~ error:", error);
  }
});

router.get("/download", async (req, res, next) => {
  try {
    const dataPNL = await CALCULATE.aggregate([
      {
        $match: {
          type: "PNL",
        },
      },
      {
        $unset: ["_id", "createdAt", "updatedAt", "type"],
      },
    ]);
    const dataMDL = await CALCULATE.aggregate([
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
    apicache.clear(cacheStr);
    const statusDelete = await CALCULATE.deleteMany({});
    console.log("delete NG ref", statusDelete);
    const usersQuery = await CALCULATE.insertMany(req.body);
    console.log("create NG ref ->", usersQuery.length);
    res.json(usersQuery);
  } catch (error) {
    res.sendStatus(500);
  }
});

module.exports = router;
