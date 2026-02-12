# train.py
from ultralytics import YOLO

def train_model():
    # Step 1: Ek pre-trained YOLOv8 model load karein.
    # Hum 'yolov8l.pt' (Large) model se shuruaat kar rahe hain.
    model = YOLO('yolov8l.pt')

    # Step 2: Apne dataset par model ko train karein.
    # 'data' ki value ko apni data.yaml file ke path se badlein.
    # epochs ka matlab hai ki model poore dataset ko kitni baar dekhega.
    print("Training shuru ho rahi hai... Ismein kai ghante lag sakte hain.")
    results = model.train(
        data='Gun-Detection-1/data.yaml',  # <-- YAHAN PATH BADLEIN
        epochs=100, 
        imgsz=640
    )
    print("Training poori ho gayi hai!")

if __name__ == '__main__':
    train_model()