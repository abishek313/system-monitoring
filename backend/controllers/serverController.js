const db = require("../db");

exports.addServer = (req, res) => {
  const { server_name, ip_address, location } = req.body;

  if (!server_name || !ip_address || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  db.query(
    "CALL add_server(?, ?, ?)",
    [server_name, ip_address, location],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Server added" })
    }
  );
};

exports.getServers = (req, res) => {
  db.query("SELECT * FROM SERVERS", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.length === 0) {
      return res.json([]);
    }

    res.json(result);
  });
};