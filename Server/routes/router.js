const express = require("express");
const services = require("../services/render");
const router = express.Router();
const controller = require('../Controller/controller')

router.get("/", services.homeRoute);

router.put('/leaving-user-update/:id',controller.leavingUserUpdate)
router.put('/new-user-update/:id',controller.newUserUpdate)
router.put('/update-on-engagement/:id',controller.updateOnEngagement)
router.post('/get-remote-users',controller.remoteUserFind)
router.post('/get-next-users/',controller.getNextUser)


module.exports = router;