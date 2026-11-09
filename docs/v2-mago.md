# Mago — classe jogável

Implementado na v2. O Novo Jogo oferece seis classes; o **Mago** é a sexta. Fogo para grupos, gelo para quem chega perto e o arcano para sair do caminho. Usa o mesmo motor de ações da Arqueira e do Mercenário ([v2-arqueira-mercenario.md](v2-arqueira-mercenario.md)): barra montável (desde 08/11/2026), projéteis reais, atirar andando com camadas de tronco e pernas, tiro contínuo segurando o botão e mira na altura do tronco.

## Barra e feitiços

| Slot | Feitiço | Custo / recarga | Tempo | Efeito |
|---|---|---|---|---|
| Clique / 1 | Seta Arcana | — / 0,45 s | 0,45 s, solta em 0,20 s | 60% do dano mágico. Projétil a 22 u/s, alcance 12 u, tolerância de acerto 0,95. Anda a 85% da velocidade. |
| Botão direito / 2 | Bola de Fogo | 18 mana / 4 s | 0,60 s, solta em 0,30 s | Projétil a 16 u/s que explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance (12 u), em raio 2,2, com 140% do dano. Paredes bloqueiam a explosão. Anda a 60%. |
| 3 / Q | Rajada de Gelo | 20 mana / 7 s | 0,50 s, efeito em 0,22 s | Cone de 70° e 6 u à frente, com 110% do dano. Inimigos atingidos ficam 40% mais lentos por 3 s (anel azul no chão); chefes recebem o dano, mas não ficam lentos. Anda a 60%. |
| C / E / 4 | Esquiva | — | — | Esquiva comum. |
| R / 5 | Teleporte | 15 mana / 8 s (−1 s por ponto) | 0,35 s, salto em 0,15 s | Salta até 7 u na direção da mira, ou até o ponto mirado se estiver mais perto, sem atravessar paredes. Deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. Fica parado durante a ação. |
| T / 6 | Meteoro | 40 mana / 4 s (era 14 s até 08/11/2026) | 0,70 s, marca em 0,45 s | Área de raio 2,8 marcada no ponto mirado (até 12 u). Uma bola de fogo desce do céu em diagonal, vinda de trás do Mago, com rastro de chamas e a sombra crescendo no chão (efeito `meteor` em `vfx.mjs`). Depois de 1 s ela chega com 320% do dano em quem estiver dentro, e o chão fica em chamas por 3 s em raio 2,4: 20% do dano a cada 0,5 s (6 pulsos). Anda a 50%. |

A redução de recarga dos itens (até 50%) vale para todos os feitiços, menos a Seta Arcana.

## Árvore

Orçamento de 3 pontos por nível, como nas outras classes, salvo em `character.marksmanRanks`. Nós novos entram sempre no fim da tabela.

| Ramo | Selo | Máx. | Requisito | Efeito |
|---|---|---|---|---|
| Arcano | Seta Arcana | 5 | — | +6% de dano da Seta por ponto |
| Fogo | Bola de Fogo | 3 | — | Libera; +10% de dano por ponto |
| Gelo | Rajada de Gelo | 3 | — | Libera; +10% de dano por ponto |
| Arcano | Teleporte | 3 | — | Libera; −1 s de recarga por ponto |
| Fogo | Combustão | 3 | nível 4, Bola de Fogo | A explosão deixa o chão em chamas (raio 2) por 1 s por ponto, com 25% do dano a cada 0,5 s |
| Gelo | Estilhaçar | 3 | nível 4, Rajada de Gelo | Inimigos lentos pela Rajada recebem +10% por ponto do dano de fogo e arcano |
| Arcano | Eco Arcano | 3 | nível 4, Teleporte | +25% de dano do eco por ponto |
| Fogo | Meteoro | 1 | nível 6, Bola de Fogo | Libera |
| Passivas | Intelecto / Vitalidade / Sabedoria / Meditação / Fôlego | 5 cada | — | +8% de dano mágico / +10% de vida / +10% de mana / +15% de regeneração de mana / +0,4 vida/s |

### Habilidades novas (08/11/2026)

Desenhadas em [docs/habilidades/arvores.json](habilidades/README.md). Entram pela barra montável (clique num slot do HUD). Números iniciais, sem balanceamento de campanha.

