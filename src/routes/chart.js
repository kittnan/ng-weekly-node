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
const cacheStr = "chart";
const CALENDAR = require("../models/calendar");

const _cal_normal_fn = require("../services/cal_normal_fn");
const $cal_general = require("../services/calculate_general_fn");

router.get("/1", async (req, res, next) => {
  try {
    // req.apicacheGroup = cacheStr;
    let CW = await CALENDAR.aggregate([
      {
        $match: {
          date: {
            $lte: new Date(),
          },
        },
      },
      {
        $group: { _id: "$CW" },
      },
      {
        $sort: { _id: -1 },
      },
    ]).limit(5);
    CW = CW.map((a) => a._id);
    CW = CW.sort((a, b) => a - b);
    let W_CW = await CALENDAR.aggregate([
      {
        $match: {
          CW: {
            $in: CW,
          },
        },
      },
    ]);
    W_CW = CW.map((w) => {
      const item = W_CW.find((c) => c.CW == w);
      return item.month;
    });

    const distinct = await CALCULATE.distinct("groupName");
    const groupName = distinct.filter((a) => a);

    const calData = await CALCULATE.aggregate([
      {
        $match: {
          groupName: {
            $in: groupName,
          },
        },
      },
      {
        $group: {
          _id: "$groupName",
          data: {
            $push: "$$ROOT",
          },
        },
      },
    ]);
    let calData2 = calData.map((a) => {
      const mdl = a.data.filter((b) => b.type == "MDL");
      const pnl = a.data.filter((b) => b.type == "PNL");
      const item1 = {
        groupName: a._id,
        type: "MDL",
        data: mdl,
      };
      const item2 = {
        groupName: a._id,
        type: "PNL",
        data: pnl,
      };
      return [item1, item2];
    });
    calData2 = calData2.reduce((p, n) => {
      return p.concat(n);
    }, []);

    calData2 = calData2.map((cal) => {
      const s1 = {
        name: "Pola FM",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "PolaFMPercent"),
        color: "#ccffcc",
        yAxisIndex: 1,
        emphasis: {
          focus: "series",
        },
      };

      const s2 = {
        name: "Process Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "ProcessCausePercent"),
        color: "#ffbf82",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };

      const s3 = {
        name: "Array Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "ArrayCausePercent"),
        color: "#ffccda",
        yAxisIndex: 1,
        emphasis: {
          focus: "series",
        },
      };

      const s4 = {
        name: "Mat Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "MaterialCausePercent"),
        color: "#82c2ff",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };

      const s5 = {
        name: "ST Yield",
        type: "line",
        data: summarizeGroupCause(cal, CW, "ST Yield"),
        color: "#f55951",
        yAxisIndex: 0,
        emphasis: {
          focus: "series",
        },
      };
      const s6 = {
        name: "Plan Yield",
        type: "line",
        data: summarizeGroupCause(cal, CW, "planYield"),
        color: "#bb99ff",
        yAxisIndex: 0,

        emphasis: {
          focus: "series",
        },
      };
      const s7 = {
        name: "Target Pola FM",
        type: "line",
        data: summarizeGroupCause(cal, CW, "targetPolaFM"),
        color: "#004723",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      let legend = ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield", "Target Pola FM"];
      let data = [s1, s2, s3, s4, s5, s6, s7];
      if (cal.type == "MDL") {
        legend = ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield"];
        data = [s1, s2, s3, s4, s5, s6];
      }

      return {
        title: {
          show: true,
          text: cal ? `${cal.groupName} ${cal.type} Yield ` : "",
        },
        legend: {
          data: legend,
          orient: "horizontal",
          top: 10,
          padding: 20,
          itemWidth: 10,
        },
        series: data,
        xAxis: [
          {
            type: "category",
            name: "",
            data: CW.map((w) => "CW" + w),
            axisPointer: {
              type: "shadow",
            },
            axisLabel: {
              formatter: "{value}",
            },
          },
          {
            type: "category",
            data: W_CW,
            axisPointer: {
              type: "shadow",
            },
            position: "bottom",
            offset: 20,
            axisTick: {
              show: false, // Hide axis ticks
            },
            axisLine: {
              show: false, // Hide axis line
            },
            axisLabel: {
              show: true, // Show axis labels
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            axisLabel: {
              formatter: "{value} %",
            },
            max: 100,
            min: 60,
          },
          {
            type: "value",
            axisLabel: {
              formatter: "{value} %",
            },
            max: 50,
          },
        ],
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            crossStyle: {
              color: "#999",
            },
          },
        },
        toolbox: {
          feature: {
            dataView: { show: true, readOnly: false },
            magicType: { show: true, type: ["line", "bar"] },
            restore: { show: true },
            saveAsImage: { show: true },
            dataZoom: {
              show: true,
            },
          },
          top: 20,
          orient: "vertical",
        },
        grid: {
          containLabel: true,
        },
      };
    });

    res.json(calData2);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.get("/2", async (req, res, next) => {
  try {
    // req.apicacheGroup = cacheStr;
    let CW = await CALENDAR.aggregate([
      {
        $match: {
          date: {
            $lte: new Date(),
          },
        },
      },
      {
        $group: { _id: "$CW" },
      },
      {
        $sort: { _id: -1 },
      },
    ]).limit(5);
    CW = CW.map((a) => a._id);
    CW = CW.sort((a, b) => a - b);
    let W_CW = await CALENDAR.aggregate([
      {
        $match: {
          CW: {
            $in: CW,
          },
        },
      },
    ]);
    W_CW = CW.map((w) => {
      const item = W_CW.find((c) => c.CW == w);
      return item.month;
    });
    const calData = await CALCULATE.aggregate([
      {
        $match: {
          groupName: null,
          CW: {
            $in: CW,
          },
        },
      },
      // {
      //   $group: {
      //     _id: "$projectName",
      //     foo: {
      //       $push: "$$ROOT",
      //     },
      //   },
      // },
    ]);

    const modelDistinct = await CALCULATE.distinct("model");

    const ab = modelDistinct.map((model) => {
      // let arrayData = CW.map((w) => {
      const item = calData.find((cal) => cal.model == model);
      //   if (dataOnCW) console.log("🚀 ~ dataOnCW:", dataOnCW);
      //   return [dataOnCW?.ArrayCausePercent ? dataOnCW.ArrayCausePercent : 0, dataOnCW?.ProcessCausePercent ? dataOnCW.ProcessCausePercent : 0, dataOnCW?.PolaFMPercent ? dataOnCW.PolaFMPercent : 0];
      // });

      const s1 = {
        name: "Pola FM",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "PolaFMPercent"),
        color: "#ccffcc",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };

      const s2 = {
        name: "Process Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "ProcessCausePercent"),
        color: "#ffbf82",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };

      const s3 = {
        name: "Array Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "ArrayCausePercent"),
        color: "#ffccda",
        yAxisIndex: 1,
        emphasis: {
          focus: "series",
        },
      };

      const s4 = {
        name: "Mat Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "MaterialCausePercent"),
        color: "#82c2ff",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };

      const s5 = {
        name: "ST Yield",
        type: "line",
        data: summarizeNormalCause(model, calData, CW, "ST Yield"),
        color: "#f55951",
        yAxisIndex: 0,
        emphasis: {
          focus: "series",
        },
      };
      const s6 = {
        name: "Plan Yield",
        type: "line",
        data: summarizeNormalCause(model, calData, CW, "planYield"),
        color: "#bb99ff",
        yAxisIndex: 0,

        emphasis: {
          focus: "series",
        },
      };
      const s7 = {
        name: "Target Pola FM",
        type: "line",
        data: summarizeNormalCause(model, calData, CW, "targetPolaFM"),
        color: "#004723",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };

      let legend = ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield", "Target Pola FM"];
      let data = [s1, s2, s3, s4, s5, s6, s7];
      if (item && item.type == "MDL") {
        legend = ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield"];
        data = [s1, s2, s3, s4, s5, s6];
      }

      return {
        title: {
          show: true,
          text: item ? `${item.projectName} ${item.type} Yield ( ${item.model} )` : "",
        },
        legend: {
          data: legend,
          orient: "horizontal",
          top: 10,
          padding: 20,
          itemWidth: 10,
        },
        series: data,
        xAxis: [
          {
            type: "category",
            name: "",
            data: CW.map((w) => "CW" + w),
            axisPointer: {
              type: "shadow",
            },
            axisLabel: {
              formatter: "{value}",
            },
          },
          {
            type: "category",
            data: W_CW,
            axisPointer: {
              type: "shadow",
            },
            position: "bottom",
            offset: 20,
            axisTick: {
              show: false, // Hide axis ticks
            },
            axisLine: {
              show: false, // Hide axis line
            },
            axisLabel: {
              show: true, // Show axis labels
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            axisLabel: {
              formatter: "{value} %",
            },
            max: 100,
            min: 60,
          },
          {
            type: "value",
            axisLabel: {
              formatter: "{value} %",
            },
            max: 50,
          },
        ],
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            crossStyle: {
              color: "#999",
            },
          },
        },
        toolbox: {
          feature: {
            dataView: { show: true, readOnly: false },
            magicType: { show: true, type: ["line", "bar"] },
            restore: { show: true },
            saveAsImage: { show: true },
            dataZoom: {
              show: true,
            },
          },
          top: 20,
          orient: "vertical",
        },
        grid: {
          containLabel: true,
        },
      };
    });
    const onlyData = ab.filter((a) => {
      const foo = a.series.filter((b) => b.data.filter((c) => c == 0 || c == null).length == b.data.length);
      if (foo.length == a.series.length) return false;
      return true;
    });

    // const sortData = onlyData.sort((a, b) => b.title.text - a.title.text);
    const sortData = onlyData.sort(function (a, b) {
      return a.title.text.localeCompare(b.title.text);
    });
    res.json(sortData);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

function summarizeNormalCause(model, calData, CW, key) {
  return CW.map((w) => {
    const dataOnCW = calData.find((cal) => cal.model == model && cal.CW == w);
    const temp = dataOnCW ? dataOnCW[key] : null;
    return temp ? Number(temp * 100).toFixed(2) : null;
  });
}

function summarizeGroupCause(cal, CW, key) {
  return CW.map((w) => {
    if (key == "planYield" || key == "targetPolaFM") {
      const dataOnCW = cal.data.find((d) => d.CW == w);
      const sum = dataOnCW ? dataOnCW[key] : null;
      return sum ? Number(sum * 100).toFixed(2) : null;
    } else if (key == "ST Yield") {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const input = dataOnCW.reduce((p, n) => {
        return (p += n["Input"]);
      }, 0);
      const output = dataOnCW.reduce((p, n) => {
        return (p += n["Output"]);
      }, 0);
      // const sum = dataOnCW.reduce((p, n) => {
      //   p += n[key];
      //   return p;
      // }, 0);
      const sum2 = output / input;
      return sum2 ? Number(sum2 * 100).toFixed(2) : null;
    } else if (key == "ProcessCausePercent") {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const input = dataOnCW.reduce((p, n) => {
        return (p += n["Input"]);
      }, 0);
      const P = dataOnCW.reduce((p, n) => {
        return (p += n["ProcessCause"]);
      }, 0);
      const sum = P / input;
      return sum ? Number(sum * 100).toFixed(2) : null;
    } else if (key == "PolaFMPercent") {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const input = dataOnCW.reduce((p, n) => {
        return (p += n["Input"]);
      }, 0);
      const P = dataOnCW.reduce((p, n) => {
        return (p += n["Pola"]);
      }, 0);
      const sum = P / input;
      return sum ? Number(sum * 100).toFixed(2) : null;
    } else if (key == "ArrayCausePercent") {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const input = dataOnCW.reduce((p, n) => {
        return (p += n["Input"]);
      }, 0);
      const P = dataOnCW.reduce((p, n) => {
        return (p += n["ArrayCause"]);
      }, 0);
      const sum = P / input;
      return sum ? Number(sum * 100).toFixed(2) : null;
    } else if (key == "MaterialCausePercent") {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const input = dataOnCW.reduce((p, n) => {
        return (p += n["Input"]);
      }, 0);
      const P = dataOnCW.reduce((p, n) => {
        return (p += n["MaterialCause"]);
      }, 0);
      const sum = P / input;
      return sum ? Number(sum * 100).toFixed(2) : null;
    }
  });
}

module.exports = router;
