"""Empacota e incorpora apenas o teste opcional do player importado."""
from pathlib import Path
import base64, json, re, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFilter
BASE = Path(__file__).resolve().parents[1]
def write_html(path,html):
    # Troca atômica evita truncar a distribuição quando o navegador está lendo.
    with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=path.parent,
                                     prefix='player-pack-',suffix='.tmp',delete=False) as file:
        file.write(html);temporary=Path(file.name)
    try:os.replace(temporary,path)
    finally:
        if temporary.exists():temporary.unlink()
if 'rigged' in sys.argv:
    meta=json.loads((BASE/'spritesheets/rigged_player_sheet.json').read_text())
    atlas=Image.new('RGBA',(224*8,224*32))
    board=Image.new('RGB',(224*8,224*4),'#d8d0bb')
    draw=ImageDraw.Draw(board);draw.rectangle((0,448,1792,896),fill='#17212a')
    margins=[];count=0
    weapon_atlas=Image.new('RGBA',atlas.size)
    for name,anim in meta['anims'].items():
        for di in range(8):
            frames=[]
            for fi in range(anim['n']):
                im=Image.open(BASE/f"frames/rigged_player/{anim['row']+di}_{fi}.png").convert('RGBA')
                box=im.getchannel('A').getbbox()
                assert box and min(box[0],box[1],224-box[2],224-box[3])>2,(name,di,fi,box)
                margins.append(min(box[0],box[1],224-box[2],224-box[3]))
                atlas.paste(im,(fi*224,(anim['row']+di)*224));frames.append(im.tobytes());count+=1
                weapon=Image.open(BASE/f"frames/rigged_player_staff/{anim['row']+di}_{fi}.png").convert('RGBA')
                # O contorno da arma usa apenas sua parte visível: Freestyle
                # desenha linhas através de objetos holdout em certas direções.
                ink=Image.new('RGBA',weapon.size,(0,0,0,0))
                ink.putalpha(weapon.getchannel('A').filter(ImageFilter.MaxFilter(3)))
                ink.alpha_composite(weapon);weapon=ink
                wb=weapon.getchannel('A').getbbox()
                assert not wb or min(wb[0],wb[1],224-wb[2],224-wb[3])>2,('cajado recortado',name,di,fi,wb)
                weapon_atlas.paste(weapon,(fi*224,(anim['row']+di)*224))
                if fi==anim['n']//2:
                    combined=im.copy();combined.alpha_composite(weapon)
                    board.paste(combined,(di*224,(anim['row']//8)*224),combined)
            assert len(set(frames))>1,(name,di,'sem movimento')
    dest=BASE/'spritesheets/rigged_player_sheet.webp';atlas.save(dest,lossless=True)
    weapon_dest=BASE/'spritesheets/rigged_player_staff_sheet.webp';weapon_atlas.save(weapon_dest,lossless=True)
    (BASE/'spritesheets/rigged_player_staff_sheet.json').write_text(json.dumps(meta,indent=2))
    board.save(BASE/'previews/rigged_player_review.png')
    motion=[]
    panels=[('Caminhada / frente','walk',2),('Caminhada / lado','walk',0),
            ('Conjuração / frente','cast',2),('Conjuração / lado','cast',0)]
    for k in range(24):
        frame=Image.new('RGB',(896,260),'#29322f');labels=ImageDraw.Draw(frame)
        for i,(label,name,di) in enumerate(panels):
            anim=meta['anims'][name];fi=k%anim['n'];row=anim['row']+di
            im=atlas.crop((fi*224,row*224,(fi+1)*224,(row+1)*224))
            im.alpha_composite(weapon_atlas.crop((fi*224,row*224,(fi+1)*224,(row+1)*224)))
            frame.paste(im,(224*i,0),im);labels.text((224*i+38,235),label,fill='white')
        motion.append(frame)
    motion[0].save(BASE/'previews/rigged_player_motion.gif',save_all=True,append_images=motion[1:],duration=120,loop=0)
    player_load="SPR.load('necro',"+json.dumps(meta)+",'"+base64.b64encode(dest.read_bytes()).decode()+"');"
    block="// RIGGED_PLAYER_TEST_BEGIN\nif(new URLSearchParams(location.search).get('playerModel')!=='necromancer_1'){\n}\n// RIGGED_PLAYER_TEST_END"
    weapon_load="SPR.load('playerStaff',"+json.dumps(meta)+",'"+base64.b64encode(weapon_dest.read_bytes()).decode()+"');\n"
    block=block.replace("\n}\n// RIGGED_PLAYER_TEST_END","\n"+weapon_load+"}\n"+(BASE.parent/'scripts/rigged-player-test.js').read_text(encoding='utf-8')+"\n// RIGGED_PLAYER_TEST_END")
    path=BASE.parent/'necromancer-canvas.html';html=path.read_text(encoding='utf-8')
    end=html.find('\n</html>')
    assert end>=0
    html=html[:end+len('\n</html>')]+'\n'
    html,n=re.subn(r"^SPR.load\('necro',[^\n]+$",lambda m:player_load,html,count=1,flags=re.M)
    assert n==1
    if '// RIGGED_PLAYER_TEST_BEGIN' in html:
        html,n=re.subn(r'// RIGGED_PLAYER_TEST_BEGIN.*?// RIGGED_PLAYER_TEST_END',lambda m:block,html,flags=re.S)
    else:
        html,n=re.subn('// IMPORTED_PLAYER_TEST_END',lambda m:m[0]+'\n'+block,html,count=1)
    assert n==1;write_html(Path(os.environ.get('NR_PLAYER_HTML_OUTPUT',str(path))),html)
    report=dict(frames=count,minimumMargin=min(margins),animatedDirections=8,anims=list(meta['anims']))
    (BASE/'previews/rigged_player_validation.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report));sys.exit(0)
meta = json.loads((BASE/'spritesheets/imported_player_sheet.json').read_text())
atlas = Image.new('RGBA', (224, 224*8))
board = Image.new('RGB', (896, 448), '#d8d0bb')
d = ImageDraw.Draw(board)
d.rectangle((0,224,896,448),fill='#17212a')
for di in range(8):
    im = Image.open(BASE/f'frames/imported_player/{di}.png').convert('RGBA')
    box = im.getchannel('A').getbbox()
    assert box and min(box[0],box[1],224-box[2],224-box[3]) > 2, (di,box)
    atlas.paste(im,(0,di*224))
    board.paste(im,((di%4)*224,(di//4)*224),im)
atlaspath = BASE/'spritesheets/imported_player_sheet.webp'
atlas.save(atlaspath,lossless=True)
board.save(BASE/'previews/imported_player_review.png')
block = "// IMPORTED_PLAYER_TEST_BEGIN\nif(new URLSearchParams(location.search).get('playerModel')==='necromancer_1'){\nSPR.load('necro',"+json.dumps(meta)+",'"+base64.b64encode(atlaspath.read_bytes()).decode()+"');\n}\n// IMPORTED_PLAYER_TEST_END"
htmlpath = BASE.parent/'necromancer-canvas.html'
html = htmlpath.read_text(encoding='utf-8')
if '// IMPORTED_PLAYER_TEST_BEGIN' in html:
    html,n = re.subn(r'// IMPORTED_PLAYER_TEST_BEGIN.*?// IMPORTED_PLAYER_TEST_END',lambda m:block,html,flags=re.S)
else:
    html,n = re.subn(r"^SPR.load\('necro',[^\n]+$",lambda m:m[0]+'\n'+block,html,count=1,flags=re.M)
assert n == 1
write_html(htmlpath,html)
print('Teste opcional incorporado; oito direções sem recorte.')
