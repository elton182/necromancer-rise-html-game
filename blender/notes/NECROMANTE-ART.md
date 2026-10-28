# Necromante — estudo violeta

> Caminhos relativos à pasta `blender/`.

Protótipo baseado na imagem fornecida pelo usuário: capuz amplo e facetado,
rosto em sombra com dois olhos lilases, casaco violeta aberto sobre túnica
escura, mangas largas, luvas, cinto com fivela em losango e cajado de madeira
com cristal violeta. Após o retorno de que faltava imponência, a segunda
passagem alonga o corpo, amplia os ombros, reduz a proporção da cabeça e
fecha a abertura do capuz. Os olhos foram posicionados mais à frente dentro
da sombra para permanecerem visíveis pela câmera de sprites. Olhos menores,
violeta mais profundo, fivela
discreta e luvas/ botas mais angulares reforçam a presença. A câmera de
apresentação também foi abaixada. O estudo não adiciona mecânicas nem
modifica o HTML.

A versão de proporções compactas foi preservada em
`backups/necromante-before-presence-20261026/`.

## Fontes e saídas

- Fonte reproduzível: `scripts/necromante_art.py`.
- Utilitários: `scripts/common.py` e geometria/estúdio de `scripts/flora_druid_art.py`.
- Cena editável: `models/necromante_art.blend`.
- Apresentação: `previews/necromante_art_beauty.png`, 840 × 1000 px.
- Render RGBA: `previews/necromante_art.png`, 840 × 1000 px.
- Oito direções e escalas: `previews/necromante_art_review.png`.
- Atlas e contrato: `spritesheets/necromante_art_sheet.webp` / `.json`.
- Relatório: `previews/necromante_art_validation.json`.

Os arquivos existentes `necromante.blend`, `necromante.glb`, seu gerador e
seu atlas representam a versão anterior e não são sobrescritos por este estudo.
Importar os utilitários da Flora não regenera os arquivos dela.

## Rig e animação

Rig com tronco, cabeça, braços, mãos, pernas, cajado e três ossos para o tecido
da saia. Os painéis inferiores misturam os pesos entre quadril e tecido. Dedos
acompanham as mãos; não têm controles individuais. O cajado está ligado à mão
que o segura.

Ações iniciais: `idle`, `walk`, `cast`, `attack` e `death`. O atlas contém
somente `idle`, em oito direções × quatro quadros a 4 fps. Célula de 224 px,
44 px/u, âncora (112, 165); direções seguem 90 − índice × 45 graus.
Cada linha corresponde a uma direção e cada coluna a um quadro.

## Render e reprodução

Cycles, materiais PBR foscos, câmera ortográfica e iluminação suave de estúdio.
O gerenciamento de cor usa Standard com exposição −0,7 para preservar o
violeta saturado solicitado; não usa o shader toon da distribuição atual.
O chão existe apenas na apresentação; fica oculto na cena salva e nos sprites.

Na raiz do projeto, com Blender e Python/Pillow disponíveis:

```powershell
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/necromante_art.py -- preview
# Inspecionar a apresentação antes do lote.
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/necromante_art.py -- poses
blender --background --threads 4 --python-exit-code 1 --python blender/scripts/necromante_art.py -- sheets
python blender/scripts/pack_flora_art.py --necro
```

O empacotador verifica dimensões, conteúdo alfa, margens e movimento em todas
as direções. A prancha mostra fundos claro e escuro em 24, 36 e 56 px/u.
As prévias de pose verificam descanso, preparação/conjuração e morte.
São animações de protótipo, sem sincronização com combate. Integração,
qualidade baixa, horda e validação dentro do jogo ficam fora deste estudo.

Verificação executada: apresentação, preparação/conjuração, morte e oito
direções inspecionadas; 32 quadros RGBA válidos, movimento nas oito direções,
atlas de 896 × 1792 px. A margem transparente mínima é registrada no relatório
de validação gerado junto ao atlas. A posição da
origem é verificada pelo renderizador contra a âncora (112, 165).
