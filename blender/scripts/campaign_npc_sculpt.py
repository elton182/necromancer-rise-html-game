"""Volumes esculpidos e roupas low poly dos NPCs; usa o rig de campaign_npcs."""
import math
import bpy
import common as c
import character_sculpt as s


def palette(cloth, skin, hair):
    colors = {'cloth': cloth, 'skin': skin, 'hair': hair, 'linen': '#dfd2b3',
              'leather': '#705039', 'boots': '#39312b', 'gold': '#bca16b',
              'metal': '#8e9ba3', 'eyes': '#25252b', 'cloak': '#303947',
              'trim': '#8e8975', 'paper': '#e6d7af', 'skinshade': '#a87759',
              'nose': skin, 'beard': hair, 'hairlight': '#75604b',
              'cloakshade': '#252d39', 'cloaklight': '#3f4b5a',
              'seam': '#bda77c', 'sole': '#292725', 'steelshade': '#596a7a'}
    for name, color in colors.items():
        c.mat(name, color, metal=.35 if name in ('gold', 'metal', 'steelshade') else 0)


def strip(name, points, width, material, bone='chest'):
    # Fita plana com espessura: correias e costuras não parecem tubos.
    verts = []
    for x, y, z in points:
        verts.extend([(x-width/2, y, z), (x+width/2, y, z)])
    faces = [(i*2, i*2+1, i*2+3, i*2+2) for i in range(len(points)-1)]
    obj = s.mesh(name, verts, faces, material, bone)
    mod = obj.modifiers.new('Couro espesso', 'SOLIDIFY');mod.thickness=.014
    return obj


def cloak():
    n = 15
    verts = []
    for row, (z, rx, ry) in enumerate([(1.79,.48,.28),(1.52,.52,.31),(.85,.56,.37),(.30,.64,.44)]):
        for i in range(n):
            a = -.30+(math.pi+.60)*i/(n-1)
            fold = 1+(.035 if i%2 else -.035)*(row/3)
            verts.append((rx*math.cos(a)*fold,.08+ry*math.sin(a)*fold,z+(.025*math.cos(i*1.7) if row==3 else 0)))
    faces = [(row*n+i,row*n+i+1,(row+1)*n+i+1,(row+1)*n+i) for row in range(3) for i in range(n-1)]
    cape=s.mesh('Capa com pregas largas',verts,faces,'cloak','cape')
    cape.data.materials.append(c.MATS['cloakshade']);cape.data.materials.append(c.MATS['cloaklight'])
    for i, p in enumerate(cape.data.polygons):p.material_index=1 if i%(n-1) in (2,6,10) else 2 if i%(n-1) in (3,7,11) else 0
    cape.modifiers.new('Bainha com espessura','SOLIDIFY').thickness=.025
    # Gola sobre os ombros: cobre a junção entre tronco e capa.
    s.rings('Gola de tecido dobrado',[(1.68,.43,.23,.25,0),(1.79,.51,.26,.28,0),(1.87,.25,.18,.19,0)],'cloaklight',n=12)
    outer=[(-.27,-.34,1.90),(-.44,-.34,2.16),(-.39,-.30,2.51),(-.16,-.24,2.72),(.07,-.18,2.79),(.36,-.27,2.57),(.45,-.34,2.18),(.29,-.34,1.90)]
    inner=[(-.23,-.36,1.93),(-.37,-.36,2.17),(-.32,-.33,2.48),(-.13,-.28,2.65),(.06,-.23,2.70),(.30,-.31,2.51),(.38,-.36,2.18),(.24,-.36,1.93)]
    back=[(x*.85,.40,z-.08) for x,y,z in outer];n=len(outer)
    s.mesh('Capuz de tecido volumoso',outer+back,[(i,i+1,i+1+n,i+n) for i in range(n-1)]+[tuple(range(n,2*n))],'cloak','head')
    s.mesh('Borda dobrada do capuz',outer+inner,[(i,i+1,i+1+n,i+n) for i in range(n-1)],'cloaklight','head')
    for i in range(n-1):s.link('Debrum gasto do capuz',outer[i],outer[i+1],.010,.010,'trim','head')
    s.ell('Broche de viajante',(0,-.29,1.77),(.075,.027,.085),'gold',seg=10)


