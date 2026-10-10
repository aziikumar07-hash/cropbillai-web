# LEGACY: kept for reference only; not maintained. See tools/README.md.
import bpy
import os

# Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Set render engine to Cycles for better lighting, if available (fallback to Eevee)
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'CPU'

# Paths
input_folder = r"C:\Users\Administrator\Downloads\CropBillAI-3D-assets"
output_file = r"C:\Users\Administrator\Desktop\CropBillAI\site\assets\smart-farm-golden-hour.png"

# Import GLB files
# Let's import the smart-farm.glb first as the base
smart_farm_path = os.path.join(input_folder, "smart-farm.glb")
bpy.ops.import_scene.gltf(filepath=smart_farm_path)

# Let's import the plant and receipt to scatter or place them
plant_path = os.path.join(input_folder, "plant.glb")
bpy.ops.import_scene.gltf(filepath=plant_path)

receipt_path = os.path.join(input_folder, "receipt.glb")
bpy.ops.import_scene.gltf(filepath=receipt_path)

# Golden Hour Lighting
# Add a sun light
sun_data = bpy.data.lights.new(name="GoldenSun", type='SUN')
sun_data.energy = 3.5
# Golden color (warm orange/yellow)
sun_data.color = (1.0, 0.7, 0.3) 
sun_data.angle = 0.1 # Sharp shadows for late afternoon
sun_obj = bpy.data.objects.new(name="GoldenSun", object_data=sun_data)
bpy.context.collection.objects.link(sun_obj)

# Position sun for low angle (golden hour)
# Rotate it so it comes from a low angle on the horizon
import math
sun_obj.rotation_euler = (math.radians(75), 0, math.radians(45))

# Add a soft blue/purple fill light to simulate the sky opposite the sun
fill_data = bpy.data.lights.new(name="SkyFill", type='SUN')
fill_data.energy = 0.5
fill_data.color = (0.4, 0.5, 0.8)
fill_obj = bpy.data.objects.new(name="SkyFill", object_data=fill_data)
bpy.context.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (math.radians(135), 0, math.radians(-135))

# We need to position the camera so it sees the models.
# Since we don't know the exact scale of the GLB models, we can frame them.
bpy.ops.object.select_all(action='SELECT')
# Deselect lights
sun_obj.select_set(False)
fill_obj.select_set(False)

# Add a camera
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 35 # Slightly wide angle
cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Position camera roughly (we will use view_selected to frame it better if possible, 
# but view_selected only works in context of a 3D view which we don't have in background mode.
# Let's place it diagonally looking down slightly.
cam_obj.location = (8, -8, 6)
# Look at center
import mathutils
direction = mathutils.Vector((0, 0, 0)) - cam_obj.location
rot_quat = direction.to_track_quat('-Z', 'Y')
cam_obj.rotation_euler = rot_quat.to_euler()

# Render settings
bpy.context.scene.render.resolution_x = 1200
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.film_transparent = True
bpy.context.scene.render.filepath = output_file

# Render
bpy.ops.render.render(write_still=True)
print(f"Rendered Golden Hour Farm to {output_file}")
