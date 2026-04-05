const db = require("../db");

exports.addMetrics = (req, res) => {
  const { cpu, memory, disk, server_id } = req.body;

  if (
    cpu === undefined ||
    memory === undefined ||
    disk === undefined ||
    !server_id
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (
    cpu < 0 || cpu > 100 ||
    memory < 0 || memory > 100 ||
    disk < 0 || disk > 100
  ) {
    return res.status(400).json({ error: "Values must be between 0 and 100" });
  }

  db.query(
    "CALL add_metrics(?, ?, ?, ?)",
    [cpu, memory, disk, server_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Metrics inserted" });
    }
  );
};

exports.getMetrics = (req, res) => {
  const server_id = req.params.id;

  if (!server_id) {
    return res.status(400).json({ error: "Server ID required" });
  }

  db.query(
    "SELECT * FROM METRICS WHERE server_id = ? ORDER BY recorded_time DESC",
    [server_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.length === 0) {
        return res.json({ message: "No metrics found" });
      }

      res.json(result);
    }
  );
};

exports.getAllMetrics = (req, res) => {
  db.query(
    "SELECT * FROM METRICS ORDER BY recorded_time DESC",
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.length === 0) {
        return res.json({ message: "No metrics found" });
      }

      res.json(result);
    }
  );
};