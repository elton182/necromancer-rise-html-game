"""Resolve caminhos anteriores após a organização dos modelos e exports.

Mantém geradores antigos reproduzíveis e suas saídas fora das pastas atuais.
O catálogo registra a localização e o motivo de cada transferência.
"""
from pathlib import Path
import json

BLENDER = Path(__file__).resolve().parents[1]
PROJECT = BLENDER.parent
CATALOG = BLENDER / 'notes/model_catalog.json'
_moves = None

def asset_path(value):
    global _moves
    if _moves is None:
        data = json.loads(CATALOG.read_text(encoding='utf8'))
        _moves = {item['from']: item['to'] for item in data['files'] if item['from'] != item['to']}
    path = Path(value)
    if not path.is_absolute():
        path = (PROJECT if path.parts and path.parts[0] in ('blender', '_to_delete') else BLENDER) / path
    try:
        key = path.resolve().relative_to(PROJECT).as_posix()
    except ValueError:
        return str(value)
    target = _moves.get(key)
    if target is None:
        return str(value)
    result = PROJECT / target
    result.parent.mkdir(parents=True, exist_ok=True)
    return str(result)
