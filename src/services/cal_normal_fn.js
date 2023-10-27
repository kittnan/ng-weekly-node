let express = require("express");
let router = express.Router();
const $cal_general = require("./calculate_general_fn");
module.exports = {
  calculate(ngRef, dataModels, weekData) {
    let dataResult = dataModels.map((d1) => {
      d1.yield.map((d2) => {
        d2.defects = d2.defects.map((d3) => {
          const item = ngRef.find((ng) => ng.Code == d3.code);
          return {
            ...d3,
            ...item,
          };
        });
        return d2;
      });
      return d1;
    });

    dataResult = dataResult.map((d1) => {
      const result = d1.yield.reduce(
        (p2, n2) => {
          p2["Input"] += n2["Input"];
          p2["Output"] += n2["Output"];
          p2["Rework"] += n2["Rework"];
          p2["planYield"] = n2["planYield"];
          p2["targetPolaFM"] = n2["targetPolaFM"];
          return p2;
        },
        {
          Input: 0,
          Output: 0,
          Rework: 0,
          planYield: 0,
          targetPolaFM: 0,
        }
      );

      let result2 = d1.yield.reduce(
        (p2, n2) => {
          p2["P"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "P"));
          p2["A"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "A"));
          p2["M"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "M"));
          p2["X"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "X"));
          p2["Pola"] += $cal_general.calTotal(n2.defects.filter((nd) => nd.Source == "Pola"));
          return p2;
        },
        {
          P: 0,
          A: 0,
          M: 0,
          X: 0,
          Pola: 0,
        }
      );
      delete d1.yield;
      delete d1._id;
      delete d1.createdAt;
      delete d1.updatedAt;

      return {
        ...d1,
        ...result,
        ...result2,
        ...weekData,
        planYield: d1.planYield,
        targetPolaFM: d1.targetPolaFM,
        model: d1.model,
        type: d1.type,
        ProcessCause: $cal_general.calProcessCause(result2),
        ProcessCausePercent: $cal_general.calPercentInput(result.Input, $cal_general.calProcessCause(result2)),
        PolaFMPercent: $cal_general.calPercentInput(result.Input, result2["Pola"]),
        ArrayCause: $cal_general.calArrayCause(result2),
        ArrayCausePercent: $cal_general.calPercentInput(result.Input, $cal_general.calArrayCause(result2)),
        MaterialCause: result2["M"],
        MaterialCausePercent: $cal_general.calPercentInput(result.Input, result2["M"]),
        "ST Yield": $cal_general.calPercentInput(result["Input"], result["Output"]),
        "TTL Yield": $cal_general.calPercentInput(result["Output"] + result["Rework"], result["Output"]),
      };
    });
    return dataResult;
  },
};
