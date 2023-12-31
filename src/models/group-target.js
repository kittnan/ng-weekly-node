const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const model = new Schema(
  {
    model:String
  },
  { timestamps: true, versionKey: false, strict: false }
);

const UserModule = mongoose.model("groupTarget", model);

module.exports = UserModule;
