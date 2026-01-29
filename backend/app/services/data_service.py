import os
import io
import csv
import shutil
import json
from datetime import datetime
from app.services.settings_service import DATA_DIR, SETTINGS_FILE

BACKUP_DIR = os.path.join(DATA_DIR, "backups")

class DataService:
    def __init__(self):
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR, exist_ok=True)

    def export_data(self, data_type: str, start_date: str, end_date: str) -> str:
        """
        Mock export data to CSV string.
        Real implementation would query database.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow(["Timestamp", "DeviceID", "Type", "Value", "Unit", "Status"])
        
        # Mock Data Generation
        # In a real app, parse start_date/end_date and query DB
        base_time = datetime.now().timestamp()
        
        for i in range(20):
            ts = datetime.fromtimestamp(base_time - i * 3600).isoformat()
            if data_type == 'temperature':
                writer.writerow([ts, "oven-1", "Temp", 350 + i, "C", "Normal"])
            else:
                writer.writerow([ts, "chamber-1", "Vacuum", 0.001 * (i+1), "Pa", "Normal"])
                
        return output.getvalue()

    def create_backup(self) -> str:
        """
        Create a backup of the settings file.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BACKUP_DIR, f"settings_backup_{timestamp}.json")
        try:
            if os.path.exists(SETTINGS_FILE):
                shutil.copy2(SETTINGS_FILE, backup_file)
                return f"Backup created: {os.path.basename(backup_file)}"
            else:
                # Create dummy if not exists
                with open(backup_file, 'w') as f:
                    json.dump({"note": "Empty backup"}, f)
                return f"Empty backup created: {os.path.basename(backup_file)}"
        except Exception as e:
            raise Exception(f"Backup failed: {str(e)}")

    def get_backups(self):
        """List available backups"""
        if not os.path.exists(BACKUP_DIR):
            return []
        files = sorted(os.listdir(BACKUP_DIR), reverse=True)
        return [{"filename": f, "size": os.path.getsize(os.path.join(BACKUP_DIR, f))} for f in files if f.endswith('.json')]
