# ☠ Necromancer's Rise

Jogo de ação top-down de necromancia, em HTML5, num único arquivo e sem dependências.
Você é **Zephyr**, um aprendiz condenado que volta como necromante: lança magias
de osso, ergue uma horda de mortos-vivos e enfrenta a guarda do Reino de Valdoria.

> **A v2 em 3D é o jogo principal.** Abra [`v2/necromancer-3d.html`](v2/necromancer-3d.html)
> (ou [`v2/index.html`](v2/index.html)) no Edge ou Chrome com WebGL 2. Todo o
> desenvolvimento novo acontece nela; o guia está em [v2/README.md](v2/README.md) e o
> plano em [v2/plano-migracao.md](v2/plano-migracao.md). A versão em Canvas 2D
> (`necromancer-canvas.html`) é **legada**: continua jogável e é a entrada atual do
> GitHub Pages, mas não recebe novidades, e suas regras são lidas pelo build da v2.

### ▶ [Jogar a versão legada (GitHub Pages)](https://elton182.github.io/necromancer-rise-html-game/)

[![Tela inicial do jogo](docs/tela-inicial.jpg)](https://elton182.github.io/necromancer-rise-html-game/)

## Estado da v2

A v2 tem o Ato I, a Vila de Eldrin, Arena Infinita, Expedições e Conquista de Valdoria, com Grimório, maestrias,
horda, equipamentos e magias portados da versão legada. Estado, limites e próximas etapas (acabamento E11, HQs e
mapa da campanha) estão em [v2/README.md](v2/README.md) e nos guias [`docs/v2-*.md`](docs/README.md).

## Estado da versão legada — 0.5 (Canvas 2D)

O jogo legado é uma **demo jogável do Ato I** com um endgame curto. Funciona no
navegador, com teclado e mouse ou controle, e salva o progresso localmente.

| Sistema | Situação |
|---|---|
| Campanha — Ato I | 4 fases (salas, arena, rolagem lateral e chefe), quadrinhos de história e mapa para rejogar |
| Modo Livre e Vila de Eldrin | Hub com missões, moradores com pedidos, trilhas laterais e mercador |
| Pedra do Infinito | Expedições por mapas e biomas, elites e boss por wave; Arena clássica preservada; seleção até 1000 |
| Conquista de Valdoria | Mapa com 17 áreas e 6 biomas até a torre; influência, 6 maldições e 2 tenentes; dificuldade sem teto, novo mapa ao trocar de nível e seleção automática da maior liberada; acesso em Esc → VALDORIA na vila |
| Habilidades | 6 slots compartilhados entre 6 magias, Dash e 5 evocações com comandos próprios |
| Grimório | 2 árvores, 6 escolas, 42 nós e 12 especializações finais; 3 pontos por nível até o 60 |
| Maestrias | 6 especializações vinculadas à barra, escolhidas entre 12 habilidades; níveis até 20 e árvores com até 19 pontos próprios |
| Horda | Zumbis, esqueletos guerreiros e arqueiros, espectros e Abominação, com IA, esquiva, reanimação e uma habilidade automática com recarga por tipo |
| Inimigos | 6 tipos comuns com especiais anunciados, 3 chefes de missão e o Capitão da Guarda (4 fases) |
| Boss das expedições | Carcereiro das Almas: modelo e rig no Blender, sete animações em oito direções, duas fases e três ataques anunciados |
| Equipamentos | 7 espaços, 4 raridades, afixos, pontos de habilidade, mochila de 60 peças e filtro de loot |
| Visual | Sprites renderizados no Blender em 8 direções, novo Tiro de Osso e arena de comparação de efeitos |

Os valores de combate ainda são **iniciais** e precisam de balanceamento com
partidas completas. Em andamento no working tree: o sprite próprio dos
**Estilhaços** do Tiro de Osso (`blender/models/bone_shard.blend`, `scripts/skill-vfx.js`).
O próximo cartão do [roadmap visual](docs/roadmap-combate-visual.md) é o Dash
(SK-02), com o Cão de Cripta (EN-01) já disponível nas waves e expedições a partir da wave 4.

## Como jogar

A tabela vale para a versão legada; a v2 usa o mesmo esquema em linhas gerais (veja os controles dela em
[v2/README.md](v2/README.md) e [docs/v2-movimento.md](docs/v2-movimento.md)).

| Tecla | Ação |
|---|---|
| `W A S D` | Mover |
| Clique esquerdo / `1` | Slot de habilidade 1 |
| Clique direito / `2` | Slot 2 |
| `Q` `E` `R` `T` / `3`–`6` | Slots 3 a 6 |
| `Shift` + clique direito | Horda: atacar perto do ponto ou reunir |
| `C` / `Espaço` | Dash / Escudo de Carne, se equipados |
| `V` | Reanimar aliado caído (30 MP) |
| `G` | Interagir / portal |
| `F1`–`F5` | Consumíveis |
| `I` | Inventário |
| `H` | Ajuda |
| `ESC` | Pausa: Personagem, Habilidades, Horda, Sistema, Equipamentos e Waves |

Clique num slot do HUD para trocar sua habilidade e no contador `✦ pts` para abrir o
Grimório. No controle: analógicos movem e miram, `RT`/`A` usam o slot selecionado,
`LB`/`RB` trocam de slot, `LT` comanda a horda e `L3` usa o Dash.
[Mapa completo de controles](docs/mecanicas/interface-e-saves.md#controles).

## Mecânicas em resumo

A referência completa da versão legada, com fórmulas e tabelas, está em
[docs/mecanicas](docs/mecanicas/README.md); as regras e limites da v2 estão nos guias
[`docs/v2-*.md`](docs/README.md). Onde divergirem, vale o guia da v2.

- **[Personagem](docs/mecanicas/personagem-e-progressao.md)**
  - Vida, mana, dano mágico e regeneração crescem com o nível.
  - Cada nível dá **3 pontos** de habilidade e +20 de vida e +5 de mana imediatos.
  - Morrer devolve Zephyr ao hub (ou ao mapa, na campanha) com 50% da vida, sem
    perder ouro, XP ou itens da mochila.
- **[Habilidades](docs/mecanicas/habilidades.md)**
  - Começa com Tiro de Osso e Dash.
  - Magias: Chuva de Ossos, Explosão Necrótica, Muralha de Corpos, Escudo de Carne
    (sacrifica um zumbi) e Maldição da Fraqueza.
  - Todas usam mana, recarga e alcance 9; o Dash é gratuito e evita dano durante o
    deslocamento.
- **[Grimório dos Mortos](docs/mecanicas/grimorio.md)**
  - **Minions** (Carne, Ossos, Espíritos) e **Profana** (Ossos, Sangue, Sombras).
  - Cada escola tem raiz, dois ramos e duas especializações finais exclusivas.
  - Etapas nos níveis 1, 6, 12 e 22; cada ligação exige 2 pontos no nó anterior.
  - Devolver pontos custa 20 de ouro por ponto.
- **[Horda](docs/mecanicas/horda.md)**
  - Uma evocação ocupa um slot e traz o grupo inteiro (3 zumbis, 3 guerreiros,
    2 arqueiros, 2 espectros ou 1 Abominação).
  - Ativar o slot usa o comando do grupo: explosão, salva de flechas, salto,
    teletransporte ou reunião.
  - Os aliados escolhem alvos dentro de um alcance configurável (8, 16 ou 24 u),
    desviam de ataques anunciados e renascem após 12 s.
- **[Inimigos](docs/mecanicas/inimigos-e-chefes.md)**
  - Guerreiro, Arqueiro, Bruto e Mago Vivo anunciam seus especiais; sair da área
    marcada evita o golpe.
  - Acólito de Guerra fortalece inimigos próximos com uma litania interrompida pela morte; aparece a partir da wave 6 na Arena e nas Expedições.
  - Missões terminam com Guardião dos Ossos, Lich Guerreiro ou Hidra Pútrida.
  - O Ato I termina no Capitão da Guarda, com escudo e reforços a cada 25% de vida.
- **[Equipamentos](docs/mecanicas/equipamentos-e-loot.md)**
  - Cajado, grimório, vestimenta, capuz, botas e dois anéis.
  - Raridades com 0, 2, 3 ou 4 afixos.
  - 16% de chance de drop por monstro; chefes garantem mágico ou melhor.
  - Itens podem dar pontos extras em habilidades já aprendidas.
  - Compra de relíquias e venda no hub.
- **[Modos de jogo](docs/mecanicas/modos-de-jogo.md)**
  - Campanha e Modo Livre compartilham o mesmo personagem.
  - O Modo Livre começa na Vila de Eldrin, com moradores e Pedra do Infinito, sem exigir a conclusão do Ato I.
  - Na Arena Infinita, a maior wave desbloqueada define o nível do loot vendido.

## Rodando localmente

**v2 (principal):** não precisa de servidor: abra `v2/necromancer-3d.html` (ou `v2/index.html`) no Edge ou Chrome com
WebGL 2. Para regenerar o HTML depois de editar as fontes em `v2/`, rode na raiz `node v2/tools/build.cjs`.

**Versão legada:** abra `necromancer-canvas.html`. O `index.html` da raiz só redireciona para ele (entrada do GitHub Pages).

Na v2 o progresso fica no `localStorage` (chave `necromancer_rise_3d_save`; veja [docs/v2-saves.md](docs/v2-saves.md)) e a v2 importa o
JSON exportado da versão legada. Na versão legada a chave é `necromancer_v2`. Use
**Opções → Exportar/Importar save** para backup.

Para diagnosticar combate com sua build, exporte em **Esc → Sistema → Exportar save**
e use a [simulação de save no motor real](balance-simulator/SAVE-SIMULATION.md).
Ela roda tentativas reproduzíveis em navegador isolado, preservando seu progresso.

## Desenvolvimento

### Estrutura

| Caminho | Descrição |
|---|---|
| `v2/` | **Jogo principal (3D)**: fontes em `scripts/`, modelos e trilhas em `assets/`, testes em `tests/`, empacotador em `tools/build.cjs` e a distribuição autocontida `necromancer-3d.html` |
| `necromancer-canvas.html` | **Versão legada** (Canvas 2D), autocontida (código, estilos, sprites e módulos embutidos); suas regras também alimentam o build da v2 |
| `scripts/` | Fontes dos módulos da versão legada e das regras compartilhadas, sincronizadores e testes |
| `build-simulator/` | [Simulador de builds](build-simulator/README.md); `model.js` é o grafo do Grimório usado pelo jogo |
| `balance-simulator/` | [Simulador de balanceamento](balance-simulator/README.md) de equipamentos e waves |
| `tools/` | Arena de comparação de efeitos e inimigos (`combat-lab`) |
| `blender/` | Modelos, rigs e scripts Python: GLBs animados da v2 (`exports/`) e spritesheets da versão legada |
| `assets/story/` | Imagens dos quadrinhos |
| `docs/` | [Documentação](docs/README.md): mecânicas, implementação e planos |
| `game_check.js` | Cenários de regras do jogo (Node, sem dependências) |
| `necromancer-game.html`, `necromancer-demo.html` | Versões antigas (Three.js e demo visual) |

### Verificação da v2

```bash
node v2/tools/build.cjs
node --test v2/tests/*.test.mjs
```

Os `v2/tests/*-browser-check.cjs` abrem a v2 num navegador isolado (Playwright com Edge ou Chrome, WebGL 2) e gravam evidências em
`review/v2/`. Cada guia `docs/v2-*.md` indica o teste da sua área.

### Módulos embutidos (versão legada e fontes compartilhadas)

A versão legada é distribuída como um único HTML. Alguns sistemas são editados em
arquivos separados e copiados para dentro dele (a v2 lê várias dessas fontes pelo build):

| Fonte | Sistema | Sincronizar com |
|---|---|---|
| `build-simulator/model.js`, `scripts/skill-trees.js`, `scripts/skill-trees.css` | Grimório e regras de combate (`COMBAT_TUNING`) | `node scripts/sync-skill-trees.js` |
| `scripts/equipment-model.js`, `scripts/equipment.js`, `scripts/minion-care.js`, `scripts/minion-abilities.js`, `scripts/sprite-cache.js`, `scripts/equipment.css`, `scripts/menu.css` | Equipamentos, loot, waves, reanimação, esquiva e habilidades automáticas da horda, cache de sprites, menu | `node scripts/sync-equipment.js` (também roda o anterior) |
| `scripts/expedition-model.js`, `scripts/expedition.js` | Mapas de expedição, biomas por wave, elites, boss e seleção entre Expedição e Arena clássica | `node scripts/sync-equipment.js` |
| `scripts/endgame-model.js`, `scripts/endgame.js`, `scripts/endgame-map.js`, `scripts/endgame-screen.js`, `scripts/endgame.css` | Tela dedicada e mapa territorial em Canvas 2D, conquista regional, maldições, líderes do pântano e Osso Carcomido/Podridão | `node scripts/sync-equipment.js` |
| `scripts/war-acolyte-model.js`, `scripts/war-acolyte.js` | Acólito de Guerra, aura de dano e composição de grupos | `node scripts/sync-equipment.js` |
| `scripts/crypt-hound-model.js`, `scripts/crypt-hound.js` | Composição da arena e combate do Cão de Cripta | `node scripts/sync-equipment.js` |
| `scripts/skill-vfx.js` | Efeitos do Tiro de Osso e do Dash | `node scripts/sync-skill-vfx.js` |

Edite a fonte e rode o script; não edite o bloco embutido direto no HTML.

### Verificação da versão legada

```bash
node game_check.js
```

```bash
node --test scripts/equipment.test.js scripts/minion-care.test.js scripts/minion-abilities.test.js scripts/sprite-cache.test.js scripts/skill-trees.test.js scripts/navigation-options.test.js build-simulator/model.test.js balance-simulator/model.test.js
```

- `game_check.js` valida a sintaxe e roda os 71 cenários de regras.
- Os testes `node --test` (105 casos) cobrem modelos, migrações, sinergias e
  estatísticas.
- Os arquivos `scripts/*-browser-check.js` abrem o jogo num Chrome headless e
  conferem fluxos de interface. Exigem Playwright e Google Chrome instalados, por
  exemplo `node scripts/loot-filter-browser-check.js`.

### Arena de comparação (versão legada)

```bash
node tools/combat-lab-server.js
```

Depois acesse `http://127.0.0.1:4173/tools/combat-lab.html`. A arena usa os sprites
e o renderizador reais para comparar efeitos e inimigos no tamanho do jogo
(veja o [guia visual](docs/guia-visual-combate.md)).

### Pipeline do Blender

Personagens e efeitos são modelados e animados por script no Blender. A v2 usa os
`.glb` animados de `blender/exports/`, registrados em `v2/assets/models.json`. A versão
legada usa spritesheets com shader toon: 8 direções para personagens e 16 para o estilhaço de osso. Detalhes em [blender/README.md](blender/README.md).

![Personagens renderizados no Blender](blender/previews/preview_mobs.png)

- `necromante.py`, `mob.py`, `undead_ranged.py` e `bone_shard.py` constroem modelo,
  rig e animações (`.blend` / `.glb`).
- `sprites.py`, `render_undead.py` e `render_bone_shard.py` renderizam os quadros.
- `pack_undead.py` e `pack_bone_shard.py` montam o spritesheet (`*_sheet.webp`) e os
  metadados (`*_sheet.json`) e os incorporam ao HTML do jogo (exigem Python com
  Pillow).
- `render.py` gera previews; `toon.py` e `common.py` são utilitários compartilhados.

```bash
blender -b -P blender/scripts/sprites.py -- blender/models/necromante.blend blender/spritesheets necromante
```

## Migração para a v2

A v2 já é o jogo principal; a troca da entrada do GitHub Pages (`index.html` da raiz) e o acabamento final são a etapa E11.
Fluxos e limites da migração estão no [plano da v2](v2/plano-migracao.md).

Novo endgame da v2: [Cerco ao Ritual](docs/v2-cerco.md), defesa do Obelisco de Almas com torres, horda e runas.
