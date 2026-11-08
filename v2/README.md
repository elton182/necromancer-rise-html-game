# Necromancer’s Rise — v2

**ARANDU — nova abertura:** Novo Jogo cria um personagem nomeado, com seleção de Necromante, Guerreiro, Druida, Arqueira, Mercenário ou Mago e saves separados. A campanha nova começa na caravana e segue por emboscada, caverna, mensageiro e defesa de Jacarandá. [Fluxo, fontes, saves e limitações](../docs/v2-prologo-arandu.md). Os resumos E9/E10 abaixo preservam o histórico da base e dos modos existentes.


**A v2 é o jogo principal do projeto.** A versão Canvas 2D (`../necromancer-canvas.html`) é legada: novidades vão para cá e o build lê as regras compartilhadas dela (`node v2/tools/build.cjs`, na raiz). Convenções de trabalho em [../AGENTS.md](../AGENTS.md).

Estado: **E10 concluída no fluxo funcional — Arena clássica (E10a), Expedições (E10b) e Conquista de Valdoria (E10c)**, com Rei Caído provisório como boss, sobre o Ato I, a vila e as missões da E9.
Próximo passo: acabamento (E11), HQs e tela de mapa da campanha. Cenário básico; acabamento visual em E11.
O [plano de migração](plano-migracao.md) registra critérios e ponto de retomada.

## Abrir

Abra [index.html](index.html) no Edge ou Chrome com WebGL 2 habilitado.
A distribuição [necromancer-3d.html](necromancer-3d.html) também pode ser aberta
diretamente ou copiada sozinha para outra pasta. Não precisa de servidor,
instalação, internet ou biblioteca externa durante a execução.

WASD/setas movem, o mouse mira, clique/1 lança Tiro de Osso e C usa o Dash,
a roda ajusta o zoom e Esc pausa/retoma. Perda de foco pausa a simulação.
O painel permite reiniciar, alternar o chão, sombras e quantidade de aliados.

A V2 tem combate, horda, Grimório, magias, progressão e equipamentos compartilhados
com as fontes atuais. A campanha do Ato I e a Vila de Eldrin estão disponíveis.
A Arena Infinita (clássica) abre pela Pedra do Infinito na vila: veja [Arena Infinita](../docs/v2-arena.md).
As [Expedições](../docs/v2-expedicoes.md) abrem pela mesma aba (boss provisório). A [Conquista de Valdoria](../docs/v2-conquista.md) abre pela aba Valdoria. O treino permanece separado e não substitui esses modos.

Em **Personagem e saves**, salve/exporte a v2 ou importe o JSON do jogo anterior
com prévia e confirmação. O arquivo antigo é preservado inteiro; nível, XP, ouro,
equipamentos e consumíveis são aplicados. Campanha antiga, árvore e maestrias
permanecem arquivadas. A chave antiga não é sobrescrita. Consulte
o [contrato de saves e cenas](../docs/v2-saves.md) para formato e limitações.

Portal (Necromantic Threshold), início de onda (Warning Signal) e subida de nível (Crowned in Bone)
usam WAVs em `assets/audio/`; a cripta usa `crypt-of-stone.mp3` (Crypt of Stone), em loop.
A Vila de Eldrin usa Autumn Keep (`assets/audio/autumn-keep.mp3`), em loop.
O catálogo `assets/music.json` distingue efeitos (`kind: "sfx"`) de músicas. Todos são embutidos
no HTML; efeitos são pré-decodificados no primeiro gesto e mantêm fallback procedural em caso de falha.
Os demais efeitos e trilhas são gerados em tempo real: 17 efeitos e 10 trilhas (título, mapa, vila, cripta,
floresta, trilha, chefe, campo, história e menu). A tela inicial toca “The Shadow’s Oath”
(`assets/audio/the-shadows-oath.mp3`, em loop, embutida em base64 no HTML); se o arquivo não
decodificar, volta à trilha procedural `title`. O navegador só libera o áudio após o primeiro clique
ou tecla. Volume, música e mudo ficam em **Opções** na tela inicial e são guardados à parte do save,
na chave `necromancer_v2_audio`. A trilha abaixa durante a pausa e a aba em segundo plano silencia.

