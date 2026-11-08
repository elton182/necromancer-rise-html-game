# Arqueira e Mercenário — classes jogáveis

Implementado na v2. O Novo Jogo oferece cinco classes: Necromante, Guerreiro, Druida, **Arqueira** e **Mercenário**. Cada personagem tem seu próprio save e progresso. Saves anteriores sem classe continuam Necromantes.

- **Etapa 1**: modelo, animações, tiro básico, esquiva, atributos e equipamento de armadura.
- **Etapa 2**: árvores de talentos, quatro habilidades por classe, bombas, minas e fogo do Mercenário e o **falcão** da Arqueira.
- **Etapa 3**: Arco e Besta como itens (slot próprio, arma inicial, loot, mercador e forja) e sons próprios.
- **Ajustes de jogabilidade**: atirar andando (camadas de tronco e pernas), tiro contínuo segurando o botão, tolerância de acerto e mira na altura do tronco.
- **Pendente**: malha de flecha no projétil e balanceamento em campanha completa.

## Identidade

| | Arqueira | Mercenário |
|---|---|---|
| Arma | Arco (na mão esquerda) | Besta (duas mãos) |
| Papel | Tiros rápidos, mobilidade, área à distância e um falcão companheiro | Virotes pesados que atravessam fileiras; pólvora para quem chega perto |
| Recurso (campo `mp` do save) | Foco | Vigor |
| Resistência | Mais frágil e mais rápida | Mais resistente e mais lento |

## Barra

A barra é fixa: cada ação tem seu slot, e as que dependem de selo mostram "Libere na árvore". Sem o selo, o comando não gasta recurso nem inicia recarga.

| Slot | Arqueira | Mercenário |
|---|---|---|
| Clique / 1 | Disparo | Virote pesado |
| Botão direito / 2 | Flecha Perfurante | Rajada |
| 3 / Q | Recuo | Bomba de fragmentação |
| C / E / 4 | Esquiva | Esquiva |
| R / 5 | Chuva de Flechas | Mina de pólvora |
| T / 6 | Leque | Garrafa incendiária |
| F / botão de revivência do controle | Comando do Falcão | — |

### Atirar andando

As ações de tiro e de arremesso podem ser feitas em movimento. O tronco toca o clipe da ação (`shoot`, `shoot_up` ou `throw`), e as pernas seguem a passada (frente, ré ou lateral, misturadas pela direção do passo em relação à mira). A velocidade cai durante a ação:

| Ação | Velocidade durante a ação |
|---|---|
| Disparo | 85% |
| Flecha Perfurante | 50% |
| Chuva de Flechas | 60% |
| Leque | 75% |
| Virote pesado e Rajada | 70% |
| Bomba e Garrafa | 80% |
| Recuo e Mina | parado (pose de corpo inteiro) |

O corpo fica virado para a mira durante a ação. Segurar o botão esquerdo ou a tecla 1 continua atirando no ritmo da recarga; o gatilho do controle já fazia isso. No renderizador, os modelos com `layered: true` em `v2/assets/models.json` ganham versões filtradas dos clipes: o tronco cobre coluna, pescoço, cabeça, ombros, braços e mãos com a arma, e as pernas cobrem o quadril e as pernas. Como o quadril fica com a passada, a torção do tronco ao puxar o arco é um pouco menor que na pose parada.

### Acertar o alvo

- Cada tiro acerta inimigos cujo centro passe a até `hit` da linha do projétil: Disparo 0,95; Perfurante e Virote 1,0; Rajada 0,95; flechas do Leque 0,85. Inimigos maiores que o raio padrão (0,3) somam a diferença. A referência é o Tiro de Osso do Necromante (1,1). Antes dessa correção, a tolerância era de 0,48, menos da metade do que o corpo do inimigo mostra na tela.
- A mira do mouse é projetada na altura do tronco (1 u), e não no chão. Assim, clicar no corpo de um inimigo aponta para onde ele pisa; antes, o ponto caía no chão atrás dele e o tiro passava de lado quando o atirador não estava alinhado com a câmera. Vale só para Arqueira e Mercenário.

