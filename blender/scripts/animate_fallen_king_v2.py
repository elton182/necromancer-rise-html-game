"""Prévias animadas da segunda versão, com arma separada."""
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
source=(BASE/'scripts/animate_fallen_king_preview.py').read_text(encoding='utf-8')
source=source.replace('boss_fallenKing.blend','boss_fallenKing_v2.blend').replace('fallen_king_gif_','fallen_king_v2_gif_')
exec(compile(source,str(BASE/'scripts/animate_fallen_king_preview.py'),'exec'))
