
import sys
import os
import time
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models import Recipe
from app.services.recipe_service import RecipeService
from app.services.state_service import StateService
from app.services.simulation_service import SimulationService

def test_recipe_flow():
    print("Initializing Services...")
    recipe_service = RecipeService()
    state_service = StateService()
    sim_service = SimulationService() # Uses singleton StateService internally
    # SimulationService() is not a singleton but StateService is.
    # Actually SimulationService in main.py is instantiated as SimulationService().
    # Actually SimulationService in main.py is instantiated as SimulationService(state_service).
    # Let's check constructor signature.

    # 1. Create a Test Recipe
    print("Creating Test Recipe...")
    test_recipe = Recipe(
        id="test-recipe-001",
        name="Test Recipe",
        version="0.1",
        isDefault=False,
        targetLineType="anode",
        bakeDuration=0.1, # Short duration for testing
        growthDuration=0.0,
        eGunVoltage=10.0,
        eGunCurrent=100.0,
        indiumTemp=150.0,
        sealPressure=1000.0,
        csCurrent=0.0,
        o2Pressure=0.0,
        photoCurrent=0.0,
        bakeTargetTemp=400.0, # Target
        growthTargetTemp=0.0
    )
    recipe_service.create_recipe(test_recipe)
    
    # Verify it exists
    fetched = recipe_service.get_recipe("test-recipe-001")
    assert fetched is not None
    assert fetched.bakeTargetTemp == 400.0
    print("Recipe Created successfully.")

    # 2. Create a Cart using this recipe
    # Find Anode In-feed chamber
    anode_line = state_service.state.lines[0] # Assuming at least one line
    in_feed_chamber = anode_line.anodeChambers[0] # s-jlc
    
    print(f"Creating Cart in {in_feed_chamber.id} with recipe {test_recipe.id}...")
    try:
        cart = state_service.create_cart(
            line_id=anode_line.id,
            chamber_id=in_feed_chamber.id,
            mes_data={"recipeId": test_recipe.id, "batchNo": "TEST-001"}
        )
    except ValueError as e:
        print(f"Create Cart failed: {e}")
        # Might fail if cart already there. Clear carts first?
        # state_service.state.carts = [] # Force clear for test
        # Retry
        if '已有小车' in str(e):
             state_service.state.carts = [c for c in state_service.state.carts if c.locationChamberId != in_feed_chamber.id]
             cart = state_service.create_cart(
                line_id=anode_line.id,
                chamber_id=in_feed_chamber.id,
                mes_data={"recipeId": test_recipe.id, "batchNo": "TEST-001"}
            )
             
    assert cart.recipeId == test_recipe.id
    assert cart.targetTemp == 400.0
    # Steps should reflect 0.1h bake duration (6 min)
    bake_step = next(s for s in cart.steps if '烘烤' in s.name)
    # 0.1h = 6m. fmt_dur uses int math? 0h 6m
    print(f"Cart Created. Target Temp: {cart.targetTemp}, Bake Duration String: {bake_step.estimatedDuration}")
    
    # 3. Simulate Temperature
    # Update simulation to see if chamber target temp changes
    print("Simulating...")
    # Simulation logic checks cart in chamber.
    # cart is in in_feed_chamber (s-jlc). logic might be generic "bake" check?
    # In simulation_service.py: if '烘烤' in task_name or 'bake' in chamber.type.value
    # s-jlc is 'loading_chamber'? type='section_chamber'?
    # Let's check chamber type of s-jlc. usually 'vacuum_chamber' or something.
    # In default data, s-jlc is 'loading_chamber'? 
    # Wait, create_cart sets task to "烘烤工艺" immediately? 
    # In StateService: 
    # ProcessStep(id='s1', name='进样', status='completed' ...
    # ProcessStep(id='s2', name='烘烤工艺', status='active' ...
    # So currentTask is "烘烤工艺".
    
    # If chamber logic supports it. 
    # SimulationService: if '烘烤' in task_name or 'bake' in chamber.type.value:
    # So if task name has '烘烤', it should trigger logic.
    
    for _ in range(5):
        sim_service._simulate_temperature(1.0) # 1 sec tick
    
    # Check chamber temp
    chamber = next(c for c in anode_line.anodeChambers if c.id == in_feed_chamber.id)
    print(f"Chamber Temp after sim: {chamber.temperature:.2f} (Init 25.0)")
    
    # logic: target_inner = recipe.bakeTargetTemp (400) if in heat phase.
    # alpha = 1/300. Temp should rise.
    # 25 + (400-25)*alpha approx 25 + 375/300 = 26.25
    
    if chamber.temperature > 25.5:
        print("PASS: Chamber temperature is rising according to recipe.")
    else:
        print("FAIL: Chamber temperature did not rise significantly.")
    
    # Clean up
    recipe_service.delete_recipe(test_recipe.id)
    state_service.delete_cart(cart.id)
    print("Test Completed.")

if __name__ == "__main__":
    test_recipe_flow()
