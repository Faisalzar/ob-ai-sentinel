
import sys
import os
from unittest.mock import MagicMock

# Add project root
sys.path.append(os.getcwd())

# Mock the heavy detection service
sys.modules['backend.services'] = MagicMock()
sys.modules['backend.services.detection_service'] = MagicMock()
sys.modules['backend.services.email_service'] = MagicMock()
sys.modules['backend.models'] = MagicMock()
sys.modules['backend.models.models'] = MagicMock()
sys.modules['backend.db'] = MagicMock()
sys.modules['backend.db.base'] = MagicMock()
sys.modules['cv2'] = MagicMock()

try:
    # Import the api router directly
    from backend.api.v1.api import api_router
    
    print("Registered API Routes:")
    for route in api_router.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            print(f"{methods} {route.path}")
        else:
            print(f"Route: {route.path}")

except ImportError as e:
    print(f"Failed to import api_router: {e}")
except Exception as e:
    print(f"Error inspecting router: {e}")
