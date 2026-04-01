const db = require("../db");

exports.getEmailLogs = (req, res) => {
  db.query(
    `SELECT e.*, a.alert_message 
     FROM EMAIL_LOG e 
     JOIN ALERTS a ON e.alert_id = a.alert_id
     ORDER BY e.sent_time DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
};