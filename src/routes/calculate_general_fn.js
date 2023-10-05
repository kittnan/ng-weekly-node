module.exports = {
  calTotal(arr) {
    return arr.reduce((p, n) => {
      return (p += n.value);
    }, 0);
  },
  calProcessCause(data) {
    return data["X"] / 2 + data["P"];
  },
  calArrayCause(data) {
    return data["X"] / 2 + data["A"];
  },

  calPercentInput(input, value) {
    return value / input;
  },
};
