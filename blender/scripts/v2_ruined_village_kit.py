# Variante degradada do kit original; preserva encaixes e medidas.
import sys,inspect
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v2_village_kit as kit
BASE=Path(__file__).resolve().parents[1]
kit.OUT_BLEND=BASE/'models'/'v2_ruined_village_kit.blend';kit.OUT_GLB=BASE/'exports'/'v2_ruined_village_kit.glb'
# Telhas ausentes são omitidas como peças inteiras, sem faces abertas nas telhas restantes.
source=inspect.getsource(kit.roof).replace('for xa, xb in zip(cuts, cuts[1:]):','for xa, xb in zip(cuts, cuts[1:]):\n                if side==-1 and 1<=i<=3 and -.18<xa<.17:continue')
exec(source,kit.__dict__)
kit.BUILDERS=[kit.roof if fn.__name__=='roof' else fn for fn in kit.BUILDERS]
objs=kit.build()
p=kit.Piece('boarding')
p.beam('door',(-.5,-.1,.2),(.5,-.1,.8),(.16,.09));p.beam('timber',(-.5,-.2,.8),(.5,-.2,.2),(.12,.09))
objs.append(p.finish())
kit.export(objs)
