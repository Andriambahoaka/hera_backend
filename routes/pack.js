const express = require('express');
const router = express.Router();

const packCtrl = require('../controllers/pack');

router.post('/',packCtrl.addPack);
router.get('/',packCtrl.findAll);
router.get('/owner/:ownerId',packCtrl.findAllByOwner);
router.post('/access',packCtrl.addOrUpdatePackAccess);
router.get('/access/:userId',packCtrl.findAllPackAccessByUser);

module.exports = router;