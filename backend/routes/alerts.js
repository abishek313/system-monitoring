const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alertController");

router.get("/", alertController.getAlerts);
router.get("/:id", alertController.getAlertsByServer);

module.exports = router;