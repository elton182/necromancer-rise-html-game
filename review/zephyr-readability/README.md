# Zephyr: leitura de volume em sprites

Foi escolhida a alternativa fosca com materiais separados e luz de estúdio.
O capuz tem borda lilás, abertura quase preta, mangas violeta, luvas neutras,
cinto de couro e painéis de túnica com valores distintos. Apenas olhos (0,45)
e cristal (0,35) têm emissão; não há bloom. A malha, pesos, rig, curvas das seis
ações, escala e lógica de gameplay foram preservados.

## Comparação controlada

`material-comparison-large.png` compara três versões na mesma pose: idle,
quadro 1, direção 1 (rotação Z de 45°), câmera ortográfica elevada a 32°:

1. Toon anterior com emissão e três faixas.
2. Mesma paleta anterior com materiais PBR e o estúdio novo.
3. Materiais foscos separados com o mesmo estúdio da alternativa 2 (escolhida).

Os arquivos `toon-*`, `studio-*` e `matte-*` preservam os renders individuais.
`*-native.png` tem 320 px por célula; `*-large.png` tem 960 px, sem mudar a câmera.
A ampliação é apenas para inspeção, não foi usada no atlas de produção.

`material-comparison-game-scale.png` passa os renders nativos pelo mesmo
contorno, redução a 224 px e escala aproximada da partida (célula de 263 px).
Essa prancha é uma simulação de escala; as capturas abaixo são a verificação
real no navegador.

`gameplay-before-after-1x.png` reúne recortes sem ampliação das capturas de
1440 × 1000, DPR 1. A posição, direção, tempo (0), pose e escala são iguais.
Linhas: iluminação sobreposta ligada e desligada. Colunas: antes e depois.
`before-lighting-*.png` e `after-lighting-*.png` preservam as capturas completas.
O cenário tem elementos ambientais aleatórios; os personagens estão pausados.
A iluminação sobreposta foi mantida: a nova separação de materiais continua
legível com ela ligada. A captura desligada é uma intervenção só na sessão de
inspeção, não uma alteração no código do jogo.

## Regeneração atual

```sh
/tmp/blender-4.3.2-linux-x64/blender -b -t 4 --python-exit-code 1 --python blender/reference_characters.py -- --only=zephyr
python3 blender/pack_reference_characters.py --only=zephyr
```

Não execute os empacotadores antigos para atualizar esta versão.
`blender/reference/zephyr.blend` abre com câmera, materiais finais, três luzes,
World e a pose idle da direção 1. Um render dessa cena salva reproduziu os
pixels do mestre `frames_zephyr/01_00.png` exatamente. A cena usa Cycles,
32 amostras, fundo transparente e transformação de cor Standard.

O atlas continua com 1344 × 10752, células de 224 px, oito direções, 248 quadros,
ppu 34,3 e escala 1,12 no jogo. Os metadados não precisaram mudar. Somente o
registro `SPR.load('necro', ...)` foi alterado no HTML.

## Validação e limites

`validation.json` registra a preservação de geometria, pesos e curvas de
animação; ausência de emissão no corpo; cena reproduzível; reimportação do GLB
com 18 poses amostradas; 248 quadros sem corte/vazios; 76 cenários de gameplay;
e integração no navegador com 784 extremos de animação decodificados.
Os hashes dos recursos de Bram foram preservados. A integração verificou
movimento, invocação, animações e conversa com Bram, sem erros JavaScript.

A avaliação visual foi feita em desktop, DPR 1, na vila e nas pranchas. Não foi
feita avaliação artística individual dos 248 quadros, nem uma nova avaliação em
todos os biomas, dispositivos móveis ou monitores. Não foi alterada a geometria
para esconder sobreposições existentes entre o cajado e o capuz.
