"""Novo estudo do necromante com base na referência violeta do usuário.

-- preview: modelo editável e apresentação; -- poses: conferência do rig;
-- sheets: oito direções da cena salva. Sem argumentos: preview e sheets.
Os assets necromante.blend/glb e o jogo distribuído permanecem independentes.
"""
from pathlib import Path
import math, sys, json, time
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
import common as C
import flora_druid_art as F

BASE=F.BASE
NAME='necromante_art'
BODY='Necromante — estudo violeta'
RIG='Rig Necromante'

def render_image(sc,path):
    # Gravação temporária evita disputar o PNG aberto no visualizador do Windows.
    temporary=path.with_name(path.stem+'_rendering'+path.suffix)
    F.render(sc,temporary)
    for attempt in range(5):
        try:
            temporary.replace(path);return
        except OSError:
            if attempt==4:raise
            time.sleep(.3)

def materials():
    colors={'robe':'#5909b8','robeLight':'#721bcc','robeShade':'#3c0c73',
            'lining':'#301541','inner':'#30223d','glove':'#393142',
            'boot':'#2c2934','wood':'#513d29','woodLight':'#654630',
            'gold':'#b49049','goldLight':'#d0af68','belt':'#54422c','void':'#090510'}
    for name,color in colors.items():C.mat(name,color,rough=.87,metal=.18 if name.startswith('gold') else 0)
    C.MATS['void'].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=0
    C.mat('eye','#b36aff',rough=.6,emit='#b66aff',es=2.5)
    C.mat('crystal','#b86beb',rough=.45,emit='#b365ef',es=.3)
    C.mat('crystalLight','#e0adff',rough=.4,emit='#d9a1ff',es=.45)
    C.mat('crystalShade','#8e46b6',rough=.5,emit='#934bc2',es=.12)

def rig():
    C.bone('root',(0,0,0),(0,0,.20))
    C.bone('hips',(0,0,1.08),(0,0,1.31),'root')
    C.bone('spine',(0,0,1.31),(0,0,1.56),'hips')
    C.bone('chest',(0,0,1.56),(0,0,1.86),'spine')
    C.bone('head',(0,0,1.88),(0,0,2.45),'chest')
    C.bone('armL',(-.30,0,1.81),(-.44,-.04,1.49),'chest')
    C.bone('handL',(-.44,-.04,1.49),(-.52,-.14,1.14),'armL')
    C.bone('armR',(.30,0,1.81),(.45,-.02,1.53),'chest')
    C.bone('handR',(.45,-.02,1.53),(.70,-.23,1.61),'armR')
    C.bone('staff',(.70,-.23,1.61),(.82,-.23,2.57),'handR')
    for side,s in [('L',-1),('R',1)]:
        C.bone('leg'+side,(s*.15,0,1.10),(s*.18,0,.56),'hips')
        C.bone('foot'+side,(s*.18,0,.56),(s*.22,-.10,.14),'leg'+side)
        C.bone('skirt'+side,(s*.16,0,1.25),(s*.32,0,.32),'hips')
    C.bone('skirtBack',(0,.15,1.25),(0,.33,.32),'hips')
    C.build_rig();C.ARM.name=RIG

def cloth_section(name,rings,material,bone,opening=True):
    # Painéis largos com dobras contínuas e barra discretamente irregular.
    count=15 if opening else 16
    angles=[math.radians(-55+i*290/(count-1)) for i in range(count)] if opening else [i*math.tau/count for i in range(count)]
    verts=[]
    for j,(z,rx,ry) in enumerate(rings):
        for i,a in enumerate(angles):
            fold=1+(.025 if i%2 else -.015)
            hem=[.025,-.015,.02,0,-.02][i%5] if j==0 else 0
            verts.append((rx*math.cos(a)*fold,ry*math.sin(a)*fold,z+hem))
    faces=[]
    for j in range(len(rings)-1):
        for i in range(count-1 if opening else count):
            ni=(i+1)%count;faces.append((j*count+i,j*count+ni,(j+1)*count+ni,(j+1)*count+i))
    ob=F.mesh(name,verts,faces,material,bone)
    # Espessura nas bordas, aplicada antes de reunir as partes.
    bpy.context.view_layer.objects.active=ob
    mod=ob.modifiers.new('Espessura do tecido','SOLIDIFY');mod.thickness=.018
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return ob

