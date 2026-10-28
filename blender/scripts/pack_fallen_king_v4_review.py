"""Monta GIFs e prancha de revisão do Fallen King v4, conferindo margens dos quadros.

python blender/scripts/pack_fallen_king_v4_review.py
Lê frames/fallen_king_v4_review (render_fallen_king_v4_review.py) e grava em previews/.
"""
from pathlib import Path
import json
from PIL import Image,ImageDraw
BASE=Path(__file__).resolve().parents[1]
FOLDER=BASE/'frames/fallen_king_v4_review'
manifest=json.loads((FOLDER/'manifest.json').read_text(encoding='utf-8'))
validation=json.loads((BASE/'previews/fallen_king_v4_validation.json').read_text(encoding='utf-8'))
impacts={name:data['impactFrame'] for name,data in validation.items() if isinstance(data,dict) and 'impactFrame' in data}
LOOPS={'idle','walk'};SIZE=384;BACKGROUND='#293540'
report={};board_rows=[]
for group,entries in manifest.items():
    frames=[];durations=[];margins=[]
    for entry in entries:
        image=Image.open(FOLDER/group/entry['file']).convert('RGBA')
        # A sombra do chão cobre o quadro com alfa parcial; a margem usa só o personagem opaco.
        box=image.getchannel('A').point(lambda a:255 if a>=250 else 0).getbbox()
        assert box,('quadro vazio',group,entry)
        margin=min(box[0],box[1],image.width-box[2],image.height-box[3])
        assert margin>=4,('personagem cortado na borda',group,entry,box)
        margins.append(margin)
        canvas=Image.new('RGBA',image.size,BACKGROUND);canvas.alpha_composite(image)
        canvas=canvas.resize((SIZE,SIZE),Image.Resampling.LANCZOS)
        draw=ImageDraw.Draw(canvas)
        hit=impacts.get(entry['action'])==entry['frame']
        if hit:draw.rectangle((1,1,SIZE-2,SIZE-2),outline='#ff5a3c',width=3)
        draw.text((8,SIZE-18),f"{entry['action']}  q.{entry['frame']}"+('  IMPACTO' if hit else ''),fill='#ffb4a6' if hit else 'white')
        frames.append(canvas.convert('RGB'))
        durations.append(round(1000*entry['step']/24))
    if group not in LOOPS:durations[-1]=600  # segura a pose final antes de repetir
    target=BASE/f'previews/fallen_king_v4_{group}.gif'
    frames[0].save(target,save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=False)
    picks=[frames[round(i*(len(frames)-1)/5)] for i in range(6)]
    board_rows.append((group,picks))
    report[group]=dict(frames=len(frames),minMargin=min(margins),gif=target.name)
cell=200
board=Image.new('RGB',(6*cell+90,len(board_rows)*cell),BACKGROUND);draw=ImageDraw.Draw(board)
for row,(group,picks) in enumerate(board_rows):
    draw.text((8,row*cell+cell//2),group,fill='white')
    for col,frame in enumerate(picks):board.paste(frame.resize((cell,cell)),(90+col*cell,row*cell))
board.save(BASE/'previews/fallen_king_v4_review.png')
print(json.dumps(report,indent=2))
