import urllib.request
import json

API_BASE = "http://localhost:8000/api"

def get_state():
    try:
        with urllib.request.urlopen(f"{API_BASE}/state") as response:
            if response.status != 200:
                print(f"Failed to fetch state: {response.status}")
                return None
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching state: {e}")
        return None

def delete_line(line_id):
    req = urllib.request.Request(f"{API_BASE}/lines/{line_id}", method="DELETE")
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"Successfully deleted line {line_id}")
                return True
            else:
                print(f"Failed to delete line {line_id}: {response.status}")
                return False
    except Exception as e:
        print(f"Error deleting line {line_id}: {e}")
        return False

def main():
    state = get_state()
    if not state or "lines" not in state:
        print("No state or lines found.")
        return

    lines = state["lines"]
    if len(lines) <= 1:
        print("Only 1 or fewer lines exist. No cleanup needed.")
        return

    print(f"Found {len(lines)} lines. Keeping the first one (1#) and deleting the rest.")
    
    # Keep the first one, delete the rest
    for i in range(1, len(lines)):
        line = lines[i]
        print(f"Deleting {i+1}# (ID: {line['id']}, Name: {line['name']})...")
        delete_line(line['id'])

    print("Cleanup complete.")

if __name__ == "__main__":
    main()
