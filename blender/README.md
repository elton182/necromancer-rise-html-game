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
