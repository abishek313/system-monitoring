const db = require("../db");

exports.addAdmin = (req, res) => {
const { name, phone, email } = req.body;

if (!name || !phone || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }
if (!email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  db.query(
    "INSERT INTO ADMIN (admin_name, phone_number, email) VALUES (?, ?, ?)",
    [name, phone, email],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Admin added" });
    }
  );
};