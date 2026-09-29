const { Schema, model } = require("mongoose");

const RuleSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 250
  },
  category: {
    type: String,
    enum: ["PLANNING", "RISK", "ENTRY", "EXIT", "JOURNAL"],
    default: "PLANNING"
  },
  required: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
});

const PlaybookSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  strategy: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rules: [RuleSchema]
}, { timestamps: true });

// User can't have exactly duplicate playbook names easily, but mostly we just enforce rule limits in service.
// Indexing user for fast lookups
PlaybookSchema.index({ user: 1 });

const PlaybookModel = model("Playbook", PlaybookSchema);
module.exports = { PlaybookModel };
