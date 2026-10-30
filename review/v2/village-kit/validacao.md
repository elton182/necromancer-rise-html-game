# Vila de Eldrin — fatia vertical do acabamento visual

Data: 30/10/2026.

## O que mudou

- Kit `blender/exports/v2_village_kit.glb`, gerado por `blender/scripts/v2_village_kit.py`, com quinze peças.
  As casas são montadas por `v2/scripts/village-kit.mjs` a partir dos colisores de `village-map.mjs`.
- `v2/scripts/village-ground.mjs` gera o chão pintado em textura. Postes e janelas projetam poças de luz no chão.
- `renderer.mjs` recebe `SCENE_LOOK` (só a vila: ACES, exposição 1,2, céu pré-filtrado, sol quente).
  As cenas recebem `models`, e o chão liso fica escondido quando a cena traz o próprio.
- As peças do modelo medieval antigo (`medievalVillage`) saíram da periferia da vila; o campo de treino ainda as usa.
  Não tinham colisão.
- Colisão, rotas, interações e os outros mapas não mudaram.

## Verificação

- `node --test v2/tests/*.test.mjs`: 373 testes passaram.
- `node v2/tools/build.cjs`: 36 GLBs incorporados.
- Gerar o kit de novo em modo de fundo produz um GLB idêntico (mesmo MD5).
- Navegador integrado (servidor local do ateliê, 1440×900), com estes casos:
  - vila no fundo escuro;
  - vila no fundo claro com qualidade baixa;
  - cripta, para confirmar que a luz anterior continua igual;
  - volta à vila, para confirmar que a cena é remontada.
- Nenhum erro de página nesses casos. O console só mostra o 404 do `favicon.ico` no servidor HTTP local.

## Evidências

| Arquivo | Conteúdo |
| --- | --- |
| `before-village-dark.png` | Captura anterior (cópia de `review/v2/village/village-dark.png`) |
| `village-dark-overview.jpg` | Visão geral da vila no fundo escuro |
| `village-dark-plaza.jpg` | Praça vista de perto |
| `village-dark-north.jpg` | Norte da vila, com portal e ruas de terra |
| `village-light-low.jpg` | Fundo claro e qualidade baixa |
| `village-dark-inn-occlusion.jpg` | Jogador ao norte da estalagem, escondido pelo telhado (oclusão pendente, já existia) |
| `periphery-before-old-pieces.jpg` / `periphery-after.jpg` | Periferia com as peças antigas e sem elas (câmera afastada) |
| `blender-test-house.png` | Casa de teste montada no Blender com as peças do kit |

As capturas do painel saem reduzidas a 800×500.

## Segunda etapa: vegetação e oclusão

- **Kit de vegetação:** `blender/scripts/v2_nature_kit.py` gera `v2_nature_kit.glb` (carvalho, pinheiro, arbusto, grama,
  flores, pedra), instanciado por `v2/scripts/nature-kit.mjs`.
- **Backface culling:** os dois kits passaram a usá-lo; só grama, hastes e pétalas continuam com dupla face.
  Os dois GLBs foram reexportados.
- **Vento e oclusão:** `v2/scripts/scenery-fx.mjs` faz o vento na folhagem e a transparência pontilhada.
  O círculo tem 2,6 u ao redor do jogador e só afeta o cenário à frente dele e acima de 0,9 u.
  `renderer.mjs` atualiza os uniformes a cada quadro e liga o efeito só na vila.
- **Verificação:** 373 testes passaram e o build incorporou 37 GLBs. No navegador integrado foram conferidos:
  - jogador atrás da estalagem (antes ficava oculto) e atrás de um pinheiro;
  - fundo claro com qualidade baixa;
  - cripta inalterada.

  Nenhum erro novo apareceu; o console só mostra o 404 do favicon no servidor local.
- **Evidências:**
  - `vegetation-dark.jpg`: vegetação no fundo escuro;
  - `occlusion-see-through.jpg`: o caso da estalagem, que antes ficava oculto (`village-dark-inn-occlusion.jpg`);
  - `vegetation-occlusion-light-low.jpg`: fundo claro com qualidade baixa;
  - `blender-nature-kit.png`: prévia do kit no Blender, com cores de folhagem só para inspeção.
- **Não verificado:** o balanço do vento não aparece em capturas paradas e não foi medido. Também não foi medido
  o custo do descarte por pixel.

## Limites

- Playwright não está instalado: `v2/tests/village-browser-check.cjs` não foi reexecutado.
- Desempenho e chamadas de desenho não foram medidos. O kit soma cerca de 40 famílias instanciadas,
  mais a textura de 2048 px.
- A oclusão foi resolvida só para o jogador (segunda etapa). NPCs, aliados e inimigos atrás de casas continuam ocultos.
- Barracas, quadro e pilares continuam em primitivas.
