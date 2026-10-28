"""Flora: modelagem facetada, rig e render de estúdio a partir da referência.

blender --background --threads 4 --python blender/scripts/flora_druid_art.py -- preview
blender --background --threads 4 --python blender/scripts/flora_druid_art.py -- sheets
Sem argumentos: gera cena, prévias e sprites. Não altera o jogo nem o lobisomem.
"""
from pathlib import Path
import sys, math, random, json
import bpy, bmesh
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as C

BASE=Path(__file__).resolve().parents[1]
TAU=math.tau
random.seed(28)

def mesh(name, verts, faces, material, bone, palette=None):
    data=bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob)
    C._fin(ob, material, bone, False)
    if palette:
        for m in palette:data.materials.append(C.MATS[m])
        for i,p in enumerate(data.polygons):
            if i%5==1:p.material_index=1+(i//5)%len(palette)
    return ob

def volume(name, rings, material, bone, sides=10, phase=0):
    # Cada anel: (x, y, z, raio horizontal, raio em profundidade).
    verts=[]
    for x,y,z,rx,ry in rings:
        for i in range(sides):
            a=TAU*i/sides+phase;verts.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
    faces=[tuple(reversed(range(sides)))]
    for j in range(len(rings)-1):
        for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    faces.append(tuple((len(rings)-1)*sides+i for i in range(sides)))
    return mesh(name,verts,faces,material,bone)

def tube(name, points, radii, material, bone, sides=7):
    points=[Vector(p) for p in points];verts=[]
    for j,p in enumerate(points):
        axis=(points[min(j+1,len(points)-1)]-points[max(0,j-1)]).normalized()
        u=axis.cross(Vector((0,1,0))).normalized()
        if u.length<.1:u=axis.cross(Vector((1,0,0))).normalized()
        v=axis.cross(u).normalized()
        for i in range(sides):verts.append(p+radii[j]*(math.cos(i*TAU/sides)*u+math.sin(i*TAU/sides)*v))
    faces=[tuple(reversed(range(sides)))]
    for j in range(len(points)-1):
        for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    faces.append(tuple((len(points)-1)*sides+i for i in range(sides)))
    return mesh(name,verts,faces,material,bone)

def ellipsoid(name, pos, scale, material, bone, seg=12):
    ob=C.sphere(pos,1,sc=scale,m=material,bone=bone,seg=seg,smooth=False);ob.name=name;return ob

def blade(name, start, end, width, material, bone, normal=(0,-1,0), bend=.035):
    # Folha/tecido com crista, bordas serrilhadas largas e espessura real.
    a,b=Vector(start),Vector(end);axis=(b-a).normalized();n=Vector(normal).normalized()
    u=axis.cross(n).normalized();n=u.cross(axis).normalized()
    fractions=[0,.27,.50,.74,1];widths=[.24,1,.78,.57,0]
    verts=[]
    for t,w in zip(fractions,widths):
        center=a.lerp(b,t)+n*bend*math.sin(t*math.pi)
        verts.extend([center-u*width*w,center+n*width*.24*w,center+u*width*w])
    count=len(verts);verts += [v-n*.018 for v in verts]
    faces=[]
    for j in range(4):
        k=j*3
        faces.extend([(k,k+3,k+4,k+1),(k+1,k+4,k+5,k+2),
                      (count+k+1,count+k+4,count+k+3,count+k),
                      (count+k+2,count+k+5,count+k+4,count+k+1),
                      (k,count+k,count+k+3,k+3),(k+2,k+5,count+k+5,count+k+2)])
    faces.extend([(0,1,2,count+2,count+1,count),(12,13,14,count+14,count+13,count+12)])
    return mesh(name,verts,faces,material,bone)

def buckle(pos, width, height, bone):
    x,y,z=pos
    for dx in [-width/2,width/2]:C.box((x+dx,y,z),(.028,.036,height),'gold',bone)
    for dz in [-height/2,height/2]:C.box((x,y,z+dz),(width+.025,.036,.028),'gold',bone)
    C.box((x+.015,y-.008,z),(.065,.023,.018),'goldLight',bone)

def materials():
    colors={'leaf':'#536529','leafLight':'#738433','leafGold':'#7c8935','leafDark':'#34481e',
            'hood':'#586c29','hoodLight':'#6b7e32','lining':'#26351a',
            'cloth':'#465925','leather':'#65452c','leatherLight':'#88603a','leatherDark':'#453322',
            'wood':'#80532b','woodLight':'#a06b32','vine':'#63852d',
            'gold':'#c3943f','goldLight':'#dfb75b','skin':'#e6a665','skinLight':'#eeb97a',
            'lip':'#ab6e4a','hair':'#2f2419','hairLight':'#46321e',
            'eye':'#241b13','iris':'#596c35','white':'#f3d9af'}
    for name,color in colors.items():C.mat(name,color,rough=.78,metal=.25 if name.startswith('gold') else 0)
    C.mat('crystal','#8fe82b',rough=.35,emit='#86e923',es=.55)
    C.mat('crystalLight','#dcff86',rough=.3,emit='#ceff77',es=.7)
    C.mat('crystalDark','#55ba20',rough=.4,emit='#56c922',es=.35)

def rig():
    C.bone('root',(0,0,0),(0,0,.22))
    C.bone('hips',(0,0,1.10),(0,0,1.32),'root')
    C.bone('chest',(0,0,1.30),(0,0,1.82),'hips')
    C.bone('head',(0,0,1.92),(0,0,2.37),'chest')
    C.bone('armL',(-.30,0,1.82),(-.51,-.08,1.59),'chest')
    C.bone('handL',(-.51,-.08,1.59),(-.76,-.22,1.62),'armL')
    C.bone('staff',(-.76,-.22,1.62),(-.76,-.22,2.1),'handL')
    C.bone('armR',(.30,0,1.82),(.46,-.05,1.52),'chest')
    C.bone('handR',(.46,-.05,1.52),(.49,-.22,1.24),'armR')
    for side,s in [('L',-1),('R',1)]:
        C.bone('leg'+side,(s*.18,0,1.10),(s*.24,-.015,.64),'hips')
        C.bone('foot'+side,(s*.24,-.015,.64),(s*.29,-.07,.16),'leg'+side)
    C.build_rig();C.ARM.name='Rig Flora'

def body_and_boots():
    volume('Tunique ajustee',[(0,0,1.18,.235,.17),(0,0,1.37,.21,.155),
        (0,0,1.60,.28,.19),(0,0,1.77,.31,.18),(0,0,1.88,.17,.13)],'leather','chest',12)
    tube('Col',[(0,0,1.82),(0,0,2.02)],[.105,.11],'skin','head',10)
    for side,s in [('L',-1),('R',1)]:
        tube('Cuisse '+side,[(s*.18,0,1.12),(s*.21,-.01,.87),(s*.24,-.015,.65)],
             [.145,.145,.10],'skin','leg'+side,10)
        volume('Botte '+side,[(s*.29,-.06,.13,.13,.13),(s*.28,-.04,.25,.11,.105),
                (s*.25,0,.48,.13,.115),(s*.24,-.01,.65,.15,.13)],'leather','foot'+side,8,math.pi/8)
        volume('Pied '+side,[(s*.30,-.14,.045,.155,.25),(s*.30,-.16,.105,.16,.25),
               (s*.29,-.13,.20,.13,.19),(s*.28,-.075,.27,.10,.12)],'leather','foot'+side,8,math.pi/8)
        volume('Semelle '+side,[(s*.30,-.14,.035,.157,.25),(s*.30,-.14,.075,.16,.25)],'leatherDark','foot'+side,8,math.pi/8)
        for z in [.26,.42,.58]:
            tube('Laniere de botte',[(s*.24-.11,-.10,z+.035),(s*.24,-.145,z),(s*.24+.11,-.10,z-.035)],
                 [.028,.027,.026],'leatherLight','foot'+side,5)
        for k in range(7):
            a=k*TAU/7
            blade('Bord botte', (s*.24+.12*math.cos(a),.105*math.sin(a),.70),
                  (s*.24+.145*math.cos(a),.13*math.sin(a),.53+random.uniform(-.04,.04)),
                  .065,'leatherLight' if k%3==0 else 'leather','foot'+side,(math.cos(a),math.sin(a),.1))

def clothes():
    # A base contínua da saia fecha os vãos entre os painéis.
    volume('Base jupe',[(0,0,.79,.33,.235),(0,0,1.03,.30,.22),(0,0,1.24,.235,.175)],'cloth','hips',12)
    for i in range(13):
        a=TAU*i/13;dx,dy=math.cos(a),math.sin(a)
        blade('Pan de jupe',(.23*dx,.18*dy,1.22),(.37*dx,.28*dy,.62+random.uniform(-.08,.09)),
              .115,['leaf','leafDark','leaf','leafLight'][i%4],'hips',(dx,dy,0),.06)
    for i in range(10):
        a=TAU*i/10;dx,dy=math.cos(a),math.sin(a)
        blade('Surjupe',(.22*dx,.18*dy,1.26),(.36*dx,.27*dy,.91+random.uniform(-.06,.04)),
              .105,'leafLight' if i%4==0 else 'leaf','hips',(dx,dy,0))
    # Capa aberta nas costas e nas laterais.
    for layer,(z,rz,length) in enumerate([(1.78,.26,.70),(1.43,.33,.70),(1.08,.40,.67)]):
        for i in range(9):
            a=math.radians(-7+i*194/8);dx,dy=math.cos(a),math.sin(a)
            blade('Cape feuille', (rz*dx,.11+rz*.72*dy,z),
                 ((rz+.13)*dx,.13+(rz+.13)*.85*dy,z-length+random.uniform(-.06,.06)),
                 .14,'leafDark' if i%3==0 else 'leaf','chest' if layer==0 else 'hips',(dx,dy,0),.07)
    # Gola em duas camadas, com folhas curtas ao redor do rosto.
    for layer,(z,radius,length) in enumerate([(1.94,.16,.18),(1.85,.25,.19)]):
        for i in range(12):
            a=TAU*i/12+.10*layer;dx,dy=math.cos(a),math.sin(a)
            blade('Collerette', (radius*dx,radius*.70*dy,z),
                  ((radius+.28)*dx,(radius+.28)*.75*dy,z-length+random.uniform(-.025,.04)),
                  .10,['leaf','leafLight','leafDark','leaf'][i%4],'chest',(dx,dy,.25),.025)
    for side,s in [('L',-1),('R',1)]:
        for y in [-.10,.035,.15]:
            blade('Folha sobre ombro',(s*.27,y,1.90),(s*.53,y-.025,1.68),
                  .095,'leaf' if y<0 else 'leafDark','arm'+side,(0,-1,.4),.035)
    # Cinto espesso e fivela vazada.
    volume('Ceinture',[(0,0,1.19,.257,.198),(0,0,1.30,.249,.194)],'leatherLight','hips',14)
    buckle((-.025,-.208,1.245),.15,.115,'hips')
    C.box((.15,-.19,1.245),(.038,.035,.14),'leatherDark','hips')
    # Bandoleira com seção retangular.
    points=[(-.25,-.15,1.83),(-.17,-.205,1.69),(-.06,-.219,1.54),(.09,-.20,1.37),(.18,-.17,1.28)]
    verts=[]
    for x,y,z in points:verts.extend([(x-.045,y-.018,z-.032),(x+.045,y-.018,z+.032),(x-.045,y+.01,z-.032),(x+.045,y+.01,z+.032)])
    faces=[]
    for j in range(len(points)-1):
        k=j*4;faces.extend([(k,k+4,k+5,k+1),(k+2,k+3,k+7,k+6),(k,k+2,k+6,k+4),(k+1,k+5,k+7,k+3)])
    mesh('Bandouliere',verts,faces,'leatherLight','chest')
    for x,y,z in [points[1],points[3]]:
        C.box((x,y-.035,z),(.10,.028,.035),'gold','chest',rot=(0,-.60,0))
    ellipsoid('Broche',(-.23,-.19,1.83),(.07,.035,.055),'gold','chest',10)
    # Sacola no quadril oposto ao cajado.
    ob=C.box((.29,-.09,1.19),(.17,.18,.23),'leather','hips',rot=(0,.15,-.15));ob.name='Sacoche'
    C.box((.29,-.186,1.23),(.18,.03,.12),'leatherLight','hips',rot=(0,.15,-.15))
    C.box((.29,-.21,1.22),(.035,.018,.04),'gold','hips')

def face_and_hair():
    # Testa dentro do capuz; queixo e maçãs do rosto definidos pelos anéis.
    face=volume('Visage',[(0,-.065,1.99,.07,.09),(0,-.065,2.045,.14,.14),
        (0,-.055,2.13,.20,.176),(0,-.045,2.24,.205,.185),
        (0,-.025,2.35,.185,.17),(0,0,2.41,.12,.12)],'skin','head',12,math.pi/12)
    for polygon in face.data.polygons:polygon.use_smooth=True
    for s in [-1,1]:
        ellipsoid('Oreille',(s*.195,-.015,2.17),(.035,.065,.075),'skin','head',10)
    # Olhos amendoados, pequenos e visíveis sob a franja.
    for s in [-1,1]:
        x=s*.095;y=-.226;z=2.235
        pts=[(x-.043,y,z),(x-.022,y-.009,z+.024),(x+.027,y-.006,z+.019),(x+.044,y+.004,z-.003),(x+.018,y-.008,z-.022),(x-.022,y-.009,z-.019)]
        mesh('Oeil',pts,[tuple(range(6))],'white','head')
        ellipsoid('Iris',(x+.005,y-.012,z+.001),(.017,.009,.023),'iris','head',10)
        ellipsoid('Pupille',(x+.008,y-.020,z+.002),(.009,.004,.018),'eye','head',8)
        tube('Cils',pts[:4],[.005,.008,.008,.004],'eye','head',5)
        tube('Sourcil',[(x-.035,y+.004,z+.051),(x+.015,y+.003,z+.054),(x+.04,y+.015,z+.042)],[.009,.011,.003],'hair','head',5)
    nose=mesh('Nariz',[(-.018,-.23,2.19),(.018,-.23,2.19),(.014,-.246,2.135),(-.011,-.246,2.135),(0,-.259,2.15)],
         [(0,1,4),(1,2,4),(2,3,4),(3,0,4),(0,3,2,1)],'skin','head')
    for polygon in nose.data.polygons:polygon.use_smooth=True
    tube('Sourire',[(-.040,-.208,2.081),(0,-.223,2.076),(.035,-.211,2.084)],[.004,.006,.003],'lip','head',5)
    # Mechas largas e assimétricas deixam o olho direito descoberto.
    ellipsoid('Cheveux arriere',(0,.025,2.23),(.23,.19,.255),'hair','head',12)
    blade('Frange principale',(.075,-.155,2.43),(-.16,-.26,2.17),.09,'hair','head',bend=.03)
    blade('Frange gauche',(-.12,-.15,2.40),(-.205,-.17,2.06),.09,'hairLight','head',bend=.02)
    blade('Meche droite',(.19,-.1,2.38),(.205,-.16,2.04),.065,'hair','head',bend=.02)
    blade('Pointe frange',(.025,-.21,2.39),(-.09,-.261,2.255),.045,'hair','head')

def hood_and_antlers():
    outline=[(-.27,1.96),(-.40,2.13),(-.32,2.36),(.045,2.60),(.29,2.40),(.35,2.13),(.25,1.96),(0,1.925)]
    n=len(outline);verts=[]
    for depth in range(3):
        for x,z in outline:
            if depth==0:verts.append((x,-.265-(.07 if z>2.25 else 0),z))
            elif depth==1:verts.append((x*.91,.08,2.24+(z-2.24)*.92))
            else:verts.append((x*.68,.24,2.24+(z-2.24)*.70))
    faces=[]
    for j in range(2):
        for i in range(n):
            if j==0 and i>=6:continue
            faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.append(tuple(range(2*n,3*n)))
    mesh('Capuche exterieure',verts,faces,'hood','head',['hoodLight'])
    # Borda espessa de tecido e forro escuro.
    inner=[]
    for x,y,z in verts[:n]:inner.append((x*.86,y+.026,2.22+(z-2.22)*.88))
    rimverts=verts[:n]+inner
    mesh('Revers capuche',rimverts,[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(6)],'hoodLight','head')
    lining=inner+[(x*.96,y+.15,z) for x,y,z in inner]
    mesh('Doublure capuche',lining,[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(6)],'lining','head')
    for s in [-1,1]:
        blade('Rabattement capuche',(s*.29,-.20,2.08),(s*.22,-.17,1.87),.075,'hood','head')
        offset=.035 if s==1 else 0
        pts=[(s*.25,.10,2.45),(s*.40,.12,2.63),(s*.51,.12,2.81),(s*.55,.10,2.98+offset),(s*.51,.11,3.09+offset)]
        tube('Bois principal',pts,[.062,.052,.047,.035,.004],'wood','head',6)
        tube('Andouiller externe',[pts[2],(s*.72,.12,2.89),(s*.76,.14,3.06),(s*.73,.13,3.14)],
             [.035,.03,.025,.003],'woodLight','head',6)
        tube('Andouiller interne',[pts[1],(s*.29,.10,2.78),(s*.27,.08,2.92)],
             [.033,.026,.003],'wood','head',6)

def arms():
    for side,points in [('L',[(-.30,0,1.82),(-.43,-.04,1.70),(-.51,-.08,1.59),(-.64,-.15,1.61),(-.76,-.22,1.62)]),
                        ('R',[(.30,0,1.82),(.40,-.025,1.67),(.46,-.05,1.52),(.48,-.13,1.38),(.49,-.22,1.24)])]:
        tube('Bras '+side,points[:3],[.112,.10,.084],'skin','arm'+side,10)
        tube('Avant bras '+side,points[2:],[.084,.095,.068],'skin','hand'+side,10)
        # Braçadeira acompanha o antebraço e tem duas tiras.
        a=Vector(points[3]);b=Vector(points[4]);axis=(b-a).normalized()
        tube('Brassard '+side,[a-axis*.02,a.lerp(b,.75),b],[.104,.095,.075],'leather','hand'+side,8)
        for t in [.05,.65]:
            p=a.lerp(b,t);tube('Bande brassard',[p,p+axis*.035],[.108,.105],'leafLight','hand'+side,8)
    ellipsoid('Paume gauche',(-.76,-.22,1.62),(.095,.08,.11),'leather','handL',10)
    for z in [1.55,1.60,1.65,1.70]:
        tube('Doigt gauche',[(-.82,-.21,z),(-.825,-.28,z),(-.765,-.30,z),(-.72,-.27,z)],
             [.023,.026,.025,.017],'leatherLight','handL',6)
    tube('Pouce gauche',[(-.70,-.19,1.68),(-.71,-.28,1.69),(-.76,-.29,1.65)],
         [.033,.03,.021],'leather','handL',6)
    ellipsoid('Paume droite',(.49,-.225,1.20),(.095,.075,.10),'leather','handR',10)
    for dx in [-.055,-.017,.025,.061]:
        tube('Doigt droit',[(.49+dx,-.24,1.20),(.49+dx,-.275,1.14),(.49+dx,-.24,1.105)],
             [.022,.025,.019],'leatherDark','handR',6)
    tube('Pouce droit',[(.41,-.22,1.23),(.39,-.28,1.18),(.425,-.29,1.15)],[.032,.029,.021],'leather','handR',6)

def staff():
    pts=[(-.79,-.22,.04),(-.83,-.22,.45),(-.71,-.22,1.08),(-.76,-.22,1.64),
         (-.69,-.22,2.11),(-.84,-.22,2.48),(-1.015,-.22,2.78),(-1.055,-.22,3.04),
         (-.94,-.22,3.24),(-.74,-.22,3.29),(-.61,-.22,3.16),(-.67,-.22,3.04),(-.78,-.22,3.06)]
    tube('Cajado de madeira',pts,[.055,.052,.049,.05,.052,.062,.056,.055,.05,.047,.038,.032,.01],'wood','staff',7)
    tube('Ramo cajado',[pts[5],(-.65,-.22,2.61),(-.58,-.22,2.82),(-.60,-.22,2.94)],
         [.04,.035,.026,.004],'woodLight','staff',6)
    tube('Ramo alto',[pts[9],(-.54,-.22,3.27),(-.51,-.22,3.42)],[.035,.027,.004],'wood','staff',6)
    # Cristal alongado, com faces claras orientadas para a luz.
    ob=volume('Cristal', [(-.81,-.22,2.52,0,0),(-.81,-.22,2.72,.135,.115),
              (-.81,-.22,2.83,.105,.09),(-.81,-.22,3.005,0,0)],'crystal','staff',5,.2)
    ob.data.materials.append(C.MATS['crystalLight']);ob.data.materials.append(C.MATS['crystalDark'])
    for p in ob.data.polygons:p.material_index=[0,1,0,2,0][p.index%5]
    vine=[]
    for i in range(60):
        t=i/59;z=.12+t*3.12;a=t*TAU*3.15
        center=-.91
        if z<3.24:
            for pa,pb in zip(pts[:9],pts[1:10]):
                if pa[2]<=z<=pb[2]:
                    center=pa[0]+(pb[0]-pa[0])*(z-pa[2])/(pb[2]-pa[2]);break
        vine.append((center+.067*math.cos(a),-.22+.072*math.sin(a),z))
    tube('Trepadeira',vine,[.022]*len(vine),'vine','staff',5)
    for x,y,z,s in [(-.78,-.24,.37,1),(-.80,-.24,.89,-1),(-.77,-.22,1.30,1),(-.79,-.22,1.95,-1),(-.82,-.22,2.28,1),(-1.0,-.20,2.92,-1),(-.91,-.20,3.18,-1)]:
        blade('Folha trepadeira',(x,y,z),(x+s*.16,y-.025,z+.22),.063,'leafLight','staff',bend=.025)

def animate():
    C.init_anim(bpy.context.scene)
    def idle(t):
        C.R('chest',.012*math.sin(TAU*t));C.R('head',0,0,.018*math.sin(TAU*t))
        # Pequena compensação do braço para estabilizar a pegada.
        C.R('armL',-.012*math.sin(TAU*t))
    def walk(t):
        idle(t)
        for side,s in [('L',1),('R',-1)]:C.R('leg'+side,s*.28*math.sin(TAU*t));C.R('foot'+side,max(0,-s*math.sin(TAU*t))*.15)
        C.R('armR',-.20*math.sin(TAU*t))
    def attack(t):
        p=math.sin(math.pi*t);C.R('armR',-.9*p,0,-.25*p);C.R('handR',-.15*p);C.R('chest',0,.10*p,0)
    def death(t):C.R('root',0,0,1.45*t)
    C.bake_loop('idle',24,idle);C.bake_loop('walk',24,walk);C.bake_once('attack',18,attack);C.bake_once('death',24,death)
    C.ARM.animation_data.action=bpy.data.actions['idle'];C.reset();bpy.context.scene.frame_set(1)

def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def studio():
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=48;sc.cycles.use_denoising=True
    sc.cycles.max_bounces=5;sc.cycles.diffuse_bounces=3
    sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
    sc.render.resolution_x=840;sc.render.resolution_y=1000;sc.render.resolution_percentage=100
    sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast'
    world=bpy.data.worlds.new('Ambiente de estudio');sc.world=world;world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.64,.69,.75,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.45
    for name,pos,power,size,color in [('Luz principal',(-3,-4,7),650,4,(1,.87,.69)),
            ('Preenchimento',(4,-2,4),250,3,(.80,.89,1)),('Recorte',(1,4,6),500,3,(1,.91,.72))]:
        bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;aim(o,(0,0,1.5))
    bpy.ops.object.camera_add(location=(2.6,-8,3.8));cam=bpy.context.object;cam.name='Camera Flora';cam.data.type='ORTHO';cam.data.ortho_scale=3.9;sc.camera=cam;aim(cam,(-.17,0,1.67))
    sc['art_direction']='Flora v3: volumes facetados e iluminacao suave de estudio, conforme referencia do usuario; shader PBR Cycles.'
    sc['scope']='Prototipo isolado. Nenhuma alteracao de gameplay.'
    # Plano apenas para a apresentação; invisível no render RGBA e nos sprites.
    C.mat('floor','#8f877b',rough=1)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.005));ground=bpy.context.object;ground.name='Chao somente apresentacao';ground.data.materials.append(C.MATS['floor']);ground.hide_render=True
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.shading.type='MATERIAL'
    return sc,cam,ground

