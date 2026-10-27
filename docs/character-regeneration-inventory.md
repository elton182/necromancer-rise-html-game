# Inventário para a regeneração visual dos personagens

Levantamento feito antes de gerar ou substituir qualquer asset, com o repositório
no commit `2c9d76b`. A direção visual pedida é o elenco low-poly de
`blender/examples/image.png`, usado apenas como referência de estilo.

## 1. Como os personagens chegam à tela

### Registro e desenho

- Sprites embutidos: `SPR.load('<chave>', meta, base64)` em `necromancer-canvas.html`, com 19 chaves (18 personagens e o projétil `boneShard`).
- Sprites opcionais: `assets/characters/reference/catalog.js` (`window.ReferenceCharacterCatalog`). São carregados sob demanda por `scripts/character-visuals.js` com a chave `reference_<id>`.
- Desenho: `drawSprite(chave, ref, opções)` no HTML, envolvido por `scripts/character-visuals.js`, que:
  - troca o visual de alguns papéis (`defaults`): `specter` e `mage` → `skeleton_mage`, `soldier` → `raider`, `brute` → `corrupted`, `cryptHound` → `shadow_wolf`;
  - escolhe animações extras a partir do estado real: `hurt` (0,22 s após dano), `spawn`, `summon`, `nova`, `channel`, `dash`, as fases `windup`/`charge`/`recover` do Cão e o ciclo do Bram.
- Quem chama `drawSprite`:
  - `necromancer()`: Zephyr.
  - Laço dos minions: `m.type` ou chave fixa.
  - Laço dos inimigos: `ESPR[e.def.name]`, com escala `1,05 × sc × ESPR_K`.
  - `drawHubProp`: `NK={bram:'smith',lysa:'elder',tilda:'tilda'}`.
  - `drawMerchant` e `scripts/village-environment.js`: `merch`.
- Sem sprite, o jogo cai no desenho vetorial `person()` com os estilos de `CHAR`, ou em `specterDraw`/`hydraDraw`.

### Contrato do atlas

| Campo | Significado |
|---|---|
| `cell` | Lado da célula quadrada em px |
| `ppu` | Pixels do atlas por unidade de mundo; escala na tela = `S / ppu × scale` |
| `anchorX`, `anchorY` | Ponto dos pés dentro da célula |
| `dirs` | 8 (ou 1 para Bram) |
| `anims.<nome>` | `n` quadros (colunas), `fps`, `loop`, `row` inicial |

- Linha usada = `row + direção`. A direção é `round(ângulo / 45°)` com o eixo y para baixo: 0 = leste, 1 = sudeste, 2 = sul, 3 = sudoeste, 4 = oeste, 5 = noroeste, 6 = norte, 7 = nordeste. Os renderizadores giram a armature em `90° − d × 45°`.
- Padrão comum: célula de 224 px, 8 direções, até 8 colunas (largura 1792 px) ou 10 colunas (2240 px, sheets antigos).
- Limite WebP de 16383 px por lado. O atlas de Zephyr já tem 72 linhas (16128 px) e não comporta nenhuma linha extra sem mudar o arranjo.

### Como o motor escolhe o quadro

| Estado | Animação | Quadro |
|---|---|---|
| Morto (cadáver) | `death` | Último |
| Morrendo | `death` | `deadT / 0,8 s` |
| Atacando | `cast`, se existir; senão `attack` | Progresso de `swing` (0,28 s) ou `prog` |
| Movendo | `walk` | Fase de passo do ator |
| Parado | `idle` | `fps` do atlas |

**Não há evento de impacto.** No ataque básico, o motor aplica o dano quando
`atkTimer` zera e, no mesmo passo, define `swing=.28`. O clipe de ataque toca nos
0,28 s **seguintes**. Assim, o impacto visual acontece depois do dano real. Os
especiais (golpe pesado, salto, investida, erupção) têm preparação no motor, com
avisos desenhados no chão. Somente Cão de Cripta, Carcereiro e Acólito têm clipes
próprios de preparação.

## 2. Pipelines existentes

São cinco gerações; a quinta é o Lote 1 desta regeneração. Os empacotadores de gerações diferentes substituem os mesmos registros `SPR.load`.

