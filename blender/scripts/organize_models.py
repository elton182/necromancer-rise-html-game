"""Inventário e organização reversível dos modelos Blender.

Sem argumentos: prepara o catálogo e exibe o plano. --apply move usando git mv
nos arquivos versionados e atualiza os consumidores. --check verifica o catálogo.
Modelos atuais ficam na raiz de models/exports; fontes e legado em subpastas.
"""
from pathlib import Path
from collections import Counter
import argparse, ast, hashlib, json, re, subprocess, sys

BLENDER=Path(__file__).resolve().parents[1]
PROJECT=BLENDER.parent
CATALOG=BLENDER/'notes/model_catalog.json'
parser=argparse.ArgumentParser()
parser.add_argument('--apply',action='store_true')
parser.add_argument('--check',action='store_true')
parser.add_argument('--refresh',action='store_true')
parser.add_argument('--blender',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def registry():return json.loads((PROJECT/'v2/assets/models.json').read_text(encoding='utf8'))

def plan():
    if CATALOG.exists():return json.loads(CATALOG.read_text(encoding='utf8'))
    reg=registry()
    exports={Path(a['path']).name for a in reg.values()}
    scenes={Path(a['path']).stem+'.blend' for a in reg.values()}
    scenes|={Path(a['source']).name for a in reg.values() if a.get('source','').endswith('.blend')}
    scenes|={'boss_fallenKing_v4.blend','hud_orb_frame.blend'}
    source_scenes={'boss_fallenKing_v3_teste.blend','rigged_player.blend','v2_imported_enemies_review.blend',
        'mage_hero.blend','mage_hero_t_source.blend','flora_tripo_druid_t.blend','flora_tripo_wolf.blend'}
    source_exports={'fallen_king_source.glb','fallen_king_model_v2.glb','fallen_king_sword_v2.glb',
        'necromancer_1.glb','purple_hooded_mage.glb','lab_player_current.glb'}
    legacy_stems={'boss_soulWarden','mob_archer','mob_cryptHound','mob_skeleton','mob_zombie',
        'necromante','necromante_art','village_eldrin'}
    files=[]
    for folder in ['models','exports']:
        for path in sorted((BLENDER/folder).iterdir()):
            if not path.is_file() or path.suffix not in ('.blend','.blend1','.glb'):continue
            old=path.relative_to(PROJECT).as_posix()
            if path.suffix=='.blend1':
                category='backup';new=BLENDER/'backups/automatic_models'/path.name
                reason='Backup automático do Blender; não é fonte atual.'
            elif 'blocking' in path.stem:
                category='blocking';new=BLENDER/'backups/blocking'/path.name
                reason='Blocking de autoria, recuperável e reproduzível pelo gerador.'
            elif path.name in (exports if folder=='exports' else scenes):
                category='current';new=path
                reason='Modelo registrado na v2, cena editável correspondente ou fonte do HUD atual.'
            elif path.name in (source_exports if folder=='exports' else source_scenes):
                category='source';new=BLENDER/folder/'sources'/path.name
                reason='Entrada de geração, rig editável de base ou laboratório ainda utilizado.'
            elif path.stem in legacy_stems:
                category='legacy';new=BLENDER/folder/'legacy'/path.name
                reason='Fonte do pipeline Canvas 2D e seus renderizadores; mantida separada da v2.'
            else:
                category='retired';new=PROJECT/'_to_delete/blender-models'/folder/path.name
                reason='Versão substituída, estudo ou export sem consumo atual identificado.'
            files.append({'from':old,'to':new.relative_to(PROJECT).as_posix(),'category':category,
                'reason':reason,'bytes':path.stat().st_size,'sha256':digest(path)})
    data={'version':1,'scope':'blender/models e blender/exports; reference e evidências preservados',
        'files':files}
    CATALOG.parent.mkdir(parents=True,exist_ok=True)
    CATALOG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return data

def wrap_consumers(data):
    changed=[]
    selected={'bpy.ops.wm.open_mainfile','bpy.ops.wm.save_as_mainfile','bpy.data.libraries.load',
        'bpy.data.libraries.write','bpy.ops.export_scene.gltf','bpy.ops.import_scene.gltf'}
    moved_names={Path(f['from']).name for f in data['files'] if f['from']!=f['to'] and not f['from'].endswith('.blend1')}
    dynamic={'common.py','lowpoly_cast.py','village_npcs.py','npc_portraits.py','stylized_characters.py',
        'render_undead.py','render_imported_player.py','export_3d_lab.py','flora_tripo_motion.py',
        'flora_wolf_motion.py','flora_prototype.py'}
    header=b'\nimport sys as _asset_sys\nfrom pathlib import Path as _AssetPath\n_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))\nfrom asset_paths import asset_path\n'
    for path in sorted((BLENDER/'scripts').glob('*.py')):
        if path.name in ('asset_paths.py','organize_models.py'):continue
        raw=path.read_bytes();text=raw.decode('utf-8-sig')
        if not re.search(r'models|exports',text):continue
        tree=ast.parse(text);lines=text.encode('utf8').splitlines(keepends=True)
        starts=[0]
        for line in lines:starts.append(starts[-1]+len(line))
        def pos(line,col):return starts[line-1]+col
        edits=[]
        needed=path.name in dynamic or any(name in text for name in moved_names)
        if not needed:
            if 'from asset_paths import asset_path' not in text:continue
            for node in ast.walk(tree):
                if isinstance(node,ast.Call) and ast.unparse(node.func)=='asset_path':
                    a,b=pos(node.lineno,node.col_offset),pos(node.end_lineno,node.end_col_offset)
                    inner=node.args[0];start,end=pos(inner.lineno,inner.col_offset),pos(inner.end_lineno,inner.end_col_offset)
                    edits.extend([(a,start,b''),(end,b,b'')])
            output=text.encode('utf8')
            for a,b,value in sorted(edits,reverse=True):output=output[:a]+value+output[b:]
            output=output.replace(header,b'',1)
            ast.parse(output.decode('utf8'));path.write_bytes(output)
            continue
        for node in ast.walk(tree):
            if not isinstance(node,ast.Call) or ast.unparse(node.func) not in selected:continue
            target=next((k.value for k in node.keywords if k.arg=='filepath'),None)
            if target is None and node.args:target=node.args[0]
            if target is None or isinstance(target,ast.Call) and ast.unparse(target.func)=='asset_path':continue
            a,b=pos(target.lineno,target.col_offset),pos(target.end_lineno,target.end_col_offset)
            edits.extend([(a,b'asset_path('),(b,b')')])
        if not edits:continue
        body=tree.body;at=0
        if body and isinstance(body[0],ast.Expr) and isinstance(body[0].value,ast.Constant) and isinstance(body[0].value.value,str):
            at=pos(body[0].end_lineno,body[0].end_col_offset)
        for node in body:
            if isinstance(node,ast.ImportFrom) and node.module=='__future__':at=pos(node.end_lineno,node.end_col_offset)
        if 'from asset_paths import asset_path' not in text:
            edits.append((at,header))
        output=text.encode('utf8')
        for offset,value in sorted(edits,key=lambda e:e[0],reverse=True):output=output[:offset]+value+output[offset:]
        ast.parse(output.decode('utf8'))
        path.write_bytes(output);changed.append(path.relative_to(PROJECT).as_posix())
    return changed

def rewrite_guides(data):
    paths=[PROJECT/'README.md',BLENDER/'README.md',PROJECT/'v2/README.md']
    paths+=list((PROJECT/'docs').glob('v2-*.md'))
    paths+=list((PROJECT/'tools').glob('**/README.md'))
    # Docstrings contêm comandos de CLI que abrem .blend antes do resolver Python.
    paths+=list((BLENDER/'scripts').glob('*.py'))
    changed=[]
    moved=[f for f in data['files'] if f['from']!=f['to']]
    for path in paths:
        if not path.exists() or path.name in ('organize_models.py','asset_paths.py'):continue
        text=path.read_text(encoding='utf-8-sig');before=text
        if path.suffix=='.py':
            tree=ast.parse(text)
            if not tree.body or not isinstance(tree.body[0],ast.Expr) or not isinstance(tree.body[0].value,ast.Constant) or not isinstance(tree.body[0].value.value,str):continue
            lines=text.splitlines(keepends=True);end=tree.body[0].end_lineno
            subject=''.join(lines[:end]);tail=''.join(lines[end:])
        else:subject=text;tail=''
        for item in moved:
            old,new=item['from'],item['to']
            subject=subject.replace(old,new)
            local=old.removeprefix('blender/')
            replacement=new.removeprefix('blender/') if new.startswith('blender/') else '../'+new
            subject=re.sub(r'(?<![\w/\-])((?:\.\./)*)'+re.escape(local)+r'(?![\w.])',lambda m:m[1]+replacement,subject)
        text=subject+tail
        if text!=before:
            path.write_text(text,encoding='utf8');changed.append(path.relative_to(PROJECT).as_posix())
    return changed

def verify(data,preservation=False):
    sys.path.insert(0,str(BLENDER/'scripts'))
    from asset_paths import asset_path
    for item in data['files']:
        path=PROJECT/item['to']
        assert path.is_file(),f'Ausente: {path}'
        assert Path(asset_path(PROJECT/item['from'])).resolve()==path.resolve(),('Resolver',item['from'])
        if preservation:assert digest(path)==item['sha256'],f'Conteúdo alterado no movimento: {path}'
    for name,asset in registry().items():
        for key in ['path','source']:
            if key in asset:assert (PROJECT/asset[key]).exists(),(name,key,asset[key])
    for path in (BLENDER/'scripts').glob('*.py'):ast.parse(path.read_text(encoding='utf-8-sig'),filename=str(path))
    if args.blender:
        import bpy
        inspected=[]
        for item in data['files']:
            if item['category']!='source' or not item['to'].endswith('.blend'):continue
            path=PROJECT/item['to']
            with bpy.data.libraries.load(str(path)) as (src,dst):
                count=len(src.objects);dst.images=list(src.images)
            for image in dst.images:
                if image is None:continue
                if image.source=='FILE' and not image.packed_file:
                    image_path=Path(bpy.path.abspath(image.filepath,start=str(path.parent)))
                    assert image_path.exists(),(path,image.name,image.filepath)
                bpy.data.images.remove(image)
            inspected.append({'path':item['to'],'objects':count})
        (BLENDER/'notes/model_source_check.json').write_text(json.dumps(inspected,indent=2)+'\n',encoding='utf8')
        print('Fontes .blend abertas e imagens conferidas:',len(inspected))
    print('Catálogo e todos os caminhos registrados na v2 conferidos.')

if args.check:
    data=json.loads(CATALOG.read_text(encoding='utf8'));verify(data)
elif args.refresh:
    data=json.loads(CATALOG.read_text(encoding='utf8'))
    wrap_consumers(data);guides=rewrite_guides(data)
    report=BLENDER/'notes/model_cleanup_result.json'
    result=json.loads(report.read_text(encoding='utf8'))
    result['consumers_updated']=[p.relative_to(PROJECT).as_posix() for p in sorted((BLENDER/'scripts').glob('*.py')) if p.name not in ['asset_paths.py','organize_models.py'] and 'from asset_paths import asset_path' in p.read_text(encoding='utf-8-sig')]
    report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'consumers':len(result['consumers_updated']),'guides':guides},ensure_ascii=False))
