const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");

router.post("/", metricsController.addMetrics);
router.get("/", metricsController.getAllMetrics);
router.get("/:id", metricsController.getMetrics);

module.exports = router;