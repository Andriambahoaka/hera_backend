const express = require('express');
const router = express.Router();

const packCtrl = require('../controllers/pack');

router.post('/',packCtrl.addPack);
router.get('/',packCtrl.findAll);
router.get('/owner/:ownerId',packCtrl.findAllByOwner);
router.get('/:deviceId',packCtrl.findByDeviceId);
router.post('/access',packCtrl.addOrUpdatePackAccess);
router.get('/access/:userId',packCtrl.findAllPackAccessByUser);
router.put('/urgency-number',packCtrl.editUrgencyNumber);
router.put('/',packCtrl.update);
router.put('/names',packCtrl.updateDeviceNames);

module.exports = router;