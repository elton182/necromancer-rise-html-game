# Arqueiro morto-vivo e espectro

`mob_archer.blend` e `mob_specter.blend` contêm os modelos editáveis, rig e quatro
animações: `idle`, `walk`, `attack` e `death`. Os arquivos `.glb` incluem o rig e
as animações para reutilização. O arqueiro mantém a base óssea do guerreiro,
com olhos azuis, arco, aljava e manto de couro. O espectro usa um capuz azul,
rosto escuro, garras claras e uma mortalha flutuante sem pernas.

Os sprites usam contorno fino em azul acinzentado e sem linhas de quina internas.
O couro, o interior do tórax e as sombras do capuz usam tons médios para evitar
manchas pretas na escala de jogo.

Execute a partir da raiz do repositório, com Blender no PATH:

```powershell
blender --background --threads 4 --python blender/undead_ranged.py -- archer
blender --background --threads 4 --python blender/undead_ranged.py -- specter
blender --background --threads 4 --python blender/render_undead.py -- archer
blender --background --threads 4 --python blender/render_undead.py -- specter
python blender/pack_undead.py
node game_check.js
node scripts/undead-sprites-browser-check.js
```

O teste de navegador exige Playwright e Chrome. O empacotador usa Pillow no Python do sistema, monta os WebP e atualiza somente
os registros `SPR.load` dos dois personagens no HTML. O jogo continua independente
de arquivos externos. Os sprites seguem o padrão de células de 224 px, oito
direções, 56 pixels por unidade e âncora `(112, 165)`.

Para conferir uma imagem antes de renderizar todas as animações, acrescente
`preview` ao comando de `render_undead.py`. `preview_undead.png` reúne seis poses
dos dois modelos após o empacotamento. As pastas `frames_*` e os logs são temporários.

# Estilhaço de osso (Tiro de Osso com Estilhaços)

`bone_shard.blend` / `.glb` contêm o osso partido usado pelos três projéteis do
Tiro de Osso quando o nó Estilhaços está ativo: uma saliência larga atrás, haste
marfim (`#f1e5c4`) e ponta partida em três lascas, com borda fina `#697b80`,
seguindo o guia em `docs/guia-visual-combate.md`.

```powershell
blender --background --threads 4 --python blender/bone_shard.py
blender --background --threads 4 --python blender/render_bone_shard.py
python blender/pack_bone_shard.py
node game_check.js
```

O projétil voa na altura do peito e a tela não tem perspectiva vertical, então o
osso é renderizado no plano da imagem: 16 direções de tela × 6 quadros de giro,
células de 96 px, 56 pixels por unidade e âncora no centro `(48, 48)`. O
empacotador grava `bone_shard_sheet.webp`, `preview_bone_shard.png` e atualiza
somente o registro `SPR.load('boneShard', ...)` no HTML. `BoneBoltVFX.shard`
escolhe a direção mais próxima e gira o resto; sem o sheet, usa o osso desenhado
em escala menor. Acrescente `preview` ao render para gerar só o primeiro quadro
de cada direção. A pasta `frames_bone_shard` é temporária.


# Cão de Cripta

`crypt_hound.py` gera `mob_cryptHound.blend` e `.glb` com rig quadrúpede e sete ações: idle, walk, attack, windup, charge, recover e death. `render_crypt_hound.py` usa o renderizador de estúdio do Blender, materiais do modelo, contorno cinza e fundo transparente. O atlas mantém células de 224 px, oito direções, 56 px/u e âncora (112, 165). O empacotador valida os 272 quadros e incorpora o WebP ao HTML independente.

```powershell
blender --background --threads 4 --python blender/crypt_hound.py
blender --background --threads 4 --python blender/render_crypt_hound.py
python blender/pack_crypt_hound.py
node scripts/sync-equipment.js
node scripts/crypt-hound-browser-check.js
```

Se Blender não estiver no PATH, use o executável da instalação local. `preview_crypt_hound.png` mostra todas as direções e as sete ações.

# Carcereiro das Almas — boss das expedições

