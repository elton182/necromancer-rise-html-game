"""Lobisomem de Flora: malha, rig, ações e render Cycles de estúdio.

Use -- preview para conferir a arte, -- sheets para renderizar a cena salva.
Sem argumentos, executa ambas as etapas. Não modifica a Flora humana ou o jogo.
"""
from pathlib import Path
import math, sys, random, json
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
import common as C
import flora_druid_art as F

BASE=F.BASE
random.seed(43)

def mass(name,center,scale,material,bone,detail=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail,radius=1,location=center)
    ob=bpy.context.object;ob.name=name;ob.scale=scale;C._apply(ob)
    C._fin(ob,material,bone,False)
    return ob

def fur(name,start,end,width,material,bone,normal=(0,-1,0),depth=.07):
    """Mecha sólida com crista assimétrica e ponta curvada."""
    a,b=Vector(start),Vector(end);axis=(b-a).normalized();normal=Vector(normal).normalized()
    u=axis.cross(normal).normalized()
    if u.length<.01:u=axis.cross(Vector((1,0,0))).normalized()
    v=u.cross(axis).normalized();verts=[]
    for t,w in [(0,.70),(.22,1),(.62,.47),(1,0)]:
        center=a.lerp(b,t)+v*depth*math.sin(t*math.pi)
        verts.extend([center-u*width*w,center+v*depth*w,center+u*width*w,
                      center-v*depth*.45*w])
    faces=[(3,2,1,0)]
    for j in range(3):
        for i in range(4):faces.append((j*4+i,j*4+(i+1)%4,(j+1)*4+(i+1)%4,(j+1)*4+i))
    return F.mesh(name,verts,faces,material,bone)

def materials():
    colors={'fur':'#4e3b32','furMid':'#665044','furLight':'#7a6050','furDark':'#352a25',
            'cream':'#c8b28d','creamLight':'#dfcba4','nose':'#24221f','mouth':'#241716',
            'gum':'#754634','ivory':'#eee0b9','leather':'#65462d','leatherLight':'#916239',
            'leatherDark':'#473121','gold':'#ba8b3a','goldLight':'#dcaf53'}
    for name,color in colors.items():C.mat(name,color,rough=.85,metal=.25 if name.startswith('gold') else 0)
    C.mat('eye','#ed9413',rough=.5,emit='#ff9c13',es=1.2)
    C.mat('eyeCore','#ffd544',rough=.5,emit='#ffd544',es=1.4)

def rig():
    C.bone('root',(0,0,0),(0,0,.22))
    C.bone('hips',(0,.12,1.16),(0,.12,1.40),'root')
    C.bone('chest',(0,.12,1.39),(0,.05,2.16),'hips')
    C.bone('head',(0,.01,2.15),(0,-.25,2.57),'chest')
    C.bone('jaw',(0,-.36,2.20),(0,-.72,2.15),'head')
    C.bone('tail',(0,.35,1.2),(0,.83,.89),'hips')
    for side,s in [('L',-1),('R',1)]:
        C.bone('arm'+side,(s*.49,.05,2.08),(s*.77,-.08,1.63),'chest')
        C.bone('hand'+side,(s*.77,-.08,1.63),(s*.88,-.30,1.28),'arm'+side)
        C.bone('leg'+side,(s*.22,.12,1.18),(s*.42,-.07,.76),'hips')
        C.bone('foot'+side,(s*.42,-.07,.76),(s*.51,.15,.39),'leg'+side)
        C.bone('paw'+side,(s*.51,.15,.39),(s*.58,-.12,.11),'foot'+side)
    C.build_rig();C.ARM.name='Rig Lobisomem'

