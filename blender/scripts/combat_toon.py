"""Shared cel-shaded render settings for the hound and expedition boss."""
import bpy
import toon

def setup(scene):
    scene.render.engine='CYCLES'
    scene.cycles.samples=1
    scene.cycles.use_denoising=False
    scene.render.film_transparent=True
    scene.view_settings.view_transform='Standard'
    # The same quantized normal-light shader used by the undead sprites.
    toon.toonify(scene,bands=(.42,.72,1.0),thick=.65,line=(.12,.15,.20))
    lines=bpy.context.view_layer.freestyle_settings.linesets[0]
    lines.select_crease=False
    lines.select_border=False
    scene['combat_shader']='cel-three-bands-v1'

def save_editable(scene,filepath):
    setup(scene)
    # Opening the .blend in Material Preview/Rendered shows the actual bands.
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.shading.type='MATERIAL'
    bpy.ops.wm.save_as_mainfile(filepath=filepath)
