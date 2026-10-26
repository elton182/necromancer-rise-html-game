# Linha de base da refatoração (Fase 1)

Retrato do projeto **antes** de qualquer refatoração. Serve para comparar cada
etapa seguinte: nenhum teste aprovado aqui pode passar a falhar, e as falhas
listadas só podem diminuir.

- Data: 26/10/2026.
- Commit: `2c9d76b` (`main`, 2 commits à frente de `origin/main` = `f21fadd`).
- Ambiente: Linux, Node v20.20.2, Google Chrome e Microsoft Edge do sistema, Chrome headless.
- Nenhum arquivo de código, asset ou HTML foi alterado nesta fase.

## 1. Estado do Git

- Nenhum arquivo versionado modificado. Não há stash.
- 1.264 arquivos não versionados, todos em `blender/`:

| Grupo | Arquivos | Origem |
|---|---|---|
| `blender/frames_villager_{bram,lysa,merchant,tilda}/` | 70 + 3 × 128 | Quadros dos NPCs da vila, lidos por `blender/pack_village_npcs.py` |
| `blender/frames_stylized_{bram,lysa,merchant,tilda,zephyr}/` | 4 × 128 + 288 | Quadros de `blender/stylized_characters.py` |
| `blender/*.blend1` | 10 | Backups automáticos do Blender |

O `.gitignore` atual ignora `blender/frames/`, `blender/logs/` e `blender/backups/`
(layout organizado vindo de `origin`). Ele **não** cobre as pastas `frames_*` nem
os `.blend1` na raiz de `blender/`, por isso eles aparecem como não versionados.
Os quadros `frames_villager_bram/03_*.png` (animação `recover` do Bram) são gerados
por `blender/bram_recover_frames.py` a partir de `blender/bram_recover_keys/`.

Os assets que antes estavam fora do Git (`assets/characters/`, `assets/village/`,
`assets/npc-portraits/`, `scripts/npc-dialogue.js`, `scripts/village-*.js`,
`scripts/character-visuals.js`) foram versionados no commit `4940a80`.

## 2. Comandos executados

Todos na raiz do repositório, salvo indicação.

| Comando | Resultado |
|---|---|
| `git status`, `git log`, `git diff --stat 4940a80 2c9d76b`, `git count-objects -vH` | Estado acima; merge trouxe 180 arquivos de `origin/main` |
| Comparação (Node, somente leitura) de cada bloco `*_BEGIN/*_END` do HTML com sua fonte | 24 iguais, 3 diferentes (seção 5) |
| `node game_check.js` | **76 cenários aprovados**; 10 scripts com sintaxe válida (~4,5 s) |
| `node --test` com a lista oficial do README (8 arquivos) | **116/117**; 1 falha |
| `node --test scripts/crypt-hound.test.js scripts/defense.test.js scripts/endgame.test.js scripts/expedition.test.js scripts/simulate-save.test.js scripts/skill-mastery.test.js scripts/soul-warden.test.js scripts/war-acolyte.test.js` | **41/41** |
| 25 `scripts/*-browser-check.js` e `*-visual-check.js`, numa cópia em `/tmp` (seção 3) | **20 aprovados, 5 falhos** |
| Teste de fumaça próprio no navegador (fora do repositório, seção 3) | Fluxos principais funcionam; 1 defeito confirmado |
| Abrir somente `necromancer-canvas.html`, sem `scripts/` e `assets/` | Abre, mas o diálogo com NPCs quebra |

### Como os testes de navegador foram executados

Os testes de navegador exigem `require('playwright')`, que não existe no projeto,
e gravam capturas em arquivos versionados (`review/*.png`, `docs/concepts/*.png`).
Para não instalar nada nem sobrescrever evidências:

1. O projeto foi copiado para uma pasta temporária, sem `.git`, `_to_delete/`, quadros e `.blend`.
2. Foi usado um `playwright-core` já existente fora do projeto, exposto como `playwright` via `NODE_PATH`.
3. Na cópia, o `require` com caminho absoluto do Windows em `defense-browser-check.js` foi trocado por `require('playwright')`.

As capturas geradas ficaram na cópia temporária, não em `review/`.

## 3. Resultado dos testes

### Node

| Suíte | Aprovados | Falhos |
|---|---|---|
| `game_check.js` | 76 | 0 |
| Lista oficial `node --test` | 116 | 1 |
| Demais `*.test.js` | 41 | 0 |