def torso():
    F.volume('Tronco inclinado',[(0,.13,1.17,.29,.23),(0,.15,1.42,.34,.24),
        (0,.13,1.69,.44,.29),(0,.10,1.98,.52,.32),(0,.12,2.17,.46,.32),
        (0,.10,2.36,.26,.25)],'fur','chest',12,math.pi/12)
    for s in [-1,1]:
        mass('Peitoral',(s*.23,-.10,1.96),(.29,.23,.28),'fur','chest')
        fur('Pelagem do peito',(s*.12,-.28,2.02),(s*.23,-.30,1.83),
            .13,'fur','chest',depth=.025)
    # Mechas acompanham o arco dos ombros até as costas.
    for row in range(3):
        z=2.46-row*.16
        for i in range(7):
            a=math.radians(8+i*164/6);dx,dy=math.cos(a),math.sin(a)
            radius=.29+row*.075
            fur('Juba posterior',(radius*dx,.12+radius*.65*dy,z),
                ((radius+.25)*dx,.26+(radius+.24)*.8*dy,z+.10-row*.09),
                .13,'furLight' if (i+row)%4==0 else 'furMid','chest',(dx,dy,.25),.045)
    for s in [-1,1]:
        for j in range(5):
            fur('Juba lateral',(s*(.23+.043*j),-.01,2.65-j*.13),
                (s*(.48+.057*j),.14,2.61-j*.17),.135,
                ['furMid','fur','furLight','furMid'][j%4], 'head' if j<2 else 'chest',(s,-.5,.15),.045)
        for j in range(3):
            fur('Juba frontal',(s*(.26+j*.045),-.20,2.38-j*.12),
                (s*(.45+j*.05),-.25,2.13-j*.13),.12,'furMid','chest',(s,-1,0),.035)
    F.tube('Cauda',[(0,.31,1.20),(0,.59,1.03),(0,.84,.71),(0,1.03,.61)],
           [.13,.16,.12,.01],'fur','tail',8)
    for j in range(3):
        fur('Pelagem cauda',(0,.50+j*.12,1.10-j*.16),
            (.04,.77+j*.10,.83-j*.12),.12,'furMid','tail',(0,1,.3))

def head():
    # Crânio em cunha: a testa recua em direção à nuca, como na referência.
    verts=[];segments=10
    for y,z,rx,rz in [(-.45,2.43,.205,.17),(-.23,2.49,.31,.265),(.055,2.51,.285,.235)]:
        for i in range(segments):
            a=i*math.tau/segments
            verts.append((rx*math.cos(a),y,z+rz*math.sin(a)))
    faces=[tuple(reversed(range(segments)))]
    for j in range(2):
        for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
    faces.append(tuple(range(2*segments,3*segments)))
    F.mesh('Crânio alongado',verts,faces,'furMid','head')
    mass('Ponte nasal',(0,-.44,2.38),(.19,.22,.14),'furMid','head')
    # Maxilar comprido e mandíbula separada deixam a boca realmente aberta.
    mass('Focinho superior',(0,-.63,2.305),(.195,.29,.115),'cream','head')
    mass('Nariz',(0,-.88,2.33),(.12,.075,.070),'nose','head',1)
    mass('Boca aberta',(0,-.58,2.215),(.182,.245,.085),'mouth','head')
    mass('Mandíbula',(0,-.565,2.135),(.18,.235,.068),'cream','jaw')
    F.tube('Linha da gengiva',[(-.16,-.64,2.15),(0,-.78,2.15),(.16,-.64,2.15)],
           [.018,.025,.018],'gum','jaw',6)
    for s in [-1,1]:
        # Olhos baixos sob sobrancelhas oblíquas.
        points=[(s*.095,-.491,2.49),(s*.255,-.444,2.55),(s*.225,-.482,2.49),(s*.135,-.517,2.47)]
        F.mesh('Olho âmbar',points,[(0,1,2,3)],'eye','head')
        mass('Brilho do olho',(s*.168,-.505,2.495),(.024,.009,.015),'eyeCore','head',1)
        F.tube('Sobrancelha',[(s*.07,-.48,2.51),(s*.18,-.47,2.57),(s*.25,-.34,2.60)],
               [.028,.042,.023],'fur','head',5)
        fur('Maçã do rosto',(s*.22,-.31,2.40),(s*.38,-.29,2.24),.11,'cream','head',(s,-1,0),.035)
        for j in range(3):
            fur('Mecha facial',(s*.24,-.16,2.48-j*.10),(s*.43,-.15,2.34-j*.13),
                .10,'furMid' if j%2 else 'furLight','head',(s,-1,0),.04)
        # Presas superiores e dentes pequenos, sem cruzar a mandíbula.
        for x,y,length in [(.14,-.685,.13),(.085,-.79,.065),(.17,-.57,.08)]:
            F.tube('Presa superior',[(s*x,y,2.285),(s*x,y-.015,2.285-length*.65),(s*x*.90,y-.025,2.285-length)],
                   [.031,.023,.001],'ivory','head',5)
        for x in [.06,.12]:
            F.tube('Dente inferior',[(s*x,-.74,2.15),(s*x,-.75,2.20)],[.021,.001],'ivory','jaw',5)
        # Orelha angular e cavidade interna.
        verts=[(s*.19,-.08,2.62),(s*.34,-.035,2.65),(s*.33,.10,2.68),
               (s*.20,.10,2.69),(s*.38,.025,2.86)]
        F.mesh('Orelha',verts,[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(0,3,2,1)],'fur','head')
        F.mesh('Interior orelha',[(s*.224,-.079,2.68),(s*.308,-.033,2.705),(s*.354,.002,2.80)],
               [(0,1,2)],'cream','head')
    # Topete quebrado, variação controlada para não parecer uma coroa.
    for i,x in enumerate([-.20,-.09,.035,.15]):
        fur('Topete',(x,-.04,2.65),(x-.15,.34,2.79+(.07 if i==1 else 0)),
            .11,'fur' if i%2 else 'furMid','head',(0,-1,.3),.035)
    for s in [-1,1]:
        fur('Pelagem da testa',(s*.065,-.21,2.74),(s*.21,-.35,2.56),.105,'furMid','head',(0,-1,.2),.025)
    fur('Testa',(0,-.34,2.70),(.025,-.485,2.51),.11,'fur','head',(0,-1,.1),.025)

