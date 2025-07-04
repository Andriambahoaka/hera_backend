const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

router.post('/signup',userCtrl.signup);
router.post('/login',userCtrl.login);
router.post('/update-password', userCtrl.updatePassword);
router.post('/update-pass', userCtrl.updateMotDePasse);
router.post('/forgot-password', userCtrl.forgotPassword);
//router.post('/profile', userCtrl.getProfile);

module.exports = router;