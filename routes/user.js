const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

router.get('/',userCtrl.findAll);
router.post('/device-token',userCtrl.addDeviceToken);
router.delete('/device-token', userCtrl.deleteDeviceToken); 

module.exports = router;