| Ação | Custo / recarga | Efeito |
|---|---|---|
| Setas Perseguidoras (Arcano, nível 4, requer Seta Arcana) | 20 mana / 6 s | Cinco setas em leque de 70°, 40% do dano cada; cada uma vira até 6 rad/s para o inimigo mais próximo à frente (até 7 u). |
| Esfera de Gelo (Gelo, nível 6, requer Rajada de Gelo) | 30 mana / 4 s | Um pequeno planeta de gelo com dois anéis inclinados, como Saturno (efeito `iceOrb`), que flutua à altura do peito e atravessa o campo bem devagar: 2 u/s por até 10 u (5 s), parando em paredes. Fere uma vez quem toca, em raio 1,1 (50%). Girando, solta dois cristais opostos a cada 0,15 s em espiral, a partir da borda; cada cristal curva até 5 rad/s para inimigos a até 3 u, com 20% do dano e 20% de lentidão por 1 s, que conta para o Estilhaçar. |
| Familiar de Fogo (Fogo, nível 8, requer Combustão) | 35 mana / 25 s | Espírito de fogo em órbita por 20 s. A cada 1,2 s lança uma bola de fogo (40%, explosão de raio 1,2; com a Combustão, o chão queima) no inimigo mais próximo do Mago, até 9 u, com linha de visão. Lançar de novo renova. |
| Golem de Gelo (Gelo, nível 10, requer Esfera de Gelo) | 40 mana / 30 s | Companheiro por 25 s, com 120% da vida máxima do Mago. Avança no inimigo mais próximo e golpeia a cada 1,4 s com 70% do dano mágico, deixando-o 30% mais lento por 1,5 s (chefes não). Inimigos a menos de 5 u dele passam a atacá-lo. Só um por vez; usa o modelo da Abominação com tinta azul-gelo e escala 0,85 (`companions.mjs`). |

Testes em `v2/tests/class-ideas.test.mjs`; navegador em `v2/tests/class-ideas-browser-check.cjs` (evidências em `review/v2/class-ideas/`).

## Atributos e equipamento

A base vem do mesmo modelo mágico do Necromante e da Druida (nível e itens), sem horda nem Grimório, ajustada pelas passivas (`mageAttributes` em `marksman-model.mjs`). O Mago usa o **catálogo arcano** compartilhado: cajado, grimório, manto, capuz, botas e dois anéis, com o dano mágico e os afixos desse catálogo. Começa sem peças, como o Necromante. O cajado do modelo é visual; trocar o item não muda o modelo 3D.

## Modelo e rig

### Modelo atual: novo mago em T

O registro `mageHero` usa agora `blender/exports/mage_hero_t.glb`, gerado por
`blender/scripts/mage_hero_t.py`. A nova malha fornecida no Blender está preservada em
`blender/models/sources/mage_hero_t_source.blend`; a cena animada é `blender/models/mage_hero_t.blend`.
O modelo e o gerador anteriores continuam preservados, conforme a seção histórica abaixo.

O rig novo tem 29 ossos, com IDs `mixamorig:` para manter a separação de tronco e pernas.
São controles FK com soluções de braços e pernas calculadas e gravadas nos clipes; não há
controladores IK interativos. Chapéu, barba e lados do manto têm ossos próprios. Os pesos
da malha nova são atribuídos por região, com no máximo duas influências por vértice.
O cajado foi extraído da malha antiga com UV e material, endireitado e preso rigidamente
à mão direita. A mão tem fechamento dos dedos; não há articulação individual de cada dedo.
A pose T original continua como bind pose. Todos os clipes são in-place e usam 30 FPS.

**Locomoção humana revisada.** `mage_hero_gait.py`, chamado pelo gerador, refaz `walk`,
`strafe_left` e `strafe_right`. O apoio percorre o chão a velocidade constante; o balanço
do pé conserva a tangente ao sair e voltar ao apoio, evitando as paradas entre fases.
A passada rola do calcanhar à ponta, com biqueira articulada; a altura é conferida na
sola real da malha. Quadril, ombros e cabeça têm contraposição e pequenos atrasos.
O braço livre fica mais baixo, perto do corpo, balança para trás e flexiona à frente;
o braço do cajado mantém uma pegada estável, com compensação do punho e haste acima do piso.
Os passos laterais recebem uma base mais aberta, transferência lateral do quadril,
inclinação discreta dos pés e postura dos braços própria. Manto, barba e chapéu seguem
o corpo com atraso. Os três ciclos continuam com frames 1–25 (0,8 s); os strides 1,29/1,01,
a velocidade de jogo, o rig e os clipes de combate foram mantidos.