A direção e o ponto-alvo ficam fixos ao iniciar. A esquiva cancela a ação; o que já foi lançado (projétil, bomba no ar, chuva, mina) continua. Morte, troca de cena e reinício removem ações, projéteis, bombas, zonas, minas e o falcão.

## Ações da Arqueira

| Ação | Custo / recarga | Tempo | Efeito |
|---|---|---|---|
| Disparo | — / 0,5 s | 0,50 s, solta em 0,26 s | 85% do dano. Flecha a 24 u/s, alcance 13 u; para no primeiro inimigo. |
| Flecha Perfurante | 20 foco / 5 s | 0,75 s, solta em 0,55 s | 200% do dano. A linha de 16 u aparece no chão durante a carga, que pode ser feita andando a metade da velocidade. Flecha a 34 u/s que atravessa todos os inimigos, com dano cheio em cada um. |
| Recuo | 15 foco / 6 s (−0,5 s por ponto) | 0,40 s | Salto de 5 u para trás, de frente para a mira, entre 0,05 e 0,35 s, respeitando paredes. Inimigos a até 2,5 u do ponto de partida (sem parede no meio) ficam 35% mais lentos por 2 s; chefes não. |
| Chuva de Flechas | 35 foco / 12 s | 0,60 s, marca em 0,35 s | Área de raio 3 no ponto mirado (até 12 u), marcada no chão. Depois de 0,7 s caem 5 ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro. |
| Leque | 22 foco / 7 s | 0,50 s, solta em 0,26 s | Cinco flechas em cone de 50°, alcance 10 u, 70% do dano cada. |

### Falcão

Com o selo **Falcão** (Caça, nível 2), um falcão acompanha a Arqueira em órbita de 1,5 u, voando a cerca de 2,2 u de altura. Ele não tem vida, não pode ser atingido e não bloqueia ninguém.

- **Automático:** a cada 2,5 s, mergulha no inimigo vivo mais próximo da Arqueira, até 8 u e com linha de visão, causando 35% do dano. Depois volta à órbita.
- **Comando (F):** 10 foco, recarga de 8 s (reduzida pelos itens). Manda o falcão ao inimigo mais perto do ponto mirado, até 3,5 u da mira e 14 u da Arqueira, com 120% do dano. Sem alvo válido, o comando não gasta foco nem inicia a recarga.
- **Marca:** o alvo do comando fica marcado por 4 s (anel dourado no chão) e recebe +15% de dano das flechas da Arqueira (Disparo, Perfurante, Leque e Chuva).
- **Escala:** cada ponto no selo soma +10% ao dano do falcão.
- **No HUD:** o botão da postura passa a mostrar `FALCÃO · F` e a recarga.

## Ações do Mercenário

| Ação | Custo / recarga | Tempo | Efeito |
|---|---|---|---|
| Virote pesado | — / 0,8 s | 0,80 s, solta em 0,36 s | 150% do dano. Virote a 28 u/s, alcance 12 u. Atravessa até 2 inimigos extras (+1 por ponto em Perfuração), perdendo 25% a cada um. Empurra 0,35 u. |
| Rajada | 24 vigor / 7 s | 0,80 s | Três virotes, em 0,25, 0,40 e 0,55 s, com 70% do dano cada; cada um atravessa um inimigo, perdendo 25%. |
| Bomba de fragmentação | 20 vigor / 6 s | 0,60 s, arremesso em 0,30 s | Arco de 0,6 s até o ponto mirado (entre 1,5 e 9 u). A marca de queda fica no chão durante o voo. Explode em raio 2,6 (+12% por ponto em Estilhaços) com 160% do dano e empurra 1 u para fora; paredes bloqueiam a explosão. |
| Mina de pólvora | 25 vigor / 9 s | 0,60 s, assenta em 0,40 s | Mina à frente dos pés. Arma em 1 s (o anel muda de cor) e explode quando um inimigo chega a 1,4 u: raio 3 (+Estilhaços), 220% do dano, empurrão de 1 u. No máximo duas, e a mais antiga sai. Duram 25 s. |
| Garrafa incendiária | 30 vigor / 12 s | 0,60 s, arremesso em 0,30 s | Arco de 0,55 s até o ponto mirado. Incendeia o chão em raio 2,4 por 4 s, com 30% do dano a cada 0,5 s em quem estiver dentro (9 pulsos). |