Falha: `scripts/equipment.test.js:228`, "released HTML embeds sources once, orders
equipment after trees, and has save bridges". Causa: o HTML não contém o texto
exato de `scripts/equipment.js` e `scripts/expedition.js` (seção 5, problema 1).

### Navegador (`scripts/*-browser-check.js`)

Aprovados (20): `brute`, `cast-animations`, `crypt-hound`, `defense`, `endgame`,
`equipment-drag`, `equipment-ui`, `expedition`, `gear-base`, `loot-filter`,
`menu-actions`, `minion`, `navigation-options`, `reference-characters`,
`skill-mastery`, `soul-warden`, `village-environment`, `war-acolyte`,
`crypt-hound-visual-check`, `war-acolyte-visual-check`.

| Falho | Asserção | Leitura |
|---|---|---|
| `npc-dialog-browser-check.js:37` | Após "🔄 Outro pedido" com Lysa, fase esperada `ready`, obtida `ambient` | **Defeito real**: ver problema 2 |
| `equipment-browser-check.js:95` | Espera `VILLAGE()===false` antes de concluir a fase 1 da campanha | Provável teste desatualizado: o README diz que o Modo Livre começa na vila sem exigir o Ato I. A confirmar |
| `stylized-characters-browser-check.js:10` | Espera `dirs:8` para `necro`, `smith`, `elder`, `tilda`, `merch`; o `smith` atual tem 1 direção | O sheet do Bram foi substituído pelo pipeline `villager_*`. A confirmar qual pipeline é oficial |
| `undead-sprites-browser-check.js:37` | Espera atlas com largura 2240, obtida 1792 | Atlas mudou de tamanho. A confirmar se é regressão ou teste desatualizado |
| `skill-vfx-browser-check.js:26` | Timeout esperando 100 amostras do `CombatLab` | Inconclusivo: pode ser limitação do headless |

### Teste de fumaça (perfil limpo, `file://`)

| Fluxo | Resultado |
|---|---|
| Abertura | `load` em ~3,4–3,8 s; 19 spritesheets prontos em ~6,5–7 s; heap JS ~77 MB; tela de título visível |
| Arquivos externos | `NpcDialogue`, `VillageKitData`, `VillageEnvironment`, `ReferenceCharacterCatalog`, `CharacterVisuals` e `game-ui.css` carregados |
| Novo jogo (Modo Livre) | Quadrinho de introdução, depois vila (`gameState='hub'`), ambiente Blender carregado sem falhas |
| Retratos dos NPCs | 4 imagens `*-painted.png` carregadas (1024×1536) |
| Movimento | Tecla `D` por 0,7 s moveu Zephyr ~2,1 u |
| Diálogo | `vilOpen('bram')` abre na fase `ambient`; `vilOpen('bram',true)` **também** fica em `ambient` |
| Combate | `startEndless()` entra no estágio `expedition`; clique esquerdo lança Tiro de Osso (−20 MP, 1 projétil) |
| Salvar / exportar | `saveGame()` grava `necromancer_v2`; o arquivo exportado (`necromancer-save-nv1-w1.json`) é idêntico ao salvo |
| Importar | `importSaveText` pede confirmação ("IMPORTAR"), recarrega e aplica nível 7 e ouro 4321 |
| Save antigo | `scripts/fixtures/legacy-level30.json` carrega no nível 30, cria `necromancer_v2_before_skill_trees` e migra as versões |
| Falha de gravação | Com `setItem` lançando exceção, `saveGame()` não avisa e mostra "💾 Salvo" (problema 4) |
| Campanha | Quadrinho de abertura, depois mapa da campanha (`CAMP.on`, `CAMP.map`) |
| Erros | Nenhum erro de página, de console ou requisição falha |

## 4. Arquivos principais

| Arquivo / pasta | Papel |
|---|---|
| `necromancer-canvas.html` | Jogo distribuído: 9.910 linhas, ~35 MB (49 linhas com base64). Motor, cenas, entrada, combate e 19 `SPR.load` embutidos |
| `scripts/*.js`, `scripts/*.css` | Fontes dos 27 blocos embutidos, módulos externos, testes e sincronizadores |
| `build-simulator/model.js` | Grafo do Grimório, embutido como `SKILL_TREE_MODEL` |
| `game_check.js` | Cenários de regras: extrai funções do HTML e roda em `vm` |
| `index.html` | Redireciona para `necromancer-canvas.html` (GitHub Pages) |
| `necromancer-game.html`, `necromancer-demo.html` | Versões antigas. `necromancer-game.html` também referencia `scripts/npc-dialogue.js` |
| `necromancer-canvas.sprites-backup.html`, `_to_delete/` | Backups; não são fontes |
| `blender/` | Pipeline organizado (`scripts/`, `models/`, `spritesheets/`) e pipeline dos NPCs da vila na raiz da pasta |
| `review/` | Evidências gravadas pelos testes de navegador |
| `AGENTS.md`, `scripts/AGENTS.md`, `docs/AGENTS.md`, `blender/AGENTS.md` | Regras do repositório |