elif args.apply:
    data=json.loads(CATALOG.read_text(encoding='utf8'))
    tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=PROJECT).decode().split('\0'))
    # Verifica TODOS os destinos antes do primeiro movimento.
    for item in data['files']:
        src,dst=PROJECT/item['from'],PROJECT/item['to']
        assert src.resolve().is_relative_to(PROJECT.resolve()) and dst.resolve().is_relative_to(PROJECT.resolve())
        if src!=dst:assert src.is_file() and not dst.exists(),(src,dst)
    for item in data['files']:
        if item['from']==item['to']:continue
        src,dst=PROJECT/item['from'],PROJECT/item['to'];dst.parent.mkdir(parents=True,exist_ok=True)
        if item['from'] in tracked:subprocess.run(['git','mv','--',item['from'],item['to']],cwd=PROJECT,check=True)
        else:src.rename(dst)
    consumers=wrap_consumers(data);guides=rewrite_guides(data)
    # Os assets continuam iguais byte a byte; só os caminhos mudam.
    verify(data,preservation=True)
    result={'counts':dict(Counter(f['category'] for f in data['files'])),
        'moved':sum(f['from']!=f['to'] for f in data['files']),
        'consumers_updated':consumers,'guides_updated':guides}
    (BLENDER/'notes/model_cleanup_result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps(result,ensure_ascii=False))
else:
    data=plan()
    print(json.dumps(dict(Counter(f['category'] for f in data['files'])),ensure_ascii=False))
    for category in ['source','legacy','retired']:
        print(category,':',', '.join(Path(f['from']).name for f in data['files'] if f['category']==category))
