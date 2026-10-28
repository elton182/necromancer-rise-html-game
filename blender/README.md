# Organização dos arquivos Blender

- `scripts/`: geração de modelos, renderização, empacotamento e módulos compartilhados.
- `models/`: cenas editáveis `.blend`.
- `exports/`: modelos `.glb` exportados.
- `spritesheets/`: atlas de sprites e metadados JSON.
- `frames/frames_<personagem>/`: quadros individuais de renderização.
- `previews/`: imagens de conferência.
- `backups/`: cópias de segurança `.blend1` existentes.
- `logs/`: registros de geração e renderização.

Execute os comandos abaixo a partir da raiz do projeto. Os scripts usam caminhos relativos à sua própria localização.

# Arqueiro morto-vivo e espectro

`models/mob_archer.blend` e `models/mob_specter.blend` contêm os modelos editáveis, rig e quatro
animações: `idle`, `walk`, `attack` e `death`. Os arquivos `.glb` incluem o rig e
as animações para reutilização. O arqueiro mantém a base óssea do guerreiro,
com olhos azuis, arco, aljava e manto de couro. O espectro usa um capuz azul,
rosto escuro, garras claras e uma mortalha flutuante sem pernas.

Os sprites usam contorno fino em azul acinzentado e sem linhas de quina internas.
O couro, o interior do tórax e as sombras do capuz usam tons médios para evitar
manchas pretas na escala de jogo.

Execute a partir da raiz do repositório, com Blender no PATH:

```powershell
blender --background --threads 4 --python blender/scripts/undead_ranged.py -- archer
blender --background --threads 4 --python blender/scripts/undead_ranged.py -- specter
blender --background --threads 4 --python blender/scripts/render_undead.py -- archer
blender --background --threads 4 --python blender/scripts/render_undead.py -- specter
python blender/scripts/pack_undead.py
node game_check.js
node scripts/undead-sprites-browser-check.js
```

O teste de navegador exige Playwright e Chrome. O empacotador usa Pillow no Python do sistema, monta os WebP e atualiza somente
os registros `SPR.load` dos dois personagens no HTML. O jogo continua independente
de arquivos externos. Os sprites seguem o padrão de células de 224 px, oito
direções, 56 pixels por unidade e âncora `(112, 165)`.

Para conferir uma imagem antes de renderizar todas as animações, acrescente
`preview` ao comando de `scripts/render_undead.py`. `previews/preview_undead.png` reúne seis poses
dos dois modelos após o empacotamento. As pastas `frames_*` e os logs são temporários.

# Estilhaço de osso (Tiro de Osso com Estilhaços)

`models/bone_shard.blend` / `.glb` contêm o osso partido usado pelos três projéteis do
Tiro de Osso quando o nó Estilhaços está ativo: uma saliência larga atrás, haste
marfim (`#f1e5c4`) e ponta partida em três lascas, com borda fina `#697b80`,
seguindo o guia em `docs/guia-visual-combate.md`.

```powershell
blender --background --threads 4 --python blender/scripts/bone_shard.py
blender --background --threads 4 --python blender/scripts/render_bone_shard.py
python blender/scripts/pack_bone_shard.py
node game_check.js
```

O projétil voa na altura do peito e a tela não tem perspectiva vertical, então o
osso é renderizado no plano da imagem: 16 direções de tela × 6 quadros de giro,
células de 96 px, 56 pixels por unidade e âncora no centro `(48, 48)`. O
empacotador grava `spritesheets/bone_shard_sheet.webp`, `previews/preview_bone_shard.png` e atualiza
somente o registro `SPR.load('boneShard', ...)` no HTML. `BoneBoltVFX.shard`
escolhe a direção mais próxima e gira o resto; sem o sheet, usa o osso desenhado
em escala menor. Acrescente `preview` ao render para gerar só o primeiro quadro
de cada direção. A pasta `frames_bone_shard` é temporária.


# Cão de Cripta

`scripts/crypt_hound.py` gera `models/mob_cryptHound.blend` e `.glb` com rig quadrúpede e sete ações: idle, walk, attack, windup, charge, recover e death. `scripts/render_crypt_hound.py` usa Cycles com cel shading em três faixas, contorno fino azul acinzentado e fundo transparente. O atlas mantém células de 224 px, oito direções, 56 px/u e âncora (112, 165). O empacotador valida os 272 quadros e incorpora o WebP ao HTML independente.