### Fontes → blocos do HTML

| Sincronizador | Blocos (marcador) ← fonte |
|---|---|
| `node scripts/sync-skill-trees.js` | `SKILL_MASTERY_MODEL` ← `skill-mastery-model.js`; `SKILL_MASTERY_STYLE` ← `skill-mastery.css`; `SKILL_TREE_MODEL` ← `build-simulator/model.js`; `SKILL_TREE_STYLE` ← `skill-trees.css`; `SKILL_TREE_RULES` ← `skill-trees.js`. Também aplica ~40 trocas literais no motor (pontes de save, remoção de almas, textos) |
| `node scripts/sync-equipment.js` (roda o anterior antes) | Cabeçalho: `EQUIPMENT_MODEL`, `EQUIPMENT_STYLE`, `MENU_STYLE`, `ENDGAME_STYLE`. Runtime, antes de `const hasSave=bootGame();`: `EQUIPMENT_RULES`, `MINION_CARE`, `MINION_ABILITIES`, `SPRITE_CACHE`, `EXPEDITION_MODEL`, `SOUL_WARDEN_MODEL`, `EXPEDITION_RULES`, `CRYPT_HOUND_MODEL`, `CRYPT_HOUND_RULES`, `SOUL_WARDEN_RULES`, `WAR_ACOLYTE_MODEL`, `WAR_ACOLYTE_RULES`, `SKILL_MASTERY_RULES`, `ENDGAME_MODEL`, `ENDGAME_MAP`, `ENDGAME_RULES`, `ENDGAME_SCREEN`. Também aplica ~30 `patch()` literais no motor |
| `node scripts/sync-skill-vfx.js` | `SKILL_VFX` ← `skill-vfx.js` |

Cada marcador aparece exatamente uma vez no HTML.

### Empacotadores que escrevem no HTML

Atualizam a linha `SPR.load('<chave>',…)` correspondente:

- `blender/scripts/pack_undead.py`, `pack_bone_shard.py`, `pack_crypt_hound.py`, `pack_soul_warden.py`, `pack_war_acolyte.py`.
- `blender/pack_village_npcs.py`, `pack_stylized_characters.py`, `pack_reference_characters.py`.

`blender/pack_village_environment.py` gera `assets/village/*` e `scripts/village-kit-data.js`.
`assets/characters/reference/catalog.js` (3,4 MB) é gerado por `blender/pack_reference_characters.py`.

## 5. Dependências externas

### Arquivos carregados pelo HTML

Todos versionados e lidos por caminho relativo (`file://` ou GitHub Pages):

| Recurso | Onde | Sem ele |
|---|---|---|
| `scripts/npc-dialogue.js` | `<script>` linha 950 | **`vilOpen` lança `ReferenceError: NpcDialogue is not defined`**: nenhum NPC abre |
| `scripts/game-ui.css` | `<link>` linha 951 | Estilos de interface ausentes |
| `scripts/village-kit-data.js`, `scripts/village-environment.js` | linhas 9905–9906 | Vila sem os assets Blender |
| `assets/village/*.webp` (17 + `ground.webp`) | carregados por `village-environment.js` | Idem |
| `assets/characters/reference/catalog.js` | linha 9907 | Sem personagens de referência |
| `scripts/character-visuals.js` | linha 9908 | Sem animações estilizadas dos NPCs |
| `assets/npc-portraits/<id>-painted.png` | `<img>` nos diálogos | Retrato quebrado |

Não há CDN, `fetch` nem `XMLHttpRequest`. Os sprites de combate, quadrinhos e
efeitos estão embutidos em base64.

### Ferramentas de desenvolvimento

