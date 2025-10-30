const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { renderTemplate } = require("../utils/emailTemplate");
const { validateSignupInput } = require("../utils/validators");
const {
  sendInternalError,
  sendUnauthorizedError,
  sendSuccess,
  sendBadRequestError,
  sendConflictError,
  sendNotFoundError
} = require('../utils/responseHandler');

const { ERRORS, SUCCESS } = require("../utils/messages");

require('dotenv').config();

// =============================
// Constants
// =============================
const { GMAIL_USER, GMAIL_PASS,JWT_SECRET, RESET_PASSWORD_SECRET, APP_DOMAIN } = process.env;
const TOKEN_EXPIRY = "24h";
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

const generateTempPassword = (length = 12) =>
  crypto.randomBytes(length).toString('base64').slice(0, length);

const sendMail = async (options) => {
  return transporter.sendMail({ from: GMAIL_USER, ...options });
};

// =============================
// Controllers
// =============================

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, userType, ownerId } = req.body;

    // ---- 1️⃣ Validation d’entrée ----
    const validationError = await validateSignupInput(req.body, User);
    if (validationError) {
      return sendBadRequestError(res, validationError);
    }

    // ---- 2️⃣ Vérification de l’existence de l’utilisateur ----
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendConflictError(res, ERRORS.USER_EXISTS);
    }

    // ---- 3️⃣ Préparation du mot de passe ----
    const tempPassword = password || generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // ---- 5️⃣ Création de l’utilisateur ----
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      userType,
      ownerId: ownerId,
    });

    const savedUser = await newUser.save();

    // ---- 6️⃣ Envoi du mail de bienvenue ----
    const html = renderTemplate("welcomeEmail", { name, email, tempPassword }, "html");
    const text = renderTemplate("welcomeEmail", { name, email, tempPassword }, "txt");

    const mailOptions = {
      from: GMAIL_USER,
      to: email,
      subject: SUCCESS.WELCOME_EMAIL_SUBJECT,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);

    // ---- ✅ Succès ----
    return sendSuccess(res, {
      message: SUCCESS.USER_CREATED,
      userId: savedUser._id,
    });

  } catch (error) {
    sendInternalError(res, error.message);
  }
};


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendUnauthorizedError(res);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return sendUnauthorizedError(res);
    }

    const token = generateToken(user._id);
    return sendSuccess(res, {
      token,
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
    sendInternalError(res, error);
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendNotFoundError(res, ERRORS.USER_NOT_FOUND);

    const token = generateToken(user._id, RESET_PASSWORD_SECRET, RESET_EXPIRY);
    const resetLink = `${APP_DOMAIN}/deeplink?to=update-password&token=${token}`;

    // 👇 Use renderTemplate for both HTML + text
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
    sendInternalError(res, error);
  }
};