def body():
    for side,s in [('L',-1),('R',1)]:
        F.tube('Perna',[(s*.15,0,1.10),(s*.18,0,.56)],[.10,.09],'inner','leg'+side,8)
        F.tube('Canela',[(s*.18,0,.56),(s*.22,-.10,.14)],[.09,.095],'boot','foot'+side,8)
        F.volume('Bota',[(s*.22,-.12,.03,.115,.21),(s*.22,-.14,.13,.125,.22),
                 (s*.21,-.08,.23,.095,.13)],'boot','foot'+side,8,math.pi/8)
    inner=cloth_section('Túnica interna',[(.25,.32,.245),(.78,.28,.20),(1.28,.235,.18)],'inner','hips',False)
    F.volume('Peito sob o manto',[(0,0,1.26,.24,.17),(0,0,1.60,.28,.195),
             (0,0,1.82,.28,.19),(0,0,1.94,.15,.12)],'inner','chest',10)
    outer=cloth_section('Manto aberto',[(.27,.445,.34),(.78,.325,.255),(1.31,.255,.195)],'robe','hips')
    # Pesos suaves entre quadril e três ossos de tecido.
    for ob in [inner,outer]:
        for group in list(ob.vertex_groups):ob.vertex_groups.remove(group)
        groups={n:ob.vertex_groups.new(name=n) for n in ['hips','skirtL','skirtR','skirtBack']}
        for v in ob.data.vertices:
            x,y,z=v.co;t=max(0,min(1,(1.25-z)/1.0))*.85
            region='skirtBack' if y>abs(x)*.7 else ('skirtL' if x<0 else 'skirtR')
            groups['hips'].add([v.index],1-t,'REPLACE');groups[region].add([v.index],t,'REPLACE')
    cloth_section('Casaco superior',[(1.28,.255,.19),(1.65,.305,.21),(1.87,.27,.18)],'robe','chest')
    F.volume('Cinto',[(0,0,1.26,.266,.208),(0,0,1.38,.267,.21)],'belt','hips',14)
    # Fivela em losango, com o vazio central mostrando o couro.
    verts=[]
    for y,r in [(-.235,.75),(-.242,.43),(-.205,.75),(-.205,.43)]:
        for x,z in [(0,.12),(.105,0),(0,-.12),(-.105,0)]:verts.append((.025+x*r,y,1.325+z*r))
    faces=[]
    for i in range(4):
        j=(i+1)%4;faces.extend([(i,j,4+j,4+i),(i,8+i,8+j,j),(4+i,4+j,12+j,12+i)])
    F.mesh('Fivela de bronze',verts,faces,'gold','hips')

def hood():
    outer=[(-.38,2.09),(-.29,2.39),(-.12,2.67),(.09,2.74),(.31,2.53),(.38,2.15),(.16,1.92),(-.13,1.92)]
    inner=[(-.21,2.09),(-.155,2.28),(-.02,2.36),(.12,2.42),(.215,2.34),(.23,2.14),(.12,2.005),(-.08,2.005)]
    n=len(outer);verts=[]
    for row in range(3):
        for x,z in outer:
            verts.append((x*(1 if row==0 else .94 if row==1 else .50),
                          -.34 if row==0 else .08 if row==1 else .33,
                          2.32+(z-2.32)*(1 if row==0 else .96 if row==1 else .68)))
    faces=[]
    for j in range(2):
        for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.append(tuple(range(2*n,3*n)))
    F.mesh('Volume do capuz',verts,faces,'robe','head',['robeLight'])
    rim=[(x,-.34,z) for x,z in outer]+[(x,-.365,z) for x,z in inner]
    F.mesh('Frente do capuz',rim,[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)],'robe','head')
    lining=[(x,-.364,z) for x,z in inner]+[(x*.94,-.18,2.24+(z-2.24)*.94) for x,z in inner]
    F.mesh('Forro do capuz',lining,[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)],'lining','head')
    F.mesh('Sombra do rosto',[(x*.94,-.18,2.24+(z-2.24)*.94) for x,z in inner],
           [tuple(range(n))],'void','head')
    for x in [-.09,.09]:
        F.ellipsoid('Olho luminoso',(x,-.275,2.255),(.023,.014,.016),'eye','head',12)
    # Pequeno apoio de tecido sobre os ombros, como na referência.
    for side,s in [('L',-1),('R',1)]:
        vs=[(s*.17,-.11,1.96),(s*.35,-.12,1.91),(s*.51,-.08,1.72),
            (s*.38,-.21,1.68),(s*.20,-.23,1.80),(s*.24,.17,1.92),(s*.46,.15,1.75)]
        F.mesh('Pala de ombro',vs,[(0,1,4),(1,2,3,4),(0,5,6,1),(1,6,2)],'robeLight','chest')

def sleeve(name,a,b,material,bone,radius):
    a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u).normalized()
    sides=8;verts=[]
    for t,r in [(0,.14),(.48,.18),(1,radius)]:
        p=a.lerp(b,t)
        for i in range(sides):verts.append(p+r*(math.cos(i*math.tau/sides)*u+math.sin(i*math.tau/sides)*v))
    faces=[]
    for j in range(2):
        for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    ob=F.mesh(name,verts,faces,material,bone)
    bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Espessura manga','SOLIDIFY');mod.thickness=.025;bpy.ops.object.modifier_apply(modifier=mod.name)
    F.tube('Sombra dentro da manga',[b-axis*.04,b-axis*.02],[radius*.91,radius*.91],'lining',bone,8)

