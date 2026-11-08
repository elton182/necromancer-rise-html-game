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

# Kit modular da vila (v2, 3D)

`scripts/v2_village_kit.py` gera `models/v2_village_kit.blend` e `exports/v2_village_kit.glb`, registrado como
`villageKit` em `../v2/assets/models.json`. São quinze peças `kit_<nome>`, cada uma com origem no ponto de encaixe:

- **Paredes:** `bay_plain`, `bay_brace`, `bay_window` e `bay_door`. Módulo de 1 × 3 u com base de pedra, face externa em -Y.
- **Estrutura e telhado:** `corner`, `gable`, `roof` (telhas desencontradas), `roof_end` e `chimney`.
- **Mobiliário:** `lamp`, `fence_post`, `fence_rails`, `well`, `barrel` e `crate`.

`plaster` e `roof` são brancos, porque o jogo tinge cada casa pela cor da instância. A cor por vértice faz
uma oclusão falsa: pé das paredes e base das telhas mais escuros. Mudar medidas do módulo exige
conferir `v2/scripts/village-kit.mjs`, que monta as casas a partir dos colisores.

```powershell
blender --background --python blender/scripts/v2_village_kit.py
node v2/tools/build.cjs
```

`scripts/v2_map_kit.py` gera o catálogo do editor de mapas (`models/v2_map_kit.blend`, `exports/v2_map_kit.glb`, `mapKit`): 29 peças de água, relevo, acampamento, ruínas, natureza e povoado. As medidas seguem `PROPS` em `v2/scripts/map-model.mjs`, e o arco das pontes segue `groundAt` em `v2/scripts/map-terrain.mjs`. Use `blender --background --python blender/scripts/v2_map_kit.py` na raiz e depois `node v2/tools/build.cjs`.

`scripts/v2_fort_kit.py` gera o kit do forte e da gruta (`models/v2_fort_kit.blend`, `exports/v2_fort_kit.glb`, `fortKit`): muralha, torre, portaria, grade, torre de menagem, armeiro, boneco de treino, boca de caverna, teia, ninho de ovos e restos de presa. Reaproveita `v2_village_kit.py` e `v2_map_kit.py`. Uso: `blender --background --python blender/scripts/v2_fort_kit.py`.

`scripts/v2_nature_kit.py` segue o mesmo padrão e reaproveita `Piece` e os materiais de `v2_village_kit.py`.
Ele gera `models/v2_nature_kit.blend` e `exports/v2_nature_kit.glb` (`natureKit`) com seis peças:

- `oak`: altura de referência 5,5 u.
- `pine`: altura de referência 6 u.
- `bush`, `grass`, `flowers` e `rock`.

Folhagem, grama e pétalas são brancas, porque o jogo tinge cada instância. Só grama, hastes e pétalas têm dupla
face; os demais materiais usam backface culling.

```powershell
blender --background --python blender/scripts/v2_nature_kit.py
```

No Blender aberto, o script monta as peças sem exportar. Execute-o com `__name__ == '__main__'` e chame `export(build())`
para gravar o `.blend` e o `.glb`.

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

## Animações revisadas sem novo atlas (player e lacaios)

As ações abaixo foram refeitas nas fontes e nas cenas; os atlas do jogo ainda
usam os quadros anteriores até um novo render e empacotamento.

| Personagem | Fonte | Mudança |
|---|---|---|
| Player (mago com rig) | `scripts/render_imported_player.py` | `cast` em 8 quadros: recolhe a mão ao peito com o ombro recuado, dispara com a palma à frente, tronco girando e inclinando e cajado avançando, sustenta e volta |
| Zumbi | `scripts/lowpoly_cast.py` | `walk` em 8 quadros com perna direita arrastada, quadril lateral e tronco em contrarrotação; `attack` com garra direita cruzando o corpo a partir do quadro 0 (o dano cai no início do golpe) |
| Esqueleto e arqueiro | `scripts/combat_animation_clips.py` | `walk` em 8 quadros com quadril subindo na passagem, tronco girando contra as pernas, escudo em guarda e arco baixo; esqueleto ergue a espada e corta com passo à frente; arqueiro fica de perfil, mira com o arco no alvo e solta a corda |

