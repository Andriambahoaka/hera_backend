const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { renderTemplate } = require("../utils/emailTemplate");
const { validateSignupInput } = require("../utils/validators");
const {
  sendInternalError,
  sendUnauthorizedError,
  sendSuccess,
  sendBadRequestError,
  sendConflictError,
  sendNotFoundError,
} = require("../utils/responseHandler");

const { ERRORS, SUCCESS } = require("../utils/messages");

require("dotenv").config();
const ApiKey = require("../models/ApiKey");
const axios = require("axios");

// =============================
// Constants
// =============================
const {
  GMAIL_USER,
  GMAIL_PASS,
  BREVO_EMAIL_SENDER,
  BREVO_SMTP_USERNAME,
  BREVO_SMTP_PASSWORD,
  JWT_SECRET,
  RESET_PASSWORD_SECRET,
  APP_DOMAIN,
} = process.env;
const TOKEN_EXPIRY = "24h";
const RESET_EXPIRY = "1h";

// =============================
// Mailer Setup
// =============================
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", // ou smtp-relay.sendinblue.com
  port: 465,
  secure: true,
  auth: {
    user: BREVO_SMTP_USERNAME, // généralement ton e-mail Brevo
    pass: BREVO_SMTP_PASSWORD, // la SMTP key générée
  },
  connectionTimeout: 10000,
});

transporter.verify((err, success) => {
  console.log("Vérification SMTP...", BREVO_SMTP_USERNAME);
  console.log("Vérification SMTP...", BREVO_SMTP_PASSWORD);

  if (err) console.error("Erreur SMTP:", err);
  else console.log("SMTP prêt:", success);
});

async function sendWelcomeEmail(name, email, tempPassword) {
  try {
    // Génération du contenu HTML et texte avec ton renderTemplate
    const html = renderTemplate(
      "welcomeEmail",
      { name, email, tempPassword },
      "html"
    );
    const text = renderTemplate(
      "welcomeEmail",
      { name, email, tempPassword },
      "txt"
    );

    // Construction du payload API Brevo
    const data = {
      sender: { email: BREVO_EMAIL_SENDER }, // ex: 'hera.app31@gmail.com'
      to: [{ email, name }],
      subject: SUCCESS.WELCOME_EMAIL_SUBJECT,
      htmlContent: html,
      textContent: text,
    };

    // Envoi via l'API Brevo
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      data,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY, // clé API en variable d'environnement
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": process.env.BREVO_API_KEY
        },
      }
    );

    console.log("Email de bienvenue envoyé avec succès", response.data);
  } catch (error) {
    console.error(
      "Erreur envoi email de bienvenue",
      error.response?.data || error.message
    );
  }
}


// =============================
// Helpers
// =============================
const generateToken = (userId, secret = JWT_SECRET, expiresIn = TOKEN_EXPIRY) =>
  jwt.sign({ userId }, secret, { expiresIn });

const generateTempPassword = (length = 12) =>
  crypto.randomBytes(length).toString("base64").slice(0, length);

const sendMail = async (options) => {
  return transporter.sendMail({ from: BREVO_EMAIL_SENDER, ...options });
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
    sendWelcomeEmail(name, email, tempPassword);

    // ---- ✅ Succès ----
    return sendSuccess(res, {
      message: SUCCESS.USER_CREATED,
      userId: savedUser._id,
    });
  } catch (error) {
    console.log(error);
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
        imageUrl: user.imageUrl,
      },
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



exports.generateApiKey = async (req, res) => {
  try {
    const apiKey = crypto.randomBytes(64).toString("hex");     
    const refreshKey = crypto.randomBytes(64).toString("hex");  

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newKey = new ApiKey({
      key: apiKey,
      refreshKey,
      expiresAt,
    });

    await newKey.save();

    return res.json({
      status: "success",
      apiKey,
      refreshKey,
      expiresAt,
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ status: "error", message: "Erreur génération API Key" });
  }
};


exports.refreshApiKey = async (req, res) => {
  try {
    const { refreshKey } = req.body;

    if (!refreshKey) {
      return res.status(400).json({ status: "error", message: "refreshKey manquant" });
    }

    const record = await ApiKey.findOne({ refreshKey });

    if (!record) {
      return res.status(403).json({ status: "error", message: "refreshKey invalide" });
    }

    const newApiKey = crypto.randomBytes(64).toString("hex");
    const newRefreshKey = crypto.randomBytes(64).toString("hex");

    record.key = newApiKey;
    record.refreshKey = newRefreshKey; 
    record.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await record.save();

    return res.json({
      status: "success",
      apiKey: newApiKey,
      refreshKey: newRefreshKey,
      expiresAt: record.expiresAt,
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ status: "error", message: "Erreur refresh API Key" });
  }
};

