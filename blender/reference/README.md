# Elenco baseado na referência

Atualização: Bram no mapa agora usa o recorte de pixels de `../examples/image.png`,
extraído por `../bram_sprite_reference.py`. É uma única pose, sem animações ou
vistas inventadas. Seus BLEND/GLB continuam como versões anteriores, não como
a origem do sprite exibido. O empacotador atual preserva esse recorte.

Zephyr tem nove ações (incluindo nova, canalização e dash), e guerreiro, arqueiro
e mago esqueleto têm ataques novos. Os visuais de saqueador, corrompido, mago
esqueleto e lobo são ativados automaticamente nas classes existentes, com
carregamento sob demanda. Não são novos tipos de combate.


O ponto de entrada é `index.html` → `necromancer-canvas.html`. Este jogo usa Canvas 2D com câmera elevada e sprites renderizados de modelos Blender, não Godot. As estruturas `scene`, `mesh` e `position` no HTML são adaptadores da lógica original. Trocar o renderizador por uma engine 3D alteraria o escopo e os sistemas existentes; por isso a integração conserva os sprites em oito direções e fornece também os modelos 3D reais.

## Arquivos entregues

Cada personagem tem `<id>.blend`, `<id>.glb`, `<id>_model.json`, `<id>_render.json` e os PNGs mestres em `frames_<id>/`. Os `.blend` incluem malha editável, UV, materiais PBR foscos, armature, câmera e ações. `cast-review.blend` reúne os oito GLB reimportados para inspeção; `review/reference-cast-models.png` é sua renderização. A exceção é Bram, cujo sprite ativo é extraído diretamente da imagem fornecida.

| ID | Integração | Ações |
|---|---|---|
| bram | Recorte original em `smith`; conversa preservada | idle (uma pose) |
| zephyr | Visual padrão de `necro`; mesmas habilidades e controles | idle, walk, cast, summon, hurt, death, nova, channel, dash |
| skeleton | Guerreiro aliado existente | idle, walk, attack, hurt, death, spawn |
| archer | Arqueiro aliado existente | idle, walk, attack, hurt, death, spawn |
| skeleton_mage | Visual padrão do Espectro e Mago Vivo, mesmas estatísticas | idle, walk, attack, hurt, death, spawn |
| raider | Visual padrão do Guerreiro existente | idle, walk, attack, hurt, death, spawn |
| corrupted | Visual padrão do Bruto existente | idle, walk, attack, hurt, death, spawn |
| shadow_wolf | Visual padrão do Cão de Cripta | anteriores + windup, charge, recover |

Os três esqueletos compartilham o gerador de malha-base, paleta e rig de 16 ossos. Os acessórios seguem grupos de vértices correspondentes às mãos ou ao tórax. Os três arquivos são exportados separadamente para edição independente. O lobo tem uma armature específica de quadrúpede. A origem fica no chão, com Z para cima no Blender e Y para cima no GLB.

A pele usa pesos rígidos normalizados por seção anatômica, articulações volumétricas nos cotovelos e joelhos e botas com pivôs próprios. É uma escolha de animação facetada: não há tecido simulado nem deformação muscular contínua. Não se usa automatic weights como acabamento final.

## Regeneração

Na raiz do projeto, com Blender 4.3.2 e Python com Pillow:

```sh
blender -b -t 4 --python-exit-code 1 --python blender/reference_characters.py -- --only=bram,zephyr,skeleton --preview
# Inspecionar os três primeiros antes de gerar as variantes.
blender -b -t 4 --python-exit-code 1 --python blender/reference_characters.py
python3 blender/pack_reference_characters.py
blender -b -t 4 --python-exit-code 1 --python blender/validate_reference_characters.py
blender -b -t 4 --python-exit-code 1 --python blender/reference_review.py
```

Nesta máquina o Blender está em `/tmp/blender-4.3.2-linux-x64/blender`. A opção `--only=bram,zephyr,skeleton` também funciona na geração completa e no empacotador. `--preview` escreve somente vistas de repouso em alta resolução; gere todos os quadros do personagem antes de empacotá-lo, para não misturar resoluções.

Os modelos são exportados antes da conversão de materiais para toon. Zephyr conserva os materiais foscos e o estúdio salvo definidos em `../zephyr_materials.py`. O `.blend` e GLB conservam materiais PBR editáveis; os sprites usam sombreamento facetado, sem bloom. Os quadros de Zephyr têm área mestre maior para acomodar o cajado durante a morte. Todos os atlas de jogo têm células de 224 px com âncoras e escala compensadas.

## Camada visual

`blender/pack_reference_characters.py` troca somente os quatro registros `SPR.load` correspondentes no jogo principal. Os scripts de equipamentos/habilidades continuam independentes. Não execute os empacotadores de personagens antigos depois deste sem reexecutar o novo: eles substituem os mesmos registros de sprites.

`scripts/character-visuals.js` escolhe animações a partir dos estados existentes e ativa os visuais da referência sob demanda. Não modifica dano, IA, custo de mana, colisores, seleção, posições de projéteis, tabelas de inimigos ou saves. As variantes não criam encontros, não renomeiam classes e não adicionam poderes ao Espectro.

Para experimentar as propostas sem alterar a campanha, no console do jogo:

```js
await CharacterVisuals.set('specter', 'skeleton_mage');
await CharacterVisuals.set('soldier', 'raider');
await CharacterVisuals.set('brute', 'corrupted');
await CharacterVisuals.set('cryptHound', 'shadow_wolf');
// Exemplo de restauração:
CharacterVisuals.reset('cryptHound');
```

A escolha vale apenas para a sessão. O catálogo contém dados locais para funcionar também com `file://`, mas as imagens opcionais só são decodificadas quando selecionadas. O cache existente de tiras ImageBitmap é mantido. As capturas com inimigos na vila são uma montagem pausada para revisão, não um encontro adicionado ao jogo.

## Validação e limites visuais

`validation.json` registra a inspeção de todos os quadros contra cortes, quadros vazios e ações estáticas. São 1.944 quadros em oito direções. `glb-validation.json` registra a reimportação dos oito GLB, UVs, pesos normalizados e amostras do início/meio/fim das ações. Essa checagem estrutural é complementada pelas capturas; não equivale a uma avaliação artística automática.

```sh
node game_check.js
node scripts/stylized-characters-browser-check.js
node scripts/reference-characters-browser-check.js
node scripts/crypt-hound-browser-check.js
node scripts/reference-characters-performance.js review/characters-performance-after.json
```

Os testes de navegador precisam de Playwright e Chrome. A avaliação de desempenho mede tempo de submissão de desenho de 100 aliados com cache aquecido; não mede FPS completo nem custo total de IA/GPU. Os JSON em `review/characters-performance-*.json` guardam o antes/depois. O cálculo de memória usa dimensões RGBA dos quatro atlas principais e exclui cache e outros personagens.

A referência foi usada para as silhuetas, roupas, cores e acessórios. Há diferenças artísticas: os esqueletos têm costelas e pés mais simplificados; barba, cabelo e tecido usam menos planos; a expressão e a pose dos inimigos são mais contidas. A câmera real de gameplay é mais elevada e o tamanho final menor que a ilustração. Os sprites têm passos discretos de animação e direção, conforme o renderizador existente. Não há alegação de reprodução exata ou de renderização 3D em tempo real.
