module.exports = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.MASTER_ADMIN_KEY) {
    return res.status(403).json({
      status: "error",
      message: "Clé administrateur invalide"
    });
  }

  next();
};