def pose_previews(sc,cam,ground):
    """Confere ligação do rig em descanso, impacto e morte; não altera a cena salva."""
    sc.render.resolution_x=512;sc.render.resolution_y=512;sc.cycles.samples=24
    ground.hide_render=True;sc.render.film_transparent=True
    body=bpy.data.objects['Flora — forma de lobisomem']
    for name,frame in [('idle',1),('attack',9),('death',24)]:
        act=bpy.data.actions[name];C.ARM.animation_data.action=act
        if hasattr(act,'slots') and len(act.slots):C.ARM.animation_data.action_slot=act.slots[0]
        sc.frame_set(frame);bpy.context.view_layer.update()
        ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
        points=[ev.matrix_world@v.co for v in ev.data.vertices]
        center=Vector(tuple((min(v[i] for v in points)+max(v[i] for v in points))/2 for i in range(3)))
        rotation=cam.rotation_euler.to_matrix();inverse=rotation.transposed()
        local=[inverse@(p-center) for p in points]
        cam.data.ortho_scale=max(max(v[i] for v in local)-min(v[i] for v in local) for i in (0,1))*1.17
        cam.location=center+rotation@Vector((0,0,12));bpy.context.view_layer.update()
        F.render(sc,BASE/'previews'/f'flora_werewolf_pose_{name}.png')

def legs():
    for side,s in [('L',-1),('R',1)]:
        F.tube('Coxa '+side,[(s*.22,.12,1.17),(s*.32,.01,.99),(s*.42,-.07,.76)],
               [.22,.235,.15],'furMid','leg'+side,9)
        fur('Coxa clara',(s*.32,-.15,1.01),(s*.43,-.20,.73),.145,'cream','leg'+side,depth=.025)
        F.tube('Canela digitígrada',[(s*.42,-.07,.76),(s*.48,.11,.53),(s*.51,.15,.39)],
               [.145,.12,.10],'fur','foot'+side,8)
        F.tube('Tornozelo',[(s*.51,.15,.40),(s*.54,.02,.25),(s*.58,-.12,.12)],
               [.10,.10,.14],'furDark','paw'+side,8)
        mass('Pata',(s*.58,-.16,.12),(.20,.25,.115),'fur','paw'+side)
        for dx in [-.13,0,.13]:
            mass('Dedo da pata',(s*.58+dx,-.29,.11),(.077,.12,.075),'furMid','paw'+side,1)
            F.tube('Garra da pata',[(s*.58+dx,-.35,.13),(s*.58+dx,-.44,.09),(s*.58+dx,-.49,.04)],
                   [.048,.034,.001],'ivory','paw'+side,5)
        for j in range(4):
            fur('Mecha da coxa',(s*(.22+j*.070),-.12,.98-j*.018),
                (s*(.28+j*.075),-.15,.77-j*.035),.075,
                'creamLight' if j%2 else 'cream','leg'+side,(0,-1,0),.025)
        for j in range(3):
            fur('Mecha da canela',(s*.45,-.015,.66-j*.10),(s*.61,.01,.51-j*.10),
                .095,'furDark','foot'+side,(s,-1,.1),.04)