def head(ident):
    if ident == 'mayor':
        mat=c.MATS['hairlight']
        shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        shader.inputs['Base Color'].default_value=(*c.hexc('#d2cec2'),1)
    s.ell('Pescoço',(0,0,1.85),(.145,.13,.15),'skin','head')
    s.face(elder=ident=='mayor',bearded=ident in ('joao','guard'))
    # Olhos têm branco e pupila pequena; expressão legível sem grandes olhos brilhantes.
    for side in [-1,1]:
        s.box('Branco dos olhos',(side*.125,-.302,2.255),(.074,.016,.052),'linen','head',.008)
        s.box('Pupila',(side*.125,-.316,2.252),(.030,.015,.037),'eyes','head',.005)
    if ident in ('helena','mayor'):
        s.hair(elder=ident=='mayor')
    else:
        s.ell('Cabelo sob cobertura',(0,.06,2.40),(.31,.25,.15),'hair','head',10)
        for side in [-1,1]:
            s.ell('Mecha lateral',(side*.28,.015,2.25),(.065,.14,.17),'hair','head',8)
    if ident=='helena':
        for side in [-1,1]:s.ell('Brinco discreto',(side*.35,-.015,2.10),(.022,.025,.035),'gold','head',8)
    if ident=='marta':
        # Lenço abaulado com nó na nuca e pontas; substitui o chapéu cônico.
        s.rings('Lenço da viajante',[(2.39,.33,.26,.28,.04),(2.51,.32,.25,.28,.05),(2.62,.19,.16,.18,.06),(2.65,.04,.04,.04,.06)],'linen','head',12)
        s.ell('Nó do lenço',(0,.31,2.40),(.11,.08,.09),'linen','head',8)
        strip('Ponta do lenço',[(0,.34,2.40),(.09,.34,2.17),(.02,.34,2.02)],.13,'linen','head')
        for side in [-1,1]:
            for j in range(4):s.ell('Trança',(side*.30,.10,2.23-j*.10),(.07,.08,.085),'hair','head',8)
    if ident=='messenger':
        s.rings('Boina assimétrica',[(2.40,.34,.27,.27,.03),(2.50,.37,.29,.27,.04),(2.60,.25,.20,.19,.04),(2.64,.07,.07,.06,.04)],'cloth','head',12)
        s.ell('Broche da boina',(-.27,-.19,2.47),(.045,.025,.045),'gold','head',8)
    if ident=='guard':
        s.rings('Elmo abaulado',[(2.39,.35,.29,.29,.03),(2.52,.35,.28,.28,.03),(2.66,.23,.20,.20,.03),(2.72,.05,.05,.05,.03)],'metal','head',12)
        s.rings('Aro do elmo',[(2.38,.36,.30,.30,.03),(2.43,.36,.30,.30,.03)],'steelshade','head',12)
        for side in [-1,1]:s.box('Proteção das têmporas',(side*.31,.02,2.25),(.085,.20,.26),'metal','head',.025)