| Ferramenta | Uso | No projeto? |
|---|---|---|
| Node.js | Testes, sincronizadores, `game_check.js`, `tools/combat-lab-server.js` | Necessário; sem `package.json` |
| Playwright + Chrome/Edge | `scripts/*-browser-check.js`. Usam canal `chrome`; `brute`, `crypt-hound`, `soul-warden` e `war-acolyte` usam `msedge` | Não instalado |
| Python + Pillow | Empacotadores em `blender/` | Não verificado nesta fase |
| Blender | Geração de modelos e quadros | Não executado nesta fase |

## 6. Problemas encontrados

Registrados, **não corrigidos**.

1. **Blocos divergentes das fontes.** Se o sincronizador rodar agora, ele sobrescreve as edições feitas direto no HTML.
   - `EQUIPMENT_RULES`, linha 258 do bloco, e `EXPEDITION_RULES`, linha 159: o HTML tem `offer.apply(this,arguments)`, as fontes têm `offer(id)`.
   - `SKILL_VFX`, linha 35: só um comentário de caminho; a fonte já usa `blender/scripts/render_bone_shard.py`.
2. **"Outro pedido" não pula a fala de ambiente.** `vilOpen(id,true)` deveria abrir o diálogo na fase `ready` (`NpcDialogue.mount(m,id,{questOnly})`). Porém o wrapper mais externo, `scripts/endgame.js:228`, chama `offer(id)` e descarta `questOnly`, então as edições do item 1 não têm efeito. Confirmado no navegador e por `npc-dialog-browser-check`.
3. **O HTML não é mais autocontido.** README e `AGENTS.md` afirmam que o jogo funciona abrindo só o HTML; na prática, o diálogo com NPCs depende de `scripts/npc-dialogue.js`.
4. **Falha de save silenciosa.** `saveGame()` usa `try{localStorage.setItem(...)}catch(e){}` e sempre mostra "💾 Salvo". `loadGame()` também regrava o save dentro de `try`. `importSaveText` já trata a falha de gravação.
5. **Testes de navegador não portáveis.** `defense-browser-check.js` importa o Playwright de `C:/Users/elton/...`. Os demais exigem Playwright instalado globalmente, e alguns exigem Edge.
6. **Quatro testes de navegador possivelmente desatualizados**, mais um inconclusivo (seção 3).
7. **`.gitignore` incompleto** para o pipeline dos NPCs na raiz de `blender/`, que também foge da estrutura definida em `blender/AGENTS.md`.
8. **Acoplamento por wrappers.** 135 reatribuições `const old=f; f=function…` no HTML e 119 em `scripts/`. As mais envolvidas: `killEnemy` (6), `tPause`, `spawnEnemy`, `enterHub`, `endWave`, `campNewChar` (4 cada), `vilOpen`, `loadGame`, `killMinion`, `gameOver`, `drawSprite`, `castDash` (3 cada). A ordem dos blocos define o comportamento.
9. **Sincronizadores frágeis.** Cerca de 70 trocas literais no motor e `replaceAll` de textos (`sync-skill-trees.js`). Elas falham com erro quando a âncora some, o que é bom, mas impedem editar esses trechos do motor livremente.
10. **Duplicações e estado global.** `buildSkillTree` é definido duas vezes no HTML; há 666 declarações `function`; 171 `getElementById`; 33 `setTimeout` e 2 `setInterval`; o HUD é atualizado no DOM a cada quadro.
11. **README desatualizado.** Cita 71 cenários e 105 casos; hoje são 76 e 117 na lista oficial.
12. **Repositório pesado.** `.git` com 1,1 GB, 5.212 objetos soltos e lixo (`tmp_obj`). `_to_delete/` tem 75 MB e `review/` 64 MB.

## 7. Limitações desta linha de base

- Navegador apenas headless: sem GPU real, áudio audível, controle, toque ou dispositivo móvel. Tempos e memória vêm de uma única execução e não são medidas de desempenho.
- O teste de fumaça usa funções do jogo para trocar de cena (`startGameReload`, `comicFinish`, `startEndless`, `vilOpen`, `saveGame`, `exportSave`, `importSaveText`). Movimento, ataque e a confirmação de importação usam entrada real.
- A campanha não foi jogada até o fim; chefes e fases são cobertos em parte por `game_check.js` e pelos testes de navegador.
- Blender, empacotadores Python e sincronizadores **não** foram executados, porque reescreveriam saídas.
- A publicação no GitHub Pages não foi verificada.
- `necromancer-game.html` e `necromancer-demo.html` não foram testados.

## 8. Comportamento a preservar

