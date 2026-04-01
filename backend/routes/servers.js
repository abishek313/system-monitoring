const express = require("express");
const router = express.Router();
const serverController = require("../controllers/serverController");

router.post("/", serverController.addServer);
router.get("/", serverController.getServers);

module.exports = router;