def body(ident,width):
    heavy=ident in ('guard','mayor');woman=ident in ('marta','helena')
    s.rings('Casaco com cintura e peito',[(1.02,.29,.21,.20,0),(1.15,.33 if heavy else .29,.24,.21,0),(1.38,.40 if heavy else .32,.29 if heavy else .24,.24,0),(1.62,width,.26,.23,0),(1.76,.30,.22,.20,0)],'cloth',n=12)
    if not woman:
        s.rings('Abas do casaco',[(.83,.36,.25,.23,0),(1.10,.30,.23,.21,0)],'cloth','hips',12)
    if ident in ('joao','mayor','helena'):
        for side in [-1,1]:
            s.mesh('Lapela do casaco',[(side*.06,-.245,1.32),(side*.24,-.21,1.73),(side*.12,-.245,1.78),(side*.02,-.265,1.49)],[(0,1,2,3)],'linen' if ident!='joao' else 'leather')
    else:
        s.mesh('Abertura da gola',[(-.12,-.24,1.76),(.12,-.24,1.76),(.04,-.27,1.57),(-.04,-.27,1.57)],[(0,1,2,3)],'linen')
    for side,sign in [('L',1),('R',-1)]:
        x=sign*(width+.10)
        s.sleeve(side,sign,width,'cloth')
        s.link('Punho de tecido',(x,-.065,1.37),(x,-.075,1.29),.115,.11,'linen','arm.'+side)
        s.link('Antebraço',(x,-.05,1.33),(x,-.10,1.08),.10,.08,'skin','hand.'+side)
        s.ell('Mão',(x,-.11,1.03),(.095,.09,.12),'skin','hand.'+side,10)
        s.ell('Polegar',(x-sign*.07,-.17,1.07),(.045,.045,.065),'skin','hand.'+side,8)
        leg='leg.'+side
        obj=s.rings('Calça com joelho',[(.25,.11,.12,.11,0),(.50,.14,.15,.14,0),(.78,.17,.17,.16,0),(1.02,.16,.18,.17,0)],'cloth',leg,10)
        for v in obj.data.vertices:v.co.x+=sign*.18
        s.link('Cano da bota',(sign*.18,0,.17),(sign*.18,0,.47),.14,.13,'boots',leg)
        s.link('Dobra da bota',(sign*.18,0,.43),(sign*.18,0,.49),.15,.15,'leather',leg)
        s.box('Sola arredondada',(sign*.18,-.11,.075),(.29,.47,.12),'sole',leg,.035)
        s.ell('Peito da bota',(sign*.18,-.13,.17),(.15,.24,.13),'boots',leg,10)
        s.box('Fivela da bota',(sign*.18,-.13,.38),(.075,.035,.055),'gold',leg,.01)
    s.rings('Cinto',[(1.055,.32,.245,.23,0),(1.135,.32,.245,.23,0)],'leather','hips',12)
    s.box('Fivela vazada',(0,-.259,1.10),(.12,.035,.09),'gold','hips',.015)
    s.box('Centro da fivela',(0,-.28,1.10),(.07,.012,.045),'leather','hips',.005)
    if woman:
        # Pregas de larguras alternadas, com barra e cintura modeladas.
        obj=s.rings('Saia com pregas',[(.18,.48,.33,.31,0),(.28,.47,.32,.30,0),(.70,.40,.28,.27,0),(1.08,.29,.23,.22,0)],'cloth','hips',16)
        for v in obj.data.vertices:
            if v.co.z<1: v.co.y*=1.04 if v.index%2 else .96
        s.rings('Bainha da saia',[(.19,.484,.335,.315,0),(.24,.480,.332,.312,0)],'seam','hips',16)
    if ident in ('joao','marta','messenger'):
        strip('Correia de viagem',[(-.27,-.20,1.77),(-.14,-.275,1.54),(.05,-.28,1.31),(.30,-.245,1.04)],.075,'leather')
        s.box('Bolsa de couro',(.35,-.09,.98),(.29,.22,.31),'leather','hips',.045)
        s.box('Aba da bolsa',(.35,-.22,1.06),(.30,.045,.18),'trim','hips',.025)
        s.box('Fecho da bolsa',(.35,-.25,1.02),(.045,.02,.07),'gold','hips',.008)
    if ident=='joao':cloak()
    if ident=='marta':
        s.mesh('Avental curvado',[(-.22,-.252,1.08),(.22,-.252,1.08),(.30,-.30,.42),(.13,-.338,.35),(-.12,-.338,.38),(-.30,-.30,.43)],[(0,1,2,3,4,5)],'linen','hips')
        s.box('Bolso do avental',(0,-.325,.75),(.24,.028,.15),'seam','hips',.014)
    if ident=='helena':
        s.box('Livro encadernado',(-.48,-.15,1.09),(.27,.16,.35),'leather','hand.R',.025)
        s.box('Páginas do livro',(-.48,-.24,1.09),(.22,.018,.28),'paper','hand.R',.006)
        s.box('Selo da guilda',(-.48,-.257,1.09),(.07,.012,.08),'gold','hand.R',.008)
        s.ell('Medalhão',(0,-.275,1.53),(.055,.025,.07),'gold',seg=10)
    if ident=='guard':
        s.rings('Peitoral abaulado',[(1.17,.31,.26,.20,0),(1.35,.40,.32,.24,0),(1.61,.42,.29,.23,0),(1.74,.29,.23,.20,0)],'metal',n=12)
        for side,sign in [('L',1),('R',-1)]:
            s.ell('Ombreira articulada',(sign*width,0,1.69),(.23,.23,.15),'steelshade','arm.'+side,10)
            s.ell('Placa da ombreira',(sign*width,-.01,1.74),(.235,.23,.10),'metal','arm.'+side,10)
        shield=[(-.78,-.28,1.38),(-.40,-.28,1.38),(-.36,-.28,1.07),(-.59,-.28,.79),(-.82,-.28,1.07)]
        obj=s.mesh('Escudo recortado',shield,[(0,1,2,3,4)],'cloth','hand.R');obj.modifiers.new('Madeira do escudo','SOLIDIFY').thickness=.065
        for a,b in zip(shield,shield[1:]+shield[:1]):s.link('Borda do escudo',a,b,.023,.023,'metal','hand.R')
        s.ell('Umbo do escudo',(-.59,-.32,1.13),(.075,.045,.075),'metal','hand.R',10)
    if ident=='messenger':
        s.link('Pergaminho',(-.48,-.16,.94),(-.48,-.16,1.24),.065,.065,'paper','hand.R')
        s.link('Fita do pergaminho',(-.48,-.16,1.07),(-.48,-.16,1.12),.071,.071,'cloth','hand.R')
    if ident=='mayor':
        for side in [-1,1]:
            strip('Corrente do cargo',[(side*.24,-.22,1.75),(side*.18,-.28,1.54),(side*.07,-.30,1.39)],.045,'gold')
        s.ell('Medalhão do prefeito',(0,-.31,1.38),(.09,.03,.10),'gold',seg=12)
        s.link('Bengala',(.54,-.11,.10),(.54,-.11,1.1),.029,.029,'leather','hand.L')
        s.ell('Pomo da bengala',(.54,-.11,1.13),(.07,.05,.045),'gold','hand.L',10)
    head(ident)