Explosões, chuva e fogo não ferem o jogador. Chefes recebem dano, mas não são empurrados nem desacelerados.

## Árvores

O orçamento é de 3 pontos por nível, incluindo o nível 1, recalculado ao carregar como no Guerreiro e na Druida. Os investimentos ficam em `character.marksmanRanks`. Nós novos entram sempre no fim da tabela de `marksman-model.mjs`, para não alterar a distribuição de saves existentes.

**Arqueira:**

| Ramo | Selo | Máx. | Requisito | Efeito |
|---|---|---|---|---|
| Arco | Disparo | 5 | — | +6% de dano do Disparo por ponto |
| Arco | Flecha Perfurante | 3 | — | Libera; +10% de dano por ponto |
| Arco | Leque | 1 | nível 4, Disparo | Libera |
| Arco | Chuva de Flechas | 1 | nível 6, Perfurante | Libera |
| Caça | Recuo | 3 | — | Libera; −0,5 s de recarga por ponto |
| Caça | Tiro de Emboscada | 3 | nível 4, Recuo | Depois do Recuo, o próximo Disparo, Perfurante ou Leque em até 3 s causa +15% por ponto (uma vez) |
| Caça | Falcão | 3 | nível 2 | Libera o falcão; +10% de dano dele por ponto |
| Passivas | Precisão / Vitalidade / Concentração / Passo leve / Fôlego | 5 cada | — | +8% de dano / +10% de vida / +10% de foco / +3% de movimento / +0,4 vida/s |

**Mercenário:**

| Ramo | Selo | Máx. | Requisito | Efeito |
|---|---|---|---|---|
| Besta | Virote pesado | 5 | — | +6% de dano por ponto |
| Besta | Rajada | 3 | — | Libera; +10% de dano por ponto |
| Besta | Perfuração | 2 | nível 4, Virote | +1 inimigo atravessado por ponto |
| Pólvora | Bomba de fragmentação | 3 | — | Libera; +10% de dano por ponto |
| Pólvora | Estilhaços | 3 | nível 4, Bomba | +12% de raio da Bomba e da Mina por ponto |
| Pólvora | Mina de pólvora | 1 | nível 6, Bomba | Libera |
| Pólvora | Garrafa incendiária | 1 | nível 6, Bomba | Libera |
| Passivas | Calibre / Couro curtido / Gibão reforçado / Resistência / Fôlego | 5 cada | — | +8% de dano / +10% de vida / +4 de armadura / +10% de vigor / +0,4 vida/s |

A redução de recarga dos itens (até 50%) vale para as habilidades e para o comando do falcão; os tiros básicos mantêm o ritmo autoral.

## Atributos

Base marcial própria, por nível (`v2/scripts/marksman-model.mjs`), antes dos itens e das passivas:

| | Vida | Recurso | Dano | Recuperação do recurso | Movimento |
|---|---|---|---|---|---|
| Arqueira | 95 + 14 × (nível − 1) | 70 + 4 × (nível − 1) | 22 + 5,5 × (nível − 1) | 6/s | 6,4 u/s |
| Mercenário | 110 + 16 × (nível − 1) | 80 + 4 × (nível − 1) | 26 + 6,5 × (nível − 1) | 5/s | 5,8 u/s |

Sem horda, Grimório ou bloqueio.

## Equipamento

Catálogo por classe em `v2/scripts/marksman-equipment.mjs` (`marksmanGear(classId)`):

