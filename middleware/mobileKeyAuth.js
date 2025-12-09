// middleware/mobileKeyAuth.js
module.exports = (req, res, next) => {
  const key = req.headers['x-mobile-key'];
  if (!key || key !== process.env.MOBILE_API_KEY)
    return res.status(403).json({ status: "error", message: "You are not authorized to perform this action"});
  next();
};
