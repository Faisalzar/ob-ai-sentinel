"""
Detect objects from 1.jpg and open the annotated image
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

from backend.services.detection_service import detection_service
import cv2
import subprocess

def detect_and_display():
    """Detect from 1.jpg and open result"""
    
    # Input image
    image_path = "1.jpg"
    
    if not os.path.exists(image_path):
        print(f"❌ Error: {image_path} not found!")
        return
    
    print(f"🔍 Detecting objects from: {image_path}")
    print(f"📊 Using detection mode: {detection_service.get_mode()}")
    print("-" * 50)
    
    try:
        # Run detection
        detections, annotated_img = detection_service.detect_image(image_path)
        
        # Save annotated image
        output_path = "1_annotated.jpg"
        cv2.imwrite(output_path, annotated_img)
        
        # Get summary
        summary = detection_service.get_detection_summary(detections)
        
        # Display results
        print(f"\n✅ Detection Complete!")
        print(f"📊 Total Detections: {summary['total_detections']}")
        print(f"🔴 Dangerous: {summary['dangerous_count']}")
        print(f"🟡 Caution: {summary['caution_count']}")
        print(f"🟢 Harmless: {summary['harmless_count']}")
        print(f"\n📋 Objects Detected: {', '.join(summary['classes_detected'])}")
        
        print(f"\n📝 Detection Details:")
        print("-" * 50)
        for i, det in enumerate(detections, 1):
            threat_emoji = "🔴" if det['threat_level'] == 'dangerous' else "🟡" if det['threat_level'] == 'caution' else "🟢"
            print(f"{i}. {threat_emoji} {det['class_name']}")
            print(f"   Confidence: {float(det['confidence'])*100:.2f}%")
            print(f"   Threat Level: {det['threat_level']}")
            print()
        
        if summary['has_dangerous_objects']:
            print("⚠️  WARNING: DANGEROUS OBJECTS DETECTED!")
            print(f"   Objects: {', '.join(summary['dangerous_objects'])}")
        
        print(f"\n💾 Annotated image saved: {output_path}")
        print(f"🖼️  Opening image...")
        
        # Open the annotated image
        abs_path = os.path.abspath(output_path)
        subprocess.run(['start', '', abs_path], shell=True)
        
        print(f"✅ Done!")
        
    except Exception as e:
        print(f"❌ Error during detection: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    detect_and_display()
