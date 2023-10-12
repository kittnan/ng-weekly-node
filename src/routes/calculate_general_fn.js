module.exports = {
  calTotal(arr) {
    return arr.reduce((p, n) => {
      return (p += n.value);
    }, 0);
  },
  calProcessCause(data) {
    let foo = data["X"] / 2 + data["P"];
    return foo ? foo : 0;
  },
  calArrayCause(data) {
    let foo = data["X"] / 2 + data["A"];
    return foo ? foo : 0;
  },

  calPercentInput(input, value) {
    let foo = value / input;
    return foo ? foo : 0;
  },
};