def arms():
    for side,s in [('L',-1),('R',1)]:
        mass('Ombro',(s*.48,.045,2.09),(.26,.25,.28),'furMid','arm'+side)
        F.tube('Braço',[(s*.50,.035,2.08),(s*.64,-.015,1.84),(s*.77,-.08,1.63)],
               [.23,.195,.13],'cream','arm'+side,9)
        mass('Bíceps',(s*.65,-.055,1.84),(.17,.14,.23),'cream','arm'+side)
        F.tube('Antebraço',[(s*.77,-.08,1.64),(s*.84,-.19,1.45),(s*.88,-.30,1.28)],
               [.13,.175,.115],'cream','hand'+side,9)
        # Capas de pelo sobre deltoide e punho, com transição irregular.
        for j in range(4):
            fur('Mecha do ombro',(s*(.35+j*.06),-.10,2.21-j*.035),
                (s*(.53+j*.065),-.10,2.04-j*.075),.12,
                'furLight' if j==1 else 'furMid','arm'+side,(0,-1,.2),.06)
        for j in range(4):
            a=j*math.tau/4;dx,dy=math.cos(a),math.sin(a)
            fur('Punho peludo',(s*.85+.13*dx,-.23+.13*dy,1.47),
                (s*.9+.17*dx,-.33+.13*dy,1.24),.10,'fur','hand'+side,(dx,dy,0),.06)
        mass('Palma',(s*.90,-.345,1.20),(.175,.12,.15),'furDark','hand'+side)
        # Palmas voltadas para a frente: polegares externos e dedos espelhados
        # entre as mãos. A orientação do antebraço e do punho é preservada.
        for i,dx in enumerate([-.115,-.038,.042,.118]):
            length=[.14,.19,.18,.13][i]
            spread=-s*dx
            x=s*.90+spread
            F.tube('Dedo da mão',[(x,-.38,1.19),(x+spread*.18,-.43,1.11),(x+spread*.22,-.42,1.19-length)],
                   [.045,.049,.032],'fur','hand'+side,7)
            F.tube('Garra da mão',[(x+spread*.22,-.42,1.19-length),(x+spread*.19,-.49,1.12-length),(x+spread*.12,-.51,1.08-length)],
                   [.032,.024,.001],'ivory','hand'+side,5)
        F.tube('Polegar',[(s*1.04,-.33,1.25),(s*1.09,-.44,1.19),(s*1.07,-.48,1.12)],
               [.064,.06,.03],'fur','hand'+side,7)
        F.tube('Garra polegar',[(s*1.07,-.48,1.12),(s*1.02,-.51,1.08)],[.032,.001],'ivory','hand'+side,5)

def clothing():
    F.volume('Cinto',[(0,.12,1.23,.325,.245),(0,.12,1.37,.32,.24)],'leather','hips',12)
    F.buckle((0,-.138,1.30),.18,.135,'hips')
    for i in range(10):
        a=i*math.tau/10;dx,dy=math.cos(a),math.sin(a)
        fur('Pele na cintura',(.28*dx,.12+.20*dy,1.25),
            (.46*dx,.13+.31*dy,.95+random.uniform(-.08,.08)),.14,
            'furDark' if i%2 else 'fur','hips',(dx,dy,.1),.055)
    F.blade('Tira de couro',(-.10,-.13,1.23),(-.07,-.21,.85),.095,'leatherLight','hips')
    F.blade('Tira curta',(.11,-.13,1.23),(.16,-.20,.97),.07,'leather','hips')
    C.box((-.29,-.045,1.30),(.13,.11,.13),'leatherLight','hips',rot=(0,0,-.4))
    C.box((-.29,-.11,1.32),(.045,.025,.035),'gold','hips')

