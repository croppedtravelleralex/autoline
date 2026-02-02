import json
import os
import uuid
import time
from threading import RLock
from typing import List, Optional

from app.models import LineTemplate, Chamber, ChamberValves

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mes_data")
TEMPLATES_FILE = os.path.join(DATA_DIR, "line_templates.json")

class TemplateService:
    _instance = None
    _lock = RLock()
    
    def __new__(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(TemplateService, cls).__new__(cls)
                    cls._instance._load_templates()
        return cls._instance

    def _load_templates(self):
        self.templates: List[LineTemplate] = []
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
            
        if os.path.exists(TEMPLATES_FILE):
            try:
                with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.templates = [LineTemplate.model_validate(item) for item in data]
            except Exception as e:
                print(f"Error loading templates: {e}")
                self._init_defaults()
        else:
            self._init_defaults()

    def _init_defaults(self):
        # 初始默认模板
        self.templates = [
            LineTemplate(
                id="template-standard",
                name="标准产线模板",
                description="标准的连续线结构：包含进出样、烘烤、清刷、铟封。"
            )
        ]
        self._save_templates()

    def _save_templates(self):
        try:
            with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
                data = [t.model_dump() for t in self.templates]
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving templates: {e}")

    def get_all_templates(self) -> List[LineTemplate]:
        return self.templates

    def save_as_template(self, line_data, name: str, description: str = "") -> LineTemplate:
        template = LineTemplate(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            anodeChambers=line_data.anodeChambers,
            cathodeChambers=line_data.cathodeChambers
        )
        self.templates.append(template)
        self._save_templates()
        return template

    def delete_template(self, template_id: str) -> bool:
        initial_len = len(self.templates)
        self.templates = [t for t in self.templates if t.id != template_id]
        if len(self.templates) < initial_len:
            self._save_templates()
            return True
        return False

    def get_template(self, template_id: str) -> Optional[LineTemplate]:
        return next((t for t in self.templates if t.id == template_id), None)

def get_template_service():
    return TemplateService()
