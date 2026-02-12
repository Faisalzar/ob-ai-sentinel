import os, cv2, uuid
os.environ['ROBOFLOW_API_KEY'] = 'RiAH9d9sVrQjjXrULxl5'
os.environ['ROBOFLOW_MODEL_ENDPOINT'] = 'gundetection-ydunq/2'
os.environ['ROBOFLOW_MODEL_GUNS'] = 'guns-30vbz/2'
os.environ['ROBOFLOW_MODEL_GUNS_DATASET'] = 'guns-dataset-1ggvd/1'
os.environ['ROBOFLOW_MODEL_THEFT'] = 'theft-detection-2jc5t/9'
os.environ['ROBOFLOW_MODEL_PERSON'] = 'person-voffo/3'
os.environ['ROBOFLOW_MODEL_HUMAN'] = 'human-az20v/4'
os.environ['ROBOFLOW_MODEL_CAR'] = 'car-detection-yd6mb/1'
os.environ['ROBOFLOW_MODEL_ANIMAL'] = 'animal-detection-ofnht/1'
os.environ['ROBOFLOW_MODEL_ANIMALS_ALT'] = 'animals-cq6th/3'
os.environ['ROBOFLOW_MODEL_LOGISTICS'] = 'logistics-sz9jr/2'
os.environ['ROBOFLOW_MODEL_PREMADE'] = 'premade-gduc5/3'
os.environ['CONFIDENCE_THRESHOLD'] = '0.12'
os.environ['IOU_THRESHOLD'] = '0.20'
os.environ['LOCAL_OUTPUT_PATH'] = 'outputs'
from backend.services.detection_service import detection_service
img_path = 'kf.jpg'
dets, img = detection_service.detect_image(img_path)
import os
out_dir = os.path.join('outputs', 'user_test')
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, f"{uuid.uuid4()}_annotated.jpg")
cv2.imwrite(out_path, img)
print('MODE:', detection_service.get_mode())
print('DETECTIONS:', len(dets))
print('OUT:', os.path.abspath(out_path))
for d in dets[:10]:
    print(d['class_name'], d['confidence'])
