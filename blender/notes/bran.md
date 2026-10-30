# Bran, o ferreiro

Referência fornecida: `reference/bran/blacksmith.glb`, com rig e texturas embutidas, sem animações. `scripts/bran.py` importa o modelo e acrescenta respiração discreta ao primeiro osso de coluna (ou raiz como fallback), gerando `models/bran.blend` e `exports/bran.glb` com clipe `idle`. Executar com Blender em segundo plano, depois `node v2/tools/build.cjs` na raiz. Registro exclusivo `npcBran`; o Guardião das Waves conserva seu modelo anterior.
