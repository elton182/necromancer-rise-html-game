# V2 — Acabamento visual do cenário

O cenário da v2 nasceu provisório: primitivas do Three.js (caixas, cones, icosaedros), um material fosco único e luz
sem tone mapping. Este guia registra a **fatia vertical** feita na Vila de Eldrin para fixar o padrão profissional,
o que ela mudou, onde o padrão ainda não chegou e como levá-lo ao editor de mapas.

Estado: **implementado só na Vila de Eldrin** (parte do acabamento E11). Os demais mapas, o campo de treino, as
Expedições e os mapas do editor continuam com o visual anterior. Nenhuma regra de jogo mudou: colisão, rotas,
interações, dano e progressão são os mesmos.

## O que mudou na vila

| Área | Antes | Agora |
| --- | --- | --- |
| Casas | Caixa + pirâmide de 4 faces, porta e janelas coladas | Enxaimel montado por módulos: base de pedra, vigas, janelas com venezianas, porta recuada, empenas, telhado de telhas desencontradas com beiral, chaminé |
| Mobiliário | Cilindros e caixas lisos | Poste com lanterna, poço com telhadinho, cerca com postes e travessas, barril com aros, caixote com ripas |
| Vegetação | Cones (grama), icosaedros (copas e arbustos) | Carvalho com galhos e copa em massas, pinheiro em andares serrilhados, arbusto, tufo de lâminas curvas, flores, pedra facetada; folhagem balança com o vento |
| Chão | Plano de cor única + retângulos de rua + dodecaedros soltos | Textura pintada ao carregar: grama com variação, terra batida com sulcos, ruas de pedra em fiadas, praça em anéis, terra e sombra no pé das construções |
| Luz | Sol + hemisfério, sem tone mapping | ACES, céu pré-filtrado como reflexo difuso, sol mais quente, poças de luz sob postes e janelas |
| Oclusão | Jogador sumia atrás de casas e árvores | O cenário à frente do jogador abre um círculo pontilhado |
| Periferia | Peças do modelo medieval antigo (`medievalVillage`) | Removidas da vila (seguem no campo de treino) |

