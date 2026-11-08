"""Clipes de jogo da Flora (druida) e da forma de lobisomem, e export GLB para a v2.

Aditivo: opera sobre o .blend aberto (models/flora_druid.blend ou models/flora_werewolf.blend),
cria ou substitui só os clipes listados aqui e preserva idle/walk/attack/death do estudo original.
Executar na sessão do Blender via MCP:
    exec(compile(open(p).read(), p, 'exec'), {'__file__': p, '__name__': '__main__'})
Também funciona em background: blender models/flora_druid.blend --python scripts/flora_game_motion.py

As poses são rotações no espaço do armature (graus, eixos X/Y/Z do rig), aplicadas sobre a pose
pai de cada osso. O modelo olha para -Y: rotação +X inclina o tronco para a frente e leva um braço
pendente para trás; rotação +Y abre o braço do lado -X (armL) para fora.
"""
import bpy, json, math, shutil, datetime
from pathlib import Path
from mathutils import Euler, Vector

ROOT = Path(__file__).resolve().parents[1]
FPS = 24

def P(**bones):
    return bones

# ── Flora (forma humana) ───────────────────────────────────────────────────────
# armL segura o cajado (lado -X); handL compensa para o cajado ficar de pé quando o braço sobe.
DRUID = {
    # Faísca e Corrente: o cajado aponta para o alvo. Liberação no quadro 5 (0,17 s de 0,45 s).
    'cast': (11, [
        (1, P()),
        (3, P(chest=(-6, 0, -10), head=(4, 0, 8), armL=(18, 8, 0), handL=(-6, 0, 0), armR=(-8, -10, 0))),
        (5, P(hips=(0, 0, 8), chest=(10, 0, 14), head=(-6, 0, -12), armL=(-46, 4, -8), handL=(116, 0, 0),
              armR=(-22, -22, 0), handR=(-20, 0, 0), legL=(-6, 0, 0), legR=(6, 0, 0))),
        (8, P(hips=(0, 0, 6), chest=(7, 0, 10), head=(-4, 0, -9), armL=(-38, 4, -6), handL=(104, 0, 0),
              armR=(-14, -16, 0), handR=(-12, 0, 0), legL=(-4, 0, 0), legR=(4, 0, 0))),
        (11, P()),
    ]),
    # Tempestade e Rejuvenescer: ergue o cajado acima da cabeça. Liberação no quadro 10 (0,4 s de 0,7 s).
    'cast_up': (17, [
        (1, P()),
        (6, P(hips=(0, 0, 0), _hipsZ=-0.08, chest=(14, 0, 0), head=(10, 0, 0), armL=(-10, 24, 0), handL=(0, -24, 0),
              armR=(-10, -24, 0), legL=(-18, 0, 0), footL=(26, 0, 0), legR=(-18, 0, 0), footR=(26, 0, 0))),
        (10, P(_hipsZ=0.04, chest=(-14, 0, 0), head=(-22, 0, 0), armL=(0, 128, 0), handL=(0, -128, 0),
               armR=(0, -78, 0), handR=(0, -10, 0))),
        (13, P(_hipsZ=0.03, chest=(-12, 0, 0), head=(-18, 0, 0), armL=(0, 122, 0), handL=(0, -122, 0),
               armR=(0, -70, 0), handR=(0, -8, 0))),
        (17, P()),
    ]),
    # Raízes: golpe do cajado no chão. Liberação no quadro 8 (0,33 s de 0,6 s).
    'slam': (15, [
        (1, P()),
        (5, P(chest=(-10, 0, -8), head=(6, 0, 4), armL=(-64, 10, 0), handL=(60, 0, 0), armR=(-20, -26, 0))),
        (8, P(_hipsZ=-0.12, chest=(24, 0, 6), head=(-12, 0, -4), armL=(-14, 6, 0), handL=(8, 0, 0),
              armR=(-6, -34, 0), legL=(-26, 0, 0), footL=(40, 0, 0), legR=(-26, 0, 0), footR=(40, 0, 0))),
        (11, P(_hipsZ=-0.1, chest=(20, 0, 4), head=(-10, 0, -3), armL=(-14, 6, 0), handL=(8, 0, 0),
               armR=(-6, -30, 0), legL=(-22, 0, 0), footL=(34, 0, 0), legR=(-22, 0, 0), footR=(34, 0, 0))),
        (15, P()),
    ]),
    # Esquiva: corpo baixo e inclinado na direção do movimento.
    'dodge': (12, [
        (1, P()),
        (3, P(_hipsZ=-0.16, chest=(32, 0, 0), head=(-18, 0, 0), armL=(36, 14, 0), handL=(-10, 0, 0), armR=(40, -14, 0),
              legL=(-40, 0, 0), footL=(52, 0, 0), legR=(10, 0, 0), footR=(30, 0, 0))),
        (8, P(_hipsZ=-0.14, chest=(28, 0, 0), head=(-16, 0, 0), armL=(32, 12, 0), handL=(-8, 0, 0), armR=(36, -12, 0),
              legL=(6, 0, 0), footL=(24, 0, 0), legR=(-36, 0, 0), footR=(48, 0, 0))),
        (12, P()),
    ]),
}