| Geração | Fontes | Saída | Estilo |
|---|---|---|---|
| Toon original | `blender/scripts/necromante.py`, `mob.py` (zumbi), `undead_ranged.py`, `crypt_hound.py`, `soul_warden.py`, `war_acolyte.py`, `render_*.py`, `pack_*.py`, `combat_toon.py`/`toon.py` | `blender/models/`, `blender/exports/`, `blender/spritesheets/` | Cel shading em 3 faixas e contorno Freestyle |
| Estilizada | `blender/stylized_characters.py`, `character_sculpt.py`, `pack_stylized_characters.py` | `blender/stylized_*.blend/.glb/_sheet.*` | Low-poly facetado com contorno no alfa |
| Referência | `blender/reference_characters.py`, `zephyr_materials.py`, `pack_reference_characters.py`, `validate_reference_characters.py`, `reference_review.py` | `blender/reference/*.blend/.glb`, `assets/characters/reference/*` | Low-poly da referência, materiais foscos |
| Moradores | `blender/village_npcs.py`, `pack_village_npcs.py`, `bram_recover_frames.py` | `blender/villager_*.blend/_sheet.*` | Lysa, Tilda e mercador continuam na geração estilizada; o Bram pintado foi substituído no Lote 1 |
| Lote 1 low-poly | `blender/scripts/lowpoly_cast.py`, `blender/scripts/pack_lowpoly_cast.py` | `blender/models/lowpoly_*.blend`, `exports/lowpoly_*.glb`, `spritesheets/lowpoly_*_sheet.*` | Zumbi e arqueiro inimigo no toon da referência. O Bram Blender foi trocado pelo atlas 2.5D do usuário (`pack_bram_2_5d.py`). Ver [revisão](character-regeneration-review.md) |

- Os scripts da raiz de `blender/` ficam fora da estrutura `scripts/`, `models/`, `frames/` exigida por `blender/AGENTS.md`.
- Ferramentas nesta máquina:
  - **Blender não está instalado no sistema.** O Lote 1 usou um Blender 4.3.2 portátil baixado em `/tmp/blender-4.3.2-linux-x64/`, fora do repositório; ele some quando `/tmp` é limpo.
  - Python 3 com Pillow 10.2 está disponível.
  - Os testes de navegador exigem Playwright, que não está no projeto (o Lote 1 usou `playwright-core` instalado em `/tmp`).

## 3. Personagens

Notação das animações: `nome n@fps`. Escala na tela: `S / ppu × scale`; o
`scale` vem de quem chama `drawSprite`.

### Jogável

| ID | Nome | Fonte atual | Sprite / atlas | Animações | Ataques | Âncora / ppu | Escala | Dependências | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `necro` | Zephyr | `blender/reference_characters.py` + `zephyr_materials.py` → `blender/reference/zephyr.blend/.glb` | Embutido, 1792×16128, célula 224 | idle 4@5, walk 6@12, cast 8@22, summon 8@16, hurt 3@12, death 6@10, nova 8@18, channel 8@16, dash 6@30 | Tiro de Osso (cast); Explosão Necrótica (nova); magias canalizadas (channel); invocação (summon); Dash | (112, 148,4) / 34,3 | 1,12 | `character-visuals.js` (escolha de clipe pela cor de `castAnim`), `pack_reference_characters.py` | Já na família low-poly. Atlas no limite de altura |

### Minions aliados

Ataque básico: dano aplicado no início de `swing`, clipe de 0,28 s. Valores em `docs/mecanicas/horda.md`.

