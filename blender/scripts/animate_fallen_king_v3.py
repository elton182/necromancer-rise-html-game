from pathlib import Path
import sys
BASE=Path(__file__).resolve().parents[1]
source=(BASE/'scripts/animate_fallen_king_preview.py').read_text(encoding='utf-8')
source=source.replace('boss_fallenKing.blend','boss_fallenKing_v3.blend').replace('fallen_king_gif_','fallen_king_v3_gif_')
source=source.replace('(1,7,13,19,25)','(1,13,25,37,48)')
source=source.replace('range(1,25)','range(1,49,2)').replace('range(1,26,3)','range(1,49,4)').replace('range(1,26,2)','range(1,49,3)')
if 'preview' in sys.argv:
    source=source.replace('range(1,49,2)','[1]').replace('range(1,49,4)','[48]').replace('range(1,49,3)','[25]')
exec(compile(source,__file__,'exec'))
