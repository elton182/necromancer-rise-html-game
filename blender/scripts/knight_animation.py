"""Animações do cavaleiro; usadas pelo gerador e pela revisão MCP."""
import math
import bpy
from mathutils import Vector, Quaternion, Matrix


def animate_knight(arm, actions):
    def bone(n):
        return arm.pose.bones['mixamorig:' + n]

    def pose_matrix(b):
        rest = b.bone.matrix_local
        local = b.rotation_quaternion.to_matrix().to_4x4()
        return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ rest @ local if b.parent else rest @ local

    def rotate(n, axis, angle):
        b = bone(n)
        local = b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
        b.rotation_quaternion = Quaternion(local.normalized(), angle) @ b.rotation_quaternion

    def aim(n, direction):
        b = bone(n)
        rest = b.bone.matrix_local.to_3x3()
        parent = pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted() if b.parent else Matrix.Identity(3)
        delta = (b.bone.tail_local-b.bone.head_local).normalized().rotation_difference(parent.inverted() @ Vector(direction).normalized())
        b.rotation_quaternion = (rest.inverted() @ delta.to_matrix() @ rest).to_quaternion()

    def smooth(a, b, u):
        t = max(0, min(1, (u-a)/(b-a)))
        return t*t*(3-2*t)

    for name, action in actions.items():
        arm.animation_data.action = action
        if action.slots:
            arm.animation_data.action_slot = action.slots[0]
        length = round(action.frame_range[1]-action.frame_range[0])
        for f in range(length+1):
            u = f/length
            for b in arm.pose.bones:
                b.rotation_mode = 'QUATERNION'
                b.rotation_quaternion = Quaternion()
                b.location = (0, 0, 0)
            aim('LeftArm', (.25, -.2, -1)); aim('LeftForeArm', (-.15, -1, .25))
            aim('RightArm', (-.2, -.15, -1)); aim('RightForeArm', (-.1, -.7, .4))
            for side in ('Left', 'Right'):
                for digit in ('Index', 'Middle', 'Ring', 'Pinky'):
                    for joint in (1, 2, 3):
                        rotate(side+'Hand'+digit+str(joint), (0, 1, 0), .9 if side=='Left' else -.9)
            if name=='idle':
                rotate('Spine2', (1, 0, 0), .025*math.sin(u*math.tau))
            if name=='walk':
                s = math.sin(u*math.tau)
                for side, phase in [('Left', s), ('Right', -s)]:
                    rotate(side+'UpLeg', (1, 0, 0), .40*phase)
                    rotate(side+'Leg', (1, 0, 0), .65*max(0, -phase))
                    rotate(side+'Foot', (1, 0, 0), -.18*phase)
                bone('Hips').location.z = .012*(1-math.cos(u*math.tau*2))
                rotate('Hips', (0, 1, 0), .035*s)
                rotate('Spine', (0, 0, 1), .07*s)
                rotate('RightArm', (1, 0, 0), -.09*s)
                rotate('LeftArm', (1, 0, 0), .06*s)
            if name in ('attack', 'heavy_windup', 'heavy_attack', 'recover'):
                # Impacto existente: início do básico / fim da preparação pesada.
                # A preparação mantém a espada alta até o corte final.
                if name=='heavy_windup':
                    lift = smooth(0, .45, u)
                    cut = smooth(.78, 1, u)
                    theta = -.85*lift+2.3*cut
                    twist = -.28*lift+.55*cut
                elif name=='recover':
                    theta = 1.8*(1-smooth(0, 1, u)); twist = .32*(1-smooth(0, 1, u))
                else:
                    follow = smooth(0, 1, u)
                    theta = 1.45+.35*follow if name=='heavy_attack' else 1.45*(1-follow)
                    twist = .27+.05*follow if name=='heavy_attack' else .27*(1-follow)
                rotate('Spine2', (0, 0, 1), twist)
                rotate('Spine', (1, 0, 0), .12*max(0, theta))
                aim('RightArm', (-.25, -math.sin(theta), -math.cos(theta)))
                aim('RightForeArm', (-.12, -.7, .4))
                # A mão dirige a lâmina junto com o braço, em vez de mantê-la vertical.
                rotate('RightHand', (1, 0, 0), theta)
                rotate('LeftUpLeg', (1, 0, 0), -.1*max(0, theta))
                rotate('RightLeg', (1, 0, 0), .15*max(0, theta))
            if name=='hit':
                k = math.sin(u*math.pi)
                rotate('Spine', (1, 0, 0), -.3*k)
                rotate('LeftArm', (1, 0, 0), -.18*k)
            if name=='death':
                k = smooth(0, .8, u)
                rotate('Hips', (1, 0, 0), -1.5*k)
                bone('Hips').location.y = -.15*k
                bone('Hips').location.z = -.35*k
                rotate('LeftArm', (0, 1, 0), -.55*k)
                rotate('RightArm', (0, 1, 0), .55*k)
                rotate('LeftLeg', (1, 0, 0), .4*k)
                rotate('RightLeg', (1, 0, 0), .2*k)
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_quaternion', frame=f+1)
                if b.name.endswith('Hips'):
                    b.keyframe_insert('location', frame=f+1)
        action['loop'] = name in ('idle', 'walk')