Armas dos esqueletos (`scripts/reference_characters.py` + `combat_animation_clips.py`):
- Guerreiro: repouso, caminhada e ataque com o escudo em guarda, vertical e de frente diante
  do lado esquerdo do peito (antebraço por trás do disco). A espada reta não tem mais a inclinação
  lateral fixa; o pulso a mantém em pé no repouso e na caminhada, e o ataque parte e volta a essa pose.
- Arqueiro: o punho do arco fica na mão esquerda, com as pontas para trás e a corda do lado do
  corpo; o pulso mantém o arco vertical ao caminhar e ao mirar. A flecha está na mão da corda:
  na puxada completa (quadro 5 do ataque) vai da mão direita até o punho do arco; em repouso pende
  para trás. A corda é uma malha reta e não se curva com a puxada.

Regerar só cenas, ações e GLB, sem render:

```powershell
blender --background --python blender/scripts/render_imported_player.py -- rigged poses
blender --background --python blender/scripts/check_rigged_player.py
blender --background --python blender/scripts/lowpoly_cast.py -- --only=zombie --no-render
blender --background --python blender/scripts/reference_characters.py -- --only=skeleton,archer --no-render
```

`models/v2_abomination.blend` deriva de `lowpoly_zombie.blend` e herda as novas
ações do zumbi quando `scripts/v2_abomination.py` é executado de novo. O atlas `abom`
do jogo 2D não tem cena-fonte no repositório. No jogo, o esqueleto mostra só os
quadros 0–2 do ataque (`attackFrame`); com o novo corte, esses quadros são a preparação.

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

## Inimigos importados da v2

Seis modelos com rigs importados, ações próprias e equipamento separado incorporado ao personagem. Fontes, comandos, cena de revisão MCP e limitações em [notes/imported_enemies_v2.md](notes/imported_enemies_v2.md).

## Lich da Forma da Morte (v2)

Esqueleto de 65 ossos e foice fornecidos pelo usuário, com 16 clipes e a foice presa a um osso livre (`Scythe`). Gerar na raiz: `blender --background --python blender/scripts/lich.py` (saídas `models/v2_lich.blend`, `exports/v2_lich.glb`, `exports/v2_lich_scythe.glb`); depois rode `scripts/lich_dodge.py`, que acrescenta a esquiva (`dodge`) à cena e regrava o GLB; prévias com `preview_lich.py`. Notas, clipes e limitações em [notes/lich_v2.md](notes/lich_v2.md); desenho da mecânica em [../docs/v2-morte-lich.md](../docs/v2-morte-lich.md).

Escudo de Carne da v2: [fonte e integração](notes/flesh_shield_v2.md), gerado por `scripts/flesh_shield.py`.

Bran, o ferreiro (v2): `models/bran.blend` → `exports/bran.glb`, importado de `reference/bran/blacksmith.glb` por `scripts/bran.py`; detalhes em [notes/bran.md](notes/bran.md).

Cerco ao Ritual (v2): `scripts/siege_structures.py` usa `common.py` para gerar as cenas `models/siege_{core,bone,frost,plague,crypt}.blend` e os GLBs correspondentes em `exports/`, com rig e clipes `idle`/`attack`. Registro em `v2/assets/models.json`; após gerar, executar `node v2/tools/build.cjs` na raiz.

### Ruínas do pântano da v2

`blender/scripts/v2_swamp_kit.py` gera `models/v2_swamp_kit.blend` e `exports/v2_swamp_kit.glb`: três lápides de pedra quebrada (`kit_tomb_0..2`), com musgo e rebaixo. Execute na raiz: `blender --background --python blender/scripts/v2_swamp_kit.py`, depois `node v2/tools/build.cjs`. Reutiliza os helpers do kit da vila.

