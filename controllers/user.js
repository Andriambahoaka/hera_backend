const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const UserType = require('../models/UserType');
const PackAccess = require('../models/PackAccess');
const crypto = require('crypto');
const { renderTemplate } = require("../utils/emailTemplate");
const cloudinary = require("../config/cloudinary"); // adjust path if needed
const streamifier = require("streamifier");

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
});

function generateTempPassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}


exports.signup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, userType, ownerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà." });
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

    // Load templates
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

    return res.status(200).json({
      message: "Utilisateur créé avec succès.",
      userId: savedUser._id,
    });
  } catch (error) {
    console.error("Erreur lors de l’inscription :", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, userType } = req.body;
    const user = await User.findById(id);

    user.name = name;
    user.phoneNumber = phoneNumber;
    user.userType = userType;
    console.log("usertype",userType);
    const updatedUser = await user.save();

    res.status(200).json({
      message: 'Utilisateur mis à jour avec succès.',
      userId: updatedUser._id
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};


exports.uploadImageFile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Supprimer l'ancienne image si elle existe
    if (user.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.imagePublicId);
      } catch (err) {
        console.warn("Impossible de supprimer l'ancienne image :", err.message);
      }
    }

    // Upload la nouvelle image depuis le buffer
    const uploadFromBuffer = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "user_images" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result = await uploadFromBuffer(req.file.buffer);

    // Sauvegarde uniquement l'URL et le public_id dans MongoDB
    user.imageUrl = result.secure_url;
    user.imagePublicId = result.public_id; // utile si tu veux supprimer ou remplacer plus tard
    await user.save();

    res.status(200).json({
      message: "Image utilisateur mise à jour avec succès",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserImage = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user || !user.image) return res.status(404).send('Image not found');

  res.set('Content-Type', user.image.mimeType); 
  res.send(user.image.data);
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrect' });
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrect' });
          }

          const token = jwt.sign(
            { userId: user._id },
            'RANDOM_TOKEN_SECRET',
            { expiresIn: '24h' }
          );

          res.status(200).json({
            token: token,
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              phoneNumber: user.phoneNumber,
              userType: user.userType,
              ownerId: user.ownerId,
              firstLogin: user.firstLogin
            }
          });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const token = jwt.sign({ userId: user._id }, 'RESET_PASSWORD_SECRET', { expiresIn: '1h' });
    const resetLink = `https://hera-backend-kes8.onrender.com/deeplink?to=update-password`;
    console.log("email",email);

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Réinitialisation du mot de passe',
  text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
  html: `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <div style="text-align: center;">
    <img src="https://hera-backend-kes8.onrender.com/public/logo.png" alt="Hera App Logo" style="max-width: 150px; margin-bottom: 20px;" />
  </div>

      <p>Bonjour,</p>

      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour procéder :</p>

      <p><a href="${resetLink}" style="color: #007bff;">${resetLink}</a></p>

      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>

      <hr />
      <p style="font-size: 12px; color: #777;">Cet email vous a été envoyé automatiquement par Hera App. Merci de ne pas y répondre directement.</p>
    </div>
  `
};


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error });
      }
      res.status(200).json({ message: 'Email de réinitialisation envoyé' });
    });
  }).catch(error => res.status(500).json({ error }));
};

exports.updatePassword = (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ message: 'Token manquant ou mal formé' });
  }


  const token = authHeader.split(' ')[1]; 
  const { newPassword } = req.body; 

  jwt.verify(token, 'RANDOM_TOKEN_SECRET', (err, decoded) => {
    if (err) {
      return res.status(400).json({ message: 'Token invalide ou expiré' + err });
    }

    // Hash the new password
    bcrypt.hash(newPassword, 10).then(hash => {
      // Update the user's password in the database
      User.findByIdAndUpdate(decoded.userId, { password: hash, firstLogin: false })
        .then(() => res.status(200).json({ message: 'Mot de passe mis à jour' }))
        .catch((error) => res.status(500).json({ error }));
    }).catch((error) => res.status(500).json({ error }));
  });
};

exports.updateMotDePasse = (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email et nouveau mot de passe requis' });
  }

  // Find the user by email
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10)
        .then(hash => {
          user.password = hash;
          user.firstLogin = false;

          // Save the updated user
          user.save()
            .then(() => res.status(200).json({ message: 'Mot de passe mis à jour avec succès' }))
            .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.addUserType = (req, res, next) => {
  const { type_id, name } = req.body;

  // Check if required fields are provided
  if (!type_id || !name) {
    return res.status(400).json({ message: 'type_id and name are required' });
  }

  // Create a new UserType
  const userType = new UserType({ type_id, name });

  userType.save()
    .then(() => res.status(201).json({ message: 'UserType created successfully', userType }))
    .catch(error => res.status(400).json({ error }));
};

exports.findAll = (req, res) => {
  User.find()
    .then(users => {
      // If packs are found, return them
      res.status(200).json({ message: 'Users retrieved successfully', users });
    })
    .catch(error => {
      // If an error occurs, return an error message
      res.status(500).json({ error: 'Error retrieving users: ' + error.message });
    });
};

exports.findAllByOwner = async (req, res) => {
  const { ownerId } = req.params;

  try {
    // 1. Fetch all users for the given ownerId
    const users = await User.find({ ownerId }).lean();

    // 2. Extract user IDs
    const userIds = users.map(user => user._id);

    // 3. Get all PackAccess for these users and populate packId
    const allPackAccess = await PackAccess.find({ userId: { $in: userIds } })
      .populate('packId') // this gives you full pack object
      .lean();

    // 4. Group access by userId, renaming `packId` → `pack`
    const accessByUserId = {};
    allPackAccess.forEach(pa => {
      const uid = pa.userId.toString();
      if (!accessByUserId[uid]) accessByUserId[uid] = [];

      const { packId, ...rest } = pa;
      accessByUserId[uid].push({
        ...rest,
        pack: packId  // rename packId to pack
      });
    });

    // 5. Merge access list into each user
    const enrichedUsers = users.map(user => ({
      ...user,
      packAccessList: accessByUserId[user._id.toString()] || []
    }));

    res.status(200).json(enrichedUsers);
  } catch (error) {
    res.status(500).json({
      error: `Error retrieving members with access: ${error.message}`,
    });
  }
};

exports.addDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;

    if (!userId || !deviceToken) {
      return res.status(400).json({ error: 'userId et deviceToken sont requis.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // Évite les doublons
    if (!user.devicesToken.includes(deviceToken)) {
      user.devicesToken.push(deviceToken);
      await user.save();
    }

    res.status(200).json({ message: 'Token ajouté avec succès.', devicesToken: user.devicesToken });
  } catch (error) {
    console.error('Erreur lors de l’ajout du token :', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

exports.deleteDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;

    if (!userId || !deviceToken) {
      return res.status(400).json({ error: 'userId et deviceToken sont requis.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const initialLength = user.devicesToken.length;

    // Supprimer tous les tokens correspondants
    user.devicesToken = user.devicesToken.filter(token => token !== deviceToken);

    if (user.devicesToken.length === initialLength) {
      return res.status(404).json({ message: 'Token non trouvé dans la liste.' });
    }

    await user.save();

    res.status(200).json({
      message: 'Token supprimé avec succès.',
      devicesToken: user.devicesToken,
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du token :', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Delete PackAccess entries related to this user
    await PackAccess.deleteMany({ userId: id });

    // Delete the user
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Utilisateur et accès au pack supprimés avec succès.' });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};





