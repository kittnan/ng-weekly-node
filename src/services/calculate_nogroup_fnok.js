// let XLSX = require("xlsx");
// const axios = require("axios");
// const CALCULATE = require("../models/calculate");
// const GROUP_TARGET = require("../models/group-target");
// const NG_REF = require("../models/ngRef");
// const moment = require("moment/moment");
// const cacheStr = "calculate";

// const $cal_general = require("./calculate_general_fn");

// module.exports = {
//   async calculate(ngRef, notHaveGroup) {
//     let notHaveGroupCalNG = notHaveGroup.map((d1) => {
//       d1.data.map((d2) => {
//         d2.yieldData.map((d3) => {
//           d3.defects = d3.defects.map((d4) => {
//             const item = ngRef.find((ng) => ng.Code == d4.code);
//             return {
//               ...d4,
//               ...item,
//             };
//           });
//           return d3;
//         });
//         return d2;
//       });
//       return d1;
//     });
//     notHaveGroupCalNG = notHaveGroupCalNG[0];

//     let calResultNoGroup = notHaveGroupCalNG.data;
//     calResultNoGroup = calResultNoGroup.map((d1) => {
//       const result = d1.yieldData.reduce(
//         (p2, n2) => {
//           p2["Input"] += n2["Input"];
//           p2["Output"] += n2["Output"];
//           p2["Rework"] += n2["Rework"];
//           p2["planYield"] = n2["planYield"];
//           p2["targetPolaFM"] = n2["targetPolaFM"];
//           return p2;
//         },
//         {
//           Input: 0,
//           Output: 0,
//           Rework: 0,
//           planYield: 0,
//           targetPolaFM: 0,
//         }
//       );

//       let result2 = d1.yieldData.reduce(
//         (p2, n2) => {
//           p2["P"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "P"));
//           p2["A"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "A"));
//           p2["M"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "M"));
//           p2["X"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "X"));
//           p2["Pola"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "Pola"));
//           return p2;
//         },
//         {
//           P: 0,
//           A: 0,
//           M: 0,
//           X: 0,
//           Pola: 0,
//         }
//       );

//       // result2 = result2.map((d1) => {
//       //   d1["ST Yield"] = d1["Output"] / d1["Input"];
//       //   d1["TTL Yield"] = (d1["Output"] + d1["Rework"]) / d1["Input"];
//       //   d1["Process Cause"] = (d1["P"] + d1["X"]) / 2 / d1["Input"];
//       //   d1["Array Cause"] = (d1["A"] + d1["X"]) / 2 / d1["Input"];
//       //   d1["Material Cause"] = d1["M"] / d1["Input"];
//       //   return d1;
//       // });

//       return {
//         ...result,
//         ...result2,
//         planYield: d1.groupData.planYield,
//         targetPolaFM: d1.groupData.targetPolaFM,
//         model: d1.model,
//         type: d1.groupData.type,
//         ProcessCause: $cal_general.calProcessCause(result2),
//         ProcessCausePercent: $cal_general.calPercentInput(result.Input, $cal_general.calProcessCause(result2)),
//         ArrayCause: $cal_general.calArrayCause(result2),
//         ArrayCausePercent: $cal_general.calPercentInput(result.Input, $cal_general.calArrayCause(result2)),
//         MaterialCause: result2["M"],
//         MaterialCausePercent: $cal_general.calPercentInput(result.Input, result2["M"]),
//         "ST Yield": $cal_general.calPercentInput(result["Input"], result["Output"]),
//         "TTL Yield": $cal_general.calPercentInput(result["Output"] + result["Rework"], result["Output"]),
//       };
//     });

//     return calResultNoGroup;
//   },
// };
