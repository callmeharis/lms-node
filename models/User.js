const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const AuthSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please provide name"],
      minLength: 3,
      maxLength: 20,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "please provide email"],
      validate: {
        validator: validator.isEmail,
        message: "Please provide valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minLength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "instructor", "student"],
      default: "student",
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // For instructors
    grades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Grade" }], // For students
  },
  { timestamps: true }
);

AuthSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

AuthSchema.methods.comparePassword = async function (userPassword) {
  const isMatch = await bcrypt.compare(userPassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", AuthSchema);
