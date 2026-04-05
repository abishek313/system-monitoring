require("dotenv").config({ path: '../config/.env' });
const db = require("./db");
const nodemailer = require("nodemailer");

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider here
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

function processPendingEmails() {
    // 1. Fetch pending emails with alert and admin details
    const query = `
        SELECT e.email_id, a.alert_type, a.alert_message, a.severity, ad.email, ad.admin_name, s.server_name
        FROM EMAIL_LOG e
        JOIN ALERTS a ON e.alert_id = a.alert_id
        JOIN ADMIN ad ON e.admin_id = ad.admin_id
        JOIN SERVERS s ON a.server_id = s.server_id
        WHERE e.email_status = 'Pending'
    `;

    db.query(query, (err, pendingEmails) => {
        if (err) {
            console.error("Error fetching pending emails:", err.message);
            return;
        }

        if (pendingEmails.length === 0) return;

        console.log(`[EmailService] Found ${pendingEmails.length} pending emails to send.`);

        pendingEmails.forEach(record => {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'your-email@gmail.com',
                to: record.email,
                subject: `🚨 [${record.severity} ALERT] System Monitor: ${record.server_name}`,
                html: `
                    <h2>Server Monitoring Alert</h2>
                    <p>Hello <b>${record.admin_name}</b>,</p>
                    <p>An alert has been triggered for one of your monitored systems.</p>
                    <ul>
                        <li><strong>Server:</strong> ${record.server_name}</li>
                        <li><strong>Alert Type:</strong> ${record.alert_type}</li>
                        <li><strong>Severity:</strong> ${record.severity}</li>
                        <li><strong>Details:</strong> ${record.alert_message}</li>
                    </ul>
                    <br>
                    <p>Please check the <a href="http://localhost:5500">System Dashboard</a> for more details.</p>
                `
            };

            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`[EmailService] Failed to send email to ${record.email}:`, error);
                    // Update status to Failed
                    db.query("UPDATE EMAIL_LOG SET email_status = 'Failed' WHERE email_id = ?", [record.email_id]);
                } else {
                    console.log(`[EmailService] Email sent to ${record.email}`);
                    // Update status to Sent and set sent_time
                    db.query("UPDATE EMAIL_LOG SET email_status = 'Sent', sent_time = NOW() WHERE email_id = ?", [record.email_id]);
                }
            });
        });
    });
}

// Start polling every 15 seconds
setInterval(processPendingEmails, 15000);
console.log("[EmailService] Background email worker started.");

module.exports = { processPendingEmails };
