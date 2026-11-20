"""NPCs low poly da campanha, com fontes independentes dos moradores antigos.
Na raiz: blender --background --threads 4 --python blender/scripts/campaign_npcs.py
"""
import sys
import math
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import common as c
import campaign_npc_sculpt as sculpt

CAST = {
    'joao': ('#343846', '#d0a078', '#49372d'),
    'marta': ('#a45339', '#b87850', '#35291f'),
    'helena': ('#386c72', '#d9aa83', '#302b29'),
    'guard': ('#425b75', '#aa7956', '#40332c'),
    'messenger': ('#6c8050', '#d2a47e', '#694b32'),
    'mayor': ('#713e55', '#be8b65', '#b3aca0'),
}



def build(ident):
    c.reset_scene()
    cloth, skin, hair = CAST[ident]
    sculpt.palette(cloth, skin, hair)
    c.bone('root', (0, 0, 0), (0, 0, .12))
    c.bone('hips', (0, 0, 1), (0, 0, 1.18), 'root')
    c.bone('chest', (0, 0, 1.18), (0, 0, 1.78), 'hips')
    c.bone('head', (0, 0, 1.78), (0, 0, 2.4), 'chest')
    c.bone('cape', (0, .20, 1.76), (0, .30, .5), 'chest')
    width = .44 if ident in ('guard', 'mayor') else .40
    for side, s in [('L', 1), ('R', -1)]:
        c.bone('arm.' + side, (s*width, 0, 1.7), (s*(width+.1), 0, 1.35), 'chest')
        c.bone('hand.' + side, (s*(width+.1), 0, 1.35), (s*(width+.1), -.08, 1.02), 'arm.' + side)
        c.bone('leg.' + side, (s*.18, 0, 1), (s*.18, 0, .16), 'hips')
    c.build_rig()
    sculpt.body(ident, width)
    c.finish('NPC_' + ident)
    sc = bpy.context.scene
    c.init_anim(sc)
    def idle(t):
        p = t*math.tau
        c.R('chest', x=.018*math.sin(p))
        c.R('head', z=.025*math.sin(p))
        c.R('cape', x=.025*math.sin(p+.5))
    def greet(t):
        idle(t)
        v = math.sin(t*math.pi)**2
        c.R('arm.L', x=-.35*v, y=-.65*v)
        c.R('hand.L', x=-.5*v)
    def walk(t):
        idle(t)
        for side, sign in [('L', 1), ('R', -1)]:
            c.R('leg.'+side, x=sign*.30*math.sin(t*math.tau))
            c.R('arm.'+side, x=-sign*.20*math.sin(t*math.tau))
        c.R('cape', x=.1+.04*math.sin(t*math.tau))
    def death(t):
        c.R('root', x=1.4*t)
    c.bake_loop('idle', 32, idle)
    c.bake_loop('greet', 32, greet)
    c.bake_loop('walk', 24, walk)
    c.bake_once('death', 24, death)
    sc.frame_end = 33
    sc.frame_set(1)
    c.export(str(ROOT / 'models'), 'campaign_' + ident, sc)


if __name__ == '__main__':
    only = next((arg.split('=', 1)[1] for arg in sys.argv if arg.startswith('--only=')), None)
    if only and only not in CAST:
        raise ValueError('NPC desconhecido: ' + only)
    for ident in CAST:
        if only is None or ident == only:
            build(ident)
