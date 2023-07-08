const express = require("express");
const services = require("../services/render");
const router = express.Router();

router.get("/", services.homeRoute);


module.exports = router;