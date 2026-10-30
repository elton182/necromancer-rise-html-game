# Criação de assets, animação e sprites

Estas regras complementam o `AGENTS.md` da raiz para arquivos em `blender/`. **A v2 (3D) é o jogo principal e consome os `.glb` de `exports/`**, registrados em `../v2/assets/models.json` e incorporados por `node v2/tools/build.cjs`; modelos novos seguem esse caminho (o GLB precisa conter malha, rig e todas as animações exigidas no registro). As seções sobre atlas, `SPR.load` e oito direções valem para a versão legada (Canvas 2D). Consulte também `README.md` desta pasta e `../docs/guia-visual-combate.md`.

## Organização e fontes editáveis

| Pasta | Conteúdo |
| --- | --- |
| `scripts/` | Todos os scripts Python: modelos, rigs, ações, render, empacotamento, validação e inspeção |
| `models/` | Cenas editáveis `.blend` |
| `exports/` | Exportações `.glb` |
| `spritesheets/` | Atlas `.webp`, metadados `.json` e atlas 2D de origem a fatiar |
| `previews/` | Pranchas, GIFs, imagens de conferência e JSON de validação de prévia |
| `frames/<asset>/` | Quadros intermediários de render e o `render.json` que os descreve |
| `reference/` | Pipeline dos personagens de referência, com estrutura própria descrita em `reference/README.md` |
| `examples/` | Imagens fornecidas pelo usuário e poses pintadas que os scripts leem |
| `notes/` | Notas de estudo e de teste de assets, com caminhos relativos a `blender/` |
| `logs/`, `backups/` | Logs e backups locais |

- Preserve esta estrutura. A raiz de `blender/` contém só `README.md`, `AGENTS.md` e as pastas acima; não grave scripts, cenas, exports, atlas, quadros ou prévias nela.
- Scripts ficam em `scripts/` e resolvem caminhos a partir de sua localização (`Path(__file__).resolve().parents[1]` é `blender/`), funcionando quando invocados da raiz do projeto. Não use o diretório atual nem caminhos absolutos.
- `frames/`, `logs/`, `backups/` e os `.blend1` automáticos do Blender são ignorados pelo Git. Os quadros `frames/frames_villager_*` e `frames/frames_stylized_*` já eram versionados como fonte dos atlas da vila e continuam assim; não versione quadros novos.
- Iterações experimentais (`_v2`, `_teste`) seguem as mesmas pastas. Ao aprovar uma versão, registre no `README.md` qual é a atual; não apague as anteriores sem pedido.
- Entregue a fonte editável e um caminho reproduzível de geração. Não entregue apenas uma imagem achatada para substituir um personagem animado.
- Use `scripts/common.py` para os utilitários compatíveis de malha, rig, materiais, animação e exportação. Confira os exemplos atuais antes de inventar outra estrutura.
- Não apague cenas, exports ou backups existentes como parte de uma geração. Não inclua milhares de frames na entrega.

## Direção visual

- Fantasia sombria com leitura clara em escala pequena: silhueta distinta, massas simples, arma e rosto identificáveis. Evite excesso de detalhes finos e grandes regiões pretas.
- Use a paleta do guia visual. Marfim para ossos, azul/ciano para espíritos e tons de perigo hostil distinguíveis dos efeitos aliados também por forma e movimento.
- Para novos personagens de combate, use como referência o toon compartilhado de `scripts/combat_toon.py` / `scripts/toon.py`: três faixas, contorno fino azul acinzentado e sem linhas de quina internas.
- Os renders atuais de combate usam Cycles. Workbench não avalia o shader toon; não o troque silenciosamente para acelerar um render.
- Preserve transparência RGBA, câmera ortográfica e convenção de orientação usada pelo renderizador escolhido. Confira iluminação e cores no resultado renderizado.
- O `.blend` preserva materiais toon; o `.glb` usa materiais PBR para interoperabilidade. Não espere que a rede de shader seja reproduzida integralmente no GLB.

## Pipeline para um personagem novo

1. Defina função, proporção e silhueta com base no comportamento planejado. Modele e faça rig por script; mantenha arma e membros presos aos ossos corretos.
2. Crie `idle`, `walk`, `attack` e `death`, mais ações específicas da mecânica (`windup`, `cast`, `charge`, `recover` etc.). Nomes, FPS e loop precisam concordar com os metadados e o runtime.
3. Gere uma prévia de descanso, preparação, impacto e morte em direções representativas antes do lote completo. Use `-- preview` quando o render correspondente suportar essa opção.
4. Inspecione visualmente a prévia: pegada da arma, articulações, contato com o chão, silhueta, enquadramento e contraste. Corrija a fonte e gere novamente quando necessário.
5. Renderize as direções e quadros completos, empacote o atlas, gere os metadados e incorpore ao HTML. Confira todos os quadros contra transparência vazia ou recorte.
6. Confira no jogo: posição dos pés, escala, direção, transições, tempo da animação versus impacto e morte. Veja também em grupo, com horda e qualidade baixa.

## Contrato do spritesheet

- Personagens usam oito direções. A referência comum é célula de 224 px, 56 pixels por unidade e âncora `(112, 165)`; não force essas medidas em assets com contrato diferente.
- O Carcereiro é uma exceção existente: atlas com células de 288 px, 50,4 px/u e âncora `(144, 211.5)`. O estilhaço usa 16 direções, célula de 96 px e âncora central `(48, 48)`.
- Metadados devem descrever `cell`, `ppu`, `anchorX`, `anchorY`, `dirs` e, por animação, `n`, `fps`, `loop`, `row`. Confira dimensões e limites de linhas/colunas contra o atlas real.
- Siga a ordem angular do render/runtime existentes; não espelhe uma arma ou inverta direções para preencher quadros ausentes.
- O atlas WebP deve respeitar o limite de 16383 pixels por dimensão. Planeje o arranjo e a redução de escala antes de gerar um atlas maior; mantenha âncora e `ppu` coerentes após redução.
- Valide margem transparente em todas as poses/direções. Não aceite armas, partículas do personagem ou membros cortados na borda.
- O empacotador deve atualizar somente o registro `SPR.load` do asset pretendido, preservando os demais sprites e módulos. A distribuição deve conter a imagem embutida, sem depender de carregar o WebP externo.

## Comandos de referência

Exemplo atual do Cão de Cripta, executado na raiz:

```powershell
blender --background --threads 4 --python blender/scripts/crypt_hound.py
blender --background --threads 4 --python blender/scripts/render_crypt_hound.py -- preview
# Inspecionar as imagens geradas antes do render completo.
blender --background --threads 4 --python blender/scripts/render_crypt_hound.py
python blender/scripts/pack_crypt_hound.py
node scripts/sync-equipment.js
node scripts/crypt-hound-browser-check.js
```

Blender precisa estar instalado; use o executável local se não estiver no PATH. Empacotadores usam Python com Pillow; testes de navegador usam Playwright e o navegador indicado no teste. Consulte o `README.md` para os comandos próprios de cada asset. Não execute um gerador existente só para documentá-lo, pois ele pode sobrescrever saídas.

## Critério de entrega

- Fonte, cena editável, atlas/metadados e integração coerentes com o escopo solicitado.
- Prévia inspecionada, sem quadros vazios ou recortados; direção, âncora e tempos conferidos no jogo.
- Testes pertinentes executados e evidências registradas. Se o ambiente impedir render ou teste, informe a limitação e não marque o asset como validado.
