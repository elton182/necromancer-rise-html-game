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
