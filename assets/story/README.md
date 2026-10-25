# Imagens da história — alta definição com ComfyUI

Os 23 painéis foram refinados com IA local (ComfyUI + Z-Image Turbo) em img2img com denoise baixo (0,3): o original é ampliado 2× por Lanczos, o modelo reconstrói linhas e texturas e remove artefatos de compressão, e o resultado é redimensionado para exatamente 3× o original. O denoise baixo preserva composição, personagens e cores, mas o modelo chega a trocar letras ("sua" → "soa"). Por isso as caixas de legenda e os balões listados em `text_boxes` no manifesto (pixels do original) são restaurados a partir da ampliação conservadora sem IA, com borda suavizada. Cada painel deve ser conferido visualmente, porque o modelo pode reinterpretar detalhes pequenos da arte (janelas, folhagem, ornamentos).

- `originals/`: WebP extraídos do jogo, preservados byte a byte.
- `enhanced/`: versões em alta definição em WebP (qualidade 95).
- `manifest.json`: títulos, dimensões, método, hashes dos arquivos e erro médio da codificação.

As versões aprimoradas estão embutidas em `necromancer-canvas.html`, preservando a abertura offline do arquivo. O zoom animado da apresentação foi removido e a densidade do canvas da história usa a tela (até 2×), independentemente da redução de qualidade usada no combate.

Para reproduzir, abra o ComfyUI em `127.0.0.1:8188` com `z_image_turbo_bf16`, `qwen_3_4b` e `ae` instalados e execute `python scripts/enhance_story_comfy.py` na raiz do repositório. Use `--only 1 10 --preview PASTA` para testar painéis sem alterar o jogo e `--denoise` para ajustar a intensidade. Depois de ajustar `text_boxes`, `--reuse-enhanced` recompõe as legendas sem chamar o ComfyUI. O método anterior, sem IA (Lanczos 3× com nitidez leve), continua disponível em `python scripts/enhance_story.py`.

Validação: `node game_check.js` verifica integridade dos originais e arquivos aprimorados, ampliação em 3×, integração dos 23 painéis e densidade de exibição da história.
