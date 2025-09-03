const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");

const User = require("../models/User");
const UserType = require("../models/UserType");
const PackAccess = require("../models/PackAccess");
const cloudinary = require("../config/cloudinary");

const {
  sendInternalError,
  sendSuccess,
  sendBadRequestError,
} = require("../utils/responseHandler");

const { ERRORS, SUCCESS } = require("../utils/messages");

// ==================================================
// Helpers
// ==================================================
const getTokenFromHeader = (req) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

const findUserOrFail = async (id, res) => {
  const user = await User.findById(id);
  if (!user) {
    sendBadRequestError(res, ERRORS.USER_NOT_FOUND);
    return null;
  }
  return user;
};

const uploadFromBuffer = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "user_images" },
      (error, result) => (result ? resolve(result) : reject(error))
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

// ==================================================
// Upload user profile image
// ==================================================
exports.uploadImageFile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserOrFail(id, res);
    if (!user) return;

    if (user.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.imagePublicId);
      } catch (err) {
        console.warn("Impossible de supprimer l'ancienne image :", err.message);
      }
    }

    const result = await uploadFromBuffer(req.file.buffer);

    Object.assign(user, {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });

    await user.save();

    return sendSuccess(res, {
      message: SUCCESS.IMAGE_UPDATED,
      imageUrl: result.secure_url,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Add UserType
// ==================================================
exports.addUserType = async (req, res) => {
  try {
    const { type_id, name } = req.body;
    if (!type_id || !name) {
      return sendBadRequestError(res, ERRORS.USER_TYPE_REQUIRED);
    }

    const userType = await UserType.create({ type_id, name });

    return sendSuccess(res, {
      message: SUCCESS.USER_TYPE_CREATED,
      userType,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Add device token
// ==================================================
exports.addDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;
    if (!userId || !deviceToken) {
      return sendBadRequestError(res, ERRORS.DEVICE_TOKEN_REQUIRED);
    }

    const user = await findUserOrFail(userId, res);
    if (!user) return;

    if (!user.devicesToken.includes(deviceToken)) {
      user.devicesToken.push(deviceToken);
      await user.save();
    }

    return sendSuccess(res, {
      message: SUCCESS.TOKEN_ADDED,
      devicesToken: user.devicesToken,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Find all users
// ==================================================
exports.findAll = async (_, res) => {
  try {
    const users = await User.find();
    return sendSuccess(res, {
      message: SUCCESS.USERS_FETCHED,
      users,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Find all users by owner with packs
// ==================================================
exports.findAllByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const users = await User.find({ ownerId }).lean();
    const userIds = users.map((u) => u._id);

    const allPackAccess = await PackAccess.find({ userId: { $in: userIds } })
      .populate("packId")
      .lean();

    const accessByUserId = allPackAccess.reduce((acc, pa) => {
      const uid = pa.userId.toString();
      if (!acc[uid]) acc[uid] = [];
      const { packId, ...rest } = pa;
      acc[uid].push({ ...rest, pack: packId });
      return acc;
    }, {});

    const enrichedUsers = users.map((u) => ({
      ...u,
      packAccessList: accessByUserId[u._id.toString()] || [],
    }));

    return sendSuccess(res, {
      message: SUCCESS.USERS_BY_OWNER_FETCHED,
      users: enrichedUsers,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Update user by ID
// ==================================================
exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, userType } = req.body;

    const user = await findUserOrFail(id, res);
    if (!user) return;

    Object.assign(user, { name, phoneNumber, userType });
    await user.save();

    return sendSuccess(res, {
      message: SUCCESS.USER_UPDATED,
      userId: user._id,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Reset password (via token)
// ==================================================
exports.resetPassword = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return sendBadRequestError(res, ERRORS.TOKEN_MISSING);

    jwt.verify(
      token,
      process.env.JWT_SECRET || "RANDOM_TOKEN_SECRET",
      async (err, decoded) => {
        if (err) return sendBadRequestError(res, ERRORS.TOKEN_INVALID);

        const { newPassword } = req.body;
        if (!newPassword)
          return sendBadRequestError(res, ERRORS.PASSWORD_REQUIRED);

        const hash = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(decoded.userId, {
          password: hash
        });

        return sendSuccess(res, { message: SUCCESS.PASSWORD_UPDATED });
      }
    );
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Update password by email
// ==================================================
exports.updatePassword = async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return sendBadRequestError(res, ERRORS.TOKEN_MISSING);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendBadRequestError(res, ERRORS.OLD_NEW_PASSWORD_REQUIRED);
    }

    const user = await User.findById(decoded.userId);
    if (!user) return sendBadRequestError(res, ERRORS.USER_NOT_FOUND_BY_EMAIL);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return sendUnauthorizedError(res, ERRORS.OLD_PASSWORD_INCORRECT);

    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLogin = false;
    await user.save();

    return sendSuccess(res, { message: SUCCESS.PASSWORD_UPDATED });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Delete device token
// ==================================================
exports.deleteDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;
    if (!userId || !deviceToken) {
      return sendBadRequestError(res, ERRORS.DEVICE_TOKEN_REQUIRED);
    }

    const user = await findUserOrFail(userId, res);
    if (!user) return;

    const initialLength = user.devicesToken.length;
    user.devicesToken = user.devicesToken.filter((t) => t !== deviceToken);

    if (user.devicesToken.length === initialLength) {
      return sendBadRequestError(res, ERRORS.DEVICE_TOKEN_NOT_FOUND);
    }

    await user.save();
    return sendSuccess(res, {
      message: SUCCESS.TOKEN_DELETED,
      devicesToken: user.devicesToken,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Delete user by ID
// ==================================================
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserOrFail(id, res);
    if (!user) return;

    await PackAccess.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return sendSuccess(res, { message: SUCCESS.USER_DELETED });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};