def arms():
    sleeve('Manga esquerda',(-.30,0,1.81),(-.49,-.09,1.32),'robe','armL',.245)
    F.tube('Antebraço esquerdo',[(-.44,-.04,1.49),(-.52,-.14,1.13)],[.095,.085],'glove','handL',8)
    F.volume('Luva esquerda',[(-.52,-.15,1.03,.10,.075),(-.52,-.15,1.13,.11,.08),
              (-.52,-.14,1.20,.075,.06)],'glove','handL',8)
    for dx in [-.075,-.025,.025,.075]:
        F.tube('Dedo esquerdo',[(-.52+dx,-.18,1.09),(-.52+dx,-.21,1.02),(-.52+dx,-.17,.99)],
               [.029,.03,.024],'glove','handL',6)
    F.tube('Polegar esquerdo',[(-.62,-.14,1.13),(-.65,-.21,1.08),(-.61,-.23,1.04)],
           [.035,.032,.025],'glove','handL',6)
    sleeve('Manga direita superior',(.30,0,1.81),(.44,-.02,1.50),'robe','armR',.18)
    sleeve('Manga direita aberta',(.45,-.02,1.53),(.62,-.18,1.58),'robe','handR',.18)
    F.ellipsoid('Luva no cajado',(.70,-.23,1.61),(.095,.085,.12),'glove','handR',10)
    for z in [1.53,1.58,1.63,1.68]:
        F.tube('Dedo segurando cajado',[(.77,-.23,z),(.77,-.30,z),(.70,-.32,z),(.65,-.29,z)],
               [.025,.028,.027,.019],'glove','handR',6)
    F.tube('Polegar no cajado',[(.63,-.20,1.68),(.64,-.29,1.70),(.70,-.31,1.67)],
           [.035,.033,.024],'glove','handR',6)

def staff():
    F.tube('Haste de madeira',[(.58,-.23,.012),(.70,-.23,1.61),(.82,-.23,2.62)],
           [.049,.047,.058],'wood','staff',7)
    F.tube('Garra esquerda do cajado',[(.81,-.23,2.53),(.67,-.23,2.76),(.68,-.23,2.95)],
           [.07,.057,.016],'wood','staff',5)
    F.tube('Garra direita do cajado',[(.81,-.23,2.53),(.98,-.23,2.77),(.98,-.23,2.94)],
           [.07,.055,.016],'woodLight','staff',5)
    F.tube('Apoio traseiro do cristal',[(.81,-.19,2.55),(.84,-.08,2.74),(.84,-.07,2.90)],
           [.05,.037,.008],'wood','staff',5)
    gem=F.volume('Cristal violeta',[(.83,-.23,2.66,0,0),(.83,-.23,2.91,.14,.12),
                   (.83,-.23,3.045,.105,.09),(.83,-.23,3.24,0,0)],'crystal','staff',5,.2)
    gem.data.materials.append(C.MATS['crystalLight']);gem.data.materials.append(C.MATS['crystalShade'])
    for p in gem.data.polygons:p.material_index=[1,0,0,2,0][p.index%5]

def animate():
    C.init_anim(bpy.context.scene)
    def idle(t):
        p=math.sin(math.tau*t);C.R('chest',.012*p);C.R('head',0,0,.018*p)
        C.R('armR',-.012*p);C.R('skirtBack',.018*p)
    def walk(t):
        idle(t)
        for side,s in [('L',1),('R',-1)]:
            C.R('leg'+side,s*.28*math.sin(math.tau*t));C.R('skirt'+side,s*.10*math.sin(math.tau*t))
        C.R('armL',-.20*math.sin(math.tau*t))
    def cast(t):
        p=math.sin(math.pi*t);C.R('armL',-.95*p,0,.2*p);C.R('handL',-.15*p);C.R('chest',-.05*p)
    def death(t):C.R('root',0,0,1.45*t)
    C.bake_loop('idle',24,idle);C.bake_loop('walk',24,walk);C.bake_once('cast',24,cast)
    C.bake_once('attack',18,cast);C.bake_once('death',24,death)
    C.ARM.animation_data.action=bpy.data.actions['idle'];C.reset();bpy.context.scene.frame_set(1)

def proportions():
    """Postura alta, ombros amplos e cabeça proporcional, na malha e no rig."""
    def remap(v):
        x,y,z=v
        shoulder=1.18-.22*max(0,min(1,(z-1.80)/.25))
        return Vector((x*shoulder,y,z*1.12 if z<1.90 else 2.128+(z-1.90)*.90))
    for ob in C.PARTS:
        for vertex in ob.data.vertices:vertex.co=remap(vertex.co)
    bpy.context.view_layer.objects.active=C.ARM;bpy.ops.object.mode_set(mode='EDIT')
    for bone in C.ARM.data.edit_bones:
        bone.head=remap(bone.head);bone.tail=remap(bone.tail)
    bpy.ops.object.mode_set(mode='OBJECT')