`soul_warden.py` constrói um chefe original com armadura, crânio coroado,
martelo de execução e jaula de almas. `boss_soulWarden.blend` é o modelo
editável; `boss_soulWarden.glb` inclui rig e as sete ações: idle, walk,
windup, attack, cast, recover e death.

```powershell
blender --background --threads 4 --python blender/soul_warden.py
blender --background --threads 4 --python blender/render_soul_warden.py
python blender/pack_soul_warden.py
node scripts/sync-equipment.js
node --test scripts/soul-warden.test.js
node scripts/soul-warden-browser-check.js
```

O render gera 320 quadros transparentes em oito direções, com validação contra
cortes em todas as poses. O empacotador reduz os mestres de 320 px a células
de 288 px (50,4 px/u, âncora 144 / 211,5), mantendo o atlas abaixo do limite
WebP de 16384 px, e incorpora o sprite ao HTML independente.
`preview_soul_warden.png` reúne as sete ações e oito direções.

O chefe aparece ao final de cada expedição, com atributos escalados pela wave.
Suas regras ficam em `scripts/soul-warden-model.js` e `scripts/soul-warden.js`.

# Retratos de diálogo dos NPCs

`npc_portraits.py` cria quatro bustos exclusivos para as conversas: Bram (ferreiro
forte, avental de couro e martelo), Lysa (anciã de xale e cajado), Tilda (aldeã
jovem com tranças) e mercador (roupas verdes, medalhão e livro de contas).
Os modelos `npc_*.blend` incluem materiais, câmera e iluminação editáveis.
Não substituem os sprites dos personagens no mapa.

```sh
blender --background --threads 4 --python blender/npc_portraits.py
node game_check.js
node scripts/npc-dialog-browser-check.js
```

As imagens transparentes são gravadas em `assets/npc-portraits/`. Distribua essa
pasta junto do HTML. O teste de navegador usa Playwright e Chrome.

Os diálogos agora usam as versões `*-painted.png`, ilustrações medievais realistas
geradas com `image_gen`. Os bustos 3D permanecem como fontes editáveis da primeira
versão. Prompts e detalhes das imagens atuais: `assets/npc-portraits/README.md`.

# Moradores animados no mapa

`village_npcs.py` gera os quatro personagens de corpo inteiro em
`villager_bram.blend`, `villager_lysa.blend`, `villager_tilda.blend` e
`villager_merchant.blend`, com esqueleto, materiais, câmera e ações `idle` e
`greet`. Os GLB incluem as animações. A roupa e os traços seguem os retratos:
camisa de linho, barba e avental no ferreiro; cabelos prateados, xale e cajado
na anciã; tranças e vestido vermelho em Tilda; casaco verde e livro no mercador.
As pinturas dos diálogos permanecem estáticas; as animações são dos NPCs no mapa.

```sh
blender -b -t 4 --python blender/village_npcs.py
python3 blender/pack_village_npcs.py
node scripts/npc-dialog-browser-check.js
node game_check.js
```

São 512 quadros transparentes: quatro moradores × duas ações × oito direções ×
oito quadros. O empacotador verifica movimento e recortes, grava os WebP e
substitui somente os registros existentes `smith`, `elder`, `tilda` e `merch`.
A ação `greet` ocupa a entrada `attack` do renderizador existente e aparece
quando o jogador se aproxima. `preview_village_npcs.png` permite comparar as
poses. Acrescente `-- --preview` ao comando Blender para renderizar só a frente
de cada personagem; execute a renderização completa antes de empacotar.

Bram tem uma linha extra, `recover` (`frames_villager_bram/03_*.png`), que liga o
descanso no martelo à respiração: os quadros reais do descanso em ordem inversa
(ele se endireita) e três poses pintadas em `bram_recover_keys/` (ergue o
martelo, passa-o pela frente do avental e baixa-o ao lado da mão do repouso).
O jogo toca as poses pintadas também ao contrário antes do descanso, para pegar
o martelo. Para refazer:

```sh
python3 blender/bram_recover_frames.py
python3 blender/pack_village_npcs.py --only=bram
```

# Cenário modular da Vila de Eldrin

