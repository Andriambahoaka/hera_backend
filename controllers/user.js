const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const streamifier = require("streamifier");

const User = require('../models/User');
const UserType = require('../models/UserType');
const PackAccess = require('../models/PackAccess');
const cloudinary = require("../config/cloudinary");

const {
  sendInternalError,
  sendSuccess,
  sendBadRequestError
} = require('../utils/responseHandler');

// ==================================================
// Upload user profile image
// ==================================================
exports.uploadImageFile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return sendBadRequestError(res, "Utilisateur non trouvé.");

    // Supprimer l'ancienne image si elle existe
    if (user.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.imagePublicId);
      } catch (err) {
        console.warn("Impossible de supprimer l'ancienne image :", err.message);
      }
    }

    // Upload depuis buffer
    const uploadFromBuffer = (fileBuffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "user_images" },
          (error, result) => (result ? resolve(result) : reject(error))
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });

    const result = await uploadFromBuffer(req.file.buffer);

    user.imageUrl = result.secure_url;
    user.imagePublicId = result.public_id;
    await user.save();

    return sendSuccess({
      message: "Image utilisateur mise à jour avec succès",
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
      return sendBadRequestError(res, "type_id et name sont requis.");
    }

    const userType = new UserType({ type_id, name });
    await userType.save();

    return sendSuccess({
      message: 'UserType créé avec succès',
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
      return sendBadRequestError(res, 'userId et deviceToken sont requis.');
    }

    const user = await User.findById(userId);
    if (!user) return sendBadRequestError(res, 'Utilisateur non trouvé.');

    if (!user.devicesToken.includes(deviceToken)) {
      user.devicesToken.push(deviceToken);
      await user.save();
    }

    return sendSuccess({
      message: 'Token ajouté avec succès.',
      devicesToken: user.devicesToken,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Find all users
// ==================================================
exports.findAll = async (req, res) => {
  try {
    const users = await User.find();
    return sendSuccess({
      message: 'Users récupérés avec succès',
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
      .populate('packId')
      .lean();

    const accessByUserId = {};
    allPackAccess.forEach((pa) => {
      const uid = pa.userId.toString();
      if (!accessByUserId[uid]) accessByUserId[uid] = [];
      const { packId, ...rest } = pa;
      accessByUserId[uid].push({ ...rest, pack: packId });
    });

    const enrichedUsers = users.map((u) => ({
      ...u,
      packAccessList: accessByUserId[u._id.toString()] || [],
    }));

    return sendSuccess(enrichedUsers);
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

    const user = await User.findById(id);
    if (!user) return sendBadRequestError(res, "Utilisateur non trouvé.");

    user.name = name;
    user.phoneNumber = phoneNumber;
    user.userType = userType;
    const updatedUser = await user.save();

    return sendSuccess({
      message: 'Utilisateur mis à jour avec succès.',
      userId: updatedUser._id,
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Update password (by token auth)
// ==================================================
exports.updatePassword = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return sendBadRequestError(res, "Token manquant ou mal formé");
    }

    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return sendBadRequestError(res, "Email et nouveau mot de passe requis");
    }

    const user = await User.findOne({ email });
    if (!user) return sendBadRequestError(res, "Utilisateur non trouvé.");


    const token = authHeader.split(' ')[1];


    jwt.verify(token, process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET', async (err, decoded) => {
      if (err) return sendBadRequestError(res, "Token invalide ou expiré");

      const hash = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(decoded.userId, { password: hash, firstLogin: false });

      return sendSuccess(res,{ message: 'Mot de passe mis à jour' });
    });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};

// ==================================================
// Update password by email
// ==================================================
exports.updateMotDePasse = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return sendBadRequestError(res, "Email et nouveau mot de passe requis");
    }

    const user = await User.findOne({ email });
    if (!user) return sendBadRequestError(res, "Utilisateur non trouvé.");

    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLogin = false;
    await user.save();

    return sendSuccess({ message: 'Mot de passe mis à jour avec succès' });
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
      return sendBadRequestError(res, 'userId et deviceToken sont requis.');
    }

    const user = await User.findById(userId);
    if (!user) return sendBadRequestError(res, 'Utilisateur non trouvé.');

    const initialLength = user.devicesToken.length;
    user.devicesToken = user.devicesToken.filter((t) => t !== deviceToken);

    if (user.devicesToken.length === initialLength) {
      return sendBadRequestError(res, 'Token non trouvé dans la liste.');
    }

    await user.save();
    return sendSuccess({
      message: 'Token supprimé avec succès.',
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

    const user = await User.findById(id);
    if (!user) return sendBadRequestError(res, "Utilisateur non trouvé.");

    await PackAccess.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return sendSuccess({ message: 'Utilisateur et accès au pack supprimés avec succès.' });
  } catch (error) {
    sendInternalError(res, error.message);
  }
};
