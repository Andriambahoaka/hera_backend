const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notification');

// POST /notifications
router.post('/', notificationCtrl.postNotification);
router.get('/owner/:ownerId', notificationCtrl.findAllByOwner);

module.exports = router;
