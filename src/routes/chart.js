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

const _cal_normal_fn = require("./cal_normal_fn");
const $cal_general = require("./calculate_general_fn");

router.get("/1", async (req, res, next) => {
  try {
    req.apicacheGroup = cacheStr;
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
        name: "Array Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "ArrayCausePercent"),
        color: "#bae8e8",
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
        color: "#f8aa4b",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      const s3 = {
        name: "Pola FM",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "PolaFMPercent"),
        color: "#58b368",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      const s4 = {
        name: "ST Yield",
        type: "line",
        data: summarizeGroupCause(cal, CW, "ST Yield"),
        color: "#f55951",
        yAxisIndex: 0,
        emphasis: {
          focus: "series",
        },
      };
      const s5 = {
        name: "Plan Yield",
        type: "line",
        data: summarizeGroupCause(cal, CW, "planYield"),
        color: "#bb99ff",
        yAxisIndex: 0,

        emphasis: {
          focus: "series",
        },
      };
      const s6 = {
        name: "Target Pola FM",
        type: "line",
        data: summarizeGroupCause(cal, CW, "targetPolaFM"),
        color: "#f9c46b",
        yAxisIndex: 0,

        emphasis: {
          focus: "series",
        },
      };
      const s7 = {
        name: "Mat Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeGroupCause(cal, CW, "targetPolaFM"),
        color: "#3783ae",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      let data = [s1, s2, s3, s4, s5, s7, s6];

      return {
        title: {
          show: true,
          text: cal ? `${cal.groupName} ${cal.type} Yield ` : "",
        },
        legend: {
          data: ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield", "Target Pola FM"],
          orient: "horizontal",
          top: 10,
          padding: 20,
          itemWidth: 10,
        },
        series: data,
        xAxis: [
          {
            type: "category",
            name: "CW",
            data: CW,
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
            max: 120,
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
      };
    });

    res.json(calData2);
    // // todo ต้องเอา CW มาก่อน
    // // calData2 = calData2.reduce((p, n) => {
    // //   const mdl1 = n.MDL.reduce(
    // //     (p2, n2) => {
    // //       p2["Input"] += n2["Input"];
    // //       p2["Output"] += n2["Output"];
    // //       p2["Rework"] += n2["Rework"];
    // //       p2["P"] += n2["P"];
    // //       p2["A"] += n2["A"];
    // //       p2["M"] += n2["M"];
    // //       p2["X"] += n2["X"];
    // //       p2["Pola"] += n2["Pola"];
    // //       p2["models"].push(n2.model);
    // //       return p2;
    // //     },
    // //     {
    // //       Input: 0,
    // //       Output: 0,
    // //       Rework: 0,
    // //       P: 0,
    // //       A: 0,
    // //       M: 0,
    // //       X: 0,
    // //       Pola: 0,
    // //       models: [],
    // //     }
    // //   );
    // //   const mdl2 = {
    // //     ProcessCause: $cal_general.calProcessCause(mdl1),
    // //     ProcessCausePercent: $cal_general.calPercentInput(mdl1.Input, $cal_general.calProcessCause(mdl1)),
    // //     PolaFMPercent: $cal_general.calPercentInput(mdl1.Input, mdl1["Pola"]),
    // //     ArrayCause: $cal_general.calArrayCause(mdl1),
    // //     ArrayCausePercent: $cal_general.calPercentInput(mdl1.Input, $cal_general.calArrayCause(mdl1)),
    // //     MaterialCause: mdl1["M"],
    // //     MaterialCausePercent: $cal_general.calPercentInput(mdl1.Input, mdl1["M"]),
    // //     "ST Yield": $cal_general.calPercentInput(mdl1["Input"], mdl1["Output"]),
    // //     "TTL Yield": $cal_general.calPercentInput(mdl1["Output"] + mdl1["Rework"], mdl1["Output"]),
    // //   };
    // //   const pnl1 = n.PNL.reduce(
    // //     (p2, n2) => {
    // //       p2["Input"] += n2["Input"];
    // //       p2["Output"] += n2["Output"];
    // //       p2["Rework"] += n2["Rework"];
    // //       p2["P"] += n2["P"];
    // //       p2["A"] += n2["A"];
    // //       p2["M"] += n2["M"];
    // //       p2["X"] += n2["X"];
    // //       p2["Pola"] += n2["Pola"];
    // //       p2["models"].push(n2.model);
    // //       return p2;
    // //     },
    // //     {
    // //       Input: 0,
    // //       Output: 0,
    // //       Rework: 0,
    // //       P: 0,
    // //       A: 0,
    // //       M: 0,
    // //       X: 0,
    // //       Pola: 0,
    // //       models: [],
    // //     }
    // //   );
    // //   const pnl2 = {
    // //     ProcessCause: $cal_general.calProcessCause(pnl1),
    // //     ProcessCausePercent: $cal_general.calPercentInput(pnl1.Input, $cal_general.calProcessCause(pnl1)),
    // //     PolaFMPercent: $cal_general.calPercentInput(pnl1.Input, pnl1["Pola"]),
    // //     ArrayCause: $cal_general.calArrayCause(pnl1),
    // //     ArrayCausePercent: $cal_general.calPercentInput(pnl1.Input, $cal_general.calArrayCause(pnl1)),
    // //     MaterialCause: pnl1["M"],
    // //     MaterialCausePercent: $cal_general.calPercentInput(pnl1.Input, pnl1["M"]),
    // //     "ST Yield": $cal_general.calPercentInput(pnl1["Input"], pnl1["Output"]),
    // //     "TTL Yield": $cal_general.calPercentInput(pnl1["Output"] + pnl1["Rework"], pnl1["Output"]),
    // //   };
    // //   return p.concat(p, [
    // //     { ...mdl1, ...mdl2 },
    // //     { ...pnl1, ...pnl2 },
    // //   ]);
    // // }, []);
    // // res.json(calData2);

    // let moo1 = calData.map((f) => {
    //   const PNL_DATA = f.data.filter((d) => d.type == "PNL");
    //   const MDL_DATA = f.data.filter((d) => d.type == "MDL");
    //   const item1 = {
    //     ...f,
    //     data: PNL_DATA,
    //   };
    //   const item2 = {
    //     ...f,
    //     data: MDL_DATA,
    //   };
    //   return [item1, item2];
    // });
    // moo1 = moo1.reduce((p, n) => {
    //   return p.concat(n);
    // });

    // const foo = moo1.map((a) => {
    //   const newCal = a.data.reduce(
    //     (p, n) => {
    //       p["Input"] += n["Input"];
    //       p["Output"] += n["Output"];
    //       p["Rework"] += n["Rework"];
    //       p["P"] += n["P"];
    //       p["A"] += n["A"];
    //       p["M"] += n["M"];
    //       p["X"] += n["X"];
    //       p["Pola"] += n["Pola"];
    //       p["models"].push(n.model);
    //       return p;
    //     },
    //     {
    //       Input: 0,
    //       Output: 0,
    //       Rework: 0,
    //       P: 0,
    //       A: 0,
    //       M: 0,
    //       X: 0,
    //       Pola: 0,
    //       models: [],
    //     }
    //   );

    //   const newCal2 = {
    //     ProcessCause: $cal_general.calProcessCause(newCal),
    //     ProcessCausePercent: $cal_general.calPercentInput(newCal.Input, $cal_general.calProcessCause(newCal)),
    //     PolaFMPercent: $cal_general.calPercentInput(newCal.Input, newCal["Pola"]),
    //     ArrayCause: $cal_general.calArrayCause(newCal),
    //     ArrayCausePercent: $cal_general.calPercentInput(newCal.Input, $cal_general.calArrayCause(newCal)),
    //     MaterialCause: newCal["M"],
    //     MaterialCausePercent: $cal_general.calPercentInput(newCal.Input, newCal["M"]),
    //     "ST Yield": $cal_general.calPercentInput(newCal["Input"], newCal["Output"]),
    //     "TTL Yield": $cal_general.calPercentInput(newCal["Output"] + newCal["Rework"], newCal["Output"]),
    //   };

    //   return {
    //     ...a,
    //     ...newCal,
    //     ...newCal2,
    //   };
    // });

    // let goo = foo.map((a) => {
    //   // console.log(a);
    //   const s1 = {
    //     name: "Array Cause",
    //     type: "bar",
    //     stack: "stack1",
    //     data: foo2(a, "ArrayCausePercent", CW),
    //     color: "#bae8e8",
    //     yAxisIndex: 1,
    //     emphasis: {
    //       focus: "series",
    //     },
    //   };
    //   // console.log(s1);
    //   const s2 = {
    //     name: "Process Cause",
    //     type: "bar",
    //     stack: "stack1",
    //     data: foo2(a, "ProcessCausePercent", CW),
    //     color: "#f8aa4b",
    //     yAxisIndex: 1,

    //     emphasis: {
    //       focus: "series",
    //     },
    //   };
    //   const s3 = {
    //     name: "Pola FM",
    //     type: "bar",
    //     stack: "stack1",
    //     data: foo2(a, "PolaFMPercent", CW),
    //     yAxisIndex: 1,

    //     color: "#58b368",

    //     emphasis: {
    //       focus: "series",
    //     },
    //   };
    //   const s4 = {
    //     name: "ST Yield",
    //     type: "line",
    //     data: foo2(a, "ST Yield", CW),
    //     yAxisIndex: 0,

    //     color: "#f55951",

    //     emphasis: {
    //       focus: "series",
    //     },
    //   };
    //   const s5 = {
    //     name: "Plan Yield",
    //     type: "line",
    //     data: foo2(a, "planYield", CW),
    //     yAxisIndex: 0,

    //     color: "#bb99ff",

    //     emphasis: {
    //       focus: "series",
    //     },
    //   };
    //   const s6 = {
    //     name: "Target Pola FM",
    //     type: "line",
    //     data: foo2(a, "targetPolaFM", CW),
    //     yAxisIndex: 0,

    //     color: "#f9c46b",

    //     emphasis: {
    //       focus: "series",
    //     },
    //   };
    //   const s7 = {
    //     name: "Mat Cause",
    //     type: "bar",
    //     stack: "stack1",
    //     data: foo2(a, "targetPolaFM", CW),
    //     yAxisIndex: 1,

    //     color: "#3783ae",

    //     emphasis: {
    //       focus: "series",
    //     },
    //   };

    //   let data = [s1, s2, s3, s4, s5, s7, s6];

    //   return {
    //     title: {
    //       show: true,
    //       text: a ? `${a._id} ${a.data[0].type} Yield ` : "",
    //     },
    //     legend: {
    //       data: ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield", "Target Pola FM"],
    //       orient: "horizontal",
    //       top: 10,
    //       padding: 20,
    //       itemWidth: 10,
    //     },
    //     series: data,
    //     xAxis: [
    //       {
    //         type: "category",
    //         name: "CW",
    //         data: CW,
    //         axisPointer: {
    //           type: "shadow",
    //         },
    //         axisLabel: {
    //           formatter: "{value}",
    //         },
    //       },
    //       {
    //         type: "category",
    //         data: W_CW,
    //         axisPointer: {
    //           type: "shadow",
    //         },
    //         position: "bottom",
    //         offset: 20,
    //         axisTick: {
    //           show: false, // Hide axis ticks
    //         },
    //         axisLine: {
    //           show: false, // Hide axis line
    //         },
    //         axisLabel: {
    //           show: true, // Show axis labels
    //         },
    //       },
    //     ],
    //     yAxis: [
    //       {
    //         type: "value",
    //         axisLabel: {
    //           formatter: "{value} %",
    //         },
    //         max: 120,
    //       },
    //       {
    //         type: "value",
    //         axisLabel: {
    //           formatter: "{value} %",
    //         },
    //         max: 50,
    //       },
    //     ],
    //     tooltip: {
    //       trigger: "axis",
    //       axisPointer: {
    //         type: "cross",
    //         crossStyle: {
    //           color: "#999",
    //         },
    //       },
    //     },
    //     toolbox: {
    //       feature: {
    //         dataView: { show: true, readOnly: false },
    //         magicType: { show: true, type: ["line", "bar"] },
    //         restore: { show: true },
    //         saveAsImage: { show: true },
    //         dataZoom: {
    //           show: true,
    //         },
    //       },
    //       top: 20,
    //       orient: "vertical",
    //     },
    //   };
    // });

    // res.json(goo);
  } catch (error) {
    console.log("🚀 ~ error:", error);
  }
});

router.get("/2", async (req, res, next) => {
  try {
    req.apicacheGroup = cacheStr;
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
        name: "Array Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "ArrayCausePercent"),
        color: "#bae8e8",
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
        color: "#f8aa4b",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      const s3 = {
        name: "Pola FM",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "PolaFMPercent"),
        color: "#58b368",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      const s4 = {
        name: "ST Yield",
        type: "line",
        data: summarizeNormalCause(model, calData, CW, "ST Yield"),
        color: "#f55951",
        yAxisIndex: 0,
        emphasis: {
          focus: "series",
        },
      };
      const s5 = {
        name: "Plan Yield",
        type: "line",
        data: summarizeNormalCause(model, calData, CW, "planYield"),
        color: "#bb99ff",
        yAxisIndex: 0,

        emphasis: {
          focus: "series",
        },
      };
      const s6 = {
        name: "Target Pola FM",
        type: "line",
        data: summarizeNormalCause(model, calData, CW, "targetPolaFM"),
        color: "#f9c46b",
        yAxisIndex: 0,

        emphasis: {
          focus: "series",
        },
      };
      const s7 = {
        name: "Mat Cause",
        type: "bar",
        stack: "stack1",
        data: summarizeNormalCause(model, calData, CW, "targetPolaFM"),
        color: "#3783ae",
        yAxisIndex: 1,

        emphasis: {
          focus: "series",
        },
      };
      return {
        title: {
          show: true,
          text: item ? `${item.projectName} ${item.type} Yield ( ${item.model} )` : "",
        },
        legend: {
          data: ["Mat Cause", "Array Cause", "Process Cause", "Pola FM", "ST Yield", "Plan Yield", "Target Pola FM"],
          orient: "horizontal",
          top: 10,
          padding: 20,
          itemWidth: 10,
        },
        series: [s1, s2, s3, s4, s5, s7, s6],
        xAxis: [
          {
            type: "category",
            name: "CW",
            data: CW,
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
            max: 120,
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
  }
});

function summarizeNormalCause(model, calData, CW, key) {
  return CW.map((w) => {
    const dataOnCW = calData.find((cal) => cal.model == model && cal.CW == w);
    const temp = dataOnCW ? dataOnCW[key] : null;
    return temp ? Number(temp * 100).toFixed(2) : null;
  });
}
function foo2(group, key, CW) {
  return CW.map((w) => {
    if (key == "planYield" || key == "ST Yield") {
      const dataOnCW = group.data.find((cal) => cal.CW == w);
      const sum = dataOnCW ? dataOnCW[key] : null;
      return sum ? Number(sum * 100).toFixed(2) : 0;
    } else {
      const dataOnCW = group.data.filter((cal) => cal.CW == w);
      const sum = dataOnCW.reduce((p, n) => {
        return (p += n[key]);
      }, 0);
      return sum ? Number(sum * 100).toFixed(2) : 0;
    }
  });
}
function summarizeGroupCause(cal, CW, key) {
  return CW.map((w) => {
    if (key == "planYield") {
      const dataOnCW = cal.data.find((d) => d.CW == w);
      const sum = dataOnCW ? dataOnCW[key] : null;
      return sum ? Number(sum * 100).toFixed(2) : null;
    } else if (key == "ST Yield") {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const sum = dataOnCW.reduce((p, n) => {
        p += n[key];
        return p;
      }, 0);
      const sum2 = sum / dataOnCW.length;
      return sum2 ? Number(sum2 * 100).toFixed(2) : null;
    } else {
      const dataOnCW = cal.data.filter((cal) => cal.CW == w);
      const sum = dataOnCW.reduce((p, n) => {
        return (p += n[key]);
      }, 0);
      return sum ? Number(sum * 100).toFixed(2) : null;
    }
  });
}

module.exports = router;
