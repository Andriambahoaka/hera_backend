const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();   
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,             // Your Gmail address from the .env file 
        pass: process.env.GMAIL_PASS,  
    }
});
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(() => res.status(200).json({ message: 'Utilisateur créé' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};


exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user == null) {
                res.status(401).json({ message: 'Paire identifiant/mot de passe incorrect' });
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({ message: 'Paire identifiant/mot de passe incorrect' });
                        } else {
                            // Payload = les données encodées dans le token
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    'RANDOM_TOKEN_SECRET',
                                    { expiresIn: '24h' }
                                )
                            });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({ error });
                    });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    User.findOne({ email }).then(user => {
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        const token = jwt.sign({ userId: user._id }, 'RESET_PASSWORD_SECRET', { expiresIn: '1h' });
        const resetLink = `yourapp://reset-password?token=${token}`;

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
    const { token, newPassword } = req.body;
    jwt.verify(token, 'RESET_PASSWORD_SECRET', (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }
        bcrypt.hash(newPassword, 10).then(hash => {
            User.findByIdAndUpdate(decoded.userId, { password: hash })
                .then(() => res.status(200).json({ message: 'Mot de passe mis à jour' }))
                .catch(error => res.status(500).json({ error }));
        }).catch(error => res.status(500).json({ error }));
    });
};