Prévias frontal, de perfil e isométrica em `blender/previews/mage_gait/locomotion.gif`.
A auditoria inclui velocidade de apoio compensada pelo deslocamento do ator, flexão
dos joelhos, amplitude do braço livre, ciclos, piso e rigidez do cajado. Ela verifica
contatos em piso plano; não cria IK de terreno no runtime.

```powershell
blender --background --python blender/scripts/mage_hero_t.py
blender --background blender/models/mage_hero_t.blend --python-exit-code 1 --python blender/scripts/validate_mage_hero_t.py -- --gait
blender --background blender/models/mage_hero_t.blend --python blender/scripts/mage_hero_t_review.py -- --gait
python blender/scripts/pack_mage_gait_preview.py
node v2/tools/build.cjs
node v2/tests/mage-gait-browser-check.cjs
```

O cenário de navegador usa perfil isolado e cobre frente, ré, laterais, diagonal,
conjuração andando e grupo em chão claro/qualidade baixa. Evidências em
`review/v2/mage-gait/`. A cena e o GLB anteriores à revisão ficam em
`blender/backups/mage_gait/`, fora das pastas de assets atuais.

| Action no Blender | Clipe GLB | Frames | Duração | Poses e eventos |
|---|---|---|---|---|
| `AN_MageT_idle` | `idle` | 1–61 | 2 s | Respiração, barba e ponta do chapéu; ciclo |
| `AN_MageT_walk` | `walk` | 1–25 | 0,8 s | Contato, passagem e troca de apoio; ciclo |
| `AN_MageT_strafe_left` | `strafe_left` | 1–25 | 0,8 s | Passada lateral à esquerda; ciclo |
| `AN_MageT_strafe_right` | `strafe_right` | 1–25 | 0,8 s | Passada lateral à direita; ciclo |
| `AN_MageT_cast` | `cast` | 1–16 | 0,5 s | Preparação 1–6, disparo recomendado 8, sobreposição e recuperação 9–16 |
| `AN_MageT_cast_up` | `cast_up` | 1–22 | 0,7 s | Erguer 1–8, sustentar 9–12, apontar/marcar 15, recuperar 16–22 |
| `AN_MageT_dodge` | `dodge` | 1–16 | 0,5 s | Recolher o corpo e o cajado, abaixar e recuperar |
| `AN_MageT_death` | `death` | 1–31 | 1 s | Perda de equilíbrio, queda para trás e pose final mantida |

As durações usam o intervalo entre o primeiro e o último frame. Os frames 8 de `cast` e 15
de `cast_up` são referências visuais para disparo/marcação; a detecção real continua nas regras
do feitiço, com os tempos já documentados acima. A troca visual não alterou dano ou recargas.
O GLB exporta uma faixa NLA por clipe, com amostragem a cada frame, sem animar escala dos ossos.

Na raiz do projeto, com Blender e Python/Pillow instalados:

```powershell
blender --background --python blender/scripts/mage_hero_t.py -- --blocking
# Inspecionar o blocking em backups/blocking/mage_hero_t_blocking.blend antes do refinamento.
blender --background --python blender/scripts/mage_hero_t.py
blender --background blender/models/mage_hero_t.blend --python blender/scripts/validate_mage_hero_t.py
blender --background blender/models/mage_hero_t.blend --python blender/scripts/mage_hero_t_review.py
python blender/scripts/pack_mage_hero_t_preview.py
node v2/tools/build.cjs
```

Prévias PBR em Eevee: `blender/previews/mage_hero_t/poses.png`, `animations.gif` e um GIF
por clipe. A auditoria em `validation.json` verificou todos os frames: pesos, fechamento
dos ciclos, pés fixos nas conjurações, rigidez do cajado e contato da malha com o solo.
Ela levou à correção do manto na esquiva e da altura da pose final de morte.
Essas verificações não equivalem a uma garantia de ausência de toda interpenetração entre
roupa, barba e braços em combinações de camadas. A revisão visual e o teste de navegador
cobriram poses representativas e conjuração andando; não houve campanha completa jogada.

Evidências da nova versão: `review/v2/mage-t/`. Para repetir sem substituir as capturas antigas:

```powershell
$env:NR_MAGE_REVIEW_DIR='../../review/v2/mage-t'
node v2/tests/mage-browser-check.cjs
```

### Modelo anterior (preservado)

Fonte Tripo do usuário: `blender/reference/mage/mage_source.glb` (rig Mixamo em pose A, cajado na mão direita). O esqueleto estava no lugar certo, mas os **pesos** não:

