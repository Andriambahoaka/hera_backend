const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth');
const adminApiKeyAuth = require('../middleware/adminApiKeyAuth');
const apiKeyAuth = require('../middleware/apiKeyAuth')

router.post('/signup',apiKeyAuth,authCtrl.signup);
router.post('/login',authCtrl.login);
router.post('/forgot-password', authCtrl.forgotPassword);
router.get("/generate-token",adminApiKeyAuth, authCtrl.generateApiKey);
router.post("/refresh-token", authCtrl.refreshApiKey);

module.exports = router;