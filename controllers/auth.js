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
  sendBadRequestError
} = require('../utils/responseHandler');

require('dotenv').config();

// =============================
// Constants
// =============================
const { GMAIL_USER, GMAIL_PASS, EMAIL_USER, JWT_SECRET, RESET_PASSWORD_SECRET } = process.env;
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
  return transporter.sendMail({ from: EMAIL_USER, ...options });
};

// =============================
// Controllers
// =============================

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, userType, ownerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendBadRequestError(res, "Un utilisateur avec cet email existe déjà.");
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Hera App : Mot de passe temporaire",
      text,
      html,
    };

    await transporter.sendMail(mailOptions);

    return sendSuccess(res, {
      message: "Utilisateur créé avec succès.",
      userId: savedUser._id,
    });
  } catch (error) {
    console.error("Erreur lors de l’inscription :", error);
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

    return sendSuccess(res,{
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
    console.error(error);
    sendInternalError(res, error);
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendNotFoundError(res, 'Utilisateur non trouvé');

    const token = generateToken(user._id, RESET_PASSWORD_SECRET, RESET_EXPIRY);
    const resetLink = `https://hera-backend-kes8.onrender.com/deeplink?to=update-password`;

    // 👇 Use renderTemplate for both HTML + text
    const context = { name: user.name || "Utilisateur", email, resetLink };
    const html = renderTemplate("resetPasswordEmail", context, "html");
    const text = renderTemplate("resetPasswordEmail", context, "txt");

    await sendMail({
      to: email,
      subject: 'Réinitialisation du mot de passe',
      text,
      html,
    });

    return sendSuccess(res, { message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    sendInternalError(res, error);
  }
};
