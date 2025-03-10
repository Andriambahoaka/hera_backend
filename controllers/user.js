const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const UserType = require('../models/UserType');

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

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password: hash,
                phoneNumber: req.body.phoneNumber || null,
                userType: req.body.userType,
                ownerId : req.body.ownerId
            });
            return user.save();
        })
        .then(user => res.status(201).json({ 
            message: 'User created with success',
            userId: user._id  
        }))
        .catch((error) => res.status(400).json({ error }));
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
                            name: "user.name",
                            email: user.email,
                            phoneNumber: user.phoneNumber,
                            userType: user.userType,
                            ownerId: user.ownerId
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
        const resetLink = `hera://reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Réinitialisation du mot de passe',
            text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`
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
    jwt.verify(token, 'RESET_PASSWORD_SECRET', (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }

        // Hash the new password
        bcrypt.hash(newPassword, 10).then(hash => {
            // Update the user's password in the database
            User.findByIdAndUpdate(decoded.userId, { password: hash })
                .then(() => res.status(200).json({ message: 'Mot de passe mis à jour' }))
                .catch(error => res.status(500).json({ error }));
        }).catch(error => res.status(500).json({ error }));
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