Kit arquitetônico da cripta: `blender --background --python blender/scripts/v2_crypt_architecture.py` gera `models/v2_crypt_architecture.blend` e `exports/v2_crypt_architecture.glb`. Módulo `kit_crypt_wall`: 4 m de largura, 8 m de parede, vitral em mosaico e pilares laterais; base na origem.

O gerador `v2_crypt_architecture.py` também produz `crypt_floor` (48 × 40 m), `sarcophagus` (aberto a leste), `crypt_bench`, `crypt_altar` e `crypt_shelf`. Os móveis e o piso são decorativos no editor; paredes conservam colisão.

`crypt_column` no kit arquitetônico: coluna de 6 m com base de raio 0,86 m, capitel e fuste segmentado. O runtime escala para as medidas do colisor.

`v2_ruined_village_kit.py` gera a variante degradada do kit original em `models/v2_ruined_village_kit.blend` e `exports/v2_ruined_village_kit.glb`, incluindo `boarding`. Execute com Blender em modo background. `v2_crypt_architecture.py` inclui também `torch` (tocha estática de madeira e ferro).


## Kit da abertura ARANDU

Fonte: `scripts/arandu_caravan_kit.py`. Gera `models/arandu_caravan_kit.blend` e `exports/arandu_caravan_kit.glb`, registro `caravanKit` na v2. Contém carroça coberta, estandarte e flecha de cena; peças estáticas `kit_caravan_cart`, `kit_bandit_banner`, `kit_story_arrow`. Usa os materiais e utilitários do kit da vila. Executar com Blender em background e depois `node v2/tools/build.cjs` na raiz. Conferência no jogo em `review/v2/arandu-prologue/`; o kit estático original é complementado pelo cavalo e pelas rodas independentes descritos abaixo.


### Viagem inicial do ARANDU

O kit da caravana também inclui `kit_caravan_open` (corte aberto para leitura), `kit_caravan_wheel` (rodas independentes) e `kit_road_block`. A movimentação de suas instâncias é ligada à distância da viagem. `scripts/arandu_caravan_horse.py` gera `models/arandu_caravan_horse.blend` e `exports/arandu_caravan_horse.glb`: cavalo low-poly com rig e ações `idle`/`walk` de 1 s; registro `caravanHorse` na v2. Executar esse script em Blender separado/background para não alterar uma cena de trabalho; a execução também pode ser acionada pelo MCP, preservando a cena aberta. Evidências no jogo: `review/v2/arandu-travel/`.


### Acabamento da carroça

O gerador `scripts/arandu_caravan_kit.py` passou a produzir rodas vazadas de oito raios, aro de madeira com cinta de ferro, chassi reforçado, tábuas de cores alternadas, rebites, faixa vinho, bancos laterais, apoio do cocheiro, lanternas e bagagem presa ao suporte traseiro. A variante coberta usa lona curva facetada com costuras. Origens, nomes de peças e raio de roda de 0,65 u foram mantidos para o movimento existente; o kit permanece único e embutido na v2. Exportação acionada pelo MCP em processo separado, preservando a cena aberta. Build e conferência no Edge em `review/v2/arandu-travel/`, incluindo 390 px e a versão coberta no encontro.


## Queda na caverna do ARANDU

- `scripts/arandu_cave_fall.py`: gera `models/arandu_cave_fall.blend` e `exports/arandu_cave_fall.glb`, com `kit_pit_rim`, `kit_pit_shaft` e `kit_collapse_chunk`; registro `caveFallKit` na v2. Adereços estáticos movimentados pelo tempo da cena.
- `scripts/arandu_necromancer_fall.py`: executar com `blender --background blender/models/v2_necromancer.blend --python blender/scripts/arandu_necromancer_fall.py`. Gera `models/arandu_necromancer_fall.blend` e `exports/arandu_necromancer_fall.glb`, com animação própria `fall` (1,5 s, 24 FPS), sem alterar o necromante original. Registro `necromancerFalling` na v2.

