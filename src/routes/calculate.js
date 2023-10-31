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
const CALENDAR = require("../models/calendar");
const cacheStr = "calculate";
const cacheStr2 = "chart";

const $cal = require("../services/calculate_fn");
const _cal_normal_fn = require("../services/cal_normal_fn");

// const $cal_group = require("./calculate_group_fn");
// const $cal_NoGroup = require("./calculate_nogroup_fn");

router.get("/", async (req, res, next) => {
  try {
    // req.apicacheGroup = cacheStr;
    const usersQuery = await CALCULATE.aggregate([{ $match: {} }]).sort({ date: -1 });
    res.json(usersQuery);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

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
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});
router.get("/calculate", async (req, res, next) => {
  try {
    // apicache.clear(cacheStr);
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
    res.sendStatus(500);
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
    // apicache.clear(cacheStr);
    const statusDelete = await CALCULATE.deleteMany({});
    console.log("delete NG ref", statusDelete);
    const usersQuery = await CALCULATE.insertMany(req.body);
    console.log("create NG ref ->", usersQuery.length);
    res.json(usersQuery);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.get("/cal", async (req, res, next) => {
  try {
    // apicache.clear(cacheStr);
    // apicache.clear(cacheStr2);
    const { date } = req.query;
    let groupTargetAll = await GROUP_TARGET.aggregate([
      {
        $match: {},
      },
    ]);
    const models = groupTargetAll.map((a) => a.model);
    const resYield_models = await axios.get("http://10.200.90.152:4042/models");
    const yield_models = resYield_models.data;

    let modelsStr = JSON.stringify(models);
    const nextFriday = moment(date).day("Friday");
    const lastSaturday = moment(nextFriday).subtract(6, "day");
    let sd = moment(lastSaturday).startOf("day").format("YYYY-MM-DD");
    let ed = moment(nextFriday).endOf("day").format("YYYY-MM-DD");
    const resYield_data = await axios.get("http://10.200.90.152:4042/dataDaily", {
      params: {
        start: sd,
        end: ed,
        model: modelsStr,
      },
    });
    const yield_data = resYield_data.data;
    const dataModels = groupTargetAll.map((a) => {
      const item1 = yield_models.find((b) => b.model == a.model);
      const item2 = yield_data.filter((b) => b.modelNo == a.model);
      //   console.log("🚀 ~ item2:", item2);
      //   return { a, item1, item2 };
      return {
        ...a,
        ...item1,
        yield: item2,
      };
    });
    const ngRef = await NG_REF.aggregate([{ $match: {} }]);
    const calendar = await CALENDAR.aggregate([
      {
        $match: {
          date: {
            $gte: moment(ed).startOf("day").toDate(),
            $lte: moment(ed).endOf("day").toDate(),
          },
        },
      },
      {
        $project: {
          date: "$date",
          month: "$month",
          CW: "$CW",
        },
      },
    ]);
    console.log("🚀 ~ calendar:", calendar);
    const weekData = calendar && calendar.length > 0 ? calendar[0] : null;
    weekData ? delete weekData._id : false;
    const foo = _cal_normal_fn.calculate(ngRef, dataModels, weekData);
    const deleteItems = foo.map((a) => {
      return { deleteMany: { filter: { CW: a.CW } } };
    });
    const resultDelete = await CALCULATE.bulkWrite(deleteItems);
    console.log("🚀 ~ resultDelete:", resultDelete);
    const foo2 = await CALCULATE.insertMany(foo);
    res.json(foo2);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.get("/calAll", async (req, res, next) => {
  try {
    // apicache.clear(cacheStr);
    // apicache.clear(cacheStr2);
    let thursdays = findAllThursday();
    let result = [];
    for (let i = 0; i < thursdays.length; i++) {
      const thursday = thursdays[i];
      let groupTargetAll = await GROUP_TARGET.aggregate([
        {
          $match: {},
        },
      ]);
      const models = groupTargetAll.map((a) => a.model);
      const resYield_models = await axios.get("http://10.200.90.152:4042/models");
      const yield_models = resYield_models.data;

      let modelsStr = JSON.stringify(models);
      const nextFriday = moment(thursday).day("Friday");
      const lastSaturday = moment(nextFriday).subtract(6, "day");
      let sd = moment(lastSaturday).startOf("day").format("YYYY-MM-DD");
      let ed = moment(nextFriday).endOf("day").format("YYYY-MM-DD");
      const resYield_data = await axios.get("http://10.200.90.152:4042/dataDaily", {
        params: {
          start: sd,
          end: ed,
          model: modelsStr,
        },
      });
      const yield_data = resYield_data.data;
      const dataModels = groupTargetAll.map((a) => {
        const item1 = yield_models.find((b) => b.model == a.model);
        const item2 = yield_data.filter((b) => b.modelNo == a.model);
        return {
          ...a,
          ...item1,
          yield: item2,
        };
      });
      const ngRef = await NG_REF.aggregate([{ $match: {} }]);
      const calendar = await CALENDAR.aggregate([
        {
          $match: {
            date: {
              $gte: moment(ed).startOf("day").toDate(),
              $lte: moment(ed).endOf("day").toDate(),
            },
          },
        },
        {
          $project: {
            date: "$date",
            month: "$month",
            CW: "$CW",
          },
        },
      ]);
      const weekData = calendar && calendar.length > 0 ? calendar[0] : null;
      weekData ? delete weekData._id : false;
      const foo = _cal_normal_fn.calculate(ngRef, dataModels, weekData);
      const deleteItems = foo.map((a) => {
        return { deleteMany: { filter: { CW: a.CW } } };
      });
      const resultDelete = await CALCULATE.bulkWrite(deleteItems);
      const foo2 = await CALCULATE.insertMany(foo);
      result.push(foo2);
      if (i + 1 === thursdays.length) {
        res.json(result);
      }
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});
findAllThursday();
function findAllThursday() {
  const startDate = moment("2023-09-01");
  const endDate = moment(); // ใช้วันที่ปัจจุบัน
  const thursdays = [];
  while (startDate.isSameOrBefore(endDate, "day")) {
    if (startDate.day() === 4) {
      // 4 คือวันพฤหัส
      thursdays.push(startDate.format("YYYY-MM-DD"));
    }
    startDate.add(1, "day");
  }
  return thursdays;
}

module.exports = router;
