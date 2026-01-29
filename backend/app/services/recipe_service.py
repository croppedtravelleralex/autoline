import json
import os
import uuid
from threading import Lock
from typing import List, Optional

from app.models import Recipe

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "mes_data")
RECIPES_FILE = os.path.join(DATA_DIR, "recipes.json")

class RecipeService:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(RecipeService, cls).__new__(cls)
                    cls._instance._load_recipes()
        return cls._instance

    def _load_recipes(self):
        self.recipes: List[Recipe] = []
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
            
        if os.path.exists(RECIPES_FILE):
            try:
                with open(RECIPES_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.recipes = [Recipe.model_validate(item) for item in data]
            except Exception as e:
                print(f"Error loading recipes, initializing defaults: {e}")
                self._init_defaults()
        else:
            self._init_defaults()

    def _init_defaults(self):
        # Default Anode Recipe
        default_anode = Recipe(
            id="rec-anode-default",
            name="阳极标准工艺 v1.0",
            version="1.0",
            isDefault=True,
            targetLineType="anode",
            bakeDuration=15.0,
            growthDuration=0.0, # Not used
            eGunVoltage=5.0,
            eGunCurrent=300.0,
            indiumTemp=100.0,
            sealPressure=1200.0,
            csCurrent=0.0,
            o2Pressure=0.0,
            photoCurrent=0.0,
            bakeTargetTemp=390.0
        )
        
        # Default Cathode Recipe
        default_cathode = Recipe(
            id="rec-cathode-default",
            name="阴极标准工艺 v1.0",
            version="1.0",
            isDefault=True,
            targetLineType="cathode",
            bakeDuration=24.0,
            growthDuration=12.0,
            eGunVoltage=0.0,
            eGunCurrent=0.0,
            indiumTemp=0.0,
            sealPressure=0.0,
            csCurrent=4.0,
            o2Pressure=2e-5,
            photoCurrent=550.0,
            bakeTargetTemp=420.0,
            growthTargetTemp=110.0
        )
        
        self.recipes = [default_anode, default_cathode]
        self.save_recipes()

    def get_all_recipes(self) -> List[Recipe]:
        return self.recipes

    def get_recipe(self, recipe_id: str) -> Optional[Recipe]:
        return next((r for r in self.recipes if r.id == recipe_id), None)
        
    def get_default_recipe(self, line_type: str) -> Optional[Recipe]:
        return next((r for r in self.recipes if r.isDefault and r.targetLineType == line_type), None)

    def create_recipe(self, recipe: Recipe) -> Recipe:
        with self._lock:
            # If set as default, unset others of same type
            if recipe.isDefault:
                for r in self.recipes:
                    if r.targetLineType == recipe.targetLineType:
                        r.isDefault = False
            
            # Ensure unique ID if not provided (though model requires it)
            if not recipe.id:
                recipe.id = f"rec-{uuid.uuid4().hex[:8]}"
            
            self.recipes.append(recipe)
            self.save_recipes()
        return recipe

    def update_recipe(self, recipe_id: str, updates: Recipe) -> Optional[Recipe]:
        with self._lock:
            idx = next((i for i, r in enumerate(self.recipes) if r.id == recipe_id), -1)
            if idx == -1:
                return None
            
            # Handle default toggle logic
            if updates.isDefault:
                for r in self.recipes:
                    if r.targetLineType == updates.targetLineType and r.id != recipe_id:
                        r.isDefault = False
            
            self.recipes[idx] = updates
            self.save_recipes()
            return updates

    def delete_recipe(self, recipe_id: str) -> bool:
        with self._lock:
            initial_len = len(self.recipes)
            self.recipes = [r for r in self.recipes if r.id != recipe_id]
            if len(self.recipes) < initial_len:
                self.save_recipes()
                return True
            return False

    def save_recipes(self):
        try:
            with open(RECIPES_FILE, 'w', encoding='utf-8') as f:
                # model_dump_json for list? Pydantic V2
                 # Manually dump list of dicts
                data = [r.model_dump() for r in self.recipes]
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving recipes: {e}")

# Global helper to get instance easily if needed (or just use class singleton)
def get_recipe_service():
    return RecipeService()
