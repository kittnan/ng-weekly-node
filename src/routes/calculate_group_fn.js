let XLSX = require("xlsx");
const axios = require("axios");
const CALCULATE = require("../models/calculate");
const GROUP_TARGET = require("../models/group-target");
const NG_REF = require("../models/ngRef");
const moment = require("moment/moment");
const cacheStr = "calculate";

const $cal_general = require('./calculate_general_fn')

module.exports = {
  async calculate(ngRef, haveGroup) {
    const haveGroupCalNG = haveGroup.map((d1) => {
      d1.data.map((d2) => {
        d2.yieldData.map((d3) => {
          d3.defects = d3.defects.map((d4) => {
            const item = ngRef.find((ng) => ng.Code == d4.code);
            return {
              ...d4,
              ...item,
            };
          });
          return d3;
        });
        return d2;
      });
      return d1;
    });

    let calResultGroup = haveGroupCalNG.map((d1) => {
      const obj = d1.data.reduce(
        (p, n) => {
          const result = n.yieldData.reduce(
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
          p["Input"] += result["Input"];
          p["Output"] += result["Output"];
          p["Rework"] += result["Rework"];
          p["planYield"] = result["planYield"];
          p["targetPolaFM"] = result["targetPolaFM"];
          return p;
        },
        {
          Input: 0,
          Output: 0,
          Rework: 0,
          planYield: 0,
          targetPolaFM: 0,
        }
      );
      return {
        ...d1,
        ...obj,
      };
    });

    calResultGroup = calResultGroup.map((d1) => {
      const obj = d1.data.reduce(
        (p, n) => {
          const result = n.yieldData.reduce(
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
          p["P"] += result["P"];
          p["A"] += result["A"];
          p["M"] += result["M"];
          p["X"] += result["X"];
          p["Pola"] += result["Pola"];
          return p;
        },
        {
          P: 0,
          A: 0,
          M: 0,
          X: 0,
        }
      );
      return {
        ...d1,
        ...obj,
      };
    });
    return calResultGroup
  },

};
