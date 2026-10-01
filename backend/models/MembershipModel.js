const { Schema, model } = require("mongoose");

const MembershipSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "RESEARCHER", "VIEWER"],
      default: "RESEARCHER",
      required: true
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "DECLINED"],
      default: "ACTIVE"
    }
  },
  { timestamps: true }
);

MembershipSchema.index({ organization: 1, user: 1 }, { unique: true });

const MembershipModel = model("Membership", MembershipSchema);

module.exports = {
  MembershipModel
};
