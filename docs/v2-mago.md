# Mago — classe jogável

Implementado na v2. O Novo Jogo oferece seis classes; o **Mago** é a sexta. Fogo para grupos, gelo para quem chega perto e o arcano para sair do caminho. Usa o mesmo motor de ações da Arqueira e do Mercenário ([v2-arqueira-mercenario.md](v2-arqueira-mercenario.md)): barra fixa, projéteis reais, atirar andando com camadas de tronco e pernas, tiro contínuo segurando o botão e mira na altura do tronco.

## Barra e feitiços

| Slot | Feitiço | Custo / recarga | Tempo | Efeito |
|---|---|---|---|---|
| Clique / 1 | Seta Arcana | — / 0,45 s | 0,45 s, solta em 0,20 s | 60% do dano mágico. Projétil a 22 u/s, alcance 12 u, tolerância de acerto 0,95. Anda a 85% da velocidade. |
| Botão direito / 2 | Bola de Fogo | 18 mana / 4 s | 0,60 s, solta em 0,30 s | Projétil a 16 u/s que explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance (12 u), em raio 2,2, com 140% do dano. Paredes bloqueiam a explosão. Anda a 60%. |
| 3 / Q | Rajada de Gelo | 20 mana / 7 s | 0,50 s, efeito em 0,22 s | Cone de 70° e 6 u à frente, com 110% do dano. Inimigos atingidos ficam 40% mais lentos por 3 s (anel azul no chão); chefes recebem o dano, mas não ficam lentos. Anda a 60%. |
| C / E / 4 | Esquiva | — | — | Esquiva comum. |
| R / 5 | Teleporte | 15 mana / 8 s (−1 s por ponto) | 0,35 s, salto em 0,15 s | Salta até 7 u na direção da mira, ou até o ponto mirado se estiver mais perto, sem atravessar paredes. Deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. Fica parado durante a ação. |
| T / 6 | Meteoro | 40 mana / 14 s | 0,70 s, marca em 0,45 s | Área de raio 2,8 marcada no ponto mirado (até 12 u). Depois de 1 s, o meteoro cai com 320% do dano em quem estiver dentro. Anda a 50%. |

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

## Atributos e equipamento

A base vem do mesmo modelo mágico do Necromante e da Druida (nível e itens), sem horda nem Grimório, ajustada pelas passivas (`mageAttributes` em `marksman-model.mjs`). O Mago usa o **catálogo arcano** compartilhado: cajado, grimório, manto, capuz, botas e dois anéis, com o dano mágico e os afixos desse catálogo. Começa sem peças, como o Necromante. O cajado do modelo é visual; trocar o item não muda o modelo 3D.

## Modelo e rig

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
- `.blend`: `blender/models/mage_hero.blend`.
- GLB: `blender/exports/mage_hero.glb`.
- `v2/assets/models.json`: `mageHero`, com `layered: true`, `stride` 1,29 e `strafeStride` 1,01, iguais às constantes do gerador na escala do jogo.

**Pranchas de revisão:**
- `blender/previews/mage_hero_weights_before.png` e `mage_hero_weights_after.png`: na versão "depois", cada cor é um osso: amarelo, mão direita; laranja, mão esquerda; vermelho, cabeça; verde, quadril; verde-água, coxas; azul, coluna; roxo, braços; marrom, pernas e pés.
- `mage_hero_poses_front.png` e `mage_hero_poses_side.png`.

## Leitura e sons

- **Projéteis:** a Seta Arcana é um projétil pequeno e lilás, com traço; a Bola de Fogo é maior e laranja.
- **Avisos e marcas no chão:** a Rajada mostra um arco gelado no chão e anéis azuis nos alvos lentos. O Teleporte deixa um círculo arcano no ponto de partida. O Meteoro marca a área antes de cair.
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
