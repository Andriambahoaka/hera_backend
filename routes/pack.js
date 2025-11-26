const express = require('express');
const router = express.Router();

const packCtrl = require('../controllers/pack');
const apiKeyAuth = require('../middleware/apiKeyAuth')

router.post('/',apiKeyAuth,packCtrl.addPack);
router.get('/',apiKeyAuth,packCtrl.findAll);
router.get('/owner/:ownerId',apiKeyAuth,packCtrl.findAllByOwner);
router.get('/:deviceId',packCtrl.findByDeviceId);
router.post('/access',packCtrl.addOrUpdatePackAccess);
router.get('/access/:userId',packCtrl.findAllPackAccessByUser);
router.put('/urgency-number',packCtrl.editUrgencyNumber);
router.put('/',packCtrl.update);
router.put('/names',packCtrl.updateDeviceNames);

module.exports = router;