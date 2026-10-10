import cv2
import os

assets_dir = r"C:\Users\Administrator\Desktop\CropBillAI\site\assets"
video_path = os.path.join(assets_dir, "Firefly Macro cinematic push-in (dolly forward) at ground level through pristine rows of healthy whe.mp4")
frames_dir = os.path.join(assets_dir, "frames")

if not os.path.exists(frames_dir):
    os.makedirs(frames_dir)

print(f"Opening video: {video_path}")
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error: Could not open video file.")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Video FPS: {fps}, Total Frames: {total_frames}")

# We want roughly 300 frames to keep the web page snappy.
# Let's see how many frames we have. If it's short (e.g. 5 seconds at 30fps = 150 frames), we extract all.
# If it's long, we can skip frames, but for scroll scrubbing, sequential frames are usually best.
# Let's extract them at max 1280px wide and save as JPG (since cv2 webp support can be tricky).

count = 0
frame_idx = 1
while True:
    ret, frame = cap.read()
    if not ret:
        break
        
    # Resize to 1280 wide to keep memory reasonable
    height, width = frame.shape[:2]
    if width > 1280:
        new_width = 1280
        new_height = int(height * (new_width / width))
        frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
    # Save as high quality JPG
    out_path = os.path.join(frames_dir, f"frame_{frame_idx:04d}.jpg")
    cv2.imwrite(out_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    
    frame_idx += 1
    count += 1
    if count % 50 == 0:
        print(f"Extracted {count} frames...")

cap.release()
print(f"Extraction complete! {count} frames generated in {frames_dir}.")
