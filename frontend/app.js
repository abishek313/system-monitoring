const API_BASE = 'http://localhost:3000/api';

async function fetchServers() {
    try {
        const res = await fetch(`${API_BASE}/servers`);
        const data = await res.json();
        
        const tbody = document.getElementById('servers-table-body');
        tbody.innerHTML = '';
        
        if (data.message || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No servers available</td></tr>';
            document.getElementById('total-servers').innerText = 0;
            document.getElementById('healthy-servers').innerText = 0;
            return;
        }

        let healthyCount = 0;
        
        data.forEach(server => {
            if(server.status === 'Active') healthyCount++;
            
            const tr = document.createElement('tr');
            
            let statusClass = 'status-active';
            if(server.status === 'Critical') statusClass = 'status-critical';
            else if(server.status === 'Warning') statusClass = 'status-warning';

            tr.innerHTML = `
                <td><strong>${server.server_name}</strong></td>
                <td>${server.ip_address}</td>
                <td>${server.location}</td>
                <td><span class="status-badge ${statusClass}">${server.status}</span></td>
                <td><button class="btn-metrics" onclick="viewMetrics(${server.server_id}, '${server.server_name}')">View Metrics</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('total-servers').innerText = data.length;
        document.getElementById('healthy-servers').innerText = healthyCount;
    } catch (err) {
        console.error('Error fetching servers:', err);
    }
}

async function fetchAlerts() {
    try {
        const res = await fetch(`${API_BASE}/alerts`);
        const data = await res.json();
        
        const container = document.getElementById('alerts-list-container');
        container.innerHTML = '';
        
        if (data.message || data.length === 0) {
            container.innerHTML = '<div class="empty-state">No active alerts</div>';
            document.getElementById('active-alerts').innerText = 0;
            document.getElementById('alert-badge').innerText = 0;
            return;
        }

        document.getElementById('active-alerts').innerText = data.length;
        document.getElementById('alert-badge').innerText = data.length;

        // Display top 5 alerts
        data.slice(0, 5).forEach(alert => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerHTML = `
                <h4>${alert.server_name} - ${alert.alert_type}</h4>
                <p>${alert.alert_message}</p>
                <span class="alert-time">${new Date(alert.alert_time).toLocaleString()}</span>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error('Error fetching alerts:', err);
    }
}

async function viewMetrics(serverId, serverName) {
    document.getElementById('modal-server-name').innerText = `Metrics: ${serverName}`;
    document.getElementById('metrics-modal').style.display = 'block';
    
    // Reset
    updateProgress('cpu', 0);
    updateProgress('mem', 0);
    updateProgress('disk', 0);

    try {
        const res = await fetch(`${API_BASE}/metrics/${serverId}`);
        const data = await res.json();
        
        if(!data.message && data.length > 0) {
            const latest = data[0]; // Metrics are returned ordered by desc
            updateProgress('cpu', latest.cpu_usage);
            updateProgress('mem', latest.memory_usage);
            updateProgress('disk', latest.disk_usage);
        }
    } catch (err) {
        console.error('Error fetching metrics:', err);
    }
}

function updateProgress(type, value) {
    const bar = document.getElementById(`${type}-progress`);
    const text = document.getElementById(`${type}-text`);
    
    bar.style.width = `${value}%`;
    text.innerText = `${value}%`;
    
    bar.className = 'progress';
    if(value > 90) bar.classList.add('high');
    else if(value > 75) bar.classList.add('medium');
    else bar.classList.add('low');
}

function closeModal() {
    document.getElementById('metrics-modal').style.display = 'none';
}

// Initialization and automatic polling
document.addEventListener('DOMContentLoaded', () => {
    fetchServers();
    fetchAlerts();
    
    // Refresh every 10 seconds
    setInterval(() => {
        fetchServers();
        fetchAlerts();
    }, 10000);
});