| Parte | Rig original | Correção |
|---|---|---|
| Cajado | Metade de cima no antebraço direito, metade de baixo no pé direito: dobraria ao andar | Rígido na mão direita. O eixo da haste é encontrado por ajuste de reta nos vértices da base |
| Barba | Parte em um dedo da mão esquerda, parte na coluna | Cabeça, com a ponta dividida com a parte de cima da coluna |
| Aba do chapéu | Misturada com ombros e braços | Cabeça, inclusive as bordas que descem até a altura dos ombros |
| Luvas | Punho fechado preso a um dedo | Mão inteira, com o fim da manga |
| Barra do manto | Pés e canelas: esticaria a cada passo | Quadril e coxa do lado, mais forte perto da barra |

O restante mantém o peso original. O gerador [mage_hero.py](../blender/scripts/mage_hero.py) aplica a correção e cria os clipes in-place a 30 fps:

| Clipe | Uso |
|---|---|
| `idle`, `walk`, `strafe_left`, `strafe_right` | Parado e passadas |
| `cast` | Aponta o cajado ao alvo: Seta, Bola de Fogo, Rajada e Teleporte |
| `cast_up` | Ergue o cajado e o baixa apontando o chão: Meteoro |
| `dodge`, `death` | Esquiva e morte |

A origem fica entre os pés; o cajado não entra na conta.

```powershell
blender --background --python blender/scripts/mage_hero.py
node v2/tools/build.cjs
```

**Saídas e registro:**
- `.blend`: `blender/models/sources/mage_hero.blend`.
- GLB: `_to_delete/blender-models/exports/mage_hero.glb`.
- `v2/assets/models.json`: `mageHero`, com `layered: true`, `stride` 1,29 e `strafeStride` 1,01, iguais às constantes do gerador na escala do jogo.

**Pranchas de revisão:**
- `blender/previews/mage_hero_weights_before.png` e `mage_hero_weights_after.png`: na versão "depois", cada cor é um osso: amarelo, mão direita; laranja, mão esquerda; vermelho, cabeça; verde, quadril; verde-água, coxas; azul, coluna; roxo, braços; marrom, pernas e pés.
- `mage_hero_poses_front.png` e `mage_hero_poses_side.png`.

## Leitura e sons

- **Projéteis:** a Seta Arcana é um projétil pequeno e lilás, com traço; a Bola de Fogo é maior e laranja.
- **Avisos e marcas no chão:** a Rajada mostra um arco gelado no chão e anéis azuis nos alvos lentos. O Teleporte deixa um círculo arcano no ponto de partida. O Meteoro marca a área, a bola de fogo aparece descendo antes do impacto e o chão queima depois. A Esfera de Gelo é o planeta com anéis; os cristais saem girando dela.
- **Sons novos:**
  - `arcaneBolt`: Seta Arcana.
  - `frostBlast`: Rajada de Gelo.
  - `blink`: Teleporte.
- **Sons reutilizados:**
  - `fireIgnite`: lançamento da Bola de Fogo e conjuração do Meteoro.
  - `powderBlast`: explosão da Bola de Fogo.
  - `explosao`: queda do Meteoro.

## Verificação

- **Regras:** `node --test v2/tests/mage.test.mjs`. Cobre:
  - Registro, catálogo arcano e save.
  - Árvore e passivas.
  - Os cinco feitiços: explosão no contato, na parede e no fim do alcance; Combustão; cone e lentidão; Estilhaçar; Teleporte com parede e ponto mirado; Meteoro.
  - Esquiva e limpeza ao trocar de cena.
- **Navegador:** `node v2/tests/mage-browser-check.cjs` (Playwright + Edge, perfil isolado). Cobre:
  - Criação pela carta do Novo Jogo.
  - Seta Arcana andando com as camadas de tronco e pernas.
  - Selos investidos pela interface da árvore.
  - Cada feitiço capturado no momento em que aparece.
  - Inventário com cajado e grimório.
  - Sons, chão claro e qualidade baixa.
  - Sem erros de página nem requisições externas.

  Evidências em [review/v2/mage](../review/v2/mage/).

## Limites conhecidos

- Números iniciais, sem campanha completa jogada com a classe.
- Animações procedurais de primeira versão; sem clipe de reação a dano. O Teleporte usa o `cast`, sem clipe próprio de desaparecer e reaparecer.
- A Combustão usa o mesmo chão em chamas da Garrafa incendiária.
- O retrato 2D do menu existe só para o Necromante.