# ── Lobisomem ──────────────────────────────────────────────────────────────────
# armR fica do lado +X: abrir para fora é rotação -Y; armL abre com +Y.
WOLF = {
    # Garras: dois golpes espelhados. Liberação no quadro 5 (0,2 s de 0,42 s).
    'claw_1': (10, [
        (1, P()),
        (3, P(chest=(-6, 0, -22), head=(4, 0, 14), armR=(30, -70, 0), handR=(0, 0, 20), armL=(-14, 10, 0), tail=(0, 0, 14))),
        (5, P(hips=(0, 0, 10), chest=(16, 0, 26), head=(-10, 0, -16), jaw=(22, 0, 0), armR=(-72, 26, 0), handR=(-30, 0, -10),
              armL=(10, 16, 0), tail=(0, 0, -16), legL=(-10, 0, 0), legR=(10, 0, 0))),
        (7, P(hips=(0, 0, 8), chest=(12, 0, 22), head=(-8, 0, -12), jaw=(14, 0, 0), armR=(-54, 38, 0), handR=(-24, 0, -8),
              armL=(8, 12, 0), tail=(0, 0, -10))),
        (10, P()),
    ]),
    'claw_2': (10, [
        (1, P()),
        (3, P(chest=(-6, 0, 22), head=(4, 0, -14), armL=(30, 70, 0), handL=(0, 0, -20), armR=(-14, -10, 0), tail=(0, 0, -14))),
        (5, P(hips=(0, 0, -10), chest=(16, 0, -26), head=(-10, 0, 16), jaw=(22, 0, 0), armL=(-72, -26, 0), handL=(-30, 0, 10),
              armR=(10, -16, 0), tail=(0, 0, 16), legL=(10, 0, 0), legR=(-10, 0, 0))),
        (7, P(hips=(0, 0, -8), chest=(12, 0, -22), head=(-8, 0, 12), jaw=(14, 0, 0), armL=(-54, -38, 0), handL=(-24, 0, 8),
              armR=(8, -12, 0), tail=(0, 0, 10))),
        (10, P()),
    ]),
    # Salto Feroz: agacha, voa com os braços à frente e cai batendo no chão. Avanço nos quadros 3-11, impacto no 12.
    'leap': (15, [
        (1, P()),
        (3, P(_hipsZ=-0.22, chest=(26, 0, 0), head=(-14, 0, 0), armL=(44, 10, 0), armR=(44, -10, 0),
              legL=(-36, 0, 0), footL=(56, 0, 0), legR=(-36, 0, 0), footR=(56, 0, 0), tail=(30, 0, 0))),
        (6, P(_rootZ=0.55, chest=(30, 0, 0), head=(-20, 0, 0), jaw=(18, 0, 0), armL=(-96, -6, 0), armR=(-96, 6, 0),
              legL=(26, 0, 0), footL=(10, 0, 0), legR=(30, 0, 0), footR=(14, 0, 0), tail=(-20, 0, 0))),
        (9, P(_rootZ=0.4, chest=(18, 0, 0), head=(-12, 0, 0), jaw=(24, 0, 0), armL=(-140, -10, 0), armR=(-140, 10, 0),
              legL=(-10, 0, 0), legR=(-6, 0, 0), tail=(-10, 0, 0))),
        (12, P(_hipsZ=-0.26, chest=(40, 0, 0), head=(-24, 0, 0), jaw=(10, 0, 0), armL=(-36, -4, 0), handL=(-30, 0, 0),
               armR=(-36, 4, 0), handR=(-30, 0, 0), legL=(-40, 0, 0), footL=(60, 0, 0), legR=(-40, 0, 0), footR=(60, 0, 0), tail=(16, 0, 0))),
        (15, P()),
    ]),
    # Uivo: tronco para trás, focinho para cima e braços abertos. Efeito no quadro 6 (0,25 s de 0,7 s).
    'howl': (17, [
        (1, P()),
        (4, P(_hipsZ=-0.06, chest=(14, 0, 0), head=(8, 0, 0), armL=(20, 10, 0), armR=(20, -10, 0))),
        (7, P(chest=(-26, 0, 0), head=(-46, 0, 0), jaw=(30, 0, 0), armL=(-20, 48, 0), handL=(0, 0, -20),
              armR=(-20, -48, 0), handR=(0, 0, 20), tail=(-26, 0, 0))),
        (13, P(chest=(-24, 0, 0), head=(-42, 0, 0), jaw=(28, 0, 0), armL=(-18, 44, 0), handL=(0, 0, -18),
               armR=(-18, -44, 0), handR=(0, 0, 18), tail=(-22, 0, 0))),
        (17, P()),
    ]),
    'dodge': (12, [
        (1, P()),
        (3, P(_hipsZ=-0.2, chest=(36, 0, 0), head=(-22, 0, 0), armL=(30, 10, 0), armR=(30, -10, 0),
              legL=(-44, 0, 0), footL=(60, 0, 0), legR=(6, 0, 0), footR=(30, 0, 0), tail=(20, 0, 0))),
        (8, P(_hipsZ=-0.18, chest=(32, 0, 0), head=(-20, 0, 0), armL=(26, 10, 0), armR=(26, -10, 0),
              legL=(4, 0, 0), footL=(26, 0, 0), legR=(-40, 0, 0), footR=(56, 0, 0), tail=(16, 0, 0))),
        (12, P()),
    ]),
}

