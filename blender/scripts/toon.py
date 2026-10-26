# Estilo cartunesco: sombreamento em faixas + contorno (Freestyle)
import bpy
from mathutils import Vector
def toonify(sc, light=(-.45,-.55,.75), bands=(.52,.78,1.0), thick=2.6, line=(.04,.02,.07)):
    L = Vector(light).normalized()
    for m in bpy.data.materials:
        if not m.use_nodes: continue
        nt=m.node_tree; pr=nt.nodes.get('Principled BSDF')
        if pr is None: continue
        base=tuple(pr.inputs['Base Color'].default_value)
        gain=m['toon_gain'] if 'toon_gain' in m else {'robe':1.9,'robe_dark':1.7,'cape':1.8,'trim':1.7,'skin':1.15,'bone':1.1}.get(m.name,1.0); base=(min(1,base[0]*gain),min(1,base[1]*gain),min(1,base[2]*gain),1)
        es=pr.inputs['Emission Strength'].default_value
        emi=tuple(pr.inputs['Emission Color'].default_value)
        nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); nt.links.new(em.outputs[0],out.inputs[0])
        if es>.5:
            em.inputs['Color'].default_value=emi; em.inputs['Strength'].default_value=1.0; continue
        geo=nt.nodes.new('ShaderNodeNewGeometry'); dot=nt.nodes.new('ShaderNodeVectorMath'); dot.operation='DOT_PRODUCT'; dot.inputs[1].default_value=L
        nt.links.new(geo.outputs['Normal'],dot.inputs[0])
        mr=nt.nodes.new('ShaderNodeMath'); mr.operation='MULTIPLY_ADD'; mr.inputs[1].default_value=.5; mr.inputs[2].default_value=.5; nt.links.new(dot.outputs['Value'],mr.inputs[0])
        cr=nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation='CONSTANT'
        e=cr.color_ramp.elements; e[0].position=0.0; e[0].color=(bands[0],)*3+(1,); e[1].position=.5; e[1].color=(bands[1],)*3+(1,)
        e3=e.new(.8); e3.color=(bands[2],)*3+(1,)
        nt.links.new(mr.outputs[0],cr.inputs['Fac'])
        mx=nt.nodes.new('ShaderNodeMix'); mx.data_type='RGBA'; mx.blend_type='MULTIPLY'; mx.inputs[0].default_value=1.0
        mx.inputs[7].default_value=base  # B (RGBA)
        nt.links.new(cr.outputs['Color'],mx.inputs[6])
        nt.links.new(mx.outputs[2],em.inputs['Color']); em.inputs['Strength'].default_value=1.0
    sc.render.use_freestyle=True; sc.render.line_thickness_mode='ABSOLUTE'; sc.render.line_thickness=thick
    vl=bpy.context.view_layer; vl.use_freestyle=True; fs=vl.freestyle_settings
    if len(fs.linesets)==0: fs.linesets.new('ls')
    ls=fs.linesets[0]; ls.select_silhouette=True; ls.select_border=True; ls.select_crease=True; ls.select_edge_mark=False
    ls.linestyle=bpy.data.linestyles.new('ink'); ls.linestyle.color=line; ls.linestyle.thickness=thick; ls.linestyle.alpha=1.0
