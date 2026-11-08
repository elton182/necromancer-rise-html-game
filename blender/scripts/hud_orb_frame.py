"""Molduras de bronze dos orbes do HUD da v2, a partir do relevo gerado pelo Tripo.

Fonte: examples/hud_orb_frame_tripo.glb (HUD inteiro em relevo, fornecido pelo usuário).
Separa só as peças de bronze em volta de cada orbe; descarta as esferas (com texto
pintado), a bandeira vermelha e a poção. Renderiza cada lado de frente, em câmera
ortográfica e fundo transparente, e salva a cena editável.

Saídas:
  frames/hud_orb_frame/left.png, right.png   (1024 px; o recorte do vidro fica no empacotador)
  frames/hud_orb_frame/render.json           (centro e raio do orbe em pixels)
  models/hud_orb_frame.blend

Uso (raiz do projeto):
  blender --background --python blender/scripts/hud_orb_frame.py
  python blender/scripts/pack_hud_orb_frame.py
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

BLENDER = Path(__file__).resolve().parents[1]
SOURCE = BLENDER / "examples" / "hud_orb_frame_tripo.glb"
FRAMES = BLENDER / "frames" / "hud_orb_frame"
SCENE_FILE = BLENDER / "models" / "hud_orb_frame.blend"

SIZE = 1024          # pixels do render
ORTHO = 0.27         # metros cobertos pela câmera (a moldura mede ~0,24 x 0,17 m)
SPHERES = {"tripo_part_9": "L", "tripo_part_7": "R"}  # esferas com texto pintado


def world_bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return (Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
            Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))))


def average_color(obj):
    for mat in obj.data.materials:
        if mat and mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == "TEX_IMAGE" and node.image:
                    px = node.image.pixels[:]
                    n = len(px) // 4
                    return [sum(px[i::4]) / n for i in range(3)]
    return [0.0, 0.0, 0.0]


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    scene = bpy.context.scene
    meshes = [o for o in scene.objects if o.type == "MESH"]

    spheres = {SPHERES[o.name]: o for o in meshes if o.name in SPHERES}
    centers = {}
    for side, sphere in spheres.items():
        lo, hi = world_bounds([sphere])
        centers[side] = ((lo.x + hi.x) / 2, (lo.z + hi.z) / 2, (hi.x - lo.x + hi.z - lo.z) / 4)

    groups = {"L": [], "R": []}
    for obj in meshes:
        if obj.name in SPHERES:
            continue
        lo, hi = world_bounds([obj])
        cx = (lo.x + hi.x) / 2
        r, g, b = average_color(obj)
        if r > 2.5 * max(g, b, 0.01):      # bandeira vermelha atrás do orbe
            continue
        if cx < -0.295 or obj.name == "tripo_part_1":  # tripo_part_1: arco de cima que avança para a barra
            groups["L"].append(obj)
        elif cx > 0.295:
            groups["R"].append(obj)

    for obj in meshes:
        if obj not in groups["L"] and obj not in groups["R"]:
            bpy.data.objects.remove(obj, do_unlink=True)

    collections = {}
    for side, objs in groups.items():
        col = bpy.data.collections.new("orb_frame_" + side)
        scene.collection.children.link(col)
        for obj in objs:
            for c in list(obj.users_collection):
                c.objects.unlink(obj)
            col.objects.link(obj)
        collections[side] = col

    cam_data = bpy.data.cameras.new("hud_orb_cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = ORTHO
    cam = bpy.data.objects.new("hud_orb_cam", cam_data)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam

    sun_data = bpy.data.lights.new("hud_orb_sun", "SUN")
    sun_data.energy = 5.0
    sun = bpy.data.objects.new("hud_orb_sun", sun_data)
    sun.rotation_euler = (math.radians(60), math.radians(-25), math.radians(-20))
    scene.collection.objects.link(sun)

    world = bpy.data.worlds.new("hud_orb_world")
    world.use_nodes = True
    background = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    background.inputs[0].default_value = (1, 1, 1, 1)
    background.inputs[1].default_value = 1.35
    scene.world = world

    render = scene.render
    render.resolution_x = render.resolution_y = SIZE
    render.resolution_percentage = 100
    render.film_transparent = True
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            render.engine = engine
            break
        except TypeError:
            continue
    scene.view_settings.view_transform = "Standard"
    render.image_settings.file_format = "PNG"
    render.image_settings.color_mode = "RGBA"

    FRAMES.mkdir(parents=True, exist_ok=True)
    layer = scene.view_layers[0]
    meta = {"size": SIZE, "orthoScale": ORTHO, "sides": {}}
    for side, name in (("L", "left"), ("R", "right")):
        for lc in layer.layer_collection.children:
            lc.exclude = lc.name != "orb_frame_" + side
        cx, cz, radius = centers[side]
        cam.location = (cx, -1.0, cz)
        render.filepath = str(FRAMES / (name + ".png"))
        bpy.ops.render.render(write_still=True)
        meta["sides"][name] = {"centerPx": [SIZE / 2, SIZE / 2], "sphereRadiusPx": radius / ORTHO * SIZE,
                               "parts": len(groups[side])}
    for lc in layer.layer_collection.children:
        lc.exclude = False
    (FRAMES / "render.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    SCENE_FILE.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(SCENE_FILE))
    print("hud_orb_frame:", json.dumps(meta))


main()