Os dois GLBs são incorporados pelo build normal. Abertura, paredes e fragmentos foram conferidos no Edge; evidências em `review/v2/arandu-prologue/`. As exportações foram acionadas pelo MCP em processos separados; a cena aberta permaneceu intacta. O movimento vertical do personagem e da câmera é governado pelo runtime, e não pelo deslocamento global do rig.


## Esconderijo dos salteadores

Na raiz do repositório, `blender --background --python blender/scripts/arandu_cave_hideout.py` gera `blender/models/arandu_cave_hideout.blend` e `blender/exports/arandu_cave_hideout.glb`. Peças: `kit_hideout_table`, `kit_hideout_cargo`, `kit_hideout_bedroll`, `kit_cave_support` e `kit_cave_spire`. Registro `caveHideoutKit` em `v2/assets/models.json`; incorporar com `node v2/tools/build.cjs`. A exportação foi acionada via MCP em processo separado, preservando a cena aberta do usuário. Conferência no jogo em `review/v2/arandu-cave-story/`.

## Necromante jogável: material e repintura (v2)

Desde 2026-11-07, `scripts/v2_necromancer_look.py` define o visual de `models/v2_necromancer.blend` / `exports/v2_necromancer.glb`. O material de emissão herdado do Tripo (textura inteira no canal emissivo) deixava o necromante sem luz no toon do jogo e destoando do guerreiro. Agora:

- os dois materiais (corpo e cajado) são Principled, com a textura na cor base e um mapa de brilho próprio na emissão;
- a textura é repintada a partir da original: robe violeta saturado para violeta dessaturado, ouro da fivela para marfim, e couro e madeira um pouco menos saturados;
- olhos, gema da fivela e cristal do cajado passam ao verde-água da energia dos ossos (`#8bd4bd`) e são os únicos emissivos. As três regiões são localizadas pela geometria, porque o atlas é fragmentado demais para separá-las só pela cor.

A paleta já desconta o reforço de saturação (×1,8) e de brilho (×1,18) que o toon do jogo aplica ao mapa de cor. A textura original fica no `.blend` com fake user e o script sempre parte dela, então pode ser executado de novo. As imagens são exportadas em JPEG, como as originais.

```powershell
blender --background blender/models/v2_necromancer.blend --python blender/scripts/v2_necromancer_look.py
blender --background blender/models/v2_necromancer.blend --python blender/scripts/arandu_necromancer_fall.py
node v2/tools/build.cjs
node v2/tests/necromancer-look-browser-check.cjs
```

`v2_necromancer_motion.py` aplica o mesmo script antes de exportar, então regerar os clipes mantém a repintura. Comparação antes da mudança: `review/v2/comparacao-necromante-guerreiro/`. Resultado no jogo: `review/v2/necromancer-look/`.

## Guerreiro jogável

`models/warrior.blend` e `exports/warrior.glb`, gerados por `scripts/warrior_motion.py` a partir de `reference/warrior/warrior_source.glb`. Equipamentos vinculados às mãos, três cortes, estocada e golpe de escudo; [integração](../docs/v2-guerreiro.md). Geração desta entrega realizada via MCP.

### Fonte atual do Guerreiro após edição manual

