import os
import subprocess

assets_dir = r"C:\Users\Administrator\Desktop\CropBillAI\site\assets"
video_path = os.path.join(assets_dir, "Firefly Macro cinematic push-in (dolly forward) at ground level through pristine rows of healthy whe.mp4")
frames_dir = os.path.join(assets_dir, "frames")

if not os.path.exists(frames_dir):
    os.makedirs(frames_dir)

# Extract frames using ffmpeg. Scale to max 1280px wide to save memory/bandwidth, save as quality webp
# -r 24 to force 24fps extraction to limit the total number of frames.
command = [
    'ffmpeg', '-i', video_path, 
    '-vf', 'scale=1280:-1', 
    '-r', '24', 
    '-vcodec', 'webp', 
    '-qscale', '75',
    os.path.join(frames_dir, 'frame_%04d.webp')
]

try:
    print("Extracting frames...")
    subprocess.run(command, check=True)
    
    # Count frames
    frame_count = len([f for f in os.listdir(frames_dir) if f.endswith('.webp')])
    print(f"Extraction complete! {frame_count} frames generated.")
except Exception as e:
    print(f"Error extracting frames: {e}")