| ID | Nome | Fonte atual | Sprite / atlas | Animações | Ataques | Âncora / ppu | Escala | Dependências | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `zombie` | Zumbi | `blender/scripts/lowpoly_cast.py` → `models/lowpoly_zombie.blend`, `exports/lowpoly_zombie.glb` (antes: `mob.py`) | Embutido, 1344×14336 | idle 6@6, idle_variation 6@5, walk 6@10, attack 6@12, attack_secondary 6@12, spawn 6@10, hurt 3@12, death 6@10 | Básico 1,2 s, alcance 1,5; Mordida Pútrida (7 s); comando: detonação | (112, 165) / 56 | 1,05 | Fallback `CHAR.zombie`; seleção em `character-visuals.js` | **Lote 1**: low-poly, aguardando validação |
| `skeleton` | Esqueleto Guerreiro | `reference_characters.py` → `blender/reference/skeleton.blend` | Embutido, 1792×10752 | idle 4@5, walk 6@10, attack 8@20, hurt 3@12, death 6@10, spawn 6@10 | Básico 0,9 s, alcance 1,6; Golpe Giratório (6 s) | (112, 157,5) / 42,875 | 1,05 | `pack_reference_characters.py` | Já na família low-poly |
| `archer` | Esqueleto Arqueiro | `reference_characters.py` → `blender/reference/archer.blend` | Embutido, 1792×10752 | Iguais às do guerreiro | Básico 1,1 s, alcance 7,5; Rajada Tripla (8 s); comando: salva forte | (112, 157,5) / 42,875 | 1,05 | Idem | Já na família low-poly |
| `specter` | Espectro | Base: `undead_ranged.py` → `models/mob_specter.blend`. Visual ativo: `reference_skeleton_mage` | Base 2240×7168 embutido; ativo no catálogo (1792×10752) | Ativo: idle, walk, attack, hurt, death, spawn | Básico 0,7 s, alcance 2,0; Investida Fantasma (9 s); comando: teletransporte | Base (112, 165) / 56; ativo (112, 157,5) / 42,875 | 1,05 | `CharacterVisuals.defaults.specter` | Low-poly pela troca, mas a identidade virou "esqueleto mago" em vez de espectro |
| `abom` | Abominação | **Não identificada**: não há `.blend` nem gerador no repositório | Embutido, 2240×7168 | idle 8@6, walk 10@12, attack 8@16, death 10@12 | Básico 1,25 s, alcance 2,1; Rugido Pútrido (10 s); comando: salto com impacto | (112, 165) / 56 | 1,05 | Fallback `CHAR.abom` | Toon antigo, sem fonte editável |

### Inimigos comuns

Ataque básico: corpo a corpo a cada 1,1 s e tiros a cada 1,3 s; o dano sai no início do clipe de 0,28 s.

| ID (sprite) | Nome (`ENEMY_TYPES[i]`) | Fonte atual | Sprite / atlas | Animações | Ataques | Âncora / ppu | Escala | Dependências | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `soldier` | Guerreiro [0] | Base: **não identificada**. Ativo: `reference_raider` (`blender/reference/raider.blend`) | Base embutido 2240×7168; ativo no catálogo 1344×10752 | Ativo: idle 4@5, walk 6@10, attack 6@14, hurt, death, spawn | Corpo a corpo, 8 de dano; Golpe pesado (aviso 0,5 s, raio 2,1, recarga 5 s) | Ativo (112, 157,5) / 42,875 | 1,05 × 1,0 × 1,1 | `ESPR`, `ESPR_K`, `CharacterVisuals` | Low-poly pela troca (visual de saqueador) |
| `earcher` | Arqueiro [1] | `blender/scripts/lowpoly_cast.py` → `models/lowpoly_earcher.blend`, `exports/lowpoly_earcher.glb` | Embutido, 1344×12544 | idle 6@6, idle_variation 6@5, walk 6@10, attack 6@20, windup 6@9,23, hurt 3@12, death 6@10 | Tiro, alcance 7,5; Tiro forte (aviso 0,65 s, linha de 12 u, recarga 5 s) | (112, 165) / 56 | 1,05 × 0,85 × 1,3 | `ESPR`, `ESPR_K`; seleção do `windup` em `character-visuals.js` | **Lote 1**: low-poly com fonte editável, aguardando validação |
| `brute` | Bruto [2] | Base: **não identificada**. Ativo: `reference_corrupted` | Base 2240×7168; ativo 1344×10752 | Ativo como `soldier` | Corpo a corpo, 18; Salto devastador (aviso 0,65 s, 2,5–7 u, raio 2,6, recarga 6 s) | Ativo (112, 157,5) / 42,875 | 1,05 × 1,5 × 1,0 | Idem | Low-poly pela troca |
| `mage` | Mago Vivo [3] | Base: **não identificada**. Ativo: `reference_skeleton_mage` | Base 2240×7168; ativo 1792×10752 | Ativo como `specter` | Tiro mágico, alcance 6,5; Erupção de fogo (aviso 0,75 s, raio 2,2, fogo 3 s, recarga 6,5 s) | Ativo (112, 157,5) / 42,875 | 1,05 × 0,9 × 1,2 | Idem | Low-poly pela troca, mas um mago **vivo** aparece como esqueleto e repete o visual do Espectro aliado |
| `cryptHound` | Cão de Cripta [4] | Base: `blender/scripts/crypt_hound.py` → `models/mob_cryptHound.blend`. Ativo: `reference_shadow_wolf` | Base 1344×12544; ativo 1344×16128 | Ativo: idle, walk, attack, hurt, death, spawn, windup 4@8, charge 6@16, recover 4@8 | Mordida a cada 1,2 s, alcance 1; Investida (aviso 0,75 s, até 6 u, recuperação 1 s) | Base (112, 165) / 56; ativo (112, 157,5) / 42,875 | 1,05 × 0,85 | `scripts/crypt-hound.js`, `CharacterVisuals` | Low-poly pela troca |
| `warAcolyte` | Acólito de Guerra [5] | `blender/scripts/war_acolyte.py` → `models/mob_warAcolyte.blend` | Embutido, 1344×10752 | idle 4@4, walk 6@10, attack 6@20, windup 4@4, channel 4@4 (loop), death 6@7,5 | Cajado a cada 1,5 s, alcance 1,3; Litania (preparação 1 s, canal 4 s, círculo de 5,5 u, sem dano direto) | (112, 156,17) / 46,667 | Definida em `scripts/war-acolyte.js` | `war-acolyte.js` | Toon antigo, com fonte editável |
| *(vetorial)* | Alvo de treino (`name:'skeleton'`) | `person()` com `CHAR.skeleton` | — | — | Não ataca | — | — | — | Desenho vetorial |

