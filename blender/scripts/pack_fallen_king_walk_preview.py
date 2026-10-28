"""Monta GIF e prancha das fases da caminhada, conferindo margens dos quadros."""
from pathlib import Path
from PIL import Image,ImageDraw
BASE=Path(__file__).resolve().parents[1]
frames=[];images=[];boxes=[]
for i in range(1,33):
    im=Image.open(BASE/'frames/fallen_king_walk_review'/f'{i:03}.png').convert('RGBA')
    box=im.getchannel('A').getbbox()
    assert box and min(box[0],box[1],560-box[2],560-box[3])>=4,(i,box)
    images.append(im);boxes.append(box)
# Use one crop for the whole animation so the character never changes scale.
union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
width=union[2]-union[0];height=union[3]-union[1]
edge=max(width,height)+36
for im in images:
    cut=im.crop(union)
    canvas=Image.new('RGBA',(edge,edge),'#293540')
    canvas.alpha_composite(cut,((edge-width)//2,(edge-height)//2))
    canvas=canvas.resize((560,560),Image.Resampling.LANCZOS)
    frames.append(canvas.convert('RGB'))
frames[0].save(BASE/'previews/fallen_king_walk_review.gif',save_all=True,append_images=frames[1:],duration=40,loop=0,optimize=False)
board=Image.new('RGB',(4*280,2*300),'#293540');draw=ImageDraw.Draw(board)
for n,i in enumerate(range(0,32,4)):
    x=(n%4)*280;y=(n//4)*300
    board.paste(frames[i].resize((280,280)),(x,y));draw.text((x+8,y+280),f'Quadro {i+1}',fill='white')
board.save(BASE/'previews/fallen_king_walk_phases.jpg')
print('32 quadros conferidos, GIF e prancha gerados.')