- **Abertura:** abrir `necromancer-canvas.html` por `file://`, sem servidor nem build, mostra a tela de título sem erros; `index.html` redireciona.
- **Fluxos:**
  - Modo Livre: quadrinho e depois vila.
  - Campanha: quadrinho e depois mapa.
  - Pedra do Infinito: estágios `expedition` e arena clássica.
  - Retorno ao hub.
  - Escolhidos por `sessionStorage['nr_start']` (`new`, `camp`, `continue`).
- **Controles:** tabela do [README](../README.md#como-jogar) e de [interface e saves](mecanicas/interface-e-saves.md#controles): WASD, clique e slots 1–6/Q E R T, `Shift`+clique direito, `C`/`Espaço`, `V`, `G`, `F1`–`F5`, `I`, `H`, `Esc` e o mapeamento do controle.
- **Saves:**
  - Chaves `necromancer_v2`, `necromancer_v2_before_skill_trees`, `necromancer_story` e `nr_opts`.
  - Migrações `migrateAbilitySave` → `migrateSummonSlots` → `skillMigrateSave`; campos de versão (`abilityVersion`, `summonSlotVersion`, `skillTreeVersion`, `skillMasteryVersion`, `equipmentVersion`).
  - Exportação `necromancer-save-nv<nível>-w<wave>.json` igual ao conteúdo salvo.
  - Importação com validação (`level`, `maxHp`, `learnedSkills`) e confirmação.
  - O save legado do nível 30 continua carregando. Hoje a migração deixa a barra em `raio, vazio, vazio, vazio, dash, vazio`, comportamento coberto por `game_check.js`.
- **Identificadores:**
  - IDs de habilidades, itens e tipos.
  - A **ordem** de `ENEMY_TYPES`, acessado por índice.
  - As 19 chaves de `SPR.load`.
  - Os nomes dos marcadores `*_BEGIN/*_END` e a âncora `const hasSave=bootGame();`.
  - A ordem de incorporação dos blocos, da qual os wrappers dependem.
- **Vila:**
  - Assets Blender da vila e coordenadas de NPCs e casas (conferidas por `village-environment-browser-check`).
  - Diálogos em fases (`ambient` → `ready`).
  - Retratos pintados e o ciclo de animação do Bram (respiração, retomada do martelo, descanso e transição).
- **Visual:** Canvas 2D, sprites, paleta e textos em português sem alteração.
- **Testes:** os 76 cenários, os 157 casos `node --test` aprovados e os 20 testes de navegador aprovados devem continuar aprovados.

## 9. Decisões em aberto

Estas dúvidas mudam o escopo das próximas fases e precisam de decisão do
responsável antes de serem executadas:

1. **Autocontido ou pasta distribuível?** O `AGENTS.md` exige um HTML autocontido, "sem requisições para buscar módulos e sprites". Já a Fase 3 do plano pede assets separados e carregamento assíncrono, e o jogo atual já depende de seis arquivos externos. Opções:
   - embutir os módulos externos pelo sincronizador;
   - adotar oficialmente "HTML + `scripts/` + `assets/`" e atualizar `AGENTS.md`/README;
   - manter os arquivos separados no desenvolvimento e gerar um build autocontido para distribuição.
2. **Qual versão de `vilOpen` vira a fonte?** Levar `offer.apply(this,arguments)` do HTML para `scripts/equipment.js` e `scripts/expedition.js` mantém o comportamento atual. Corrigir também `scripts/endgame.js:228` muda o comportamento (corrige o problema 2).
3. **Testes desatualizados ou regressões?** Decidir o caso de `equipment-browser-check` (vila antes do Ato I), `stylized-characters-browser-check` (Bram com 1 direção) e `undead-sprites-browser-check` (atlas de 1792 px).
4. **Pipeline dos NPCs em `blender/`:** mover para a estrutura organizada e ajustar o `.gitignore`, ou manter na raiz.

### Decididas em 26/10/2026

- **Item 1:** manter os arquivos separados no desenvolvimento e gerar um build autocontido para distribuição. O `AGENTS.md` e o README devem ser atualizados quando o build existir.
- **Item 2:** corrigir já na Fase 2 as três fontes (`scripts/equipment.js`, `scripts/expedition.js` e `scripts/endgame.js`) para repassar todos os argumentos de `vilOpen`. É uma mudança de comportamento intencional: "Outro pedido" passará a abrir o diálogo direto na fase `ready`, e `npc-dialog-browser-check` deve passar.

Os itens 3 e 4 continuam em aberto.
