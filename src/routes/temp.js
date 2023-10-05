// const groupTarget = await GROUP_TARGET.aggregate([{ $match: {} }]);
    // const models = groupTarget.map((a) => a.model);
    // const modelsStr = JSON.stringify(models);
    // const nextFriday = moment().day("Friday");
    // const lastSaturday = moment(nextFriday).subtract(6, "day");
    // let sd = moment(lastSaturday).startOf("day").format("YYYY-MM-DD");
    // console.log("🚀 ~ sd:", sd);
    // let ed = moment(nextFriday).endOf("day").format("YYYY-MM-DD");
    // console.log("🚀 ~ ed:", ed);
    // const resGet = await axios.get("http://10.200.90.152:4042/dataDaily", {
    //   params: {
    //     start: sd,
    //     end: ed,
    //     model: modelsStr,
    //   },
    // });

    // const mergeData = models.map((a) => {
    //   return {
    //     model: a,
    //     yieldData: resGet.data.filter((b) => b.modelNo == a),
    //     groupData: groupTarget.find((b) => b.model == a),
    //   };
    // });
    // const uniqueName = [...new Set(mergeData.map((item) => item.groupData.groupName))];
    // const group = uniqueName.map((name) => {
    //   return {
    //     groupName: name,
    //     data: mergeData.filter((d) => d.groupData.groupName == name),
    //   };
    // });

    // const ngRef = await NG_REF.aggregate([{ $match: {} }]);

    // const haveGroup = group.filter((g) => g.groupName);
    // const notHaveGroup = group.filter((g) => !g.groupName);

    // const haveGroupCalNG = haveGroup.map((d1) => {
    //   d1.data.map((d2) => {
    //     d2.yieldData.map((d3) => {
    //       d3.defects = d3.defects.map((d4) => {
    //         const item = ngRef.find((ng) => ng.Code == d4.code);
    //         return {
    //           ...d4,
    //           ...item,
    //         };
    //       });
    //       return d3;
    //     });
    //     return d2;
    //   });
    //   return d1;
    // });

    // let notHaveGroupCalNG = notHaveGroup.map((d1) => {
    //     d1.data.map((d2) => {
    //       d2.yieldData.map((d3) => {
    //         d3.defects = d3.defects.map((d4) => {
    //           const item = ngRef.find((ng) => ng.Code == d4.code);
    //           return {
    //             ...d4,
    //             ...item,
    //           };
    //         });
    //         return d3;
    //       });
    //       return d2;
    //     });
    //     return d1;
    //   });
    //   notHaveGroupCalNG = notHaveGroupCalNG[0];
  
      // let calResultGroup = haveGroupCalNG.map((d1) => {
      //   const obj = d1.data.reduce(
      //     (p, n) => {
      //       const result = n.yieldData.reduce(
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
      //       p["Input"] += result["Input"];
      //       p["Output"] += result["Output"];
      //       p["Rework"] += result["Rework"];
      //       p["planYield"] = result["planYield"];
      //       p["targetPolaFM"] = result["targetPolaFM"];
      //       return p;
      //     },
      //     {
      //       Input: 0,
      //       Output: 0,
      //       Rework: 0,
      //       planYield: 0,
      //       targetPolaFM: 0,
      //     }
      //   );
      //   return {
      //     ...d1,
      //     ...obj,
      //   };
      // });
  
      // calResultGroup = calResultGroup.map((d1) => {
      //   const obj = d1.data.reduce(
      //     (p, n) => {
      //       const result = n.yieldData.reduce(
      //         (p2, n2) => {
      //           p2["P"] += calTotal(n2.defects.filter((nd) => nd.Source == "P"));
      //           p2["A"] += calTotal(n2.defects.filter((nd) => nd.Source == "A"));
      //           p2["M"] += calTotal(n2.defects.filter((nd) => nd.Source == "M"));
      //           p2["X"] += calTotal(n2.defects.filter((nd) => nd.Source == "X"));
      //           p2["Pola"] += calTotal(n2.defects.filter((nd) => nd.Source == "Pola"));
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
      //       p["P"] += result["P"];
      //       p["A"] += result["A"];
      //       p["M"] += result["M"];
      //       p["X"] += result["X"];
      //       p["Pola"] += result["Pola"];
      //       return p;
      //     },
      //     {
      //       P: 0,
      //       A: 0,
      //       M: 0,
      //       X: 0,
      //     }
      //   );
      //   return {
      //     ...d1,
      //     ...obj,
      //   };
      // });
  
      // let calResultNoGroup = notHaveGroupCalNG.data;
      // calResultNoGroup = calResultNoGroup.map((d1) => {
      //   const result = d1.yieldData.reduce(
      //     (p2, n2) => {
      //       p2["Input"] += n2["Input"];
      //       p2["Output"] += n2["Output"];
      //       p2["Rework"] += n2["Rework"];
      //       return p2;
      //     },
      //     {
      //       Input: 0,
      //       Output: 0,
      //       Rework: 0,
      //     }
      //   );
  
      //   const result2 = d1.yieldData.reduce(
      //     (p2, n2) => {
      //       p2["P"] += calTotal(n2.defects.filter((nd) => nd.Source == "P"));
      //       p2["A"] += calTotal(n2.defects.filter((nd) => nd.Source == "A"));
      //       p2["M"] += calTotal(n2.defects.filter((nd) => nd.Source == "M"));
      //       p2["X"] += calTotal(n2.defects.filter((nd) => nd.Source == "X"));
      //       p2["Pola"] += calTotal(n2.defects.filter((nd) => nd.Source == "Pola"));
      //       return p2;
      //     },
      //     {
      //       P: 0,
      //       A: 0,
      //       M: 0,
      //       X: 0,
      //       Pola: 0,
      //     }
      //   );
  
      //   return {
      //     ...result,
      //     ...result2,
      //     planYield: d1.groupData.planYield,
      //     targetPolaFM: d1.groupData.targetPolaFM,
      //     model: d1.model,
      //     type: d1.groupData.type,
      //     ProcessCause: calProcessCause(result2),
      //     ProcessCausePercent: calPercentInput(result.Input, calProcessCause(result2)),
      //     ArrayCause: calArrayCause(result2),
      //     ArrayCausePercent: calPercentInput(result.Input, calArrayCause(result2)),
      //     MaterialCause: result2["M"],
      //     MaterialCausePercent: calPercentInput(result.Input, result2["M"]),
      //   };
      // });
  
      res.json({
        // calResultNoGroup: calResultNoGroup,
        calResultGroup: calResultGroup,
      });
      // res.json({
      //   haveGroup: haveGroup,
      //   notHaveGroup: notHaveGroup,
      //   haveGroupCalNG: haveGroupCalNG,
      //   notHaveGroupCalNG: notHaveGroupCalNG,
      //   fooData: fooData,
      // });
      // res.json(ngRef)