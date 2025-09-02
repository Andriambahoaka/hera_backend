const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const multer = require("multer");
const upload = multer(); 

router.post('/update-password', userCtrl.updatePassword);
router.post('/update-pass', userCtrl.updateMotDePasse);
router.post('/device-token',userCtrl.addDeviceToken);
router.post('/:id/image', upload.single('image'), userCtrl.uploadImageFile);

router.get('/',userCtrl.findAll);
router.get('/owner/:ownerId',userCtrl.findAllByOwner);

router.put('/:id',userCtrl.updateUserById);

router.delete('/device-token', userCtrl.deleteDeviceToken); 
router.delete('/:id', userCtrl.deleteUserById); 

module.exports = router;


