const ApiKey = require("../models/ApiKey");

const apiKeyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) 
      return res.status(401).json({ status: "error", message: "API Key manquante" });

    const key = authHeader.replace("Bearer ", "");

    const record = await ApiKey.findOne({ key });

    if (!record)
      return res.status(403).json({ status: "error", message: "API Key invalide" });

    if (record.expiresAt && record.expiresAt < new Date())
      return res.status(401).json({ status: "error", message: "API Key expirée" });

    next();
  } catch (e) {
    res.status(500).json({ status: "error", message: "Erreur API Key" });
  }
};

module.exports = apiKeyAuth;