- **Arma da classe:** **Arco** (Arqueira, slot `bow`) ou **Besta** (Mercenário, slot `crossbow`). Base de dano somada ao dano físico, como a espada do Guerreiro: `(dano do nível + dano-base da arma) × (1 + % de dano dos afixos) × passivas`. O aprimoramento da forja (+25% da base por grau) vale.
- **Afixos do Arco:** % de dano, foco máximo, recuperação de foco, redução de recarga e movimento.
- **Afixos da Besta:** % de dano, vida, recuperação de vigor, redução de recarga e armadura percentual.
- **Demais peças:** armadura, elmo, botas e dois anéis do catálogo marcial (`warrior-equipment.mjs`), com os afixos marciais. Espada e escudo não aparecem no mercador, no loot nem nos slots.
- **Selo das peças:** armas levam `classId: "archer"` ou `"mercenary"` e só servem à própria classe; o Guerreiro e o Necromante as descartam ao validar. As demais peças continuam com o selo marcial.
- **Arma inicial:** um personagem novo recebe um Arco ou uma Besta comum de nível 1. Personagens criados nas etapas 1 e 2 recebem a arma uma única vez ao carregar (`character.marksmanEquipmentVersion: 1`); vender ou guardar a peça não a recria.
- **Loot, mercador, forja e comparação** usam o mesmo catálogo. A categoria Armas do inventário mostra o ícone da arma da classe, e não há categoria de segunda mão.

O visual da arma no personagem é o do modelo; trocar de Arco não muda o modelo 3D.

## Registro de classes

`v2/scripts/class-registry.mjs` reúne nome, modelo, recurso, brasão, cor de prévia, citação e catálogo de cada classe (`CLASS_IDS`, `classInfo`, `isMartial`, `isMarksman`, `resourceName`). `save-model.mjs` reexporta `CLASS_IDS`, e `class-gear.mjs` escolhe o catálogo de equipamento por classe. Telas (título, jornadas, Relicário, HUD) leem o registro; as regras específicas continuam nos módulos de cada classe. Uma classe nova entra no registro e nos ramos de regra dela, sem reordenar as existentes. A árvore usa o mesmo painel genérico do Guerreiro e da Druida (`createMarksmanTalents` em `talents-panel.mjs`).

## Modelos e animações

Fontes Tripo fornecidas pelo usuário:

- `blender/reference/archer_hero/archer_hero_source.glb` (personagem com rig Mixamo) e `archer_hero_sheet.glb` (prancha com arco, aljava e flecha).
- `blender/reference/mercenary/mercenary_source.glb` e `mercenary_sheet.glb` (prancha com besta, bomba, poções e bolsas).
- `blender/reference/falcon/falcon_source.glb` (falcão com rig Tripo de 16 ossos, asas abertas).

O gerador [ranged_heroes.py](../blender/scripts/ranged_heroes.py):

1. Recorta a arma da prancha por faixa X.
2. Alinha os eixos dela por PCA (comprimento, frente do tiro, cima).
3. Ajusta a escala à altura do corpo: arco com 74%, besta com 50%.
4. Une a arma à malha com peso rígido na mão: arco na esquerda, besta na direita.
5. Gera os clipes in-place a 30 fps com IK analítica.

| Personagem | Clipes |
|---|---|
| Ambos | `idle`, `walk`, `strafe_left`, `strafe_right`, `shoot`, `dodge`, `death` |
| Só a Arqueira | `shoot_up` (Chuva, mira a 45°), `leap_back` (Recuo) |
| Só o Mercenário | `throw` (bomba e garrafa, por cima do ombro com a mão esquerda), `plant` (mina) |

Texturas reduzidas para 1024 px e sem mapa normal. A origem fica no centro das solas, sob `ArcherHeroOrigin` / `MercenaryOrigin`.

O [falcon.py](../blender/scripts/falcon.py) inclina o corpo ereto da fonte para o voo e gera `idle` (batida de asas em loop, com a ponta da asa atrasada), `glide` (planar) e `dive` (asas recolhidas e garras à frente). O renderizador só repete o clipe `idle` em loop, por isso a batida usa esse nome. A altura e o deslocamento do voo ficam no jogo.

```powershell
blender --background --python blender/scripts/ranged_heroes.py -- archer
blender --background --python blender/scripts/ranged_heroes.py -- mercenary
blender --background --python blender/scripts/falcon.py
node v2/tools/build.cjs
```

**Saídas e registro:**
- `.blend`: `blender/models/archer_hero.blend`, `mercenary.blend`, `falcon.blend`.
- GLB: `blender/exports/archer_hero.glb`, `mercenary.glb`, `falcon.glb`.
- `v2/assets/models.json`: `archerHero`, `mercenary` e `falcon`. Os dois heróis usam `stride` 1,43 e `strafeStride` 1,1, em unidades do jogo, iguais às constantes `STRIDE` e `STRAFE_STRIDE` do gerador.

