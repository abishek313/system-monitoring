const db = require("../db");

exports.getAlerts = (req, res) => {
  db.query(
    `SELECT a.*, s.server_name 
     FROM ALERTS a 
     JOIN SERVERS s ON a.server_id = s.server_id
     ORDER BY alert_time DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
};

exports.getAlertsByServer = (req, res) => {
  const server_id = req.params.id;

  if (!server_id) {
    return res.status(400).json({ error: "Server ID required" });
  }
  db.query(
    `SELECT * FROM ALERTS 
     WHERE server_id = ? 
     ORDER BY alert_time DESC`,
    [server_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.length === 0) {
        return res.json({ message: "No alerts found" });
      }

      res.json(result);
    }
  );
};