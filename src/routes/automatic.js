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
const cron = require("node-cron");
const $cal = require("../services/calculate_fn");
const _cal_normal_fn = require("../services/cal_normal_fn");

cron.schedule("0 30 11 * * 4", () => {
  console.log("Task is running every Thursday at 13:00!");
  calEvery();
});

async function calEvery() {
  try {
    const date = new Date();
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
    await CALCULATE.insertMany(foo);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
}

module.exports = router;
