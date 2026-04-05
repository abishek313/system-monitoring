const db = require("../db");

exports.addAdmin = (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  db.query(
    "INSERT INTO ADMIN (admin_name, phone_number, email, password) VALUES (?, ?, ?, ?)",
    [name, phone, email, password],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Admin added" });
    }
  );
};

exports.loginAdmin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  db.query(
    "SELECT * FROM ADMIN WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ message: "Login successful", admin: results[0] });
    }
  );
};

exports.getAdmins = (req, res) => {
  db.query("SELECT admin_id, admin_name, phone_number, email FROM ADMIN", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.updateAdmin = (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;

  db.query(
    "UPDATE ADMIN SET admin_name = ?, phone_number = ?, email = ? WHERE admin_id = ?",
    [name, phone, email, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Admin updated" });
    }
  );
};

exports.deleteAdmin = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM ADMIN WHERE admin_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Admin deleted" });
  });
};