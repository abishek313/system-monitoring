CREATE DATABASE IF NOT EXISTS server_monitor;
USE server_monitor;

-- 1. TABLES
CREATE TABLE IF NOT EXISTS ADMIN (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT 'admin123'
);

CREATE TABLE IF NOT EXISTS SERVERS (
    server_id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    location VARCHAR(100),
    status ENUM('Active', 'Inactive', 'Warning', 'Critical') DEFAULT 'Active',
    api_key VARCHAR(64) UNIQUE,
    secret_key VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS METRICS (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    cpu_usage DECIMAL(5,2) NOT NULL,
    memory_usage DECIMAL(5,2) NOT NULL,
    disk_usage DECIMAL(5,2) NOT NULL,
    recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES SERVERS(server_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ALERTS (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    alert_message TEXT NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_time TIMESTAMP NULL,
    FOREIGN KEY (server_id) REFERENCES SERVERS(server_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS EMAIL_LOG (
    email_id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    admin_id INT NOT NULL,
    email_status ENUM('Pending', 'Sent', 'Failed') DEFAULT 'Pending',
    sent_time TIMESTAMP NULL,
    FOREIGN KEY (alert_id) REFERENCES ALERTS(alert_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES ADMIN(admin_id) ON DELETE CASCADE
);

-- 2. STORED PROCEDURES
DROP PROCEDURE IF EXISTS add_server;
DELIMITER //
CREATE PROCEDURE add_server(
    IN p_server_name VARCHAR(100), 
    IN p_ip_address VARCHAR(45), 
    IN p_location VARCHAR(100)
)
BEGIN
    INSERT INTO SERVERS (server_name, ip_address, location, api_key, secret_key) 
    VALUES (p_server_name, p_ip_address, p_location, UUID(), UUID());
END //

DROP PROCEDURE IF EXISTS add_metrics;
CREATE PROCEDURE add_metrics(
    IN p_cpu DECIMAL(5,2), 
    IN p_memory DECIMAL(5,2), 
    IN p_disk DECIMAL(5,2), 
    IN p_server_id INT
)
BEGIN
    INSERT INTO METRICS (cpu_usage, memory_usage, disk_usage, server_id) 
    VALUES (p_cpu, p_memory, p_disk, p_server_id);
END //
DELIMITER ;

-- 3. TRIGGERS
DROP TRIGGER IF EXISTS trg_check_metrics_alerts;
DELIMITER //
-- Trigger: Automatically create an Alert if metrics exceed 90%
CREATE TRIGGER trg_check_metrics_alerts
AFTER INSERT ON METRICS
FOR EACH ROW
BEGIN
    DECLARE v_message VARCHAR(255);
    
    IF NEW.cpu_usage > 90.00 THEN
        SET v_message = CONCAT('High CPU Usage detected: ', NEW.cpu_usage, '%');
        INSERT INTO ALERTS (server_id, alert_type, alert_message, severity) 
        VALUES (NEW.server_id, 'CPU', v_message, 'Critical');
    END IF;

    IF NEW.memory_usage > 90.00 THEN
        SET v_message = CONCAT('High Memory Usage detected: ', NEW.memory_usage, '%');
        INSERT INTO ALERTS (server_id, alert_type, alert_message, severity) 
        VALUES (NEW.server_id, 'Memory', v_message, 'Critical');
    END IF;

    IF NEW.disk_usage > 90.00 THEN
        SET v_message = CONCAT('High Disk Usage detected: ', NEW.disk_usage, '%');
        INSERT INTO ALERTS (server_id, alert_type, alert_message, severity) 
        VALUES (NEW.server_id, 'Disk', v_message, 'Critical');
    END IF;
END //

DROP TRIGGER IF EXISTS trg_queue_email_alert;
-- Trigger: Automatically queue an email when a new alert is generated
CREATE TRIGGER trg_queue_email_alert
AFTER INSERT ON ALERTS
FOR EACH ROW
BEGIN
    -- Insert a pending email log for every admin in the system
    INSERT INTO EMAIL_LOG (alert_id, admin_id, email_status)
    SELECT NEW.alert_id, admin_id, 'Pending' FROM ADMIN;
    
    -- Update the server status to Critical since an alert occurred
    UPDATE SERVERS SET status = 'Critical' WHERE server_id = NEW.server_id;
END //
DELIMITER ;

-- Insert a default admin for testing purposes
INSERT IGNORE INTO ADMIN (admin_id, admin_name, phone_number, email, password) VALUES (1, 'Abishek', '1234567890', 'abisheksubodh58@gmail.com', 'admin123');
