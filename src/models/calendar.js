const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const model = new Schema(
  {
    date:Date
  },
  { timestamps: true, versionKey: false, strict: false }
);

const UserModule = mongoose.model("calendar", model);

module.exports = UserModule;
