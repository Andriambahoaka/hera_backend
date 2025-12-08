const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const multer = require("multer");
const upload = multer(); 
const apiKeyAuth = require("../middleware/apiKeyAuth");

// Password flows
router.post('/reset-password', userCtrl.resetPassword); 
router.put('/update-password', userCtrl.updatePassword); 

// Device tokens
router.post('/device-token', userCtrl.addDeviceToken);
router.delete('/device-token', userCtrl.deleteDeviceToken); 

// User image
router.post('/:id/image', upload.single('image'), userCtrl.uploadImageFile);

// User management
router.get('/', userCtrl.findAll);
router.get('/owner/:ownerId', userCtrl.findAllByOwner);
router.get("/owners", apiKeyAuth, userCtrl.findAllOwners);
router.put('/:id', userCtrl.updateUserById);
router.delete('/:id', userCtrl.deleteUserById);
router.get("/id", apiKeyAuth, userCtrl.getUserIdByEmail);

module.exports = router;



