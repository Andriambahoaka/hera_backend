const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

router.get('/',userCtrl.findAll);
router.post('/add-device-token',userCtrl.addDeviceToken);

module.exports = router;