```powershell
blender --background --threads 4 --python blender/scripts/crypt_hound.py
blender --background --threads 4 --python blender/scripts/render_crypt_hound.py
python blender/scripts/pack_crypt_hound.py
node scripts/sync-equipment.js
node scripts/crypt-hound-browser-check.js
```

Se Blender não estiver no PATH, use o executável da instalação local. `previews/preview_crypt_hound.png` mostra todas as direções e as sete ações.

# Rei Caído — chefe único

Modelo e espada importados (`models/boss_fallenKing_v3_teste.blend`) com dez
ações recriadas por `scripts/animate_fallen_king_v4.py`: idle, walk, windup,
attack, recover, cast, death e o golpe saltado com as duas mãos (slam_windup,
slam, slam_recover). As pernas usam IK com o joelho sobre o pé, cada quadro é
travado no chão e o quadro de impacto fica registrado na ação (`attack` 5,
`slam` 14). O mesmo gerador realça a textura (saturação, contraste e brilho
ciano nas runas) e usa a transformação de cor Standard. O resultado é
`models/boss_fallenKing_v4.blend`; o relatório de contato fica em
`previews/fallen_king_v4_validation.json`.

```powershell
blender --background --python blender/scripts/animate_fallen_king_v4.py
blender --background --threads 4 --python blender/scripts/render_fallen_king_v4_review.py -- preview
blender --background --threads 4 --python blender/scripts/render_fallen_king_v4_review.py
python blender/scripts/pack_fallen_king_v4_review.py
blender --background --threads 4 --python blender/scripts/render_fallen_king.py -- preview
blender --background --threads 4 --python blender/scripts/render_fallen_king.py
python blender/scripts/pack_fallen_king.py
node scripts/sync-equipment.js
node --test scripts/fallen-king.test.js
node scripts/fallen-king-browser-check.js
```

Os GIFs de revisão (`previews/fallen_king_v4_*.gif`) usam câmera fixa por grupo
e sombra no chão só para conferir contato. Os sprites usam Cycles com os
materiais realçados da cena, não o toon compartilhado. O corpo é normalizado
para 2,25 u; os mestres têm 320 px, 56 px/u e âncora (160, 215). O
empacotador reduz para células de 256 px (44,8 px/u, âncora 128 / 172), valida
quadros vazios, cortados ou repetidos e grava dois atlas para respeitar o
limite de 16384 px: `fallenKing` (sete ações) e `fallenKingSlam` (golpe saltado,
mais uma cópia de idle exigida por `drawSprite`). `previews/preview_fallen_king.png`
mostra todas as ações nas oito direções.

# Carcereiro das Almas — boss das expedições

`scripts/soul_warden.py` constrói um chefe original com armadura, crânio coroado,
martelo de execução e jaula de almas. `models/boss_soulWarden.blend` é o modelo
editável; `exports/boss_soulWarden.glb` inclui rig e as sete ações: idle, walk,
windup, attack, cast, recover e death.

O braço do martelo tem cotovelo flexionado, punho estreito e dedos em torno
do cabo de madeira. A arma usa seu próprio osso `hammer`, filho de `handL`,
e descansa com a cabeça acima da mão. A mão direita fica livre, sem corrente pendurada.

```powershell
blender --background --threads 4 --python blender/scripts/soul_warden.py
blender --background --threads 4 --python blender/scripts/render_soul_warden.py
python blender/scripts/pack_soul_warden.py
node scripts/sync-equipment.js
node --test scripts/soul-warden.test.js
node scripts/soul-warden-browser-check.js
```

O render gera 320 quadros transparentes em oito direções, com validação contra
cortes em todas as poses. O empacotador reduz os mestres de 320 px a células
de 288 px (50,4 px/u, âncora 144 / 211,5), mantendo o atlas abaixo do limite
WebP de 16384 px, e incorpora o sprite ao HTML independente.
`previews/preview_soul_warden.png` reúne as sete ações e oito direções.

O chefe aparece ao final de cada expedição, com atributos escalados pela wave.
Suas regras ficam em `scripts/soul-warden-model.js` e `scripts/soul-warden.js`.

# Retratos de diálogo dos NPCs

