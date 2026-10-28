"""Flora: protótipo independente. Blender --background --python este_arquivo."""
import os, sys, math, random, json
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import common as C
from common import *
import combat_toon
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
random.seed(17)

def mass(loc,scale,material,bn,detail=1):
    """Volume triangulado com facetas largas e pequenas variacoes de cor."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail,radius=1,location=loc)
    ob=bpy.context.object;ob.scale=scale;C._apply(ob)
    C._fin(ob,material,bn,False)
    base=C.MATS[material]
    for factor in [.88,1.09]:
        key=material+str(factor)
        if key not in C.MATS:
            m=base.copy();m.name=key
            color=m.node_tree.nodes['Principled BSDF'].inputs['Base Color']
            color.default_value=tuple(min(1,c*factor) for c in color.default_value[:3])+(1,)
            C.MATS[key]=m
        ob.data.materials.append(C.MATS[key])
    for face in ob.data.polygons:
        face.material_index=random.choices([0,1,2],[7,2,2])[0]
    return ob

def tuft(a,b,width,material,bn):
    """Mecha volumetrica: base irregular larga, crista e ponta inclinada."""
    a,b=Vector(a),Vector(b);direction=(b-a).normalized()
    u=direction.cross(Vector((0,1,0))).normalized()
    if u.length<.1:u=Vector((1,0,0))
    v=direction.cross(u).normalized()
    verts=[a+u*width,a+v*width*.55,a-u*width,a-v*width*.55,
           a.lerp(b,.4)+v*width*.65,b]
    mesh=bpy.data.meshes.new('mecha');mesh.from_pydata(verts,[],[(0,1,4),(1,2,4),(2,3,5),(3,0,5),(0,4,5),(4,2,5),(3,2,1,0)])
    ob=bpy.data.objects.new('mecha esculpida',mesh);bpy.context.collection.objects.link(ob)
    return C._fin(ob,material,bn,False)

def hood():
    verts=[];n=11
    for depth in range(3):
        for i in range(n):
            a=math.radians(-22+i*224/(n-1))
            x=cos(a)*(.34 if depth<2 else .25)
            z=1.94+sin(a)*(.38 if depth<2 else .28)
            verts.append((x,[-.32,-.02,.22][depth],z))
    faces=[]
    for d in range(2):
        for i in range(n-1):faces.append((d*n+i,d*n+i+1,(d+1)*n+i+1,(d+1)*n+i))
    faces.append(tuple(range(2*n,3*n)))
    mesh=bpy.data.meshes.new('capuz aberto');mesh.from_pydata(verts,[],faces)
    ob=bpy.data.objects.new('Capuz com abertura real',mesh);bpy.context.collection.objects.link(ob);C._fin(ob,'green','head',False)
    for s in [-1,1]:
        tuft((s*.29,-.29,1.96),(s*.30,-.27,1.59),.10,'dark','head')
        seg((s*.02,-.34,2.29),(s*.29,-.34,2.01),.028,.035,'light','head',5)

def leaf(a,b,width,material,bn):
    a,b=Vector(a),Vector(b); mid=a.lerp(b,.43)
    axis=(b-a).cross(Vector((0,1,0))).normalized()*width
    verts=[a,mid+axis,mid+Vector((0,-width*.45,0)),mid-axis,b]
    mesh=bpy.data.meshes.new('folha');mesh.from_pydata(verts,[],[(0,1,2),(0,2,3),(1,4,2),(2,4,3)])
    ob=bpy.data.objects.new('folha facetada',mesh);bpy.context.collection.objects.link(ob)
    return C._fin(ob,material,bn,False)

def make(wolf):
    reset_scene();sc=bpy.context.scene
    for name,col in [('green','#586c25'),('light','#839537'),('dark','#344821'),('wood','#754a28'),('leather','#60412e'),('gold','#c59942'),('skin','#efbc79'),('hair','#3e291d'),('fur','#514039'),('furLight','#88705c'),('cream','#d3bf98'),('black','#29282b')]:mat(name,col)
    mat('eye','#ffb52b',emit='#ffb52b',es=1);mat('crystal','#a3f43f',emit='#a3f43f',es=1)
    hip=1.03 if wolf else .9; chest=1.62 if wolf else 1.38; head=2.05 if wolf else 1.86
    bone('root',(0,0,0),(0,0,.2));bone('hips',(0,0,hip),(0,0,hip+.2),'root')
    bone('chest',(0,0,chest-.3),(0,0,chest+.2),'hips');bone('head',(0,0,head-.2),(0,0,head+.2),'chest')
    for side,s in [('L',-1),('R',1)]:
        x=s*(.6 if wolf else .38)
        bone('arm'+side,(x*.8,0,chest+.08),(x,-.07,chest-.32),'chest')
        bone('hand'+side,(x,-.07,chest-.32),(x*1.12,-.2,chest-.64),'arm'+side)
        bone('leg'+side,(s*.2,0,hip),(s*.27,.04,.48),'hips');bone('foot'+side,(s*.27,.04,.48),(s*.29,-.13,.12),'leg'+side)
    build_rig()
    if not wolf:
        cone((0,0,1.2),.28,.34,.57,'leather','chest',sc=(1,.68,1))
        # Open hood: faceted arch leaves the face visible from the front (-Y).
        mass((0,-.15,1.89),(.235,.18,.28),'hair','head',2)
        mass((0,-.245,1.865),(.185,.12,.225),'skin','head',2)
        hood()
        mass((0,-.365,1.845),(.037,.04,.048),'skin','head')
        seg((-.04,-.358,1.77),(.035,-.358,1.765),.009,.009,'wood','head',5)
        for s in [-1,1]:
            seg((s*.065,-.36,1.91),(s*.13,-.34,1.925),.017,.013,'black','head',5)
            mass((s*.092,-.365,1.916),(.013,.007,.013),'gold','head')
            tuft((s*.17,-.30,2.03),(s*.18,-.34,1.71),.075,'hair','head')
            # Antler branches.
            points=[(s*.2,.07,2.12),(s*.38,.07,2.34),(s*.48,.08,2.57),(s*.43,.07,2.76)]
            for a,b in zip(points,points[1:]):seg(a,b,.060,.038,'wood','head',5)
            seg(points[1],(s*.62,.07,2.46),.034,.012,'wood','head',5)
            seg(points[2],(s*.66,.08,2.64),.028,.008,'wood','head',5)
        tuft((.04,-.32,2.06),(-.15,-.37,1.86),.11,'hair','head')
        for i in range(16):
            a=i*tau/16;x,y=math.cos(a),math.sin(a)
            tuft((x*.22,y*.18,1.61),(x*.53,y*.37,1.31+random.uniform(-.09,.07)),.13,'light' if i%3==0 else 'green','chest')
            tuft((x*.2,y*.16,1.05),(x*.40,y*.3,.42+random.uniform(-.05,.12)),.14,'green' if i%2 else 'dark','hips')
        # Rear leaf cloak, layered instead of a solid cone.
        for z in [1.47,1.24,1.02,.80]:
            for x in [-.28,-.10,.10,.28]:tuft((x,.20,z+.15),(x*1.4,.38,z-.4+random.uniform(-.08,.08)),.17,'dark' if x<0 else 'green','chest' if z>1 else 'hips')
        for z in [.94,1.34]:
            mass((.26,-.22,z),(.10,.08,.12),'leather','hips' if z<1 else 'chest')
        for z in [1.27,1.45]:box((-.14+(1.45-z)*.8,-.29,z),(.075,.04,.05),'gold','chest',rot=(0,-.6,0))
        seg((-.25,-.23,1.59),(.23,-.22,1.02),.055,.055,'wood','chest',6)
        # Staff follows the left hand.
        pts=[(-.58,-.25,.05),(-.53,-.25,.84),(-.60,-.25,1.6),(-.65,-.25,2.3),(-.83,-.25,2.53),(-.73,-.25,2.76),(-.48,-.25,2.8),(-.37,-.25,2.59)]
        for a,b in zip(pts,pts[1:]):seg(a,b,.045,.038,'wood','handL',6)
        verts=[(-.6,-.25,2.75),(-.6,-.25,2.30),(-.73,-.25,2.49),(-.6,-.36,2.49),(-.47,-.25,2.49),(-.6,-.14,2.49)]
        mesh=bpy.data.meshes.new('cristal');mesh.from_pydata(verts,[],[(0,2,3),(0,3,4),(0,4,5),(0,5,2),(1,3,2),(1,4,3),(1,5,4),(1,2,5)])
        ob=bpy.data.objects.new('Cristal lapidado',mesh);bpy.context.collection.objects.link(ob);C._fin(ob,'crystal','handL',False)
        for j in range(22):
            t=j/21;tn=(j+1)/21
            a=(-.57+.07*cos(t*tau*2.5),-.25+.07*sin(t*tau*2.5),.25+t*1.96)
            b=(-.57+.07*cos(tn*tau*2.5),-.25+.07*sin(tn*tau*2.5),.25+tn*1.96)
            seg(a,b,.018,.018,'dark','handL',5)
        # Pegada envolve a haste em vez de deixar a mao afastada.
        seg((-.425,-.20,.74),(-.57,-.25,.85),.08,.08,'leather','handL',7)
        for z in [.80,.85,.90]:seg((-.62,-.29,z),(-.53,-.29,z),.025,.025,'leather','handL',6)
        for z in [.4,.95,1.8,2.13]:leaf((-.58,-.25,z),(-.8,-.25,z+.25),.075,'light','handL')
    else:
        mass((0,.07,1.55),(.48,.35,.52),'fur','chest',2)
        for s in [-1,1]:mass((s*.22,-.16,1.65),(.27,.16,.28),'fur','chest',2)
        for s in [-1,1]:
            mass((s*.49,.015,1.74),(.31,.29,.28),'fur','arm'+('L' if s<0 else 'R'),2)
            mass((s*.23,.015,.80),(.23,.23,.30),'furLight','leg'+('L' if s<0 else 'R'),2)
            for j in range(7):
                a=(s*(.16+j*.057),.08,2.38-j*.1)
                b=(s*(.25+j*.085),.17,2.54-j*.16)
                tuft(a,b,.15,'fur' if j%3 else 'furLight','head' if j<3 else 'chest')
            for j in range(3):
                leaf((s*.08,-.27,1.87-j*.1),(s*.20,-.32,1.63-j*.12),.12,'cream' if j==0 else 'furLight','chest')
        mass((0,-.10,2.08),(.34,.28,.36),'fur','head',2)
        mass((0,-.37,1.99),(.18,.26,.13),'cream','head',2)
        mass((0,-.57,2.035),(.115,.08,.073),'black','head')
        mass((0,-.37,1.84),(.17,.235,.075),'furLight','head')
        box((0,-.405,1.895),(.27,.29,.085),'black','head')
        for s in [-1,1]:
            cone((s*.23,.0,2.4),.13,.0,.34,'fur','head',rot=(0,s*.22,0),seg=4)
            mass((s*.155,-.34,2.12),(.063,.025,.038),'eye','head')
            tuft((s*.08,-.35,2.17),(s*.29,-.24,2.24),.075,'furLight','head')
            for x in [.07,.12]:cone((s*x,-.50,1.895),.03,0,.11,'cream','head',rot=(math.pi,0,0),seg=5)
            cone((s*.10,-.49,1.86),.025,0,.08,'cream','head',seg=5)
            for j in range(6):
                z=2.24-j*.14
                tuft((s*.24,-.10,z),(s*(.38+.035*j),-.12,z-.24),.14,'fur' if j%2 else 'furLight','head' if j<3 else 'chest')
            for j in range(4):
                tuft((s*.38,.12,1.96-j*.13),(s*(.65+j*.035),.16,1.7-j*.12),.16,'fur','chest')
            for j in range(3):
                tuft((s*.51,-.04,1.85-j*.09),(s*.76,-.06,1.75-j*.12),.12,'fur','arm'+('L' if s<0 else 'R'))
                tuft((s*.6,-.1,1.27-j*.07),(s*.76,-.12,1.13-j*.08),.10,'fur','hand'+('L' if s<0 else 'R'))
            for j in range(5):
                z=2.12-j*.105
                tuft((s*.22,-.19,z),(s*(.37+j*.03),-.29,z-.25),.145,'furLight' if j%3==0 else 'fur','head' if j<2 else 'chest')
                tuft((s*.46,-.17,1.92-j*.07),(s*(.61+j*.025),-.23,1.78-j*.09),.12,'fur','arm'+('L' if s<0 else 'R'))
            tuft((s*.14,-.30,2.0),(s*.27,-.33,1.81),.11,'cream','head')
            mass((s*.60,-.09,1.17),(.155,.15,.19),'cream','hand'+('L' if s<0 else 'R'),2)
        for i in range(10):
            a=i*tau/10
            tuft((.24*cos(a),.18*sin(a),1.04),(.48*cos(a),.32*sin(a),.65),.15,'leather' if i%3==0 else 'fur','hips')
        seg((0,.24,1.0),(0,.58,.7),.14,.09,'fur','hips');seg((0,.58,.7),(0,.74,.42),.09,.008,'fur','hips')
    for side,s in [('L',-1),('R',1)]:
        x=s*(.6 if wolf else .38);material='fur' if wolf else 'skin'
        seg((x*.8,0,chest+.08),(x,-.07,chest-.32),.21 if wolf else .105,.13 if wolf else .08,material,'arm'+side)
        seg((x,-.07,chest-.32),(x*1.12,-.2,chest-.64),.16 if wolf else .09,.11 if wolf else .075,'furLight' if wolf else 'leather','hand'+side)
        sphere((x*1.12,-.2,chest-.64),.15 if wolf else .10,m='fur' if wolf else 'leather',bone='hand'+side,seg=8,smooth=False)
        seg((s*.2,0,hip),(s*.27,.04,.48),.20 if wolf else .12,.12,material if wolf else 'leather','leg'+side)
        seg((s*.27,.04,.48),(s*.29,-.13,.14),.12,.09,'fur' if wolf else 'leather','foot'+side)
        sphere((s*.29,-.2,.12),.16,sc=(1,1.5,.65),m='fur' if wolf else 'leather',bone='foot'+side,seg=8,smooth=False)
        if wolf:
            for dx in [-.10,0,.10]:
                mass((x*1.12+dx,-.23,chest-.72),(.058,.08,.12),'fur','hand'+side)
            for dx in [-.09,0,.09]:
                seg((x*1.12+dx,-.24,chest-.68),(x*1.12+dx,-.31,chest-.86),.036,.002,'cream','hand'+side,5)
                seg((s*.29+dx,-.33,.12),(s*.29+dx,-.46,.08),.04,.002,'cream','foot'+side,5)
    torus((0,0,hip+.02),.265,.055,'leather','hips',sc=(1,.8,1))
    box((0,-.245,hip+.02),(.18,.055,.15),'gold','hips');box((0,-.278,hip+.02),(.10,.02,.075),'leather','hips')
    body=finish('Flora — Lobisomem' if wolf else 'Flora — Druida')
    # Proporcoes compactas da referencia; aplicadas tambem ao esqueleto.
    def reshape(v):
        x,y,z=v
        if wolf:
            x*=1.16 if z<1 else 1.05
            if z>1.75:y-=min(.18,(z-1.75)*.5)
            z*=.96
        else:
            x*=1.08
            z=z*.83 if z<1.05 else z-.1785
        return Vector((x,y,z))
    for v in body.data.vertices:v.co=reshape(v.co)
    bpy.context.view_layer.objects.active=C.ARM;bpy.ops.object.mode_set(mode='EDIT')
    for b in C.ARM.data.edit_bones:b.head=reshape(b.head);b.tail=reshape(b.tail)
    bpy.ops.object.mode_set(mode='OBJECT');init_anim(sc)
    def idle(t):R('chest',.025*sin(t*tau));R('head',0,0,.025*sin(t*tau))
    def walk(t):
        idle(t)
        for side,s in [('L',1),('R',-1)]:R('leg'+side,.35*sin(t*tau)*s);R('arm'+side,-.18*sin(t*tau)*s)
    def attack(t):R('chest',.15*sin(t*math.pi));R('armR',-.95*sin(t*math.pi),0,-.4*sin(t*math.pi))
    def death(t):R('root',0,0,1.5*t)
    bake_loop('idle',24,idle);bake_loop('walk',24,walk);bake_once('attack',18,attack);bake_once('death',24,death)
    name='flora_werewolf' if wolf else 'flora_druid'
    C.ARM.animation_data.action=bpy.data.actions['idle'];sc.frame_set(1)
    combat_toon.setup(sc)
    sc.render.resolution_x=512;sc.render.resolution_y=512;sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
    bpy.ops.object.camera_add();cam=bpy.context.object;cam.name='Camera prototipo';sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=3.65
    target=Vector((0,0,1.35));cam.location=(3,-7,4.0);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    for folder in ['models','previews','frames','spritesheets']:os.makedirs(os.path.join(BASE,folder),exist_ok=True)
    sc['prototype_scope']='Estudo visual independente; sem integracao ao jogo. Oito direcoes, idle de 4 quadros.'
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE,'models',name+'.blend'))
    sc.render.filepath=os.path.join(BASE,'previews',name+'.png');bpy.ops.render.render(write_still=True)
    sc.render.resolution_x=224;sc.render.resolution_y=224
    p=math.radians(35);forward=Vector((0,cos(p),-sin(p)));target=Vector((0,sin(p),cos(p)))*(165-112)/56
    cam.data.ortho_scale=4;cam.location=target-forward*12;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    out=os.path.join(BASE,'frames',name);os.makedirs(out,exist_ok=True)
    for di in range(8):
        C.ARM.rotation_euler.z=math.radians(90-di*45)
        for fi in range(4):
            sc.frame_set(1+fi*6);sc.render.filepath=os.path.join(out,f'{di}_{fi}.png');bpy.ops.render.render(write_still=True)
    meta={'cell':224,'ppu':56,'anchorX':112,'anchorY':165,'dirs':8,'directionAnglesDegrees':[90-i*45 for i in range(8)],'anims':{'idle':{'n':4,'fps':4,'loop':True,'row':0}},'prototype':True}
    with open(os.path.join(BASE,'spritesheets',name+'_sheet.json'),'w') as f:json.dump(meta,f,indent=2)

if __name__=='__main__':
    # Entrada legada encaminha para as fontes refinadas de cada forma.
    import flora_druid_art
    flora_druid_art.main()
    import flora_werewolf_art
    flora_werewolf_art.main()