def poses(sc,cam,ground):
    sc.render.resolution_x=512;sc.render.resolution_y=512;sc.cycles.samples=24
    ground.hide_render=True;sc.render.film_transparent=True
    body=bpy.data.objects[BODY]
    for name,frame in [('idle',1),('cast',7),('cast',13),('death',24)]:
        act=bpy.data.actions[name];C.ARM.animation_data.action=act
        if len(act.slots):C.ARM.animation_data.action_slot=act.slots[0]
        sc.frame_set(frame);bpy.context.view_layer.update()
        ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());points=[ev.matrix_world@v.co for v in ev.data.vertices]
        center=Vector(tuple((min(v[i] for v in points)+max(v[i] for v in points))/2 for i in range(3)))
        rotation=cam.rotation_euler.to_matrix();local=[rotation.transposed()@(p-center) for p in points]
        cam.data.ortho_scale=max(max(v[i] for v in local)-min(v[i] for v in local) for i in (0,1))*1.15
        cam.location=center+rotation@Vector((0,0,12));bpy.context.view_layer.update()
        render_image(sc,BASE/'previews'/f'{NAME}_pose_{name}_{frame}.png')

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for folder in ['models','previews','frames','spritesheets','logs']:(BASE/folder).mkdir(exist_ok=True)
    if 'sheets' in args or 'poses' in args or 'beauty' in args:
        bpy.ops.wm.open_mainfile(filepath=str(BASE/'models'/f'{NAME}.blend'))
        C.ARM=bpy.data.objects[RIG];sc=bpy.context.scene;cam=sc.camera;ground=bpy.data.objects['Chao somente apresentacao']
        if 'poses' in args:poses(sc,cam,ground);return
        if 'beauty' in args:
            ground.hide_render=False;sc.render.film_transparent=False
            render_image(sc,BASE/'previews'/f'{NAME}_beauty.png');return
    else:
        C.reset_scene();materials();rig();body();hood();arms();staff();proportions();C.finish(BODY);animate()
        sc,cam,ground=F.studio();cam.location=(3,-8,3.3);cam.data.ortho_scale=3.85;F.aim(cam,(.12,0,1.65))
        # Preservar a saturação violeta da referência, com as mesmas luzes suaves.
        sc.view_settings.view_transform='Standard';sc.view_settings.look='None';sc.view_settings.exposure=-.7
        sc['art_direction']='Necromante violeta: estudo facetado baseado na referencia do usuario, PBR Cycles.'
        bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models'/f'{NAME}.blend'))
        render_image(sc,BASE/'previews'/f'{NAME}.png')
        ground.hide_render=False;sc.render.film_transparent=False;render_image(sc,BASE/'previews'/f'{NAME}_beauty.png')
        ground.hide_render=True;sc.render.film_transparent=True
        if 'preview' in args:return
    sc.cycles.samples=24;sc.render.resolution_x=224;sc.render.resolution_y=224
    ground.hide_render=True;sc.render.film_transparent=True
    p=math.radians(35);ppu=44;forward=Vector((0,math.cos(p),-math.sin(p)))
    target=Vector((0,math.sin(p),math.cos(p)))*(165-112)/ppu
    cam.data.ortho_scale=224/ppu;cam.location=target-forward*12;F.aim(cam,target);bpy.context.view_layer.update()
    from bpy_extras.object_utils import world_to_camera_view
    origin=world_to_camera_view(sc,cam,Vector((0,0,0)))
    assert abs(origin.x*224-112)<.001 and abs((1-origin.y)*224-165)<.001
    out=BASE/'frames'/NAME;out.mkdir(exist_ok=True)
    act=bpy.data.actions['idle'];C.ARM.animation_data.action=act
    if len(act.slots):C.ARM.animation_data.action_slot=act.slots[0]
    for di in range(8):
        C.ARM.rotation_euler.z=math.radians(90-di*45)
        for fi in range(4):sc.frame_set(1+fi*6);render_image(sc,out/f'{di}_{fi}.png')
    meta={'cell':224,'ppu':ppu,'anchorX':112,'anchorY':165,'dirs':8,
          'directionAnglesDegrees':[90-i*45 for i in range(8)],
          'anims':{'idle':{'n':4,'fps':4,'loop':True,'row':0}},'prototype':True,'artVersion':2,'shader':'Cycles PBR studio'}
    (BASE/'spritesheets'/f'{NAME}_sheet.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')

if __name__=='__main__':main()