`scripts/npc_portraits.py` cria quatro bustos exclusivos para as conversas: Bram (ferreiro
forte, avental de couro e martelo), Lysa (anciã de xale e cajado), Tilda (aldeã
jovem com tranças) e mercador (roupas verdes, medalhão e livro de contas).
Os modelos `models/npc_*.blend` incluem materiais, câmera e iluminação editáveis.
Não substituem os sprites dos personagens no mapa.

```sh
blender --background --threads 4 --python blender/scripts/npc_portraits.py
node game_check.js
node scripts/npc-dialog-browser-check.js
```

As imagens transparentes são gravadas em `assets/npc-portraits/`. Distribua essa
pasta junto do HTML. O teste de navegador usa Playwright e Chrome.

Os diálogos agora usam as versões `*-painted.png`, ilustrações medievais realistas
geradas com `image_gen`. Os bustos 3D permanecem como fontes editáveis da primeira
versão. Prompts e detalhes das imagens atuais: `assets/npc-portraits/README.md`.

# Moradores animados no mapa

`scripts/village_npcs.py` gera os quatro personagens de corpo inteiro em
`models/villager_<id>.blend` (`bram`, `lysa`, `tilda` e `merchant`), com esqueleto, materiais, câmera e ações `idle` e
`greet`. Os GLB incluem as animações. A roupa e os traços seguem os retratos:
camisa de linho, barba e avental no ferreiro; cabelos prateados, xale e cajado
na anciã; tranças e vestido vermelho em Tilda; casaco verde e livro no mercador.
As pinturas dos diálogos permanecem estáticas; as animações são dos NPCs no mapa.

```sh
blender -b -t 4 --python blender/scripts/village_npcs.py
python3 blender/scripts/pack_village_npcs.py
node scripts/npc-dialog-browser-check.js
node game_check.js
```

São 512 quadros transparentes: quatro moradores × duas ações × oito direções ×
oito quadros. O empacotador verifica movimento e recortes, grava os WebP e
substitui somente os registros existentes `smith`, `elder`, `tilda` e `merch`.
A ação `greet` ocupa a entrada `attack` do renderizador existente e aparece
quando o jogador se aproxima. `previews/preview_village_npcs.png` permite comparar as
poses. Acrescente `-- --preview` ao comando Blender para renderizar só a frente
de cada personagem; execute a renderização completa antes de empacotar.

Bram tem uma linha extra, `recover` (`frames/frames_villager_bram/03_*.png`), que liga o
descanso no martelo à respiração: os quadros reais do descanso em ordem inversa
(ele se endireita) e três poses pintadas em `examples/bram_recover_keys/` (ergue o
martelo, passa-o pela frente do avental e baixa-o ao lado da mão do repouso).
O jogo toca as poses pintadas também ao contrário antes do descanso, para pegar
o martelo. Para refazer:

```sh
python3 blender/scripts/bram_recover_frames.py
python3 blender/scripts/pack_village_npcs.py --only=bram
```

# Cenário modular da Vila de Eldrin

`scripts/village_environment.py` cria a cena editável `models/village_eldrin.blend`, com casas
modulares de madeira e reboco, telhados em volume com telhas, forja, poço,
banca, quadros de aviso, lanternas, árvores, flores, cercas e pavimento organizado.
`scripts/pack_village_environment.py` valida os renders e produz WebP e metadados para
o Canvas, preservando o layout e a posição das interações. A fonte usa câmera
elevada, luz ambiente, luz quente de janelas e lanternas e sombras suaves.

Instruções e detalhes: `assets/village/README.md`.

# Estilo atual dos personagens — referência low poly com contorno

A versão atual dos quatro NPCs e de Zephyr é gerada por
`scripts/stylized_characters.py`. Os arquivos `models/stylized_<id>.blend` (`bram`,
`lysa`, `tilda`, `merchant` e `zephyr`) incluem malhas facetadas, materiais foscos, câmera e
esqueleto. Os GLB incluem as ações: `idle` e `greet` nos moradores;
`idle`, `walk`, `cast` e `death` em Zephyr.

As proporções são mais robustas, com olhos pequenos, mãos largas, mangas
claras e avental escuro no ferreiro. Zephyr usa um capuz de abertura escura,
túnica violeta simples e cajado de madeira com ponta clara. O contorno escuro
é aplicado ao canal alfa no empacotamento, sem linhas internas excessivas.

```sh
blender -b -t 4 --python blender/scripts/stylized_characters.py
python3 blender/scripts/pack_stylized_characters.py
node scripts/stylized-characters-browser-check.js
node game_check.js
```

