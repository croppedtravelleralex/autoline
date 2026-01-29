import json
import os
from threading import Lock
from typing import Optional

from app.models import SystemSettings, NotificationSettings, AlarmThresholds

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mes_data")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

class SettingsService:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(SettingsService, cls).__new__(cls)
                    cls._instance._load_settings()
        return cls._instance

    def _load_settings(self):
        self.settings = SystemSettings() # Default
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
            
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.settings = SystemSettings.model_validate(data)
            except Exception as e:
                print(f"Error loading settings, using defaults: {e}")
                # Save defaults if load fails
                self.save_settings(self.settings)
        else:
            # Initialize with defaults
            self.save_settings(self.settings)

    def get_settings(self) -> SystemSettings:
        return self.settings

    def update_settings(self, new_settings: SystemSettings) -> SystemSettings:
        with self._lock:
            self.settings = new_settings
            self.save_settings(self.settings)
        return self.settings

    def save_settings(self, settings: SystemSettings):
        try:
            with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
                f.write(settings.model_dump_json(indent=2))
        except Exception as e:
            print(f"Error saving settings: {e}")
