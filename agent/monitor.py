import psutil
import requests
import time
import json
import uuid

# Configuration
SERVER_NAME = "Main Web Server"
IP_ADDRESS = "192.168.1.100"
LOCATION = "Data Center 1"
BACKEND_URL = "http://localhost:3000/api"

# Global state to keep track of the registered server ID
server_id = None

def register_server():
    global server_id
    payload = {
        "server_name": SERVER_NAME,
        "ip_address": IP_ADDRESS,
        "location": LOCATION
    }
    try:
        print(f"[{time.strftime('%X')}] Registering server...")
        response = requests.post(f"{BACKEND_URL}/servers", json=payload)
        response.raise_for_status()
        print(f"[{time.strftime('%X')}] Server registered successfully!")
        
        # After registering, fetch all servers and find our ID based on IP
        servers_resp = requests.get(f"{BACKEND_URL}/servers")
        servers_resp.raise_for_status()
        servers = servers_resp.json()
        
        # In a real scenario, the backend would return the new ID directly,
        # but matching our IP is a workaround based on the current Node.js API
        for srv in servers:
            if srv['ip_address'] == IP_ADDRESS:
                server_id = srv['server_id']
                print(f"[{time.strftime('%X')}] Assigned server_id: {server_id}")
                return True
        return False
    except Exception as e:
        print(f"[{time.strftime('%X')}] Error registering server: {e}")
        return False

def collect_metrics():
    # Gather CPU
    cpu_usage = psutil.cpu_percent(interval=1)
    
    # Gather Memory
    memory = psutil.virtual_memory()
    memory_usage = memory.percent
    
    # Gather Disk
    disk = psutil.disk_usage('/')
    disk_usage = disk.percent
    
    return {
        "cpu": cpu_usage,
        "memory": memory_usage,
        "disk": disk_usage,
        "server_id": server_id
    }

def send_metrics(metrics):
    try:
        response = requests.post(f"{BACKEND_URL}/metrics", json=metrics)
        response.raise_for_status()
        print(f"[{time.strftime('%X')}] Metrics sent: CPU={metrics['cpu']}%, RAM={metrics['memory']}%, DISK={metrics['disk']}%")
    except Exception as e:
        print(f"[{time.strftime('%X')}] Failed to send metrics: {e}")

if __name__ == "__main__":
    print("Starting Monitoring Agent...")
    
    # Wait until backend is up and we register
    while not server_id:
        if not register_server():
            time.sleep(5)
    
    # Main loop
    while True:
        metrics = collect_metrics()
        send_metrics(metrics)
        time.sleep(10) # Send data every 10 seconds