São 800 quadros em oito direções. O empacotador verifica todos os recortes e
as ações e substitui somente `necro`, `smith`, `elder`, `tilda` e `merch` no
HTML. `frames/frames_stylized_<id>/render.json` descreve os PNGs mestres;
`spritesheets/stylized_<id>_sheet.json` descreve os
WebP usados no jogo. Zephyr tem mestres maiores para acomodar a queda, mas
o atlas final mantém as dimensões originais de 2240 × 7168 e a escala no mapa.
As âncoras e os pixels por unidade são ajustados juntos na redução.

`previews/preview_stylized_characters.png` amplia três vistas dos cinco personagens.
`-- --preview` no Blender renderiza somente as vistas de inspeção; a execução
completa deve ocorrer antes do empacotamento. Os scripts e modelos anteriores
permanecem como histórico; use estes comandos para regenerar o visual atual.

## Reconstrução pela referência do ferreiro

A geometria atual é definida em `scripts/character_sculpt.py`, com seções de malha
modeladas para o peito, barriga, avental curvo, mangas bufantes, punhos, botas,
rosto, barba e mechas de cabelo. A renderização usa Cycles com materiais em
três faixas de luz, câmera de 32 graus e contorno aplicado no empacotamento.
Não usa mais o sombreamento de estúdio do Workbench para os personagens.

Os cinco `models/stylized_*.blend` são editáveis e os respectivos GLB mantêm os rigs e
as animações. Os GLB são exportados antes da conversão para materiais de render,
conservando suas cores de base em outros visualizadores. Os PNGs mestres dos
moradores usam 256 px; todos os atlas finais mantêm células de 224 px e a escala
física do jogo. Zephyr tem um capuz com abertura e forro em profundidade e uma
túnica contínua até o chão, com o cajado preso à mão.

No mapa, os moradores mantêm a orientação de três quartos; a saudação acontece
durante a conversa. A posição do jogador não os força a assumir um perfil fino.
O jogador conserva as oito direções para movimento e combate.

Inspeção rápida de um modelo:

```sh
blender -b -t 4 --python blender/scripts/stylized_characters.py -- --preview --only=bram
```

Depois de uma inspeção parcial, execute a geração completa antes de empacotar.
As capturas `review/stylized-characters-in-game.png` e
`review/stylized-characters-closeup.png` mostram os sprites integrados ao jogo;
`previews/preview_stylized_characters.png` amplia as vistas de inspeção. Os testes
verificam carregamento, rig/animações e comportamento; a avaliação de semelhança
artística é feita pelas imagens, separadamente desses testes funcionais.

## Lote 1 low-poly: zumbi, arqueiro inimigo e Bram

`scripts/lowpoly_cast.py` modela, cria rig e ações e renderiza os três personagens.
Ele grava `models/lowpoly_<id>.blend`, `exports/lowpoly_<id>.glb` e os quadros mestres
em `frames/lowpoly_<id>/`. `scripts/pack_lowpoly_cast.py` valida e empacota esses quadros:
- grava `spritesheets/lowpoly_<id>_sheet.webp/.json`, com os metadados de impacto no bloco `combat`;
- grava `spritesheets/lowpoly_validation.json` e a prancha `previews/lowpoly_lote1_comparison.png`;
- substitui somente os registros `zombie`, `earcher` e `smith`.

Execute na raiz:

```sh
blender -b -t 8 --python blender/scripts/lowpoly_cast.py -- --only=zombie,earcher,bram --preview
# Inspecionar frames/lowpoly_<id>_preview/ antes do lote completo.
blender -b -t 8 --python blender/scripts/lowpoly_cast.py -- --only=zombie,earcher,bram
python3 blender/scripts/pack_lowpoly_cast.py --only=zombie,earcher,bram
node game_check.js
node scripts/lowpoly-cast-browser-check.js
```

Contratos:
- Zumbi e arqueiro mantêm 224 px, 56 px/u e âncora (112, 165).
- Bram mantém a célula de 296 px e a altura na tela, com 96 px/u e âncora (148, 262), para caber em 8 direções.

O Bram ativo não vem mais deste lote: veja a seção seguinte. Rodar `pack_lowpoly_cast.py`
com `bram` grava `smith` e substitui o Bram 2.5D; use `--only=zombie,earcher`. Detalhes e pendências:
[`../docs/character-regeneration-review.md`](../docs/character-regeneration-review.md).