### Chefes e especiais

| ID (sprite) | Nome | Fonte atual | Sprite / atlas | Animações | Ataques | Âncora / ppu | Escala | Dependências | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `knight` | Capitão da Guarda | **Não identificada** | Embutido, 2240×7168 | idle, walk, attack, death | Golpe; Investida (linha de 13 u, aviso 0,95/0,75 s); Pancada (raio 3,3, aviso 1 s); tripla na fase 4; atordoamentos | (112, 165) / 56 | 1,05 × sc × 0,8 | `CAPTAIN`, `capAI` | Toon antigo, sem fonte editável |
| `soulWarden` | Carcereiro das Almas e os tenentes **Boticário Apodrecido**, **Guardiã dos Afogados** e **Abade da Decomposição** (`scripts/endgame.js:183` reaproveita o sprite) | `blender/scripts/soul_warden.py` → `models/boss_soulWarden.blend` | Embutido, 2304×16128, célula **288** | idle 4@4, walk 6@10, attack 6@15, windup 6@5, cast 6@4,44, recover 4@5, death 8@10 | Sentença (raio 2,8, aviso 1,2 s); Almas Condenadas (leque, aviso 1,35 s); Selos (fase 2) | (144, 211,5) / 50,4 | Definida em `scripts/soul-warden.js` | `soul-warden.js`, `endgame.js` | Toon antigo. Os três tenentes não têm visual próprio |
| *(vetorial)* | Guardião dos Ossos | `person()` com `CHAR` | — | — | IA corpo a corpo de chefe | — | sc 2,4 | `MISSION_TEMPLATES` | Desenho vetorial |
| *(vetorial)* | Lich Guerreiro | `person()` com `CHAR` | — | — | Idem | — | — | Idem | Desenho vetorial |
| *(vetorial)* | Hidra Pútrida | `hydraDraw()` | — | — | Idem | — | — | Idem | Desenho vetorial |

### NPCs

| ID | Nome | Fonte atual | Sprite / atlas | Animações | Ataques | Âncora / ppu | Escala | Dependências | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `smith` | Bram, o ferreiro | Atlas 2.5D do usuário `blender/spritesheets/bram_2_5d_source.png` → `blender/scripts/pack_bram_2_5d.py` (antes: `lowpoly_cast.py`; antes disso, prancha pintada via `pack_village_npcs.py`) | Embutido, 1008×3456, célula 144, 8 direções | idle 7@5, idle_variation 7@8 (bigorna, em loop), talk 7@6 (`attack`/`walk` como aliases) | Nenhum | (72, 124) / 38 | 1,05 × 1,05 | Ciclo em `character-visuals.js` | Atlas do usuário fatiado, sem espelhamento. `pack_village_npcs.py`, `pack_reference_characters.py --only=bram` e `pack_lowpoly_cast.py --only=bram` sobrescrevem este registro |
| `elder` | Lysa, a anciã | `blender/stylized_characters.py` → `stylized_lysa.blend` | Embutido, 1792×3584 | idle 8@5; `attack` 8@6 (saudação, loop) | Nenhum | (112, 161) / 49 | 1,05 × 0,95 | `drawHubProp` | Família estilizada; sem talk/hurt/variação |
| `tilda` | Tilda | `stylized_characters.py` → `stylized_tilda.blend` | Embutido, 1792×3584 | Iguais às de Lysa | Nenhum | (112, 161) / 49 | 1,05 × 0,72 | Idem | Idem |
| `merch` | Mercador | `stylized_characters.py` → `stylized_merchant.blend` | Embutido, 1792×3584 | Iguais às de Lysa | Nenhum | (112, 161) / 49 | 1,1 | `drawMerchant`, `village-environment.js` | Idem |

