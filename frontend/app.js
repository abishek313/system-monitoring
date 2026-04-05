// app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // STATE & FETCH LOGIC
    // ==========================================
    const STATE = {
        servers: [],
        metrics: [],
        alerts: [],
        admins: [],
        emailLogs: []
    };

    const API_BASE = 'http://localhost:3000/api';

    const fetchData = async () => {
        try {
            const [serversRes, metricsRes, alertsRes, adminsRes, emailsRes] = await Promise.all([
                fetch(`${API_BASE}/servers`).catch(() => ({ json: () => [] })),
                fetch(`${API_BASE}/metrics`).catch(() => ({ json: () => [] })),
                fetch(`${API_BASE}/alerts`).catch(() => ({ json: () => [] })),
                fetch(`${API_BASE}/admin`).catch(() => ({ json: () => [] })),
                fetch(`${API_BASE}/email`).catch(() => ({ json: () => [] }))
            ]);

            const servers = await serversRes.json();
            const metrics = await metricsRes.json();
            const alerts = await alertsRes.json();
            const admins = await adminsRes.json();
            const emailLogs = await emailsRes.json();

            STATE.servers = Array.isArray(servers) ? servers : [];
            STATE.metrics = Array.isArray(metrics) ? metrics : [];
            STATE.alerts = Array.isArray(alerts) ? alerts : [];
            STATE.admins = Array.isArray(admins) ? admins : [];
            STATE.emailLogs = Array.isArray(emailLogs) ? emailLogs : [];

        } catch (err) {
            console.error("Error fetching data: ", err);
        }
    };

    // ==========================================
    // NAVIGATION LOGIC
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked nav
            item.classList.add('active');

            // Hide all views
            views.forEach(view => view.classList.add('hidden'));
            // Show target view
            const targetId = item.getAttribute('data-view');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    const getStatusClass = (status) => {
        if (!status) return 'status-online';
        switch (status.toLowerCase()) {
            case 'active': case 'online': case 'sent': case 'resolved': return 'status-online';
            case 'offline': case 'inactive': case 'failed': case 'critical': return 'status-offline';
            case 'warning': case 'pending': return 'status-warning';
            default: return 'status-online';
        }
    };

    const getAlertIndicator = (msg) => {
        if (!msg) return 'indicator-info';
        if (msg.toLowerCase().includes('critical') || msg.toLowerCase().includes('offline')) return 'indicator-critical';
        if (msg.toLowerCase().includes('warning') || msg.toLowerCase().includes('exceeded') || msg.toLowerCase().includes('high')) return 'indicator-warning';
        return 'indicator-info';
    };

    // ==========================================
    // RENDER FUNCTIONS
    // ==========================================

    // 1. Dashboard Render
    const renderDashboard = () => {
        const metrics = STATE.metrics;
        const totalCpu = metrics.reduce((acc, m) => acc + Number(m.cpu_usage), 0);
        const totalMem = metrics.reduce((acc, m) => acc + Number(m.memory_usage), 0);
        const avgCpu = metrics.length ? Math.round(totalCpu / metrics.length) : 0;
        const avgMem = metrics.length ? Math.round(totalMem / metrics.length) : 0;
        
        document.getElementById('dash-cpu-avg').innerText = `${avgCpu}%`;
        document.getElementById('dash-mem-avg').innerText = `${avgMem}%`;
        document.getElementById('dash-server-count').innerText = STATE.servers.filter(s => s.status === 'Active' || s.status === 'Online').length;
        document.getElementById('dash-alert-count').innerText = STATE.alerts.length;
        document.getElementById('alert-badge').innerText = STATE.alerts.length;

        // Render Recent Alerts
        const recentAlertsHtml = STATE.alerts.slice(0, 5).map(alert => `
            <li class="alert-item">
                <div class="alert-indicator ${getAlertIndicator(alert.alert_message)}"></div>
                <div class="alert-content">
                    <h4>${alert.server_name || alert.server_id}</h4>
                    <p>${alert.alert_message}</p>
                </div>
            </li>
        `).join('');
        document.getElementById('dash-recent-alerts').innerHTML = recentAlertsHtml || '<li style="padding: 12px; color: var(--text-muted)">No recent alerts</li>';

        // Initialize Chart
        initChart();
    };

    // 2. Servers Table Render
    const renderServers = () => {
        const tbody = document.getElementById('servers-tbody');
        tbody.innerHTML = STATE.servers.map(server => `
            <tr>
                <td><strong>${server.server_id}</strong></td>
                <td>${server.server_name}</td>
                <td>${server.ip_address}</td>
                <td>${server.location}</td>
                <td><span class="status-badge ${getStatusClass(server.status)}">${server.status}</span></td>
                <td>
                    <button class="btn" style="background: rgba(255,255,255,0.1); padding: 5px 10px; font-size: 12px;">Manage</button>
                </td>
            </tr>
        `).join('');
    };

    // 3. Metrics Table Render
    const renderMetrics = () => {
        const tbody = document.getElementById('metrics-tbody');
        tbody.innerHTML = STATE.metrics.map(metric => `
            <tr>
                <td>${metric.metric_id}</td>
                <td><strong>${metric.server_id}</strong></td>
                <td>
                    ${metric.cpu_usage}%
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${metric.cpu_usage}%; background: ${metric.cpu_usage > 80 ? 'var(--accent-red)' : 'var(--accent-blue)'}"></div>
                    </div>
                </td>
                <td>
                    ${metric.memory_usage}%
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${metric.memory_usage}%; background: ${metric.memory_usage > 80 ? 'var(--accent-red)' : 'var(--accent-purple)'}"></div>
                    </div>
                </td>
                <td>
                    ${metric.disk_usage}%
                     <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${metric.disk_usage}%; background: ${metric.disk_usage > 80 ? 'var(--accent-yellow)' : 'var(--accent-green)'}"></div>
                    </div>
                </td>
                <td>${new Date(metric.recorded_time).toLocaleString()}</td>
            </tr>
        `).join('');
    };

    // 4. Alerts Table Render
    const renderAlerts = () => {
        const tbody = document.getElementById('alerts-tbody');
        tbody.innerHTML = STATE.alerts.map(alert => `
            <tr>
                <td><strong>${alert.alert_id}</strong></td>
                <td>${alert.server_name || alert.server_id}</td>
                <td>${alert.alert_message}</td>
                <td>${new Date(alert.alert_time).toLocaleString()}</td>
                <td><span class="status-badge ${alert.resolved_time ? 'status-online' : 'status-offline'}">${alert.resolved_time ? 'Resolved' : 'Active'}</span></td>
            </tr>
        `).join('');
    };

    // 5. Admins Grid Render
    const renderAdmins = () => {
        const grid = document.getElementById('admins-grid');
        grid.innerHTML = STATE.admins.map(admin => `
            <div class="admin-card glass-panel">
                <div class="admin-header">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(admin.admin_name)}&background=random&color=fff" alt="${admin.admin_name}" class="avatar">
                    <div class="admin-info">
                        <h3>${admin.admin_name}</h3>
                        <p>ID: ${admin.admin_id}</p>
                    </div>
                </div>
                <div class="admin-details">
                    <div class="detail-row"><span class="material-symbols-outlined">call</span> ${admin.phone_number}</div>
                    <div class="detail-row"><span class="material-symbols-outlined">mail</span> ${admin.email}</div>
                </div>
                <div class="admin-actions" style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn edit-admin-btn" data-id="${admin.admin_id}" data-name="${admin.admin_name}" data-phone="${admin.phone_number}" data-email="${admin.email}">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn delete-admin-btn" data-id="${admin.admin_id}" style="color: var(--danger)">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Attach listeners after render
        document.querySelectorAll('.delete-admin-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteAdmin(btn.dataset.id));
        });
        document.querySelectorAll('.edit-admin-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset));
        });
    };

    // 6. Email Logs Table Render
    const renderEmailLogs = () => {
        const tbody = document.getElementById('emails-tbody');
        tbody.innerHTML = STATE.emailLogs.map(log => `
            <tr>
                <td>${log.email_id || log.log_id}</td>
                <td>${log.alert_id} ${log.alert_message ? `(${log.alert_message.substring(0, 20)}...)` : ''}</td>
                <td>${log.admin_id}</td>
                <td><span class="status-badge ${getStatusClass(log.email_status || log.status)}">${log.email_status || log.status}</span></td>
                <td>${log.sent_time ? new Date(log.sent_time).toLocaleString() : 'Pending'}</td>
            </tr>
        `).join('');
    };

    // ==========================================
    // CHART.JS INITIALIZATION
    // ==========================================
    let myChart = null;
    const initChart = () => {
        if (myChart) {
            myChart.destroy();
        }
        
        const ctx = document.getElementById('resourceChart').getContext('2d');
        
        // Customizing Chart defaults for dark theme
        Chart.defaults.color = '#9CA3AF';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        // Generate data dynamically from STATE if metrics exist
        let labels = ['10:00', '10:10', '10:20', '10:30', '10:40', '10:50'];
        let cpuData = [45, 50, 48, 62, 70, 65];
        let memData = [55, 56, 55, 60, 68, 72];

        if (STATE.metrics && STATE.metrics.length > 0) {
            // Very simple dynamic line charting based on first 6 metrics for display
            labels = STATE.metrics.slice(0, 6).reverse().map(m => new Date(m.recorded_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            cpuData = STATE.metrics.slice(0, 6).reverse().map(m => m.cpu_usage);
            memData = STATE.metrics.slice(0, 6).reverse().map(m => m.memory_usage);
        }

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Avg CPU %',
                        data: cpuData,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Avg Mem %',
                        data: memData,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            }
        });
    };

    // ==========================================
    // INITIALIZATION & LOGIN / REGISTRATION
    // ==========================================
    const initApp = async () => {
        // Fetch data from real backend REST APIs
        await fetchData();

        renderDashboard();
        renderServers();
        renderMetrics();
        renderAlerts();
        renderAdmins();
        renderEmailLogs();
    };

    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const loginView = document.getElementById('loginView');
    const appView = document.getElementById('appView');
    
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // Toggle logic
    toRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });

    toLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });

    // Registration logic
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            registerBtn.innerHTML = `<span class="material-symbols-outlined rotating">sync</span> Registering...`;
            
            try {
                const response = await fetch(`${API_BASE}/admin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    alert("Registration successful! Please sign in.");
                    registerSection.style.display = 'none';
                    loginSection.style.display = 'block';
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (err) {
                alert("Connection error");
            } finally {
                registerBtn.innerHTML = `Register <span class="material-symbols-outlined">person_add</span>`;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Show loading state
            loginBtn.innerHTML = `<span class="material-symbols-outlined rotating">sync</span> Authenticating...`;
            loginBtn.style.opacity = '0.8';
            
            try {
                const response = await fetch(`${API_BASE}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    loginView.style.display = 'none';
                    appView.style.display = 'flex';
                    initApp();
                } else {
                    alert(data.error || 'Login failed');
                    loginBtn.innerHTML = `Sign In <span class="material-symbols-outlined">arrow_forward</span>`;
                    loginBtn.style.opacity = '1';
                }
            } catch (err) {
                console.error("Login error:", err);
                alert("Connection error to backend");
                loginBtn.innerHTML = `Sign In <span class="material-symbols-outlined">arrow_forward</span>`;
                loginBtn.style.opacity = '1';
            }
        });
    }
    // Dashboard Admin Modal Logic
    const addAdminBtn = document.querySelector('#admins-view .btn-primary');
    const addAdminModal = document.getElementById('addAdminModal');
    const closeAdminModal = document.getElementById('closeAdminModal');
    const dashboardAddAdminForm = document.getElementById('dashboardAddAdminForm');

    addAdminBtn?.addEventListener('click', () => {
        addAdminModal.style.display = 'flex';
    });

    closeAdminModal?.addEventListener('click', () => {
        addAdminModal.style.display = 'none';
    });

    addAdminModal?.addEventListener('click', (e) => {
        if (e.target === addAdminModal) addAdminModal.style.display = 'none';
    });

    if (dashboardAddAdminForm) {
        dashboardAddAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('dashRegName').value;
            const phone = document.getElementById('dashRegPhone').value;
            const email = document.getElementById('dashRegEmail').value;
            const password = document.getElementById('dashRegPassword').value;

            try {
                const response = await fetch(`${API_BASE}/admin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email, password })
                });
                if (response.ok) {
                    alert("Admin added successfully!");
                    addAdminModal.style.display = 'none';
                    dashboardAddAdminForm.reset();
                    await fetchData();
                    renderAdmins();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to add admin');
                }
            } catch (err) {
                alert("Connection error");
            }
        });
    }
    // Edit/Delete Admin Functions
    const editAdminModal = document.getElementById('editAdminModal');
    const closeEditAdminModal = document.getElementById('closeEditAdminModal');
    const editAdminForm = document.getElementById('editAdminForm');

    const openEditModal = (data) => {
        document.getElementById('editAdminId').value = data.id;
        document.getElementById('editAdminName').value = data.name;
        document.getElementById('editAdminPhone').value = data.phone;
        document.getElementById('editAdminEmail').value = data.email;
        editAdminModal.style.display = 'flex';
    };

    closeEditAdminModal?.addEventListener('click', () => {
        editAdminModal.style.display = 'none';
    });

    const deleteAdmin = async (id) => {
        if (!confirm('Are you sure you want to delete this administrator?')) return;
        try {
            const response = await fetch(`${API_BASE}/admin/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert("Admin deleted successfully");
                await fetchData();
                renderAdmins();
            } else {
                alert("Failed to delete admin");
            }
        } catch (err) {
            alert("Error connecting to server");
        }
    };

    if (editAdminForm) {
        editAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editAdminId').value;
            const name = document.getElementById('editAdminName').value;
            const phone = document.getElementById('editAdminPhone').value;
            const email = document.getElementById('editAdminEmail').value;

            try {
                const response = await fetch(`${API_BASE}/admin/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email })
                });
                if (response.ok) {
                    alert("Admin updated successfully");
                    editAdminModal.style.display = 'none';
                    await fetchData();
                    renderAdmins();
                } else {
                    alert("Failed to update admin");
                }
            } catch (err) {
                alert("Error connecting to server");
            }
        });
    }
});
