const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const multer = require("multer");
const upload = multer(); 

// Password flows
router.post('/reset-password', userCtrl.resetPassword);  // demander un reset
router.put('/update-password', userCtrl.updatePassword); // appliquer le nouveau mdp

// Device tokens
router.post('/device-token', userCtrl.addDeviceToken);
router.delete('/device-token', userCtrl.deleteDeviceToken); 

// User image
router.post('/:id/image', upload.single('image'), userCtrl.uploadImageFile);

// User management
router.get('/', userCtrl.findAll);
router.get('/owner/:ownerId', userCtrl.findAllByOwner);
router.put('/:id', userCtrl.updateUserById);
router.delete('/:id', userCtrl.deleteUserById);

module.exports = router;