def animate():
    C.init_anim(bpy.context.scene)
    def idle(t):
        C.R('chest',.015*math.sin(math.tau*t));C.R('head',-.02*math.sin(math.tau*t))
        C.R('jaw',.025*math.sin(math.tau*t));C.R('tail',0,0,.045*math.sin(math.tau*t))
    def walk(t):
        idle(t)
        for side,s in [('L',1),('R',-1)]:
            C.R('leg'+side,s*.32*math.sin(math.tau*t));C.R('arm'+side,-s*.23*math.sin(math.tau*t))
            C.R('foot'+side,.16*max(0,-s*math.sin(math.tau*t)))
    def attack(t):
        p=math.sin(math.pi*t);C.R('chest',.14*p);C.R('head',.12*p);C.R('jaw',-.18*p)
        C.R('armR',-.65*p,0,-.30*p);C.R('handR',-.45*p)
    def death(t):C.R('root',0,0,1.45*t);C.R('jaw',-.20*t)
    C.bake_loop('idle',24,idle);C.bake_loop('walk',24,walk);C.bake_once('attack',18,attack);C.bake_once('death',24,death)
    C.ARM.animation_data.action=bpy.data.actions['idle'];C.reset();bpy.context.scene.frame_set(1)

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for folder in ['models','previews','frames','spritesheets','logs']:(BASE/folder).mkdir(exist_ok=True)
    if 'sheets' in args or 'poses' in args:
        bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/flora_werewolf.blend'))
        C.ARM=bpy.data.objects['Rig Lobisomem'];sc=bpy.context.scene;cam=sc.camera;ground=bpy.data.objects['Chao somente apresentacao']
        if 'poses' in args:
            pose_previews(sc,cam,ground);return
    else:
        C.reset_scene();materials();rig();torso();head();legs();arms();clothing()
        C.finish('Flora — forma de lobisomem');animate();sc,cam,ground=F.studio()
        cam.location=(3,-8,3.8);cam.data.ortho_scale=3.60;F.aim(cam,(0,-.02,1.47))
        sc['art_direction']='Lobisomem v3: pelagem facetada, postura digitigrada e iluminacao PBR Cycles, conforme referencia.'
        bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/flora_werewolf.blend'))
        F.render(sc,BASE/'previews/flora_werewolf.png')
        ground.hide_render=False;sc.render.film_transparent=False;F.render(sc,BASE/'previews/flora_werewolf_beauty.png')
        ground.hide_render=True;sc.render.film_transparent=True
        if 'preview' in args:return
    sc.cycles.samples=24;sc.render.resolution_x=224;sc.render.resolution_y=224
    ground.hide_render=True;sc.render.film_transparent=True
    p=math.radians(35);ppu=48;forward=Vector((0,math.cos(p),-math.sin(p)))
    target=Vector((0,math.sin(p),math.cos(p)))*(165-112)/ppu
    cam.data.ortho_scale=224/ppu;cam.location=target-forward*12;F.aim(cam,target)
    bpy.context.view_layer.update()
    from bpy_extras.object_utils import world_to_camera_view
    origin=world_to_camera_view(sc,cam,Vector((0,0,0)))
    assert abs(origin.x*224-112)<.001 and abs((1-origin.y)*224-165)<.001
    out=BASE/'frames/flora_werewolf';out.mkdir(exist_ok=True)
    act=bpy.data.actions['idle'];C.ARM.animation_data.action=act
    if hasattr(act,'slots') and len(act.slots):C.ARM.animation_data.action_slot=act.slots[0]
    for di in range(8):
        C.ARM.rotation_euler.z=math.radians(90-di*45)
        for fi in range(4):
            sc.frame_set(1+fi*6);F.render(sc,out/f'{di}_{fi}.png')
    meta={'cell':224,'ppu':ppu,'anchorX':112,'anchorY':165,'dirs':8,
          'directionAnglesDegrees':[90-i*45 for i in range(8)],
          'anims':{'idle':{'n':4,'fps':4,'loop':True,'row':0}},'prototype':True,'artVersion':3,'shader':'Cycles PBR studio'}
    (BASE/'spritesheets/flora_werewolf_sheet.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')

if __name__=='__main__':main()
