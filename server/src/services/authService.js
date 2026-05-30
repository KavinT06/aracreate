const bcrypt = require('bcrypt');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = async ({ username, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const existingUsername = await User.findOne({ username: trimmedUsername });
  if (existingUsername) {
    const err = new Error('Username already in use');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: trimmedUsername,
    email: normalizedEmail,
    password: hashedPassword,
  });

  const safeUser = user.toObject();
  delete safeUser.password;

  return { user: safeUser, token: generateToken(user._id) };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const safeUser = user.toObject();
  delete safeUser.password;

  return { user: safeUser, token: generateToken(user._id) };
};

module.exports = { registerUser, loginUser };