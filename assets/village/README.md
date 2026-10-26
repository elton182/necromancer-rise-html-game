# Vila de Eldrin — cenário modular feito no Blender

A fonte editável é `blender/village_eldrin.blend`. As coleções `KIT_*` guardam
peças reutilizáveis; `VILLAGE_LAYOUT` usa instâncias e `GROUND` contém o piso.
A câmera elevada, os materiais, as luzes de janela/lanterna e as sombras estão
configurados no arquivo. A imagem `village-preview.png` é um render real dessa
cena Blender. As imagens de referência fornecidas pelo usuário não são usadas
como fundo do jogo.

## Produção

```sh
blender -b -t 4 --python blender/village_environment.py
python3 blender/pack_village_environment.py
node scripts/village-environment-browser-check.js
node scripts/npc-dialog-browser-check.js
node game_check.js
```

A geração usa somente Blender e a biblioteca padrão do Python. O empacotamento
usa Pillow. Os testes de navegador usam Playwright e Chrome.

## Integração

O jogo continua em Canvas 2D: os objetos 3D são renderizados em sprites WebP
transparentes, com câmera e escala constantes. `scripts/village-environment.js`
integra esses objetos à ordenação por profundidade, à transparência de objetos
que encobrem o jogador e aos halos quentes de lanternas. Os portais, o altar,
os NPCs e os efeitos animados existentes continuam interativos.

O chão é renderizado de cima e mantém a relação exata entre as coordenadas do
mapa e a imagem. O pavimento usa peças hexagonais com folgas, sem elipses
sobrepostas. As seis posições de casas e as posições dos NPCs são preservadas.
Novas árvores, flores, arbustos, cercas e rochas ficam fora dos quatro caminhos
principais. Nenhuma colisão ou posição de interação foi alterada.

`manifest.json` registra resolução, escala e âncora dos sprites;
`placements.json` registra as instâncias. O empacotador gera
`scripts/village-kit-data.js`, permitindo abrir o HTML localmente sem depender
de `fetch` de JSON. Distribua esta pasta e os scripts junto do HTML.

## Conversas

Cada visita exibe uma única fala inicial, alternando entre sete opções. Clique
na fala para completar a digitação e clique novamente para mostrar diretamente
a missão ou as mercadorias. Não há botão “Próxima fala”. Sem pedido disponível,
o clique após a fala completa encerra a conversa. O retrato permanece à esquerda
e o texto à direita, na caixa inferior.
