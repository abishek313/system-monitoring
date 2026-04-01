const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailController");

router.get("/", emailController.getEmailLogs);

module.exports = router;