A fonte atual é `models/warrior.blend`, com os três cortes editados pelo usuário. Para atualizar o jogo, execute `scripts/warrior_export_manual.py` na sessão Blender via MCP e depois `node v2/tools/build.cjs`. O gerador `warrior_motion.py` é a base procedural histórica e não deve substituir automaticamente essa cena manual. O exportador publica apenas as onze trilhas do personagem e não inclui Action Stash. A esquiva (`dodge`) é acrescentada à cena por `scripts/warrior_dodge.py`, sem alterar as demais ações; rode na sessão Blender via MCP ou com `blender --background blender/models/warrior.blend --python blender/scripts/warrior_dodge.py`, e publique com `scripts/warrior_equipment_export.py` (com outro arquivo aberto na sessão, ou fora dela). O passo lateral (`strafe_left`, `strafe_right`) é acrescentado à cena por `scripts/warrior_strafe.py`, sem alterar as demais ações: `blender --background blender/models/warrior.blend --python blender/scripts/warrior_strafe.py`. A passada do `walk` (2,2 u por ciclo, com breve fase no ar) vem de `scripts/warrior_walk_stride.py`, executado do mesmo modo, que troca só pernas e altura do quadril e preserva tronco e braços.

Desde 2026-11-06, `walk`, `slash_1`, `slash_2` e `slash_3` são gerados por `scripts/warrior_fluid_motion.py`, que substitui só as chaves dessas quatro ações na cena aberta. Os cortes autorais anteriores ficam em `backups/warrior_before_fluid_motion_original_20261104.blend`. A versão com passos e mais torção do tronco nos cortes substituiu a primeira; a anterior ficou em `backups/warrior_before_body_motion_20261106_193824.blend`. No dicionário `COMBO`, as chaves opcionais `left_step`/`right_step` deslocam a planta de cada pé e `hip_roll` tomba a bacia. Para rodá-lo na sessão via MCP: `exec(compile(open(p).read(), p, 'exec'), {'__file__': p})`; para regerar só parte dos clipes, passe `ONLY` (por exemplo `['walk']`) e `SAVE=False` nesse dicionário. Depois, publique com `warrior_export_manual.py`. Como o exportador não lê o próprio arquivo aberto, conclua com `blender --background --factory-startup --python blender/scripts/warrior_equipment_export.py`.

O exportador manual chama também `scripts/warrior_equipment_export.py`: gera a máscara de escudo no personagem e `exports/warrior_shield.glb`, usado no arremesso. Esse segundo script pode ser executado sozinho via MCP para reexportar a cena salva, usando cópias temporárias e preservando a cena ativa. A fonte editável do escudo continua dentro de `models/warrior.blend`.

### Tornado para edição manual

A cena `models/warrior.blend` inclui também a ação `tornado`, frames 1–25 a 30 fps, criada por `scripts/warrior_tornado.py` via MCP. Palma para baixo, braço à frente do peito e apoios alternados. Ela está selecionada no Pose Mode para ajuste do usuário; os clipes publicados no GLB e o jogo continuam os anteriores até a integração. Os exportadores preservam a ação na cena, mas não a publicam no GLB. [Notas de edição e validação](notes/warrior_tornado.md).

## Druida jogável (v2)

`scripts/flora_game_motion.py` acrescenta os clipes de jogo a `models/flora_druid.blend` (`cast`, `cast_up`, `slam`, `dodge`) e a `models/flora_werewolf.blend` (`claw_1`, `claw_2`, `leap`, `howl`, `dodge`) e exporta `exports/flora_druid.glb` e `exports/flora_werewolf.glb`. Deve rodar pelo MCP com o `.blend` aberto na sessão. É aditivo: preserva `idle`, `walk`, `attack` e `death` do estudo e faz backup antes de salvar. Notas em `notes/FLORA-PROTOTYPE.md`; regras em `../docs/v2-druida.md`.

## Arqueira e Mercenário jogáveis (v2)