**Pranchas de revisão:**
- `blender/scripts/ranged_heroes_review.py`.
- `blender/previews/archer_hero_poses_*.png`, `mercenary_poses_*.png` e `falcon_poses.png`.

As gerações foram feitas com Blender em segundo plano, porque a sessão aberta do usuário tinha trabalho não salvo de outro asset. Os `.blend` podem ser abertos e revisados no Blender.

## Sons

Efeitos procedurais em `v2/scripts/audio.mjs`, disparados pelos eventos de combate de `marksman.mjs` (mapa `EVENT_SOUNDS` em `sound-events.mjs`):

| Som | Quando |
|---|---|
| `bowShot` | Disparo, Flecha Perfurante, Leque e Chuva de Flechas (corda) |
| `crossbowShot` | Virote pesado e cada virote da Rajada (estalo e baque) |
| `bombThrow` | Arremesso da Bomba e da Garrafa (sopro com pavio) |
| `powderBlast` | Explosão da Bomba e da Mina |
| `mineArm` | Mina terminando de armar (dois cliques metálicos) |
| `fireIgnite` | Garrafa incendiária acendendo o chão |
| `falconCry` | Comando F do falcão |
| `windCut` | Recuo e cada mergulho do falcão |

As ações dos atiradores não tocam mais o `raio` (som do Tiro de Osso); a esquiva continua com ele, como nas outras classes. Os impactos continuam com o `hit` comum.

## Leitura do combate

- O tiro do jogador tem um traço em linha na cor da classe: verde na Arqueira, âmbar no Mercenário. Flechas inimigas continuam como orbe amarelo, sem traço.
- A bomba e a garrafa voam como uma esfera escura com pavio aceso, sobre a marca de queda no chão. A mina mostra um anel claro enquanto arma e um anel laranja com o raio de disparo quando armada.
- A Flecha Perfurante mostra a linha do tiro durante a carga, e a Chuva marca a área antes das ondas.
- Inimigos marcados pelo falcão têm um anel dourado.

## Verificação

- Regras:
  - `node --test v2/tests/marksman.test.mjs`: registro, saves, atributos, tiro básico, perfuração, paredes, esquiva, barra e catálogo.
  - `node --test v2/tests/marksman-skills.test.mjs`: árvores e orçamento, passivas, bloqueio sem selo, as oito habilidades, falcão automático, comando, marca e bônus, limpeza na morte e na troca de cena.
  - `node --test v2/tests/marksman-equipment.test.mjs`: Arco e Besta por classe, validação cruzada, dano da arma e aprimoramento, arma inicial e entrega única, equipar, comprar, forjar e vender, e os sons de cada ação.
  - A suíte completa da v2 continua passando.
- Navegador: `node v2/tests/marksman-browser-check.cjs` (Playwright + Edge, perfil isolado por classe). Cobre:
  - Novo personagem com cinco classes, HUD e tiro básico.
  - Selos investidos pela interface da árvore.
  - Cada habilidade usada e capturada no momento em que aparece.
  - Falcão em mergulho, comando F e marca.
  - Inventário com a arma inicial equipada e a ficha da arma.
  - Os sete sons novos tocando num contexto WebAudio real.
  - Chão claro e qualidade baixa.
  - Sem erros de página nem requisições externas.

  Evidências em [review/v2/marksman](../review/v2/marksman/).

## Limites conhecidos

- Números iniciais, sem campanha completa jogada com essas classes.
- Animações procedurais de primeira versão; sem clipe de reação a dano (`hit`). O Recuo é um salto curto, sem cambalhota.
- Recuo e Mina ainda prendem o personagem (pose de corpo inteiro).
- O falcão não pode ser alvo nem morrer e voa através de paredes; o mergulho automático exige linha de visão a partir da Arqueira.
- A bomba voa sobre obstáculos; só a explosão é bloqueada por paredes.
- O retrato 2D do menu existe só para o Necromante; as demais classes usam o modelo 3D.