### Resíduos, fora da regeneração

- `reference_bram` no catálogo: recorte estático de `blender/examples/image.png` (`bram_sprite_reference.py`). Nenhum papel ativo o usa.
- `boneShard`: projétil, não personagem (16 direções, célula 96).
- `blender/villager_*.blend` e `blender/stylized_bram.blend`/`stylized_zephyr.blend`: gerações anteriores de Bram e Zephyr, sem uso no atlas ativo.

## 4. Animações pedidas e o motor atual

| Pedido | Existe no motor? | Mapeamento sem mudar a lógica |
|---|---|---|
| `idle` | Sim | `idle` |
| `idle_variation` | Não | Linha nova, escolhida por `character-visuals.js` com intervalo aleatório (camada de apresentação) |
| `walk` / `patrol` / `chase` | Só `walk` | `walk`; `run`/`chase` só se houver estado de corrida (não há) |
| `attack_primary` | `attack`/`cast` pelo `swing` | Manter o nome de linha `attack`/`cast`, que o motor já usa |
| `attack_secondary` | Só nos módulos (Cão, Carcereiro, Acólito) | Linha nova com seleção pelo estado da habilidade, como faz o Cão |
| `cast` / `summon` | Zephyr | Já existe |
| `hurt` | Via `character-visuals.js` | Já suportado para quem tem a linha |
| `stagger` / `knockback` | Não há estado de knockback comum | Não criar |
| `death` | Sim | `death` |
| `talk` (NPCs) | Saudação `greet`/`attack` quando o diálogo abre | Manter a linha `attack`/`greet` |
| `command` / `acknowledge` | Comandos existem; não há estado visual | Linha nova, só se ligada ao comando real |

Restrições concretas:

1. **Evento de impacto.** Atrasar o dano até um `impact_time` exige mudar a lógica de combate, o que está fora do escopo. Com o contrato atual, o metadado documenta o quadro de impacto e o clipe precisa mostrar o golpe já no início (quadros 0–2 de 8), com recuperação no restante. A preparação visível dos golpes básicos depende de mudar o motor.
2. **Atlas de Zephyr.** 72 linhas × 224 px = 16128 px. Qualquer linha nova exige reduzir quadros, separar o atlas ou mudar o renderizador.
3. **Nomes novos de linha** só aparecem se `character-visuals.js` os escolher. O motor ignora linhas desconhecidas.

## 5. Problemas e dúvidas

1. **Blender ausente.** Resolvido no Lote 1 com um Blender portátil em `/tmp`, fora do repositório.
2. **Bram.** Decidido: substituir pelo modelo Blender (Lote 1). O sprite pintado continua recuperável pelo Git e por `blender/frames_villager_bram/`.
3. **Lote 1 já parcialmente pronto.** Zephyr e o Esqueleto Guerreiro já pertencem à família da referência. Regenerá-los de novo arrisca regressão sem ganho claro. O ganho real está em zumbi (minion) e arqueiro inimigo (`earcher`), que estão em estilo antigo.
4. **Fontes ausentes.** `abom`, `soldier`, `earcher`, `brute`, `mage` e `knight` não têm `.blend` nem gerador. Regenerá-los significa modelar do zero.
5. **Identidade trocada pela camada visual.** `specter` (aliado) e `mage` (Mago Vivo, inimigo) usam o mesmo esqueleto mago, o que confunde aliado com inimigo e vivo com morto-vivo.
6. **Testes visuais desatualizados.** `stylized-characters-browser-check` e `undead-sprites-browser-check` já falham (ver [linha de base](refactoring-baseline.md)) e esperam contratos de sheets anteriores.
7. **Distribuição.** Os visuais do catálogo dependem de `assets/characters/reference/` (parte embutida em `catalog.js`). Os atlas embutidos via `SPR.load` funcionam sem arquivos externos.