`scripts/ranged_heroes.py` gera `models/archer_hero.blend` / `exports/archer_hero.glb` e `models/mercenary.blend` / `exports/mercenary.glb` a partir das fontes Tripo em `reference/archer_hero/` e `reference/mercenary/` (personagem com rig Mixamo + prancha com as armas). Recorta a arma da prancha, prende-a à mão com peso rígido e cria `idle`, `walk`, `strafe_left`, `strafe_right`, `shoot`, `dodge` e `death`, mais `shoot_up` e `leap_back` (Arqueira) e `throw` e `plant` (Mercenário). O falcão da Arqueira vem de `reference/falcon/falcon_source.glb` por `scripts/falcon.py` (`models/falcon.blend`, `exports/falcon.glb`; clipes `idle` = batida de asas, `glide` e `dive`): `blender --background --python blender/scripts/falcon.py`. Uso: `blender --background --python blender/scripts/ranged_heroes.py -- archer` (ou `mercenary`); pelo MCP, sobre um arquivo vazio, com `HERO` definido no namespace. Prancha de revisão: `scripts/ranged_heroes_review.py`. [Integração](../docs/v2-arqueira-mercenario.md).

## Mago jogável (v2)

`scripts/mage_hero.py` corrige os pesos do rig Tripo de `reference/mage/mage_source.glb` (cajado rígido na mão direita, chapéu, rosto e barba na cabeça, luvas nas mãos, barra do manto entre quadril e coxas) e gera `models/mage_hero.blend` / `exports/mage_hero.glb` com `idle`, `walk`, `strafe_left`, `strafe_right`, `cast`, `cast_up`, `dodge` e `death`. Uso: `blender --background --python blender/scripts/mage_hero.py`. Pranchas em `previews/mage_hero_*`. [Integração](../docs/v2-mago.md).

## Moldura dos orbes do HUD (v2)

Fonte: `examples/hud_orb_frame_tripo.glb`, relevo do HUD inteiro gerado no Tripo a partir da referência visual, fornecido pelo usuário. O script separa só as peças de bronze em volta de cada orbe (35 à esquerda, 36 à direita) e descarta as esferas com texto pintado, a bandeira vermelha e a poção. Cada lado é renderizado de frente, em câmera ortográfica, Eevee, fundo transparente e luz própria; o lado direito é a peça espelhada do próprio relevo, não um espelhamento da imagem, então a luz fica coerente nos dois orbes.

```powershell
blender --background --python blender/scripts/hud_orb_frame.py   # frames/hud_orb_frame/{left,right}.png e models/hud_orb_frame.blend
python blender/scripts/pack_hud_orb_frame.py                     # assets/hud/orb-frame-{left,right}.webp e orb-frame.json
node v2/tools/build.cjs
```

O empacotador descarta lascas soltas, mede o furo do aro pela borda do bronze (ajuste de círculo na metade de cima), apaga o miolo e a parede interna cinza, corta a margem e grava WebP de 560 px (~35 KB cada). `orb-frame.json` traz centro e raio do furo; os números de largura e deslocamento em `v2/scripts/hud-ornate.css` vêm dele e precisam ser atualizados se o render mudar. Conferência: `previews/hud_orb_frame_check.png` e `review/v2/hud-ornate/`.
# Druida — modelos atuais fornecidos pelo usuário

Os IDs `druid` e `druidWolf` da v2 usam `exports/flora_tripo_druid.glb` e
`exports/flora_tripo_wolf.glb`. Fontes editáveis em `models/flora_tripo_*.blend`;
GLBs de origem em `reference/flora-tripo/`. O gerador `scripts/flora_tripo_motion.py`
cria cenas próprias e exporta os clipes exigidos pelo jogo. Executar via MCP com
`__file__` definido; depois, na raiz, `node v2/tools/build.cjs`.
Os modelos e geradores anteriores da Flora foram preservados como estudo.


Flora humana atual: models/flora_tripo_druid_t.blend e exports/flora_tripo_druid_t.glb, derivados de reference/flora-tripo/druid-t-source.glb. O gerador scripts/flora_tripo_motion.py adapta a pose T às ações e cria o cajado separado. A forma de lobo continua flora_tripo_wolf. Bases humanas anteriores preservadas.