A arena agora tem paredes e pilares com colisão, navegação de atores e
visualização opcional dos colisores. A mira acompanha o mouse mesmo quando
a câmera se move. Controle padrão: stick esquerdo move, direito mira, A/RT
lança magia e Start pausa. Veja [movimento da v2](../docs/v2-movimento.md).

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
| `scripts/area-tuning.mjs` | Nível por área e densidade dos encontros da campanha integrada (dobro de integrantes, triplo de ondas, renascimento) |
| `scripts/world-relief.mjs`, `tools/world-relief.cjs` | Relevo e regiões do mundo de Jacarandá; a ferramenta mescla o relevo na edição publicada |
| `scripts/itauna-model.mjs`, `itauna-map.mjs`, `area-scene.mjs` | Várzea de Itaúna: passagens entre mapas, plantas da várzea, do forte e da gruta, grade e anéis. Veja [v2-itauna.md](../docs/v2-itauna.md) |
| `scripts/nilo-model.mjs`, `nilo-quest.mjs` | O rastro de João: missão de Marta que liga Jacarandá, várzea, gruta e forte; etapas, pontos, falas e prêmios. Veja [v2-itauna.md](../docs/v2-itauna.md#o-rastro-de-joão) |
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
| `scripts/marksman-model.mjs`, `scripts/marksman.mjs` | Arqueira, Mercenário e Mago ([guia do Mago](../docs/v2-mago.md)): árvores, atributos, catálogo restrito, tiros com projétil, Recuo, Chuva de Flechas, bombas, minas, fogo e o falcão da Arqueira ([guia](../docs/v2-arqueira-mercenario.md)) |
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
executa seus sincronizadores nem altera a entrada principal do projeto.

## Empacotar e verificar

Comandos a partir da raiz do repositório:

```powershell
npm install
npm run build
npm run test:v2
npm run check:browser
npm run check:legacy
```

`npm run test:v2` usa `tools/run-tests.cjs`, que funciona igual no Node 20 e no 22;
para um sistema só, rode `node --test v2/tests/<sistema>.test.mjs`.

O teste de navegador requer Edge instalado e o Playwright, instalado por
`npm install` como dependência de desenvolvimento; ele não é dependência do produto.
O check antigo valida a versão anterior, não substitui os testes da v2.

O empacotamento falha se um modelo não tiver os clipes exigidos ou depender de
imagens/buffers externos. O navegador mostra mensagens para indisponibilidade
de WebGL e erro de carregamento. Recursos visuais são compartilhados entre
clones e liberados quando a arena é encerrada; reinícios removem os clones e
efeitos antigos sem descartar as geometrias compartilhadas.

## Validação da E1

Executados em 28/10/2026: sete testes da simulação, teste no Edge headless e
`game_check.js` com 76 cenários aprovados. Capturas inspecionadas em 1440×900,
fundo claro/escuro, grupo e 64 aliados na qualidade baixa.

Evidências em [review/v2/e1](../review/v2/e1/):

- [Resultado do navegador](../review/v2/e1/browser-result.json)
- [Testes da simulação](../review/v2/e1/model-tests.log)
- [Regressão do jogo atual](../review/v2/e1/game-check.log)
- [Fundo escuro](../review/v2/e1/dark.png)
- [Horda e qualidade baixa](../review/v2/e1/light-horde-low.png)
- [Diagnóstico de WebGL](../review/v2/e1/webgl-failure.png)

## Validação da E2

Executados em 28/10/2026: 18 testes da simulação/sessão/saves, teste no Edge
headless e regressão do jogo atual com 76 cenários aprovados. A verificação dessa
etapa foi registrada em [review/v2/e2](../review/v2/e2/), preservando a E1.
Inclui prévia/cancelamento, importação/exportação integral de um save fictício,
backup, reload, chave antiga intacta, JSON inválido, quota e acesso bloqueado.
Também verifica menu, morte, reinício e descarte de efeitos pendentes.

- [Resultado do navegador](../review/v2/e2/browser-result.json)
- [Testes de regras e saves](../review/v2/e2/model-tests.log)
- [Regressão do jogo atual](../review/v2/e2/game-check.log)
- [Menu](../review/v2/e2/menu.png)
- [Prévia da importação](../review/v2/e2/import-preview.png)

## Validação da E3

Executados em 28/10/2026: 27 testes de regras/colisão/saves, checks de movimento
e regressão no Edge headless e `game_check.js` com 76 cenários aprovados.
Capturas inspecionadas em zoom próximo e nos fundos claro/escuro com grupo/horda.
O check geral agora grava na E3; evidências anteriores permanecem disponíveis.

- [Movimento e controle](../review/v2/e3/movement-result.json)
- [Regressão de saves e cenas](../review/v2/e3/browser-result.json)
- [Testes de regras](../review/v2/e3/model-tests.log)
- [Regressão do jogo atual](../review/v2/e3/game-check.log)
- [Zoom próximo e colisores](../review/v2/e3/movement-close.png)
- [Horda com obstáculos na qualidade baixa](../review/v2/e3/terrain-horde-low.png)

O controle foi simulado via Gamepad API; falta conferência com hardware físico.
Separação entre integrantes da horda e geometria de cada mapa continuam em E5/E9.

Limites históricos da E3: os sistemas posteriores estão descritos abaixo.
A validação automatizada continua sem equivaler a benchmark em outras máquinas.

## Atualizar modelos revisados

O HTML contém cópias dos GLBs. Depois de exportar os modelos, execute
`node v2/tools/build.cjs` na raiz e recarregue a página. Para o player, exporte
a cena atual sem regenerá-la:
`blender --background blender/models/rigged_player.blend --python blender/scripts/v2_necromancer_motion.py`
(refaz idle, walk, strafe, cast, death e dodge, grava `blender/models/v2_necromancer.blend` e
`blender/exports/v2_necromancer.glb`; o `rigged_player.blend` não é alterado). O material e a repintura vêm de
`blender/scripts/v2_necromancer_look.py`, aplicado pelo script de movimento antes da exportação ou sozinho sobre
`v2_necromancer.blend`; depois regenere a queda do prólogo com `arandu_necromancer_fall.py`.
O laboratório antigo usa `node tools/3d-lab/build.cjs`.

Player, esqueleto, arqueiro, zumbi e Abominação têm conferências em
[review/v2/model-revision](../review/v2/model-revision/). Clipes adicionais, como
reação a dano e ataques secundários, dependem de acionamento no motor. As fontes
atuais constam em `assets/models.json`; consulte também o
[plano dos modelos de inimigos](../docs/plano-modelos-inimigos-v2.md).

## Combate — E4

Tiro de Osso, Dash, mana e dano comum usam as regras atuais. A defesa, barreiras,
proteção do Dash, morte e crédito de abate passam pelo mesmo caminho. Parâmetros
são extraídos das fontes; equipamentos compartilham o modelo canônico. Veja
[combate da V2](../docs/v2-combate.md). Verificação: `node --test v2/tests/combat.test.mjs`
e `node v2/tests/combat-browser-check.cjs`. Evidências em [review/v2/e4](../review/v2/e4/).

## Horda — E5

Cinco tipos, grupos, seis slots, comandos, recuperação e persistência. Use
**Preparar e comandar a horda** para equipar grupos ou a build de teste de nível 24.
O perfil de teste substitui o nível em memória; salvar depois grava esse perfil.
`Shift + botão direito` ordena e **V** reanima. A região define o alcance dos grupos.
Veja [horda](../docs/v2-horda.md), `node --test v2/tests/horde.test.mjs` e
`node v2/tests/horde-browser-check.cjs`. Evidências em [review/v2/e5](../review/v2/e5/).

## Grimório e maestrias — E6a

O Grimório permite investir/devolver pontos e distribuir maestrias. Os cálculos
compartilham BuildModel, equipamentos e maestrias. Abates somam XP às habilidades
equipadas antes do XP do personagem; o crédito acontece uma vez. A edição exige
preparação no menu, mapa ou vila. Veja [Grimório](../docs/v2-grimorio.md).
Verificação: `node --test v2/tests/grimoire.test.mjs` e
`node v2/tests/grimoire-browser-check.cjs`. Evidências históricas em
[review/v2/e6a](../review/v2/e6a/) e [review/v2/e6b](../review/v2/e6b/).

## Magias — E6b

Use **Usar build de teste de magias** no menu para equipar Chuva de Ossos,
Explosão Necrótica, Muralha de Corpos, Escudo de Carne, Maldição da Fraqueza e Dash.
Troque Dash por Zumbis para testar o sacrifício do Escudo. A mira usa o chão real.
Lançamentos inválidos não cobram mana; morte, menu e reinício limpam os efeitos.
Parâmetros vêm de `tools/spell-source.cjs`; veja [magias](../docs/v2-magias.md).
Verificação: `node --test v2/tests/spells.test.mjs` e
`node v2/tests/spells-browser-check.cjs`. Evidências em [review/v2/e6b](../review/v2/e6b/).

## Progressão, equipamentos e loot — E7

Abates pagam XP, ouro, orbes e equipamentos uma vez por inimigo. Nível, árvore e
itens determinam atributos do personagem e da horda. **I** abre mochila de 60,
comparação, filtro, mercador e venda no menu/vila. **F1–F5** usam consumíveis.
O campo **Nível dos itens do treino** vale para o laboratório; campanha e missões
usam a fase/dificuldade. Veja [progressão](../docs/v2-progressao.md).
Verificação: `node --test v2/tests/progression.test.mjs v2/tests/gear.test.mjs`,
`node v2/tests/progression-browser-check.cjs` e `node v2/tests/gear-browser-check.cjs`.
Evidências em [review/v2/e7](../review/v2/e7/).

## Inimigos — E8

**Encontro de treino** escolhe composição e escala (1–60). Cão no quarto encontro;
acólito e elites a partir do sexto. Os seis tipos canônicos têm seus especiais.
O Rei usa corte, salto, fase 2 e invocação. Projéteis respeitam sólidos e Muralha.
Regras e limites em [inimigos](../docs/v2-inimigos.md). Verificação:
`node --test v2/tests/enemies.test.mjs` e `node v2/tests/enemies-browser-check.cjs`.
Evidências em [review/v2/e8](../review/v2/e8/).

## Campanha e Vila de Eldrin — E9

Na tela inicial, use **Campanha · Ato I**. Complete as quatro fases para liberar a
vila; aproxime-se de moradores e mercador e pressione **G**. **Continuar** restaura
mapa/vila com o campo limpo. Regras, adaptações e limites em
[campanha da V2](../docs/v2-campanha.md). O cenário é funcional, com paredes baixas
e NPCs existentes; casas, decoração e quadrinhos completos ficam para E11.

Verificação: `node --test v2/tests/campaign.test.mjs` e
`node v2/tests/campaign-browser-check.cjs` (Playwright/Edge). Evidências em
[review/v2/e9](../review/v2/e9/). O percurso controlado verifica prêmios e
transições; não equivale a validar a dificuldade de uma partida completa.

## Interface e HUD

Tela inicial com arte (Continuar, Nova campanha, Modo livre, Opções, Créditos, Sair), HUD e menu "Relicário" (Esc) portados do jogo atual: frascos, seis slots, minimapa,
barra do chefe e cinco abas (Personagem, Habilidades, Horda, Equipamentos, Sistema).
Fonte do estilo: `tools/ui-source.cjs` (gera `scripts/shared-hud.css`); a camada ornamentada da v2 (bronze, molduras SVG, orbes em garras, minimapa circular) fica em `scripts/hud-ornate.css`; lógica em
`scripts/game-ui.mjs`. Detalhes e limites em [interface da V2](../docs/v2-interface.md).

Verificação: `node v2/tests/ui-browser-check.cjs` e `node v2/tests/title-browser-check.cjs` (Playwright/Edge); evidências em
[review/v2/ui](../review/v2/ui/). Os demais checks de navegador acionam os controles
movidos para dentro do Relicário por `tests/legacy-controls.cjs`.

O **Cerco ao Ritual** abre pelo painel da Vila de Eldrin após o Ato I: oito ondas, quatro torres, runas e vinte graus de endgame. Veja [o guia do cerco](../docs/v2-cerco.md).

## Druida (Flora)

Novo personagem oferece também a Druida: Faísca, Corrente de Raios, Raízes, Tempestade e Rejuvenescer na forma humana; F transforma em lobisomem, com Garras, Salto Feroz e Uivo. Consulte [regras e limites](../docs/v2-druida.md). Verificação: `node --test v2/tests/druid.test.mjs` e `node v2/tests/druid-browser-check.cjs`.

## Guerreiro / Soldado

Novo Jogo também oferece Guerreiro, com três cortes, estocada, golpe de escudo e passivas. Consulte [regras e limites](../docs/v2-guerreiro.md).
