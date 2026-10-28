# Flora — estudo visual

> Caminhos relativos à pasta `blender/`.

Protótipo independente da druida e de sua forma de lobisomem, baseado nas
referências fornecidas. Não adiciona classes, regras, magias ou sprites ao jogo.
O urso permanece uma referência para uma etapa futura.

Direção: volumes facetados, verdes de folhagem, couro e galhos; cristal verde no
cajado. O lobisomem usa juba castanha, focinho e garras marfim e olhos âmbar.
Na terceira passagem, as duas formas usam materiais PBR foscos e iluminação
suave de estúdio em Cycles para aproximar a nova direção artística
solicitada pelo usuário.
As duas mantêm câmera ortográfica e saídas com transparência.

Segunda passagem de arte: proporcoes mais compactas, capuz aberto modelado,
rosto com cabelo e olhos, folhas e mechas volumetricas, variacao suave entre
facetas, cristal lapidado e trepadeira no cajado. O lobisomem recebeu focinho
mais projetado, juba em camadas, maos maiores e manchas claras nos antebracos.
A aproximação das referências continua sendo um estudo de personagem.

Terceira passagem (Flora): fonte dedicada `scripts/flora_druid_art.py`, rosto
redesenhado, franja assimétrica, capuz com espessura e forro, gola que cobre
os ombros, saia e capa em folhas sobrepostas, bandoleira plana, fivela vazada,
sacola, botas com tiras e dedos ao redor do cajado. A pose de descanso foi
remodelada com o cotovelo esquerdo dobrado. A versão anterior foi preservada
em `backups/flora-before-art-pass-20261026/`.

Terceira passagem (lobisomem): fonte dedicada `scripts/flora_werewolf_art.py`,
tronco inclinado, pernas digitígradas, juba em mechas sólidas sobrepostas,
crânio em cunha, focinho alongado, olhos âmbar, mandíbula articulada e presas.
Braços e coxas têm manchas claras com bordas irregulares; mãos e patas têm
dedos e garras separados. O cinto e as tiras preservam a identidade visual da
referência. A versão anterior está em `backups/werewolf-before-art-pass-20261026/`.
Correção das mãos: palmas voltadas para a frente com polegares do lado externo
e ordem dos dedos espelhada entre esquerda e direita. A geometria dos braços
e dos punhos foi preservada; a revisão anterior das mãos está em
`backups/werewolf-before-hand-fix-20261026/`.
O gerador reutiliza os utilitários geométricos e o estúdio da Flora sem
regenerar seus arquivos.

Fontes editáveis: `models/flora_druid.blend` e `models/flora_werewolf.blend`.
Cada cena contém rig e ações `idle`, `walk`, `attack` e `death`. São movimentos
iniciais para exploração, ainda sem revisão de combate. Os atlas renderizam
somente `idle`: oito direções × quatro quadros, célula 224 e âncora (112, 165).
A Flora revisada usa 44 px/u para acomodar o cajado e os galhos altos em todas
as direções; o lobisomem revisado usa 48 px/u. Cada linha representa uma
direção e cada coluna um quadro.
Os JSON registram o contrato e os ângulos; não existe registro no runtime.

Reprodução a partir da raiz, com Blender e Python/Pillow instalados:

```powershell
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/flora_druid_art.py -- preview
# Conferir as prévias antes de gerar o lote.
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/flora_druid_art.py -- sheets
python blender/scripts/pack_flora_art.py

# Forma de lobisomem, independente da forma humana.
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/flora_werewolf_art.py -- preview
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/flora_werewolf_art.py -- poses
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/flora_werewolf_art.py -- sheets
python blender/scripts/pack_flora_art.py --wolf
```

Prévia da Flora: `previews/flora_druid_beauty.png` (apresentação com chão) e
`previews/flora_druid.png` (RGBA), ambas com 840 × 1000 px. A cena editável
abre com a câmera de apresentação; o chão fica oculto no render por padrão.
`previews/flora_druid_review.png` reúne oito direções e escalas de 24, 36 e
56 px/u em fundos claro e escuro. O relatório `flora_druid_validation.json`
registra as verificações de dimensões, margens e movimento dos 32 quadros.
O lobisomem tem as mesmas saídas com prefixo `flora_werewolf`: prévia RGBA,
apresentação com chão, prancha de direções e relatório de validação. As imagens
`flora_werewolf_pose_idle.png`, `flora_werewolf_pose_attack.png` e
`flora_werewolf_pose_death.png` permitem conferir as ligações do rig nas poses
básicas; não validam a mecânica de combate.
Atlas e metadados: `spritesheets/flora_*_sheet.webp` / `.json`.
O empacotador dedicado confere os 32 quadros da forma selecionada contra
transparência vazia e corte nas bordas, sem modificar o atlas da outra forma.
Integração, horda,
qualidade baixa e validação dentro do jogo permanecem fora deste estudo.

Verificação da revisão humana: render de apresentação e prancha de direções
inspecionados; 32 quadros RGBA válidos, movimento em todas as oito direções,
atlas de 896 × 1792 px e margem transparente mínima de 15 px. A projeção da
origem é verificada no renderizador contra a âncora (112, 165).

Verificação do lobisomem revisado: apresentação, oito direções e poses de
descanso, ataque e morte inspecionadas; 32 quadros RGBA com movimento nas
oito direções, atlas de 896 × 1792 px e margem transparente mínima de 37 px.
Leitura conferida em fundos claro e escuro a 24, 36 e 56 px/u. As ações são
protótipos de rig, ainda sem sincronização com combate ou validação no jogo.