Evidências, antes/depois e o que foi verificado: [`review/v2/village-kit/validacao.md`](../review/v2/village-kit/validacao.md).
Regras da vila em si: [campanha da V2](v2-campanha.md#vila-de-eldrin-mapa).

## Como funciona

### Kits do Blender

| Kit | Gerador | Exportação | Registro | Peças |
| --- | --- | --- | --- | --- |
| Vila | [`v2_village_kit.py`](../blender/scripts/v2_village_kit.py) | `blender/exports/v2_village_kit.glb` | `villageKit` | `bay_plain`, `bay_brace`, `bay_window`, `bay_door`, `corner`, `gable`, `roof`, `roof_end`, `chimney`, `lamp`, `fence_post`, `fence_rails`, `well`, `barrel`, `crate` |
| Vegetação | [`v2_nature_kit.py`](../blender/scripts/v2_nature_kit.py) | `blender/exports/v2_nature_kit.glb` | `natureKit` | `oak`, `pine`, `bush`, `grass`, `flowers`, `rock` |

Convenções comuns aos dois kits (detalhes em [`blender/README.md`](../blender/README.md)):

- **Nome e origem:** cada peça é um objeto `kit_<nome>`, com a origem no ponto de encaixe (base). No GLB, todos os nós ficam na origem.
- **Material tingível:** `plaster`, `roof`, `leaf`, `needle`, `grass` e `petal` são brancos, e o jogo dá a cor por instância.
  O mesmo kit serve a qualquer paleta ou estação.
- **Sombreamento por vértice:** a cor por vértice (`COLOR_0`) imita oclusão de ambiente, sem textura nem bake:
  - pé das paredes escuro;
  - borda das telhas escura;
  - copa mais escura embaixo;
  - raiz da grama escura.
- **Faces:** os materiais usam backface culling; só grama, hastes e pétalas têm dupla face.
- **Medidas que o jogo assume:**
  - módulo de parede: 1 × 3 u, face externa em -Y no Blender (+Z no Three.js);
  - carvalho: 5,5 u de altura;
  - pinheiro: 6 u de altura.

  Mudar essas medidas exige ajustar `village-kit.mjs` e `nature-kit.mjs`.
- **Reprodutível:** cada gerador, rodado em modo de fundo, regrava o `.blend` e o `.glb`, e o resultado é igual byte a byte.

Comandos (na raiz; Blender 5.2 ou compatível):

```powershell
blender --background --python blender/scripts/v2_village_kit.py
blender --background --python blender/scripts/v2_nature_kit.py
node v2/tools/build.cjs
```

### Módulos do jogo

| Fonte | Papel |
| --- | --- |
| [`village-kit.mjs`](../v2/scripts/village-kit.mjs) | `kitPart`/`kitFamily`: transformam uma peça de qualquer kit em um `InstancedMesh` por material, com tinta por instância. `houseLayout`/`buildHouses` montam a casa a partir do colisor |
| [`nature-kit.mjs`](../v2/scripts/nature-kit.mjs) | `buildNature(arena, kit, {autumn})`: vegetação a partir dos mesmos campos de `buildForest` (sólidos `oak`, `pine`, `rock`; `decor.trees`, `bushes`, `grass`, `flowers`). `NATURE_SWAY` define o vento por material |
| [`village-ground.mjs`](../v2/scripts/village-ground.mjs) | `villageGround(arena)`: pinta o chão da vila numa textura de 2048 px gerada ao carregar, sem bytes no HTML |
| [`scenery-fx.mjs`](../v2/scripts/scenery-fx.mjs) | `patchScenery(material, {sway, swayFrom, see})` injeta vento e transparência pontilhada; `updateSceneryFx(...)` atualiza os uniformes a cada quadro |
| [`village-scene.mjs`](../v2/scripts/village-scene.mjs) | Com `models.villageKit` usa o kit; sem ele, volta ao visual de primitivas |
| [`renderer.mjs`](../v2/scripts/renderer.mjs) | Passa `models` às cenas, aplica `SCENE_LOOK` e chama `updateSceneryFx` antes de desenhar |

Contratos que o renderizador entende e que qualquer cena nova pode usar:

- **Assinatura das cenas:** `build<Tema>(arena, models)`. Toda cena precisa funcionar sem `models`, voltando às primitivas.
- **`userData.replacesGround`:** a cena traz o próprio chão, e o renderizador esconde o plano liso.
- **`userData.lightColor`:** cor do material no fundo claro (branco no escuro). O chão pintado usa para clarear.
- **`userData.lightOpacity`:** opacidade no fundo claro. As poças de luz usam para ficar mais fracas.
- **`SCENE_LOOK[tema]`:** exposição, intensidade do reflexo do céu, sol e hemisfério. Um tema sem entrada mantém a luz
  original, sem tone mapping. Hoje só `village` tem entrada.

### Oclusão (transparência pontilhada)

- **Onde abre:** o cenário entre a câmera e o jogador abre um círculo de 2,6 u ao redor dele.
- **Como:** descarte por pixel com matriz de Bayer 4×4, sem transparência ordenada. A sombra não muda.
- **O que fica fora:** fragmentos abaixo de 0,9 u de altura (base de muros, cercas, caixotes) e tudo que está atrás
  do jogador.
- **Quando liga:** só na vila. Nos outros temas o renderizador passa `on` falso, e o palco das histórias não usa
  materiais com o efeito.

## Onde ainda falta aplicar

### Na própria vila

| Item | Situação | Caminho sugerido |
| --- | --- | --- |
| Barracas do mercador, quadro de avisos, pilares do portal e Pedra do Infinito | Primitivas (`buildFurniture` em `village-scene.mjs`) | Novas peças no kit da vila (`stall`, `board`, `portal_pillar`, `monolith`) |
| Ferraria de Bram e estalagem | Usam o mesmo enxaimel das casas | Variações: forja/bigorna e alpendre na ferraria (`smithy`), placa e varanda na estalagem (`inn`) |
| Oclusão de NPCs, aliados e inimigos | Só o jogador ganha o círculo | Estender `updateSceneryFx` a uma lista curta de alvos (uniforme em vetor) ou contorno dos personagens atrás de cenário |
| Borda do terreno | Grama até a borda, visível com zoom máximo | Anel de árvores fora do limite caminhável (`decor.trees`, sem colisão) e escurecer a borda da textura |
| Histórias abertas na vila | O palco das histórias usa o mesmo renderizador, então herda o tone mapping da vila | Salvar e restaurar `toneMapping`/exposição em `renderStory` ou dar ao palco sua própria receita |
| Medições | Desempenho, chamadas de desenho e custo do descarte não medidos; o vento não aparece em capturas paradas | Cena fixa com contador de quadros, qualidade alta e baixa; `village-browser-check.cjs` com Playwright |

### Nos outros cenários

| Cenário | Fonte atual | O que já serve | O que falta |
| --- | --- | --- | --- |
| Floresta de Eldrin (fase 2) | `forest-scene.mjs` (`buildForest`) | `buildNature` lê os mesmos dados: dá para trocar árvores, pedras, arbustos, grama e flores direto | Peças `stump`, `log` e `mushroom` no kit de vegetação. Chão pintado com manchas e trilha (generalizar `villageGround`). Entrada `forest` em `SCENE_LOOK`. Ligar `patchScenery` |
| Trilha dos Vigias (fase 3) | `trail-scene.mjs` + `buildForest` | Vegetação (`autumn` já tem tintas em `buildNature`) | Barricadas, torres, lanternas e acampamento em kit (reaproveitar `lamp`, `fence_*`, `crate`, `barrel`). Chão com a faixa da trilha pintada |
| Posto do Capitão (fase 4) | `outpost-scene.mjs`, `camp-parts.mjs` | Árvores de outono, caixotes e barris | Kit militar: paliçada, torre de vigia, tendas, plataforma com runas. Chão de terra pisoteada |
| Cripta Esquecida (fase 1) | `crypt-scene.mjs` | Contrato de kit, `patchScenery`, `SCENE_LOOK` | Kit de cripta: parede de blocos com variação, canto, arco, pilar, sarcófago, tocha, grade, escombros. Lajes com rejunte. Paredes do lado da câmera mais baixas ou recortadas; topo escuro. Poças de luz das tochas |
| Expedições | `expedition-scene.mjs` (`buildExpedition`) | Vegetação, casas (cabana dentro do raio) e barris/caixotes | Peças por bioma: cacto, gelo, ruína, coluna, lápide, caveiras, braseiro, água. Chão por bioma. `SCENE_LOOK` por bioma (a cena usa `theme: 'expedition'` + `biome`) |
| Cerco ao Ritual | `siege-scene.mjs` | Torres e obelisco já são GLB animados | Chão e adereços do campo; receita de luz |
| Campo de treino | `renderer.mjs` (grade, lápides, peças `medievalVillage`) | — | Decidir se mantém o ensaio com `medievalVillage` (6 MB no HTML) ou troca pelos kits |

Ordem sugerida: **Floresta → Expedições/editor → Trilha → Posto → Cripta**. A floresta é quase só trocar a
vegetação. Expedições e editor compartilham a cena (veja abaixo). A cripta exige o maior kit novo e decisões de
leitura (paredes altas na câmera isométrica).

Para cada cenário, a entrega deve repetir o que a vila fez:

- novo kit ou peças registradas em `models.json`;
- cena com fallback sem `models`;
- entrada em `SCENE_LOOK`;
- `patchScenery` nos materiais;
- conferência em fundo escuro e claro, qualidade baixa, com horda;
- evidências em `review/v2/<cenário>/`.

## Integração ao editor de mapas

Hoje o editor ([guia](v2-mapas.md)) não recebe nada do acabamento novo:

- **Cena:** `toArena` (`map-model.mjs`) gera uma arena com `theme: 'expedition'`, e no jogo a cena é
  `buildExpedition(arena)`, que ignora `models`.
- **Pré-visualização 3D:** `map-preview.mjs` tem renderizador, luzes e chão próprios. Chama
  `buildExpedition(arena)` sem modelos, embora `createMapPreview` já receba `{models, assets}` do jogo.
- **Peças:** o catálogo `PROPS` só tem as peças das Expedições. Muro e Pilar, sem `look`, viram blocos lisos.

### Plano proposto

As etapas abaixo são uma proposta e nenhuma foi implementada. A ordem respeita o formato salvo (`version: 1`) e os
mapas já existentes.

1. **Uma só receita de cena para jogo e prévia.**
   - Extrair de `renderer.mjs` uma função compartilhada, por exemplo `applySceneLook(renderer, scene, {sun, hemisphere}, theme, {light})`.
     Ela aplicaria tone mapping, exposição, reflexo do céu, sol, hemisfério e os ajustes de `userData` do fundo claro.
   - Usar essa função também em `map-preview.mjs`, que hoje duplica `paint()` e as luzes.
   - Assim, o que se vê no editor é o que se joga.
2. **`buildExpedition(arena, models)` com os kits.**
   - Delegar a vegetação a `buildNature` quando `models.natureKit` existir. Árvores, pedras, arbustos, grama e
     flores do editor ganham o visual novo sem mudar dados.
   - Desenhar `house` (colisor circular de raio 2) como cabana do kit inscrita no círculo, com largura ≈ 1,6·r e
     profundidade ≈ 1,4·r. Assim a casa não passa do colisor.
   - Usar `kitFamily` para `barrel` e `crate`.
   - Chamar `patchScenery` em todos os materiais, para ter vento e oclusão.
   - Em `map-preview.mjs`: passar `models` para `buildExpedition` e chamar `updateSceneryFx` no laço de quadros antes de
     `renderer.render`. Os uniformes são globais, mas cada laço os grava logo antes do próprio desenho; jogo e prévia
     não se atrapalham.
3. **Peças novas no catálogo (`PROPS`).** Todas são aditivas: mapas antigos continuam válidos, e uma versão antiga do
   jogo descarta tipos desconhecidos ao importar, como o guia do editor já documenta.

   | Tipo sugerido | Grupo | Forma/colisão | `look` | Desenho |
   | --- | --- | --- | --- | --- |
   | `townhouse` (Casa de enxaimel) | Colisores | caixa `w`,`d`,`h` | `house` | `houseLayout` do kit, com porta na face sul |
   | `lamp` (Poste) | Colisores | círculo `r` .18, `h` 2,6 | `lamp` | `kit_lamp` + poça de luz |
   | `well` (Poço) | Colisores | círculo `r` .95, `h` 1,1 | `well` | `kit_well` |
   | `fence` (Cerca) | Colisores | caixa `w`,`d`,`h` (arrastar como o Muro) | `fence` | postes e travessas do kit |
   | `stone_wall` (Muro de pedra) | Colisores | caixa (substitui o bloco liso do Muro) | `stone_wall` | peça nova no kit da vila |
   | `road_cobble` / `road_dirt` (Rua de pedra / de terra) | Chão | retângulo (arrastar) | — | pintado no chão |
   | `plaza` (Praça) | Chão | círculo `r` | — | pintado em anéis |

   O Muro (`wall`) atual pode continuar existindo e ganhar o `stone_wall` como visual padrão. A colisão é a mesma
   caixa, então a **Verificação** do editor não muda.
4. **Chão pintado para qualquer mapa.**
   - Generalizar `villageGround` em algo como `paintGround(arena, palette)`.
   - Fontes de dados: `arena.roads`, as praças (lista, em vez de uma só), `decor.path`, `decor.water` e
     `decor.patches`, com as cores de grama/terra/pedra vindas da paleta do bioma (areia no deserto, neve na tundra).
   - Resolução: com mapas de até 120 u, uma textura única de 2048 px cai para ~14 px/u. Escolher o tamanho pelo mapa
     (até 4096) ou combinar a pintura em baixa resolução com texturas de detalhe repetidas.
   - `toArena` passaria a montar `roads`/`plazas` a partir dos objetos de Chão.
5. **Editor 2D.** Cores e rótulos das peças novas em `PROPS`. Ferramenta de arrastar retângulo para ruas e cerca,
   igual à do Muro. Grupo **Vila** ou **Construções** no painel de ferramentas.
6. **Testes e documentação.**
   - `map-model.test.mjs`: `normalizeObject` aceita os tipos novos; `toArena` gera `look`, `roads` e praças;
     importação descarta tipo desconhecido.
   - Conferência manual: editor 2D e prévia 3D (andar atrás de uma casa para ver a oclusão), Testar ▶, fundo claro.
   - Atualizar [v2-mapas.md](v2-mapas.md) (catálogo e "Como o mapa vira jogo") e este guia.

Riscos a acompanhar:

- **Custo:** muitos mapas com 600 objetos e chão de 4096 px. Medir antes de aumentar limites.
- **Divergência entre prévia e jogo:** acontece se a etapa 1 não for feita primeiro.
- **Casas circulares antigas:** devem continuar dentro do colisor.

## Verificação e limites desta fatia

Registrado em [`review/v2/village-kit/validacao.md`](../review/v2/village-kit/validacao.md):

- **Executado:**
  - testes de regras da v2 (`node --test v2/tests/*.test.mjs`) e build;
  - conferência no navegador integrado: vila no fundo escuro e no claro com qualidade baixa, casos de oclusão,
    cripta inalterada e nova entrada na vila.
- **Não executado:**
  - `village-browser-check.cjs` (sem Playwright no ambiente);
  - medição de desempenho;
  - movimento do vento.
- **Correção junto da fatia:** dois caracteres em Latin-1 ("Capitão", "sábios") numa alteração local de
  `renderer.mjs` foram convertidos para UTF-8. Isso destravou a edição do arquivo e corrigiu o filtro de textos das
  histórias no HTML gerado.
