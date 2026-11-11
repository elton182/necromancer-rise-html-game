# v2 — jogo oficial

A v2 usa Three.js local e modelos GLB animados do Blender. A entrada [../index.html](../index.html) e [index.html](index.html) abrem [necromancer-3d.html](necromancer-3d.html), distribuição autocontida para Edge ou Chrome com WebGL 2.

O estado do jogo, os modos disponíveis e os comandos estão no [README principal](../README.md). Consulte o [índice dos guias atuais](../docs/README.md) para regras, controles e limites por sistema. A v1 está em [../v1/](../v1/README.md).

Novo Jogo inicia ARANDU e oferece seis classes com personagens nomeados e saves separados. A base antiga do Ato I, treino e Vila de Eldrin continua em fluxos próprios. Na praça de Jacarandá, **G** abre os serviços dos NPCs: Arena/Expedições, Conquista e Cerco. O chefe das Expedições ainda é o Rei Caído provisório.

## Fontes e responsabilidades

| Fonte | Responsabilidade |
| --- | --- |
| `scripts/training-model.mjs` | Simulação, entidades, combate e relógio; sem DOM ou Three.js |
| `scripts/renderer.mjs` | Modelos, câmera, animações, efeitos visuais, qualidade e descarte de recursos |
| `scripts/locomotion.mjs` | Mistura da passada do jogador (`walk`, `strafe_left`, `strafe_right`) conforme o deslocamento em relação à mira, e giro do corpo na esquiva; só visual |
| `scripts/input.mjs` | Eventos traduzidos em ações e limpeza de entradas |
| `scripts/terrain.mjs` | Dados da cena, varredura de colisões com índice por setores, caixas giradas, limites e navegação no chão |
| `scripts/forest-map.mjs`, `forest-scene.mjs` | Mapa da Floresta de Eldrin (fase 2): colisores/decoração e visual procedural |
| `scripts/outpost-map.mjs`, `outpost-scene.mjs`, `camp-parts.mjs` | Mapa do Posto do Capitão (fase 4) e peças de acampamento compartilhadas |
| `scripts/trail-map.mjs`, `trail-scene.mjs` | Mapa da Trilha dos Vigias (fase 3): faixa, clareiras, barricadas e acampamento procedurais |
| `scripts/crypt-map.mjs`, `crypt-scene.mjs` | Mapa da Cripta Esquecida (fase 1): paredes, pilares, portões e decoração procedural |
| `scripts/village-map.mjs`, `village-scene.mjs`, `village-kit.mjs`, `village-ground.mjs`, `painted-ground.mjs`, `nature-kit.mjs`, `scenery-fx.mjs` | Mapa da Vila de Eldrin: casas, ruas, praça e mobiliário com colisão; casas montadas com o kit do Blender (`villageKit`), vegetação do `natureKit`, chão pintado em textura gerada (a mesma grama e terra batida em todos os mapas abertos via `painted-ground.mjs`), vento na folhagem e transparência pontilhada contra oclusão ([guia](../docs/v2-acabamento-visual.md)) |
| `scripts/gamepad.mjs` | Amostragem pura de sticks, deadzone e botões do controle padrão |
| `scripts/app.mjs` | Inicialização, ligação entre módulos, painel e relógio |
| `scripts/session.mjs` | Menu, treino, campanha, morte e separação do estado persistido |
| `scripts/save-model.mjs` | Contrato versionado, importação preservada e armazenamento injetável |
| `scripts/audio.mjs` | Efeitos e música procedurais em Web Audio, portados do jogo anterior; trilhas em arquivo por tema (`tracks`); volume, mudo e preferência do aparelho |
| `scripts/sound-events.mjs` | Lê o mundo a cada quadro e decide sons e trilha; as regras de combate não conhecem o áudio |
| `scripts/game.css` | Apresentação da interface |
| `scripts/map-model.mjs`, `map-editor.mjs`, `map-preview.mjs`, `map-panel.mjs`, `map-play.mjs`, `maps.css` | Editor de mapas: formato, catálogo e estilo, herança de mapa base, biblioteca, editor 2D com pré-visualização 3D, aba Mapas e lançamento do mapa ([guia](../docs/v2-mapas.md)) |
| `scripts/map-terrain.mjs`, `terrain-scene.mjs` | Relevo, água, rios e superfícies: regras de deslocamento, colisão e dano; desenho da água e assentamento do cenário |
| `scripts/area-tuning.mjs` | Ritmo da campanha: níveis graduais, grupos pequenos, patrulhas nas rotas e reforços limitados, sem respawn por relógio |
| `scripts/world-relief.mjs`, `tools/world-relief.cjs` | Relevo e regiões do mundo de Jacarandá; a ferramenta mescla o relevo na edição publicada |
| `scripts/expedition-biomes.mjs` | Cenário das Expedições e da Conquista por bioma, no formato dos mapas do editor: relevo, água, lugares, estilo de luz. Veja [v2-expedicoes.md](../docs/v2-expedicoes.md#cenário-por-bioma) |
| `scripts/itauna-model.mjs`, `itauna-map.mjs`, `area-scene.mjs` | Várzea de Itaúna: passagens entre mapas, plantas da várzea, do forte e da gruta, grade e anéis. Veja [v2-itauna.md](../docs/v2-itauna.md) |
| `scripts/nilo-model.mjs`, `nilo-quest.mjs` | O rastro de João e a carta: resgate, bolsa e provas no forte, entrega a Helena e convite final em Itavera; etapas, falas, prêmios e compatibilidade de saves. Veja [v2-itauna.md](../docs/v2-itauna.md#o-rastro-de-joão-e-a-carta-10112026) |
| `scripts/quest-model.mjs`, `quest-journal.mjs` | Ofertas dos NPCs (!), entregas (?), etapas aceitas no HUD e diário do inventário com missões em aberto e concluídas; histórico derivado dos estados da campanha |
| `scripts/itavera-map.mjs` | Praça de recepção das guildas em Itavera, com kits GLB existentes; encerramento do Ato I e retorno a Jacarandá |
| `scripts/map-spawns.mjs` | Grupos de inimigos dos mapas: composição, gatilho, ondas e retorno |
| `scripts/map-handles.mjs` | Seleção por raio e alças de edição no 3D, sem desenho |
| `scripts/scene-sectors.mjs` | Divide famílias grandes de instâncias por região, para a câmera descartar o que está fora da tela |
| `scripts/campaign-maps.mjs`, `assets/maps/` | Edições dos mapas da campanha: gravadas pelo editor em arquivos, embutidas pelo build e lidas ao abrir cada cena |
| `map-editor.html`, `tools/map-editor-server.cjs`, `scripts/map-editor-app.mjs`, `map-disk-store.mjs` | Cliente do editor de mapas, só para desenvolvimento: `node v2/tools/map-editor-server.cjs` ([guia](../docs/v2-mapas.md#cliente-do-editor)) |
| `scripts/lab-model.mjs`, `lab.mjs`, `lab-panel.mjs`, `lab.css` | Laboratório: medidor de DPS, boneco de treino, visualizador de animações e painel ([guia](../docs/v2-laboratorio.md)) |
| `scripts/journey-model.mjs` | Resumo de cada jornada salva para Suas jornadas: classe, atributos, XP, local de retomada, tempo de jogo e horda exibida no palco; a tela fica em `title.mjs` e as cenas 3D (palco e retratos) em `title-preview.mjs`. Verificação: `node v2/tests/journeys-browser-check.cjs` |
| `scripts/loading.mjs`, `scripts/loading.css` | Tela de carregamento: a marcação `#loading` fica no template e aparece antes dos módulos, sobre a arte `assets/title/arandu-loading.webp` (brasão, título e moldura da barra já desenhados; o build a embute no lugar de `ARANDU_LOADING`). O módulo preenche a barra, a porcentagem, o rótulo e as dicas e some quando a arena está pronta. Verificação: `node v2/tests/loading-browser-check.cjs` |
| `scripts/save.css` | Menu, prévia de importação e ferramentas de save |
| `scripts/combat.mjs` | Dano comum, Tiro de Osso, mana, Dash e morte |
| `scripts/horde.mjs` | Grupos, comandos, recuperação e persistência dos integrantes |
| `scripts/grimoire.mjs` | Investimento, maestrias e sincronização de atributos |
| `scripts/spells.mjs` | Cinco magias, áreas, Muralha e limpeza |
| `scripts/progression.mjs`, `rewards.mjs`, `drops.mjs` | Atributos, XP, crédito único, drops e coleta |
| `scripts/gear.mjs`, `consumables.mjs` | Mochila, equipamento, mercador e consumíveis |
| `scripts/gear-panel.mjs`, `inventory-preview.mjs`, `inventory.css` | Aba de inventário: mochila, ficha da peça, modelo 3D da classe com os slots e atributos ([guia](../docs/v2-interface.md#equipamentos)) |
| `scripts/character-panel.mjs`, `character-stats.mjs`, `character.css` | Aba Personagem: modelo 3D, origem dos atributos, resumo com Poder de Combate e XP ([guia](../docs/v2-interface.md#personagem)) |
| `scripts/class-registry.mjs`, `scripts/class-gear.mjs` | Registro das classes jogáveis (nome, modelo, recurso, brasão, catálogo) e catálogo de equipamento por classe ([guia](../docs/v2-arqueira-mercenario.md#registro-de-classes)) |
| `scripts/marksman-equipment.mjs` | Catálogo da Arqueira e do Mercenário: Arco ou Besta da classe mais as peças marciais, arma inicial |
| `scripts/marksman-model.mjs`, `scripts/marksman.mjs` | Arqueira, Mercenário e Mago ([guia do Mago](../docs/v2-mago.md)): atributos, catálogo restrito, tiros com projétil (alguns teleguiados), Recuo, Chuva de Flechas, bombas, redes, minas, armadilhas, fogo e o falcão da Arqueira com Impacto Celeste e Penas Voadoras ([guia](../docs/v2-arqueira-mercenario.md)) |
| `scripts/skill-tree.mjs`, `scripts/skill-tree-data.mjs` (gerado), `tools/skill-tree-source.cjs` | Árvores do Guerreiro, da Druida e dos atiradores lidas de [docs/habilidades/arvores.json](../docs/habilidades/README.md): nós jogáveis, ramos e posição no painel; regras comuns de investimento |
| `scripts/skill-synergy.mjs` | Sinergias por pontos investidos entre habilidades do mesmo ramo, usadas pelo combate e painel; [regras](../docs/habilidades/sinergias.md) |
| `scripts/skill-loadout.mjs` | Barra montável dos atiradores e da forma humana da Druida (`character.skillLoadout`) |
| `scripts/companions.mjs`, `scripts/horde.mjs` | Golem de Gelo temporário fora da horda; Cães Zumbis, Cérbero e Esqueletos Magos permanentes na horda, com reanimação e save. Arte provisória com tinta e escala sobre modelos existentes ([Grimório](../docs/v2-grimorio.md#nós-exclusivos-da-v2-vindos-do-arquivo-08112026)) |
| `scripts/druid-model.mjs`, `scripts/druid.mjs` | Druida: árvore, atributos e formas; magias de raio e plantas, garras e Salto do lobo ([guia](../docs/v2-druida.md)) |
| `scripts/talents-panel.mjs`, `talents.css` | Árvores de talentos do Guerreiro, da Druida, da Arqueira e do Mercenário: ramos, selos, pré-requisitos e detalhe ([guia](../docs/v2-interface.md#treinamento-do-guerreiro)) |
| `scripts/enemies.mjs`, `fallen-king.mjs` | Arquétipos, projéteis hostis e Rei Caído |
| `scripts/enemy-tactics.mjs` | IA tática dos inimigos: papéis (frente, flanco, distância), vagas de ataque e leque de atiradores; só decide o posicionamento |
| `scripts/campaign-model.mjs` | Progresso, desbloqueios e prêmios únicos |
| `scripts/campaign.mjs`, `campaign-panel.mjs` | Cenas, encontros, vila, mapa e histórias |
| `tools/*-source.cjs`, `scripts/shared-*.mjs` | Adaptação e cópias geradas das fontes canônicas |
| `assets/models.json` | Fontes dos modelos incorporados, altura visual, clipes exigidos e durações |
| `assets/music.json` | Trilhas em arquivo embutidas no HTML (hoje, a da tela inicial), com título e caminho do MP3 |
| `assets/build-manifest.json` | Caminhos e hashes das entradas utilizadas no último empacotamento |
| `tools/template.html` | Documento fonte da distribuição |
| `tools/build.cjs` | Empacota módulos e modelos, verifica recursos e gera o HTML |
| `tests/` | Regras isoladas e verificação do navegador |

Edite as fontes, depois empacote; não edite somente `necromancer-3d.html`.
O empacotamento usa apenas Node nativo. Os ES modules são incorporados como
dados e resolvidos por um import map interno. A simulação usa x/y no chão;
o renderizador converte para x/z do Three.js. Altura visual fica separada.

O catálogo de modelos é embutido com gzip sem perdas e restaurado pelo
`DecompressionStream` nativo antes de iniciar o jogo. Edge/Chrome atualizado
continua abrindo o HTML sozinho, offline; nenhum GLB precisa ser baixado.
O build informa o tamanho final e impede gerar uma distribuição com 100 MiB
ou mais, limite por arquivo do GitHub. O upload pelo site tem limite de
25 MiB; para este HTML, use Git pelo terminal ou GitHub Desktop.
Veja os [limites do GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
Verifique a integridade dos modelos com `node --test v2/tests/distribution.test.mjs`.

Se uma tentativa anterior de push incluiu um HTML acima de 100 MiB, apenas
adicionar outro commit menor não remove o arquivo grande do histórico a enviar.
O commit local que incluiu esse arquivo precisa ser corrigido antes de repetir
o push. Preserve as demais mudanças locais ao preparar essa correção.

Fontes canônicas compartilhadas nesta etapa:

- Three.js 0.180.0 e utilitários em `../tools/3d-lab/vendor/`, com licença MIT
  também distribuída em [assets/three-license.txt](assets/three-license.txt).
- Cenas e GLBs em `../blender/`, conforme o manifesto. O player e boss usam
  cópias animadas exportadas por `../blender/scripts/export_3d_lab.py`.
- Modelos de regras do jogo em `../scripts/` e `../build-simulator/` continuam
  canônicos e são compartilhados com a simulação da V2.

O laboratório e o HTML antigo continuam com suas próprias fontes. A v2 não
executa seus sincronizadores. A entrada principal da raiz abre a distribuição da v2.

## Empacotar e verificar

Execute na raiz do repositório:

```powershell
npm run build
npm run test:v2
npm run check:legacy
npm run check:browser
```

O build gera `necromancer-3d.html`, os módulos extraídos e `assets/build-manifest.json`. Não edite os gerados. Módulos novos entram na tabela `modules` de `tools/build.cjs`; GLBs entram em `assets/models.json`. Modelos devem conter os clipes exigidos e não depender de imagens ou buffers externos.

As regras compartilhadas ainda são extraídas de `../v1/necromancer-canvas.html`, `../scripts/` e `../build-simulator/`. Os adaptadores `tools/*-source.cjs` registram essa integração. O Three.js vem de `../tools/3d-lab/vendor/`.

Para um sistema isolado: `node --test v2/tests/<sistema>.test.mjs`. Os checks `v2/tests/*-browser-check.cjs` exigem Playwright e o navegador indicado no arquivo; usam armazenamento isolado e gravam evidências em `../review/v2/`. `npm run check:browser` usa Edge.

Para conferir a entrada oficial e a v1 por HTTP e arquivo local: `node v2/tests/version-entry-browser-check.cjs`. As evidências ficam em `review/v2/version-organization/`.

## Limites e referências

O balanceamento ainda exige partidas completas. Testes controlados, poses e simulações não comprovam toda a campanha, desempenho em outras máquinas ou controle físico. Consulte os limites de cada guia antes de declarar uma entrega validada.

- [Abertura e campanha ARANDU](../docs/v2-prologo-arandu.md)
- [Classes e árvores de habilidades](../docs/habilidades/README.md)
- [Saves e importação da v1](../docs/v2-saves.md)
- [Editor de mapas](../docs/v2-mapas.md)
- [Modelos e animações](../blender/README.md)

O antigo plano de migração foi preservado como [registro histórico](../review/v2/migracao/plano-migracao.md), pois continha anotações locais. Não é a especificação da versão oficial.
