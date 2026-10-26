"""Matte, volume-readable Zephyr materials and reproducible sprite studio.
Only the reference Zephyr generator calls this module; geometry and actions stay intact.
"""
import bpy
from mathutils import Vector
import common as c

COLORS = {
 'zephyr_hood': '#794da8', 'zephyr_hood_edge': '#ab83cc',
 'zephyr_face': '#100e1b', 'zephyr_mantle': '#593779',
 'zephyr_sleeves': '#825b9b', 'zephyr_gloves': '#403b49',
 'zephyr_robe': '#6d3e92', 'zephyr_panel': '#8c5aaa',
 'zephyr_inner_panel': '#3b2853', 'zephyr_belt': '#58442f',
 'zephyr_buckle': '#b5a078', 'zephyr_boots': '#35303a',
 'zephyr_staff': '#65533e',
}

def apply(body):
 """Split existing face materials by anatomical weights; never change vertices/weights."""
 original = [m.name for m in body.data.materials]
 slots = {}
 for name, color in COLORS.items():
  material = c.mat(name, color, rough=.92, metal=0)
  material.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0
  body.data.materials.append(material)
  slots[name] = len(body.data.materials)-1
 groups = {g.index:g.name for g in body.vertex_groups}
 body.data.update()
 for poly in body.data.polygons:
  old = original[poly.material_index]
  weights = {}
  for vi in poly.vertices:
   for weight in body.data.vertices[vi].groups:
    name = groups[weight.group]
    weights[name] = weights.get(name, 0)+weight.weight
  bone = max(weights, key=weights.get) if weights else ''
  target = None
  if old == 'face': target = 'zephyr_face'
  elif old == 'robe':
   target = ('zephyr_hood' if bone=='head' else
             'zephyr_sleeves' if bone.startswith(('arm.', 'forearm.')) else
             'zephyr_gloves' if bone.startswith('hand.') else
             'zephyr_mantle' if bone=='chest' else 'zephyr_robe')
   if bone=='hips' and abs(poly.center.x)>.23: target='zephyr_panel'
  elif old == 'robebright': target = 'zephyr_hood_edge' if bone=='head' else 'zephyr_panel'
  elif old == 'robeshade': target = 'zephyr_gloves' if bone.startswith(('hand.', 'forearm.')) else 'zephyr_inner_panel'
  elif old == 'strap': target = 'zephyr_belt'
  elif old == 'gold': target = 'zephyr_buckle'
  elif old == 'boots': target = 'zephyr_boots'
  elif old == 'wood': target = 'zephyr_staff'
  if target: poly.material_index = slots[target]
 # Only the eyes and crystal emit. No bloom or body-wide emission.
 for name, strength in [('reference_eyes', .45), ('reference_crystal', .35)]:
  c.MATS[name].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = strength


def studio(scene):
 """Soft key, low fill and rim: readable facets in all eight baked directions."""
 scene.cycles.samples = 32
 scene.cycles.use_denoising = False
 scene.world = bpy.data.worlds.new('Zephyr sprite studio')
 scene.world.use_nodes = True
 background = scene.world.node_tree.nodes['Background']
 background.inputs['Color'].default_value = (.59, .62, .70, 1)
 background.inputs['Strength'].default_value = .32
 for name, location, energy, size in [
  ('Zephyr key', (-3,-4,6), 550, 3),
  ('Zephyr fill', (4,-2,4), 160, 4),
  ('Zephyr rim', (1,3,5), 280, 3),
 ]:
  bpy.ops.object.light_add(type='AREA', location=location)
  lamp = bpy.context.object
  lamp.name = name
  lamp.data.energy = energy
  lamp.data.shape = 'DISK'
  lamp.data.size = size
  lamp.rotation_euler = (Vector((0,0,1.2))-lamp.location).to_track_quat('-Z','Y').to_euler()
