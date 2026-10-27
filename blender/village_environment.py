"""Reusable low-poly Eldrin kit, full editable village, ground and transparent game sprites.
blender -b -t 4 --python blender/village_environment.py
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets'/'village';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng=random.Random(921);kit={};current=None

def mat(name,color,emit=0,rough=.85):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 return m
M={name:mat(name,col,emit) for name,col,emit in [
 ('wood',(.15,.075,.033),0),('woodlight',(.33,.19,.08),0),('plaster',(.65,.51,.31),0),('plasterlight',(.8,.69,.45),0),('roof',(.29,.075,.032),0),('rooflight',(.39,.12,.055),0),('roofdark',(.19,.05,.027),0),('stone',(.24,.26,.23),0),('stonewarm',(.37,.34,.27),0),('metal',(.12,.14,.14),0),('leaf',(.12,.26,.065),0),('leaflight',(.23,.38,.085),0),('leafdark',(.045,.14,.065),0),('pine',(.045,.17,.13),0),('pinelight',(.09,.24,.16),0),('grass',(.13,.24,.055),0),('earth',(.23,.19,.105),0),('glass',(1,.53,.12),2),('water',(.035,.13,.15),0),('white',(.84,.74,.49),0),('red',(.53,.12,.055),0),('flower',(.57,.2,.55),0),('flowerwhite',(.9,.83,.6),0)]}

def collect(obj):
 for col in list(obj.users_collection):col.objects.unlink(obj)
 current.objects.link(obj);return obj

def finish(obj,name,material):obj.name=name;obj.data.materials.append(M[material]);return collect(obj)
def box(name,loc,size,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft chipped edges','BEVEL');mod.width=bevel;mod.segments=1;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return finish(o,name,material)
def cone(name,loc,r1,r2,depth,material,vertices=8):
 bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc);return finish(bpy.context.object,name,material)
def ico(name,loc,size,material,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.scale=size;return finish(o,name,material)
def beam(name,a,b,width,material):
 a,b=Vector(a),Vector(b);o=box(name,(a+b)/2,(width,width,(b-a).length),material,.015);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def mesh(name,verts,faces,material):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new(name,data);current.objects.link(o);o.data.materials.append(M[material]);return o

def lantern(x,y,z):
 box('Warm lantern glass',(x,y,z),(.21,.21,.34),'glass',.025)
 for dx in [-.13,.13]:
  for dy in [-.13,.13]:box('Lantern frame',(x+dx,y+dy,z),(.035,.035,.4),'metal')
 cone('Lantern cap',(x,y,z+.27),.23,.06,.19,'metal',4);box('Lantern base',(x,y,z-.21),(.33,.33,.06),'metal')
 bpy.ops.object.light_add(type='POINT',location=(x,y-.12,z));o=collect(bpy.context.object);o.name='Warm local lantern light';o.data.color=(1,.55,.18);o.data.energy=23;o.data.shadow_soft_size=.4

def roof(cx,cy,z,w,d):
 # Real gable volume; individual clay tiles are shared simple modules.
 verts=[(cx-w/2,cy-d/2,z),(cx+w/2,cy-d/2,z),(cx-w/2,cy,z+1.18),(cx+w/2,cy,z+1.18),(cx-w/2,cy+d/2,z),(cx+w/2,cy+d/2,z)]
 mesh('Gabled timber roof',verts,[(0,1,3,2),(2,3,5,4),(0,2,4),(1,5,3)],'roofdark')
 half=d/2
 for sign in [-1,1]:
  for row in range(5):
   ya=(row/5)*half;yb=((row+1)/5)*half+.04
   za=z+1.18*(1-ya/half)+.035;zb=z+1.18*(1-yb/half)+.035
   for col in range(9):
    xa=cx-w/2+col*w/9+.012;xb=cx-w/2+(col+1)*w/9-.012
    verts=[(xa,cy+sign*ya,za),(xb,cy+sign*ya,za),(xb,cy+sign*yb,zb),(xa,cy+sign*yb,zb)]
    o=mesh('Reusable clay roof tile',verts,[(0,1,2,3)],rng.choice(['roof','rooflight','roof','roofdark']));mod=o.modifiers.new('Tile thickness','SOLIDIFY');mod.thickness=.045
 beam('Ridge cap',(cx-w/2-.08,cy,z+1.22),(cx+w/2+.08,cy,z+1.22),.15,'roofdark')
 for side in [-1,1]:
  for s in [-1,1]:beam('Gable trim',(cx+side*w/2,cy,z+1.2),(cx+side*w/2,cy+s*d/2,z),.13,'wood')

def window(x,y,z):
 box('Window timber casing',(x,y,z),(.67,.13,.82),'wood',.04);box('Golden window',(x,y-.08,z),(.5,.035,.62),'glass')
 box('Window crossbar',(x,y-.115,z),(.55,.04,.065),'wood');box('Window upright',(x,y-.12,z),(.055,.04,.68),'wood')
 for s in [-1,1]:box('Window shutter',(x+s*.43,y-.01,z),(.17,.12,.84),'woodlight',.02)
 box('Window flowerbox',(x,y-.21,z-.57),(.8,.35,.22),'woodlight',.025)
 for i in range(4):ico('Window flowers',(x-.28+i*.18,y-.22,z-.36),(.14,.15,.15),'leaflight')
 for i in range(3):ico('Small blossoms',(x-.23+i*.22,y-.26,z-.25),(.045,.045,.06),'flowerwhite')

def barrel(x,y,z=0,scale=1):
 for j in range(12):
  a=math.tau*j/12;o=box('Barrel stave',(x+math.cos(a)*.27*scale,y+math.sin(a)*.27*scale,z+.36*scale),(.145*scale,.1*scale,.7*scale),'woodlight',.025*scale);o.rotation_euler.z=a+math.pi/2
 for h in [.12,.57]:
  bpy.ops.mesh.primitive_torus_add(major_radius=.285*scale,minor_radius=.026*scale,major_segments=12,minor_segments=4,location=(x,y,z+h*scale));finish(bpy.context.object,'Iron barrel hoop','metal')
 cone('Barrel lid',(x,y,z+.72*scale),.28*scale,.28*scale,.04*scale,'woodlight',12)
def crate(x,y,z=0):
 box('Crate core',(x,y,z+.28),(.55,.55,.55),'woodlight',.025)
 for h in [.07,.49]:box('Crate trim',(x,y-.295,z+h),(.61,.06,.07),'wood')
 beam('Crate diagonal',(x-.25,y-.32,z+.05),(x+.25,y-.32,z+.52),.07,'wood')

def house(variant=0,forge=False):
 w=3.8;d=2.65
 for row in range(2):
  for i in range(7):box('Foundation block',(-1.8+i*.59,-1.34,.13+row*.24),(.55,.2,.22),'stonewarm',.035)
 box('Plastered modular walls',(0,0,1.43),(w,d,2.5),'plasterlight' if variant==1 else 'plaster',.055)
 for x in [-1.84,0,1.84]:box('Timber upright',(x,-1.36,1.5),(.14,.15,2.55),'wood',.025)
 for x in [-1.84,1.84]:box('Side timber',(x,0,1.5),(.16,d, .16),'wood')
 for z in [.5,2.56]:box('Facade timber',(0,-1.38,z),(3.86,.16,.15),'wood')
 beam('Half-timber brace',(-1.75,-1.4,.6),(-.95,-1.4,1.45),.12,'wood');beam('Half-timber brace',(.15,-1.4,2.5),(.85,-1.4,1.7),.12,'wood')
 box('Door surround',(0,-1.4,1.03),(.92,.2,1.76),'wood',.04)
 for j in range(5):box('Door plank',(-.32+j*.16,-1.53,1.03),(.15,.065,1.58),'woodlight',.012)
 for z in [.65,1.38]:box('Door iron strap',(0,-1.58,z),(.73,.035,.07),'metal')
 ico('Door handle',(.24,-1.61,1.06),(.045,.035,.045),'metal')
 for i in range(3):box('Entrance step',(0,-1.6-i*.25,.3-i*.08),(1.2+i*.14,.6,.22),'stonewarm',.04)
 window(-1.15,-1.42,1.65);window(1.15,-1.42,1.65)
 roof(0,0,2.78,4.55,3.35)
 box('Chimney stone',(1.15,.55,3.65),(.45,.5,1.5),'stone',.04);box('Chimney cap',(1.15,.55,4.44),(.6,.63,.16),'stonewarm',.03)
 for z in [3.3,3.6,3.9,4.2]:box('Chimney brick accent',(1.15,.285,z),(.48,.035,.045),'roofdark')
 beam('Lantern bracket',(.58,-1.4,2.3),(.58,-1.85,2.3),.065,'metal');lantern(.58,-1.85,2.05)
 barrel(2.1,-.5);crate(-2.08,-1.07);crate(-2.12,-.48)
 if variant==1:
  roof(-.9,-1.7,2.1,1.8,1.3)
  for x in [-1.62,-.18]:box('Porch post',(x,-2.2,1.13),(.13,.13,2.1),'wood')
 if forge:
  box('Forge hearth',(-2.7,0,.7),(1.2,1.2,1.3),'stone',.08);box('Glowing forge',(-2.7,-.61,1),( .8,.04,.42),'glass')
  for j in range(4):ico('Hot coals',(-3+j*.2,-.65,1.05),(.1,.06,.1),'glass')
  box('Forge hood',(-2.7,0,1.83),(1.3,1.25,.5),'stone',.04);box('Forge flue',(-2.7,.24,2.65),(.44,.48,1.3),'stone')
  for x in [-3.4,-2.1]:box('Wood stack',(x,.8,.3),(.45,.6,.6),'woodlight',.03)

def well():
 for row in range(3):
  for i in range(12):
   a=math.tau*(i+(row%2)*.5)/12;o=box('Well masonry',(math.cos(a)*.68,math.sin(a)*.68,.14+row*.24),(.36,.25,.22),'stonewarm' if i%3 else 'stone',.025);o.rotation_euler.z=a+math.pi/2
 cone('Water surface',(0,0,.23),.55,.55,.03,'water',24)
 for s in [-1,1]:box('Well post',(s*.91,0,1.08),(.14,.16,2.1),'wood',.025)
 roof(0,0,2.03,2.25,1.8)
 beam('Well spindle',(-.96,0,1.4),(.96,0,1.4),.1,'woodlight');beam('Well rope',(0,0,.4),(0,0,1.45),.026,'earth')
 cone('Bucket',(.32,-.95,.22),.17,.21,.38,'woodlight',10)
def lamp():
 box('Lamp stone foot',(0,0,.15),(.45,.45,.3),'stonewarm',.06);cone('Lamp post',(0,0,1.52),.07,.05,2.85,'wood',8)
 beam('Lamp arm',(0,0,2.85),(.36,0,2.85),.09,'metal');lantern(.36,0,2.55)
def tree(pine=False):
 cone('Faceted trunk',(0,0,1.25),.22,.1,2.5,'wood',7)
 if pine:
  for i in range(4):cone('Layered pine canopy',(0,0,1.5+i*.8),1.45-i*.23,.06,1.8,'pine' if i%2 else 'pinelight',7)
 else:
  for x,y,z,sz in [(-.7,0,2.9,1.25),(.65,.3,3.15,1.3),(0,-.35,3.9,1.35),(-.35,.65,3.65,1.1),(.5,-.5,3.4,1.05)]:ico('Low poly foliage',(x,y,z),(sz,sz*.85,sz),rng.choice(['leaf','leaflight']),2)
def bush():
 for x,y,z in [(-.3,0,.3),(.25,.1,.4),(0,-.15,.55)]:ico('Shrub foliage',(x,y,z),(.5,.43,.45),'leaf',1)
 for i in range(9):
  a=rng.random()*math.tau;r=rng.random()*.5;ico('Shrub blossom',(math.cos(a)*r,math.sin(a)*r,.65+rng.random()*.18),(.06,.06,.07),rng.choice(['flower','flowerwhite']),1)
def flowers():
 for i in range(12):
  x,y=rng.uniform(-.5,.5),rng.uniform(-.35,.35);h=rng.uniform(.18,.45);beam('Flower stem',(x,y,0),(x,y,h),.015,'leaf');ico('Wildflower',(x,y,h),(.05,.05,.06),rng.choice(['flower','flowerwhite']),1)
def rock():
 ico('Faceted boulder',(0,0,.42),(.8,.57,.65),'stone',1);ico('Moss patch',(-.2,.1,.82),(.45,.3,.12),'leafdark',1)
def fence():
 for x in [-1.05,0,1.05]:box('Fence post',(x,0,.55),(.12,.14,1.1),'woodlight',.015)
 for z in [.35,.78]:box('Fence rail',(0,0,z),(2.2,.1,.11),'wood',.015)
def board():
 for x in [-1.05,1.05]:box('Noticeboard post',(x,0,1.16),(.17,.18,2.32),'wood',.025)
 box('Noticeboard',(0,0,1.65),(2.5,.22,1.35),'woodlight',.04)
 for i in range(4):
  o=box('Parchment notice',(-.85+i*.55,-.13,1.67),(.44,.025,.72),'white');o.rotation_euler.y=(i%2-.5)*.06
  for j in range(5):box('Notice ink',(-.85+i*.55,-.15,1.86-j*.09),(.29 if j%2 else .22,.005,.012),'wood')
 roof(0,0,2.43,2.9,.75)
def stall():
 for x in [-1.45,1.45]:box('Stall post',(x,0,1.35),(.12,.12,2.7),'wood')
 box('Shop counter',(0,-.55,.65),(3.15,.9,1.2),'woodlight',.04)
 for i in range(9):box('Counter planks',(-1.4+i*.35,-1.02,.62),(.32,.05,1.05),'wood',.01)
 box('Countertop',(0,-.56,1.3),(3.35,1.02,.12),'woodlight',.03)
 for i in range(7):
  verts=[(-1.65+i*.47,.45,2.9),(-1.18+i*.47,.45,2.9),(-1.18+i*.47,-1.1,2.35),(-1.65+i*.47,-1.1,2.35)]
  mesh('Striped cloth awning',verts,[(0,1,2,3)],'red' if i%2==0 else 'white');box('Canvas valance',(-1.415+i*.47,-1.1,2.23),(.47,.035,.25),'red' if i%2==0 else 'white')
 barrel(1.9,.2);crate(-1.95,0)
def anvil():
 cone('Anvil stump',(0,0,.38),.43,.38,.76,'wood',10);box('Anvil base',(0,0,.84),(.68,.38,.18),'metal',.035);box('Anvil top',(0,0,1.08),(.85,.4,.22),'metal',.035);o=cone('Anvil horn',(.55,0,1.1),.17,.015,.6,'metal',8);o.rotation_euler.y=math.pi/2

BUILDERS={'house0':lambda:house(0),'house1':lambda:house(1),'house2':lambda:house(2),'smithy':lambda:house(0,True),'well':well,'lamp':lamp,'pine':lambda:tree(True),'oak':tree,'bush':bush,'flowers':flowers,'rock':rock,'fence':fence,'barrel':lambda:barrel(0,0),'crate':lambda:crate(0,0),'board':board,'stall':stall,'anvil':anvil}
for name,build in BUILDERS.items():
 current=bpy.data.collections.new('KIT_'+name);current.use_fake_user=True;kit[name]=current;build()

# Ground modules use a single mesh per surface, keeping the scene light.
ground=bpy.data.collections.new('GROUND');bpy.context.scene.collection.children.link(ground);current=ground
cone('Circular grass island',(0,0,-.075),18,18,.1,'grass',128)
noise=M['grass'].node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.7;noise.inputs['Detail'].default_value=2
ramp=M['grass'].node_tree.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.065,.13,.025,1);ramp.color_ramp.elements[1].color=(.22,.34,.075,1);M['grass'].node_tree.links.new(noise.outputs['Fac'],ramp.inputs['Fac']);M['grass'].node_tree.links.new(ramp.outputs['Color'],M['grass'].node_tree.nodes['Principled BSDF'].inputs['Base Color'])
# Sand joins all four original entrances, underneath neat hexagonal setts.
box('East west path',(0,0,-.005),(36,2.65,.035),'earth');box('North south path',(0,0,-.004),(2.65,36,.035),'earth');cone('Plaza bedding',(0,0,-.002),10.2,10.2,.035,'earth',96)
for i,color in enumerate([(.38,.36,.29),(.43,.4,.32),(.32,.34,.29),(.48,.44,.35),(.36,.34,.3)]):M['paver'+str(i)]=mat('Paver variation '+str(i),color)
verts=[];faces=[];indices=[];radius=.43
for row in range(-29,30):
 for col in range(-25,26):
  x=col*math.sqrt(3)*radius+(row%2)*math.sqrt(3)*radius/2;y=row*1.5*radius
  if math.hypot(x,y)>17.7:continue
  if not(math.hypot(x,y)<9.8 or abs(x)<1.05 or abs(y)<1.05):continue
  start=len(verts);r=radius*.95;z=.055+rng.uniform(-.008,.008)
  verts.extend([(x+math.cos(math.radians(30+k*60))*r,y+math.sin(math.radians(30+k*60))*r,z) for k in range(6)])
  verts.extend([(x+math.cos(math.radians(30+k*60))*r,y+math.sin(math.radians(30+k*60))*r,z-.07) for k in range(6)])
  faces.append(tuple(start+k for k in range(6)));indices.append(rng.randrange(5))
  for k in range(6):faces.append((start+k,start+(k+1)%6,start+6+(k+1)%6,start+6+k));indices.append(2)
o=mesh('Organized non-overlapping stone pavement',verts,faces,'paver0')
for i in range(1,5):o.data.materials.append(M['paver'+str(i)])
for poly,index in zip(o.data.polygons,indices):poly.material_index=index
mod=o.modifiers.new('Worn paver edges','BEVEL');mod.width=.018;mod.segments=1;o.modifiers.new('Paver normals','WEIGHTED_NORMAL')
# Concentric border: individual curb modules, never stacked random ellipses.
for i in range(120):
 a=math.tau*i/120;o=box('Plaza curb',(math.cos(a)*10.05,math.sin(a)*10.05,.05),(.5,.22,.13),'stonewarm',.025);o.rotation_euler.z=a+math.pi/2

village=bpy.data.collections.new('VILLAGE_LAYOUT');bpy.context.scene.collection.children.link(village)
placements=[]
def instance(name,x,y,scale=1,rotation=0):
 o=bpy.data.objects.new(name+' instance',None);o.instance_type='COLLECTION';o.instance_collection=kit[name];o.location=(x,-y,0);o.rotation_euler.z=rotation;o.scale=(scale,)*3;village.objects.link(o);placements.append({'asset':name,'x':x,'y':y,'scale':scale,'rotation':rotation});return o
for i in range(6):
 a=i/6*math.tau+.52;x,y=math.cos(a)*13.6,math.sin(a)*13.6;instance('smithy' if x<-8 and y<0 else 'house'+str(i%3),x,y)
for x,y in [(-3.5,-1.5),(3.5,-1.5),(-3.5,5),(3.5,5)]:instance('lamp',x,y)
instance('well',0,.6);instance('board',0,-9);instance('board',-6,-8);instance('stall',-7,-4)
instance('barrel',-12,5.5);instance('barrel',12,5.5);instance('anvil',-10.5,2.5)
for i in range(36):
 a=i/36*math.tau;r=16.8
 if abs(math.sin(a)*r)<2 or abs(math.cos(a)*r)<2:continue
 instance('pine' if i%3 else 'oak',math.cos(a)*r,math.sin(a)*r,.82+rng.random()*.35)
for i in range(64):
 a=i/64*math.tau;r=10.8+rng.random()*5.5;x,y=math.cos(a)*r,math.sin(a)*r
 if abs(x)<2.1 or abs(y)<2.1:continue
 if any(math.hypot(x-p['x'],y-p['y'])<3.1 for p in placements if p['asset'].startswith('house') or p['asset']=='smithy'):continue
 instance(['flowers','bush','rock','flowers'][i%4],x,y,.7+rng.random()*.45)
for x,y in [(-13,-2.2),(13,-2.2),(-13,2.2),(13,2.2)]:instance('fence',x,y)
(OUT/'placements.json').write_text(json.dumps(placements,separators=(',',':')))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Twilight ambient');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.38,.48,.62,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45;scene.world=world
bpy.ops.object.light_add(type='AREA',location=(-9,-8,18));sun=bpy.context.object;sun.name='Warm sunset key';sun.data.energy=2700;sun.data.color=(1,.8,.56);sun.data.shape='DISK';sun.data.size=12;sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN',location=(0,0,12));fill=bpy.context.object;fill.name='Soft daylight';fill.data.energy=1.7;fill.data.angle=.25;fill.rotation_euler=(.4,-.5,-.4)
bpy.ops.object.camera_add(location=(0,-30,31));camera=bpy.context.object;camera.name='Village elevated review camera';camera.data.type='ORTHO';camera.data.ortho_scale=42;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
scene.render.resolution_x=1800;scene.render.resolution_y=1500;scene.render.resolution_percentage=100;scene.render.filepath=str(OUT/'village-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'village_eldrin.blend'))
bpy.ops.render.render(write_still=True)
# True top-down ground tile preserves game x/y coordinates exactly.
village.hide_render=True;camera.location=(0,0,45);camera.rotation_euler=(0,0,0);camera.data.ortho_scale=36;camera.data.shift_y=0
scene.render.resolution_x=scene.render.resolution_y=2048;scene.render.filepath=str(OUT/'ground.png');bpy.ops.render.render(write_still=True)
ground.hide_render=True
preview=bpy.data.objects.new('Asset preview instance',None);preview.instance_type='COLLECTION';scene.collection.objects.link(preview)
camera.location=(6,-10,12);camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=10;camera.data.shift_y=.20
scene.render.resolution_x=scene.render.resolution_y=512
# Shadow catcher supplies soft contact shadows without a visible tile behind props.
bpy.ops.mesh.primitive_plane_add(size=9,location=(0,0,-.025));catcher=bpy.context.object;catcher.name='Transparent contact shadow catcher';catcher.is_shadow_catcher=True;catcher.data.materials.append(M['stonewarm'])
metadata={'cell':512,'ppu':51.2,'anchorX':256,'anchorY':358.4,'assets':list(kit)}
for name,col in kit.items():
 preview.instance_collection=col;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
(OUT/'manifest.json').write_text(json.dumps(metadata,separators=(',',':')))
print('Saved editable modular village, ground and',len(kit),'rendered assets.',flush=True)
