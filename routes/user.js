const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
// need to use alias

router.post('/signup',userCtrl.signup);
router.post('/login',userCtrl.login);
router.post('/update-password', userCtrl.updatePassword);
router.post('/forgot-password', userCtrl.forgotPassword);

module.exports = router;