`village_environment.py` cria a cena editável `village_eldrin.blend`, com casas
modulares de madeira e reboco, telhados em volume com telhas, forja, poço,
banca, quadros de aviso, lanternas, árvores, flores, cercas e pavimento organizado.
`pack_village_environment.py` valida os renders e produz WebP e metadados para
o Canvas, preservando o layout e a posição das interações. A fonte usa câmera
elevada, luz ambiente, luz quente de janelas e lanternas e sombras suaves.

Instruções e detalhes: `assets/village/README.md`.

# Estilo atual dos personagens — referência low poly com contorno

A versão atual dos quatro NPCs e de Zephyr é gerada por
`stylized_characters.py`. Os arquivos `stylized_bram.blend`,
`stylized_lysa.blend`, `stylized_tilda.blend`, `stylized_merchant.blend` e
`stylized_zephyr.blend` incluem malhas facetadas, materiais foscos, câmera e
esqueleto. Os GLB incluem as ações: `idle` e `greet` nos moradores;
`idle`, `walk`, `cast` e `death` em Zephyr.

As proporções são mais robustas, com olhos pequenos, mãos largas, mangas
claras e avental escuro no ferreiro. Zephyr usa um capuz de abertura escura,
túnica violeta simples e cajado de madeira com ponta clara. O contorno escuro
é aplicado ao canal alfa no empacotamento, sem linhas internas excessivas.

```sh
blender -b -t 4 --python blender/stylized_characters.py
python3 blender/pack_stylized_characters.py
node scripts/stylized-characters-browser-check.js
node game_check.js
```

São 800 quadros em oito direções. O empacotador verifica todos os recortes e
as ações e substitui somente `necro`, `smith`, `elder`, `tilda` e `merch` no
HTML. `*_render.json` descreve os PNGs mestres; `*_sheet.json` descreve os
WebP usados no jogo. Zephyr tem mestres maiores para acomodar a queda, mas
o atlas final mantém as dimensões originais de 2240 × 7168 e a escala no mapa.
As âncoras e os pixels por unidade são ajustados juntos na redução.

`preview_stylized_characters.png` amplia três vistas dos cinco personagens.
`-- --preview` no Blender renderiza somente as vistas de inspeção; a execução
completa deve ocorrer antes do empacotamento. Os scripts e modelos anteriores
permanecem como histórico; use estes comandos para regenerar o visual atual.

## Reconstrução pela referência do ferreiro

A geometria atual é definida em `character_sculpt.py`, com seções de malha
modeladas para o peito, barriga, avental curvo, mangas bufantes, punhos, botas,
rosto, barba e mechas de cabelo. A renderização usa Cycles com materiais em
três faixas de luz, câmera de 32 graus e contorno aplicado no empacotamento.
Não usa mais o sombreamento de estúdio do Workbench para os personagens.

Os cinco `stylized_*.blend` são editáveis e os respectivos GLB mantêm os rigs e
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
blender -b -t 4 --python blender/stylized_characters.py -- --preview --only=bram
```

Depois de uma inspeção parcial, execute a geração completa antes de empacotar.
As capturas `review/stylized-characters-in-game.png` e
`review/stylized-characters-closeup.png` mostram os sprites integrados ao jogo;
`preview_stylized_characters.png` amplia as vistas de inspeção. Os testes
verificam carregamento, rig/animações e comportamento; a avaliação de semelhança
artística é feita pelas imagens, separadamente desses testes funcionais.

## Elenco da referência: fluxo atual

A implementação atual de Bram, Zephyr, esqueletos e variantes propostas está em
[`reference/README.md`](reference/README.md). Use `reference_characters.py` e
`pack_reference_characters.py` para regenerar esses personagens; os empacotadores
anteriores ficam como histórico e podem sobrescrever o visual atual.

### Bram conforme a referência enviada

`bram_reference.py` define a malha exclusiva do ferreiro: barba cinza, cabelo
castanho, camisa de linho com mangas dobradas, mãos expostas, braçadeiras,
avental longo com rebites e martelo de cabeça vertical. A geração atual usa
`reference_characters.py` com iluminação de estúdio para Bram e conserva as
animações de repouso, saudação e martelada em oito direções.

```sh
blender -b -t 4 --python blender/reference_characters.py -- --only=bram
python3 blender/pack_reference_characters.py --only=bram
```