def render(sc,path):
    sc.render.filepath=str(path);bpy.ops.render.render(write_still=True)

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for folder in ['models','previews','frames','spritesheets','logs']:(BASE/folder).mkdir(exist_ok=True)
    if 'sheets' in args:
        bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/flora_druid.blend'))
        C.ARM=bpy.data.objects['Rig Flora'];sc=bpy.context.scene;cam=sc.camera;ground=bpy.data.objects['Chao somente apresentacao']
    else:
        C.reset_scene();materials();rig();body_and_boots();clothes();face_and_hair();hood_and_antlers();arms();staff()
        C.finish('Flora — druida da floresta');animate();sc,cam,ground=studio()
        bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/flora_druid.blend'))
        render(sc,BASE/'previews/flora_druid.png')
        ground.hide_render=False;sc.render.film_transparent=False
        render(sc,BASE/'previews/flora_druid_beauty.png')
        ground.hide_render=True;sc.render.film_transparent=True
        if 'preview' in args:return
    sc.cycles.samples=24;sc.render.resolution_x=224;sc.render.resolution_y=224
    ground.hide_render=True;sc.render.film_transparent=True
    p=math.radians(35);forward=Vector((0,math.cos(p),-math.sin(p)))
    ppu=44  # Margem para o cajado e os galhos altos em todas as direções.
    target=Vector((0,math.sin(p),math.cos(p)))*(165-112)/ppu
    cam.data.ortho_scale=224/ppu;cam.location=target-forward*12;aim(cam,target)
    bpy.context.view_layer.update()
    from bpy_extras.object_utils import world_to_camera_view
    origin=world_to_camera_view(sc,cam,Vector((0,0,0)))
    assert abs(origin.x*224-112)<.001 and abs((1-origin.y)*224-165)<.001
    out=BASE/'frames/flora_druid';out.mkdir(exist_ok=True)
    act=bpy.data.actions['idle'];C.ARM.animation_data.action=act
    if hasattr(act,'slots') and len(act.slots):C.ARM.animation_data.action_slot=act.slots[0]
    for di in range(8):
        C.ARM.rotation_euler.z=math.radians(90-di*45)
        for fi in range(4):
            sc.frame_set(1+fi*6);render(sc,out/f'{di}_{fi}.png')
    meta={'cell':224,'ppu':ppu,'anchorX':112,'anchorY':165,'dirs':8,
          'directionAnglesDegrees':[90-i*45 for i in range(8)],
          'anims':{'idle':{'n':4,'fps':4,'loop':True,'row':0}},'prototype':True,'artVersion':3,'shader':'Cycles PBR studio'}
    (BASE/'spritesheets/flora_druid_sheet.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')

if __name__=='__main__':main()
