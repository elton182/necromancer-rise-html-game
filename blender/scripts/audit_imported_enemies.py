"""Audita os GLBs fornecidos em processo Blender separado, sem alterar cenas existentes."""
from pathlib import Path
import bpy, json, sys

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / 'scripts'))
from common import reset_scene

results = []
for path in sorted((BASE / 'reference/imported_enemies').glob('*.glb')):
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects = []
    for obj in bpy.context.scene.objects:
        row = {'name': obj.name, 'type': obj.type, 'dimensions': list(obj.dimensions)}
        if obj.type == 'ARMATURE':
            row['bones'] = [{'name': b.name, 'parent': b.parent.name if b.parent else None,
                             'head': list(b.head_local), 'tail': list(b.tail_local)} for b in obj.data.bones]
        if obj.type == 'MESH':
            obj.data.calc_loop_triangles()
            row.update(vertices=len(obj.data.vertices), triangles=len(obj.data.loop_triangles),
                       unweighted=sum(not v.groups for v in obj.data.vertices),
                       materials=[m.name for m in obj.data.materials if m])
        objects.append(row)
    results.append({'file': path.name, 'objects': objects})
out = BASE.parent / 'review/v2/imported-enemies'
out.mkdir(parents=True, exist_ok=True)
(out / 'audit.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print('AUDIT_COMPLETE', len(results))
