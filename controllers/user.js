const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const UserType = require('../models/UserType');
const PackAccess = require('../models/PackAccess');
const crypto = require('crypto');


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

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    // Génération d'un mot de passe temporaire si aucun n'est fourni
    const tempPassword = password || generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Création de l'utilisateur
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      userType,
      ownerId
    });

    const savedUser = await newUser.save();

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Hera App : Mot de passe temporaire',
  text: `
Bonjour ${name},

Votre compte a bien été créé sur notre plateforme.

Voici vos informations de connexion temporaires :

Adresse e-mail : ${email}
Mot de passe temporaire : ${tempPassword}

Important : Pour des raisons de sécurité, veuillez vous connecter dès que possible et modifier ce mot de passe depuis votre espace personnel.

Si vous n’êtes pas à l’origine de cette inscription, veuillez nous contacter immédiatement.
  `.trim(),
  html: `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <p>Bonjour <strong>${name}</strong>,</p>

      <p>Votre compte a bien été créé sur notre plateforme.</p>

      <p><strong>Voici vos informations de connexion temporaires :</strong></p>
      <ul>
        <li><strong>Adresse e-mail :</strong> ${email}</li>
        <li><strong>Mot de passe temporaire :</strong> ${tempPassword}</li>
      </ul>

      <p style="color: #d9534f;"><strong>⚠️ Important :</strong> Pour des raisons de sécurité, veuillez vous connecter dès que possible et modifier ce mot de passe depuis votre espace personnel.</p>

      <p>Si vous n’êtes pas à l’origine de cette inscription, veuillez nous contacter immédiatement.</p>

      <hr />
      <p style="font-size: 12px; color: #777;">Cet email vous a été envoyé automatiquement par Hera App. Merci de ne pas y répondre directement.</p>
    </div>
  `
};


    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    console.log("mail sent",mailOptions);

    return res.status(200).json({
      message: 'Utilisateur créé avec succès.',
      userId: savedUser._id
    });

  } catch (error) {
    console.error('Erreur lors de l’inscription :', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
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
    const resetLink = `https://yourdomain.com/update-password`;
    console.log("email",email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation du mot de passe',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe <a href="${resetLink}">${resetLink}</a>`
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
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];

  // Check if the Authorization header is present and starts with "Bearer"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ message: 'Token manquant ou mal formé' });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1]; // Get the part after "Bearer"
  const { newPassword } = req.body; // Assuming newPassword is sent in the body

  // Verify the token using JWT
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





