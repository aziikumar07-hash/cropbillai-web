# LEGACY: kept for reference only; not maintained. See tools/README.md.
import bpy
import os
import math

# Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Set render engine to Cycles for better lighting, if available (fallback to Eevee)
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'CPU'

# Paths
base_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd()
svg_path = os.path.join(base_dir, "site", "assets", "logo-mark.svg")
out_path = os.path.join(base_dir, "site", "assets", "logo-3d.png")

# Import SVG
bpy.ops.import_curve.svg(filepath=svg_path)

# Delete default collection created by SVG importer to just keep the curves
# Wait, SVG importer puts curves in a collection based on filename.

# Find the imported curves
curves = [obj for obj in bpy.context.scene.objects if obj.type == 'CURVE']

# The logo has:
# 1-4: Scan corners (stroke)
# 5: Leaf (fill)
# 6: Vein (stroke)

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16)/255.0 for i in (0, 2, 4)) + (1.0,)

# Create Materials
mat_bracket = bpy.data.materials.new(name="BracketMat")
mat_bracket.use_nodes = True
bsdf = mat_bracket.node_tree.nodes.get("Principled BSDF")
bsdf.inputs['Base Color'].default_value = hex_to_rgb('#1F4D2B')
bsdf.inputs['Roughness'].default_value = 0.3
bsdf.inputs['Metallic'].default_value = 0.2

mat_leaf = bpy.data.materials.new(name="LeafMat")
mat_leaf.use_nodes = True
bsdf_leaf = mat_leaf.node_tree.nodes.get("Principled BSDF")
bsdf_leaf.inputs['Base Color'].default_value = hex_to_rgb('#3FA34D')
bsdf_leaf.inputs['Roughness'].default_value = 0.2
bsdf_leaf.inputs['Metallic'].default_value = 0.1

mat_vein = bpy.data.materials.new(name="VeinMat")
mat_vein.use_nodes = True
bsdf_vein = mat_vein.node_tree.nodes.get("Principled BSDF")
bsdf_vein.inputs['Base Color'].default_value = hex_to_rgb('#FBF8F1')
bsdf_vein.inputs['Roughness'].default_value = 0.4
bsdf_vein.inputs['Metallic'].default_value = 0.0

# Process curves
# SVG origins are often weird, let's select all and set origin to geometry
for c in curves:
    c.select_set(True)
    # Extrude
    c.data.extrude = 0.015
    c.data.bevel_depth = 0.002
    c.data.resolution_u = 32

bpy.context.view_layer.objects.active = curves[0]
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='MEDIAN')

# We need to assign materials.
# Based on the SVG:
# Paths 1, 2, 3, 4 are brackets (fill="none", stroke="#1F4D2B")
# Path 5 is leaf (fill="#3FA34D")
# Path 6 is vein (fill="none", stroke="#FBF8F1")

# The SVG importer usually names them Curve, Curve.001, etc.
# We can sort them by name or look at their geometry.
curves.sort(key=lambda x: x.name)

for i, c in enumerate(curves):
    if len(c.data.materials) == 0:
        c.data.materials.append(None)
    
    if i < 4:
        c.data.materials[0] = mat_bracket
    elif i == 4:
        c.data.materials[0] = mat_leaf
        c.data.extrude = 0.01 # slightly thinner
    elif i == 5:
        c.data.materials[0] = mat_vein
        c.data.extrude = 0.018 # sticks out
        c.data.bevel_depth = 0.004

# Group them and center them
bpy.ops.object.select_all(action='DESELECT')
for c in curves:
    c.select_set(True)

# Join them into one or just move them? 
# SVG is usually imported very small. Scale it up.
bpy.ops.transform.resize(value=(50, 50, 50))
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='MEDIAN')

# Center to world
for c in curves:
    c.location.x = 0
    c.location.y = 0
    # SVG imports flat on XY plane
    
# Rotate to face camera
bpy.ops.transform.rotate(value=math.radians(90), orient_axis='X')
# Add a slight tilt for 3D effect
bpy.ops.transform.rotate(value=math.radians(-15), orient_axis='Y')
bpy.ops.transform.rotate(value=math.radians(15), orient_axis='X')


# Add lighting
light_data = bpy.data.lights.new(name="Sun", type='SUN')
light_data.energy = 5.0
light_data.angle = math.radians(15)
light_obj = bpy.data.objects.new(name="Sun", object_data=light_data)
bpy.context.collection.objects.link(light_obj)
light_obj.location = (5, -5, 5)
light_obj.rotation_euler = (math.radians(45), 0, math.radians(45))

light_data2 = bpy.data.lights.new(name="Fill", type='AREA')
light_data2.energy = 100.0
light_data2.size = 5.0
light_obj2 = bpy.data.objects.new(name="Fill", object_data=light_data2)
bpy.context.collection.objects.link(light_obj2)
light_obj2.location = (-5, -2, 2)
light_obj2.rotation_euler = (math.radians(60), 0, math.radians(-30))

# Setup Camera
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = (0, -3.5, 0)
cam_obj.rotation_euler = (math.radians(90), 0, 0)

# Render settings
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.film_transparent = True
bpy.context.scene.render.filepath = out_path

# Render
bpy.ops.render.render(write_still=True)

print(f"Rendered to {out_path}")
