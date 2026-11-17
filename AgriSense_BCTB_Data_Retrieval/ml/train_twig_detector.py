"""Train YOLOv8 using a labeled dataset described by a Ultralytics YAML file."""
import argparse
from ultralytics import YOLO

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Dataset YAML with train/val and class names")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    args = parser.parse_args()
    model = YOLO("yolov8n.pt")
    result = model.train(data=args.data, epochs=args.epochs, imgsz=args.imgsz, project="runs/twig", name="bctb-holes")
    print(f"Training finished. Copy {result.save_dir}/weights/best.pt to models/optional/twig_holes.pt")

if __name__ == "__main__":
    main()
