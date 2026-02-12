
import sys
import os

# Add the project root to sys.path so we can import backend
sys.path.append(os.getcwd())

try:
    from main import app
    
    print("Registered Routes:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            print(f"{methods} {route.path}")
        else:
            print(f"Route: {route.path}")
            
except ImportError as e:
    print(f"Failed to import app: {e}")
except Exception as e:
    print(f"Error inspecting routes: {e}")