TARGETS = {
    'Rig Flora': {'clips': DRUID, 'export': 'exports/flora_druid.glb', 'blend': 'models/flora_druid.blend', 'mesh': 'Flora — druida da floresta'},
    'Rig Lobisomem': {'clips': WOLF, 'export': 'exports/flora_werewolf.glb', 'blend': 'models/flora_werewolf.blend', 'mesh': 'Flora — forma de lobisomem'},
}


def local_rotation(bone, deg):
    """Rotação dada no espaço do armature → quaternion local do osso (relativa à pose do pai)."""
    rest = bone.bone.matrix_local.to_3x3().to_quaternion()
    q = Euler(tuple(math.radians(v) for v in deg), 'XYZ').to_quaternion()
    return rest.inverted() @ q @ rest


def local_offset(bone, vec):
    return bone.bone.matrix_local.to_3x3().inverted() @ Vector(vec)


def build(rig, name, length, keys):
    old = bpy.data.actions.get(name)
    if old:
        old.name = name + '__old'
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    ad = rig.animation_data or rig.animation_data_create()
    previous_action, previous_slot = ad.action, ad.action_slot
    ad.action = action
    bones = rig.pose.bones
    for b in bones:
        b.rotation_mode = 'XYZ'
    for frame, pose in keys:
        for b in bones:
            deg = pose.get(b.name, (0, 0, 0))
            prev = b.rotation_euler.copy()
            b.rotation_euler = local_rotation(b, deg).to_euler('XYZ', prev)
            b.location = (0, 0, 0)
            if b.name == 'hips' and '_hipsZ' in pose:
                b.location = local_offset(b, (0, 0, pose['_hipsZ']))
            if b.name == 'root' and '_rootZ' in pose:
                b.location = local_offset(b, (0, 0, pose['_rootZ']))
            b.keyframe_insert('rotation_euler', frame=frame, group=b.name)
            b.keyframe_insert('location', frame=frame, group=b.name)
            b.scale = (1, 1, 1)
    fcurves = list(action.fcurves) if hasattr(action, 'fcurves') else [fc for l in action.layers for s in l.strips for cb in s.channelbags for fc in cb.fcurves]
    for fc in fcurves:
        for k in fc.keyframe_points:
            k.interpolation = 'BEZIER'
            k.handle_left_type = k.handle_right_type = 'AUTO_CLAMPED'
        fc.update()
    action.frame_range = (1, length)
    if old:
        bpy.data.actions.remove(old)
    ad.action = previous_action
    if previous_slot is not None:
        try:
            ad.action_slot = previous_slot
        except Exception:
            pass
    return action


def export(rig, target):
    mesh = bpy.data.objects[target['mesh']]
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    rig.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    path = ROOT / target['export']
    bpy.ops.export_scene.gltf(filepath=str(path), use_selection=True, export_format='GLB', export_animations=True,
                              export_animation_mode='ACTIONS', export_anim_slide_to_zero=True, export_force_sampling=True,
                              export_def_bones=False, export_skins=True)
    return path


def main():
    scene = bpy.context.scene
    rig = next((o for o in scene.objects if o.type == 'ARMATURE' and o.name in TARGETS), None)
    if rig is None:
        raise RuntimeError('Abra models/flora_druid.blend ou models/flora_werewolf.blend antes de rodar.')
    target = TARGETS[rig.name]
    blend = ROOT / target['blend']
    stamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = ROOT / 'backups' / (blend.stem + '_before_game_motion_' + stamp + '.blend')
    backup.parent.mkdir(exist_ok=True)
    if blend.exists():
        shutil.copy2(blend, backup)
    frame = scene.frame_current
    made = [build(rig, name, length, keys).name for name, (length, keys) in target['clips'].items()]
    scene.frame_set(frame)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    path = export(rig, target)
    report = {'rig': rig.name, 'clips': made, 'actions': sorted(a.name for a in bpy.data.actions), 'export': str(path.relative_to(ROOT)), 'backup': str(backup.relative_to(ROOT))}
    print(json.dumps(report, ensure_ascii=False))
    return report


if __name__ == '__main__':
    main()