## Bram 2.5D a partir do atlas do usuário

`scripts/pack_bram_2_5d.py` fatia `spritesheets/bram_2_5d_source.png` (14 × 10 figuras, fundo
transparente) em 8 direções e grava `spritesheets/bram_2_5d_sheet.webp/.json` e
`previews/bram_2_5d_comparison.png`. Ele substitui somente o registro `smith`:

```sh
python3 blender/scripts/pack_bram_2_5d.py
node game_check.js
node scripts/cast-animations-browser-check.js
```

A tabela de vistas, o contrato (célula 144, 38 px/u, âncora (72, 124)) e o alinhamento estão em
[`../docs/character-regeneration-review.md`](../docs/character-regeneration-review.md#11-bram-a-partir-do-atlas-25d-do-usuário).
`pack_village_npcs.py`, `pack_reference_characters.py --only=bram` e `pack_lowpoly_cast.py --only=bram`
também gravam `smith` e desfazem este Bram.

## Elenco da referência: fluxo atual

A implementação atual de Zephyr, esqueletos e variantes propostas (o Bram ativo vem do atlas 2.5D, acima) está em
[`reference/README.md`](reference/README.md). Use `scripts/reference_characters.py` e
`scripts/pack_reference_characters.py` para regenerar esses personagens; os empacotadores
anteriores ficam como histórico e podem sobrescrever o visual atual.

### Bram conforme a referência enviada

`scripts/bram_reference.py` define a malha exclusiva do ferreiro: barba cinza, cabelo
castanho, camisa de linho com mangas dobradas, mãos expostas, braçadeiras,
avental longo com rebites e martelo de cabeça vertical. A geração atual usa
`reference_characters.py` com iluminação de estúdio para Bram e conserva as
animações de repouso, saudação e martelada em oito direções.

```sh
blender -b -t 4 --python blender/scripts/reference_characters.py -- --only=bram
python3 blender/scripts/pack_reference_characters.py --only=bram
```
## Cel shading compartilhado

Boss e Cão de Cripta usam `scripts/combat_toon.py`, baseado em `scripts/toon.py`: produto
normal/luz, rampa CONSTANT com três faixas (0,42 / 0,72 / 1), material emissivo
para preservar as cores e contorno Freestyle de 0,65 px sem linhas de quina.
O render usa Cycles; Workbench não avalia esse shader. Os `.blend` já são
salvos com os materiais em faixas e a visualização de materiais ativada.
O GLB mantém materiais PBR para interoperabilidade; a rede de shader do Blender
fica no `.blend` e no resultado renderizado dos sprites.

Acrescente `-- preview` ao render de qualquer um dos dois para conferir poses
de descanso, preparação, impacto e morte em três direções antes do render completo.

Novos backups automáticos criados pelo Blender podem aparecer ao lado das cenas em `models/`; os backups anteriores foram preservados em `backups/`.

# Acólito de Guerra

`blender/scripts/war_acolyte.py` gera `models/mob_warAcolyte.blend` e
`exports/mob_warAcolyte.glb`: sacerdote de túnica vermelha, estola marfim e cajado
solar, com rig e seis ações (`idle`, `walk`, `attack`, `windup`, `channel`, `death`).

Execute na raiz do projeto:

```powershell
blender --background --threads 4 --python blender/scripts/war_acolyte.py
blender --background --threads 4 --python blender/scripts/render_war_acolyte.py -- preview
# Conferir as poses antes do lote completo.
blender --background --threads 4 --python blender/scripts/render_war_acolyte.py
python blender/scripts/pack_war_acolyte.py
node scripts/sync-equipment.js
node --test scripts/war-acolyte.test.js
node scripts/war-acolyte-browser-check.js
node scripts/war-acolyte-visual-check.js
```

São 240 quadros em oito direções, com transparência e toon compartilhado. A câmera
ortográfica usa escala 4,8 para acomodar o cajado na morte: células de 224 px,
46,6667 px/u, âncora (112, 156,1667). O empacotador valida todos os quadros, cria
`spritesheets/warAcolyte_sheet.webp` e a prancha `previews/preview_war_acolyte.png`,
e incorpora somente esse asset no HTML. A mecânica fica em
`scripts/war-acolyte-model.js` e `scripts/war-acolyte.js` na raiz do repositório.
