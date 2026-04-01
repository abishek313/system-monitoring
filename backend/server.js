const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/servers", require("./routes/servers"));
app.use("/api/metrics", require("./routes/metrics"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/email", require("./routes/email"));
app.use("/api/admin", require("./routes/admin"));

// Start background email worker
require("./emailService");

app.listen(3000, () => console.log("Server running on port 3000"));