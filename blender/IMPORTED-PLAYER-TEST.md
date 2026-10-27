# Teste do player importado

Abra `../teste-player.html` para experimentar `exports/necromancer_1.glb` no player.
A abertura normal de `necromancer-canvas.html` usa o mago com rig e cajado. O teste estático
é ativado somente por `?playerModel=necromancer_1`; não grava a escolha no save.
O atlas está embutido no HTML e funciona offline.

O arquivo fornecido tem uma malha com textura, sem rig ou animações. Este teste
usa oito direções estáticas; idle, caminhada, conjuração e morte compartilham a
pose original. Não representa animações finais. Não altera regras de combate.
Preserva os materiais PBR importados: o toon compartilhado atual elimina as
texturas ao reconstruir os materiais, portanto não foi aplicado neste estudo.

## Reprodução

Na raiz, com Blender e Python/Pillow disponíveis:

```powershell
blender --background --threads 4 --python blender/scripts/render_imported_player.py -- preview
# Conferir blender/frames/imported_player/0.png antes do lote.
blender --background --threads 4 --python blender/scripts/render_imported_player.py
python blender/scripts/pack_imported_player.py
node game_check.js
node scripts/imported-player-browser-check.js
```

O teste de navegador usa Playwright e Edge em contexto isolado. A cena editável
fica em `models/imported_player.blend`, atlas e metadados em `spritesheets/`,
prancha em `previews/imported_player_review.png` e captura em
`../review/imported-player-game.png`. O empacotador verifica transparência e
margens nas oito direções antes de incorporar somente o bloco opcional.

## Mago com rig

Abra `../teste-player-rig.html` para o segundo modelo (`?playerModel=purple_mage`).
O teste anterior continua disponível em `../teste-player.html`.
O mago com rig agora é o player padrão, sem parâmetro na URL. O seletor de
cajado aparece somente com `?playerModel=purple_mage`; a abertura normal usa
o cajado equipado e oculta os controles do estudo.

`exports/purple_hooded_mage.glb` contém 65 ossos, mas não contém clipes de
animação. Foram criadas quatro ações de protótipo no rig: descanso (4 quadros),
caminhada (8), conjuração (6) e morte (6), em oito direções. São movimentos
simples para avaliar o modelo, ainda sujeitos a refinamento de pegada, contato
com o chão e deformações da túnica.

A revisão `black-outline-layered-staff-v4` fecha a base das pernas e anima
o braço livre no eixo frente/trás: perna direita à frente com mão esquerda à
frente, invertendo na outra metade do ciclo. A mão direita segura o cajado
ligeiramente à frente, com cotovelo dobrado e braço afastado lateralmente.
O cajado permanece vertical, preso ao osso da mão. Na conjuração, o braço esquerdo estende
à frente com dedos para cima e palma para a frente. As texturas alimentam o
cel shading compartilhado de três faixas, com contorno preto fino e sem quinas
internas. Dano, custo, alcance e tempos do combate não foram alterados.

```powershell
blender --background --threads 4 --python blender/scripts/render_imported_player.py -- rigged preview
blender --background --threads 4 --python blender/scripts/render_imported_player.py -- rigged
blender --background --threads 4 --python blender/scripts/check_rigged_player.py
python blender/scripts/pack_imported_player.py rigged
node scripts/sync-visual-boot.js
node game_check.js
node scripts/imported-player-browser-check.js --rigged
```

Cena: `models/rigged_player.blend`. Atlas e metadados:
`spritesheets/rigged_player_sheet.webp` e `spritesheets/rigged_player_sheet.json`.
Prancha: `previews/rigged_player_review.png`. O empacotamento verifica margem
transparente e quadros distintos em cada ação/direção.

O cajado foi extraído de `exports/necromancer_1.glb` por
`scripts/imported_staff.py`, preservando a malha e textura do cabo e cristal.
O atlas independente `spritesheets/rigged_player_staff_sheet.webp` contém
somente as partes visíveis da arma, com oclusão pelo corpo em cada pose.
O contorno preto da arma é calculado a partir dessa máscara visível para
evitar linhas de Freestyle atravessando as costas do personagem.
Os dois atlas são embutidos no HTML; o teste continua funcionando offline.

O seletor **Arma do teste** permite alternar entre **Cajado original** e
**Sem cajado** durante o jogo. Essa escolha visual é transitória e não altera
inventário, atributos ou saves. Novas armas precisam de seu próprio atlas
alinhado às mesmas poses e de registro em `../scripts/rigged-player-test.js`.
Esse módulo é incorporado pelo empacotador; não editar só a cópia no HTML.

Validação executada: 192 quadros sem recorte (margem mínima de 26 px),
alternância de quadros no renderizador para as quatro ações, cinco aliados no
jogo e qualidade baixa, sem erros de página no Edge. `game_check.js` passou
os 76 cenários. Evidência em `../review/rigged-player-game.png`; prévia animada
em `previews/rigged_player_motion.gif`. A validação não substitui uma revisão
artística das animações de protótipo.

O teste de poses da revisão verifica a base estreita dos pés, os sentidos
opostos do braço livre e perna do mesmo lado, a pegada lateral à frente,
o cajado vertical preso à mão, a extensão da mão na conjuração,
a normal da palma à frente e a textura ligada às três faixas. Os resultados
ficam em `previews/rigged_player_pose_validation.json`. As quatro ações são
preservadas na cena editável para que continuem disponíveis ao reabri-la.

O teste de navegador também confere o seletor, a presença da segunda camada
somente com o cajado equipado, IDs inválidos e a preservação do save ao trocar
a escolha visual.

## Abertura visual

`../scripts/visual-boot.js` é embutido por `node scripts/sync-visual-boot.js`.
A tela de preparação permanece visível até os sprites registrados, os visuais
padrão de `CharacterVisuals` e a vila estarem prontos. O ciclo do jogo não
atualiza combate durante esse período. Isso evita a troca dos assets antigos
pelos atuais na primeira cena. O registro principal do player já contém o
atlas novo, sem decodificar o atlas anterior antes de substituí-lo.

A barra mostra a proporção de tarefas concluídas (decodificação das imagens
e preparação dos grupos de personagens e vila), não uma estimativa de tempo
ou de bytes transferidos. Ela chega a 100% depois da verificação do player,
imediatamente antes de liberar a cena.

Validação da abertura: `node scripts/visual-boot-browser-check.js` (Edge e
Playwright, contexto isolado). O teste verifica os visuais prontos no instante
em que a tela é revelada, o cajado padrão e a ausência do seletor de teste.
