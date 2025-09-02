const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { renderTemplate } = require("../utils/emailTemplate");

const {
  sendInternalError,
  sendUnauthorizedError,
  sendSuccess,
  sendBadRequestError,
  sendNotFoundError
} = require('../utils/responseHandler');

const { ERRORS, SUCCESS } = require('../utils/messages');

require('dotenv').config();

// =============================
// Constants
// =============================
const {
  GMAIL_USER,
  GMAIL_PASS,
  EMAIL_USER,
  JWT_SECRET,
  RESET_PASSWORD_SECRET,
  REFRESH_SECRET
} = process.env;

const TOKEN_EXPIRY = "15m";  // access token court
const REFRESH_EXPIRY = "7d"; // refresh token long
const RESET_EXPIRY = "1h";

// =============================
// Mailer Setup
// =============================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

// =============================
// Helpers
// =============================
const generateToken = (userId, secret = JWT_SECRET, expiresIn = TOKEN_EXPIRY) =>
  jwt.sign({ userId }, secret, { expiresIn });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

const generateTempPassword = (length = 12) =>
  crypto.randomBytes(length).toString('base64').slice(0, length);

const sendMail = async (options) => {
  return transporter.sendMail({ from: EMAIL_USER, ...options });
};

// =============================
// Controllers
// =============================

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, userType, ownerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendBadRequestError(res, ERRORS.USER_EXISTS);
    }

    const tempPassword = password || generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      userType,
      ownerId,
    });

    const savedUser = await newUser.save();

    const html = renderTemplate("welcomeEmail", { name, email, tempPassword }, "html");
    const text = renderTemplate("welcomeEmail", { name, email, tempPassword }, "txt");

    await sendMail({
      to: email,
      subject: SUCCESS.WELCOME_EMAIL_SUBJECT,
      text,
      html,
    });

    return sendSuccess(res, {
      message: SUCCESS.USER_CREATED,
      userId: savedUser._id,
    });
  } catch (error) {
    console.error("Erreur signup:", error);
    sendInternalError(res, error.message);
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendUnauthorizedError(res, ERRORS.INVALID_CREDENTIALS);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return sendUnauthorizedError(res, ERRORS.INVALID_CREDENTIALS);

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Sauvegarde du refresh token dans l'utilisateur
    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(res, {
      message: SUCCESS.LOGIN_SUCCESS,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        ownerId: user.ownerId,
        firstLogin: user.firstLogin,
        imageUrl: user.imageUrl
      }
    });
  } catch (error) {
    console.error("Erreur login:", error);
    sendInternalError(res, error.message);
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendBadRequestError(res, ERRORS.REFRESH_TOKEN_REQUIRED);

    const user = await User.findOne({ refreshToken });
    if (!user) return sendUnauthorizedError(res, ERRORS.INVALID_REFRESH_TOKEN);

    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
      if (err) return sendUnauthorizedError(res, ERRORS.INVALID_REFRESH_TOKEN);

      const newAccessToken = generateToken(decoded.userId);
      return sendSuccess(res, {
        message: SUCCESS.TOKEN_REFRESHED,
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error("Erreur refreshToken:", error);
    sendInternalError(res, error.message);
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return sendBadRequestError(res, ERRORS.USER_ID_REQUIRED);

    const user = await User.findById(userId);
    if (!user) return sendNotFoundError(res, ERRORS.USER_NOT_FOUND);

    user.refreshToken = null;
    await user.save();

    return sendSuccess(res, { message: SUCCESS.LOGOUT_SUCCESS });
  } catch (error) {
    console.error("Erreur logout:", error);
    sendInternalError(res, error.message);
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendNotFoundError(res, ERRORS.USER_NOT_FOUND);

    const token = generateToken(user._id, RESET_PASSWORD_SECRET, RESET_EXPIRY);
    const resetLink = `https://hera-backend-kes8.onrender.com/deeplink?to=update-password&token=${token}`;

    const context = { name: user.name || "Utilisateur", email, resetLink };
    const html = renderTemplate("resetPasswordEmail", context, "html");
    const text = renderTemplate("resetPasswordEmail", context, "txt");

    await sendMail({
      to: email,
      subject: SUCCESS.RESET_EMAIL_SUBJECT,
      text,
      html,
    });

    return sendSuccess(res, { message: SUCCESS.RESET_EMAIL_SENT });
  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    sendInternalError(res, error.message);
  }
};
