const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

router.get('/',userCtrl.findAll);
router.get('/owner/:ownerId',userCtrl.findAllByOwner);
router.post('/device-token',userCtrl.addDeviceToken);
router.delete('/device-token', userCtrl.deleteDeviceToken); 

module.exports = router;


