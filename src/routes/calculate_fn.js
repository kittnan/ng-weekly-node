let XLSX = require("xlsx");
const axios = require("axios");
const CALCULATE = require("../models/calculate");
const GROUP_TARGET = require("../models/group-target");
const NG_REF = require("../models/ngRef");
const moment = require("moment/moment");

module.exports = {
  async calculate() {
    const groupTarget = await GROUP_TARGET.aggregate([{ $match: {} }]);
    const models = groupTarget.map((a) => a.model);
    const modelsStr = JSON.stringify(models);
    const nextFriday = moment().day("Friday");
    const lastSaturday = moment(nextFriday).subtract(6, "day");
    let sd = moment(lastSaturday).startOf("day").format("YYYY-MM-DD");
    console.log("🚀 ~ sd:", sd);
    let ed = moment(nextFriday).endOf("day").format("YYYY-MM-DD");
    console.log("🚀 ~ ed:", ed);
    const resGet = await axios.get("http://10.200.90.152:4042/dataDaily", {
      params: {
        start: sd,
        end: ed,
        model: modelsStr,
      },
    });
    const mergeData = models.map((a) => {
        return {
          model: a,
          yieldData: resGet.data.filter((b) => b.modelNo == a),
          groupData: groupTarget.find((b) => b.model == a),
        };
      });
      const uniqueName = [...new Set(mergeData.map((item) => item.groupData.groupName))];
      const group = uniqueName.map((name) => {
        return {
          groupName: name,
          data: mergeData.filter((d) => d.groupData.groupName == name),
        };
      });
  
      const ngRef = await NG_REF.aggregate([{ $match: {} }]);
  
      const haveGroup = group.filter((g) => g.groupName);
      const notHaveGroup = group.filter((g) => !g.groupName);
      return {
        ngRef:ngRef,
        haveGroup:haveGroup,
        notHaveGroup:notHaveGroup
      }
  },

};
