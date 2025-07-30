const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const upload = require('../middleware/upload');

router.get('/',userCtrl.findAll);
router.get('/owner/:ownerId',userCtrl.findAllByOwner);
router.post('/device-token',userCtrl.addDeviceToken);
router.delete('/device-token', userCtrl.deleteDeviceToken); 
router.delete('/:id', userCtrl.deleteUserById); 
router.put('/:id',userCtrl.updateUserById);
router.post('/:id/image', upload.single('image'), userCtrl.uploadImageFile);

module.exports = router;


