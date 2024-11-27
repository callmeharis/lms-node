const { createTokenUser, attachCookiesToResponse } = require("../utils");
const User = require("../models/User");

const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const register = async (req, res) => {
  const { name, email, password, role: requestedRole } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exist");
  }

  const isFirstAccount = (await User.countDocuments({})) === 0;
  let role = isFirstAccount ? "admin" : "student";
  if (requestedRole && ["student", "instructor"].includes(requestedRole)) {
    role = requestedRole;
  }

  const user = await User.create({ name, email, password, role });
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now() + 1000),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out" });
};

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate role
  if (!["instructor", "student"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role. Only 'instructor' or 'student' allowed.",
    });
  }

  // Check if email already exists
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // Create user
  const newUser = await User.create({ name, email, password, role });

  res.status(201).json({ user: newUser });
};

module.exports = { register, login, logout, createUser };
