
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.state_service import StateService
from app.models import Chamber

def test_duplicate():
    service = StateService()
    # Create a line if not exists
    if not service.state.lines:
        service.create_line("anode", "Test Line")
    
    line_id = service.state.lines[0].id
    print(f"Duplicating line {line_id}...")
    try:
        service.duplicate_line(line_id)
        print("Success!")
    except Exception as e:
        print(f"Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_duplicate()
