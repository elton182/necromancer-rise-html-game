# Arqueira e Mercenário — classes jogáveis

Implementado na v2. O Novo Jogo oferece seis classes: Necromante, Guerreiro, Druida, **Arqueira**, **Mercenário** e Mago. Cada personagem tem seu próprio save e progresso. Saves anteriores sem classe continuam Necromantes.

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

Desde 08/11/2026 a barra é **montável** (`v2/scripts/skill-loadout.mjs`): clicar num slot do HUD abre o seletor com todas as ações da classe. Escolher uma ação que já está na barra troca as duas de lugar; escolher uma de fora substitui a do slot. O tiro básico e a Esquiva ficam sempre na barra, em qualquer posição. Ações sem selo aparecem bloqueadas no seletor e, se estiverem na barra, mostram "Libere na árvore"; sem o selo, o comando não gasta recurso nem inicia recarga. A barra fica em `character.skillLoadout` (ids de ação); saves sem ela recebem a barra padrão abaixo.

Barra padrão (as seis primeiras ações da tabela de cada classe):

| Slot | Arqueira | Mercenário |
|---|---|---|
| Clique / 1 | Disparo | Virote pesado |
| Botão direito / 2 | Flecha Perfurante | Rajada |
| 3 / Q | Recuo | Bomba de fragmentação |
| C / E / 4 | Esquiva | Esquiva |
| R / 5 | Chuva de Flechas | Mina de pólvora |
| T / 6 | Tiro Seguidor | Molotov |
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
| Chuva de Flechas | 35 foco / 12 s | 0,60 s, marca em 0,35 s | Área de raio 3–4,2 conforme pontos no ponto mirado (até 12 u), marcada no chão. Depois de 0,7 s caem 5 ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro. |
| Tiro Seguidor (antigo Leque, id `fan`) | 22 foco / 7 s | 0,50 s, solta em 0,26 s | Cinco flechas em cone de 50°, alcance 10 u, 70% do dano cada. Cada flecha vira até 4 rad/s em direção ao inimigo mais próximo à frente dela (até 6 u); a curva é visível no ar. |
| Saraivada Seguidora | 25 foco / 9 s | 0,80 s, primeira flecha em 0,20 s | Trava no inimigo mais perto da mira (até 3,5 u dela e 13 u da Arqueira), marcado por um anel dourado. Cinco flechas, uma a cada 0,12 s, com 45% do dano cada, que viram até 9 rad/s em direção a ele. Se o alvo cair, as restantes buscam o inimigo mais próximo à frente (até 8 u). Anda a 50% durante a ação. |
| Impacto Celeste | 25 foco / 12 s | 0,60 s, marca em 0,30 s | Marca uma área de raio 4,5 no ponto mirado (até 12 u). O falcão desce até ela e, 0,9 s depois, a área recebe 150% do dano e empurra os inimigos 1 u a partir do centro (chefes não são empurrados). Até o impacto o falcão não ataca sozinho e o comando F fica bloqueado. |
| Penas Voadoras (passiva) | Sem custo / 7 s | Automática, com inimigos visíveis até 8 u | Seis penas saem do falcão, uma para cada inimigo mais próximo da Arqueira (até 8 u, com linha de visão), com 40% do dano cada; seguem o alvo (até 6 rad/s). Sem alvos suficientes, as que sobram seguem a mira em leque de 0,6 rad, sem procurar alvo. |
| Disparo Preciso | 35 foco / 20 s | 1,45 s, solta em 1,2 s | 500% do dano, alcance 24 u e velocidade 65 u/s; para no primeiro inimigo ou parede. Durante a preparação, linha clara mostra a trajetória e anda a 20%. Esquiva cancela, mantendo custo e recarga. |
| Rasante Relâmpago | 30 foco / 16 s | Prepara 0,25 s; seis rasantes em 1,5 s | Seleciona área de raio 4,5 até 12 u. Cada rasante acerta uma presa com 65% do dano. Prioriza a Marca do Caçador dentro da área, depois presas ainda não atingidas; pode repetir. O falcão percorre as trajetórias e causa dano na chegada, respeitando paredes. |
| Saraivada Múltipla | 40 foco / 12 s | Cinco ondas, uma a cada 0,12 s | Variante da Seguidora: até cinco inimigos visíveis a até 5 u da mira e 13 u da Arqueira, cinco flechas de 45% por alvo (até 25). Um inimigo sozinho recebe cinco. Sequências de presas mortas podem passar para presas ainda não selecionadas; não acumulam nos alvos já escolhidos. |
| Chuva de Flechas Explosivas | 45 foco / 16 s | Mesmo atraso e cinco ondas da Chuva | Variante de fogo: 55% por onda, raio 3,6–4,8 conforme pontos da Chuva. Cada onda renova um único campo de fogo até 2 s depois dela; a cada 0,5 s causa 30% do dano de uma onda. |

Desde 10/11/2026, o raio da **Chuva de Flechas** cresce de 3 a 4,2 u: +0,3 u por ponto depois do primeiro, além da escala de dano existente. O aviso acompanha o raio real. Chuva Explosiva e Saraivada Múltipla são opções da barra montável, compartilham a recarga com suas ações de origem e usam os pontos delas para a escala de dano. Cada lançamento usa a recarga e o custo da variante escolhida. Disparo Preciso e Rasante ganham +10% do dano base por ponto depois do primeiro, além das sinergias de ramo.

**Emboscada em Dupla:** o primeiro acerto do tiro fortalecido por Tiro de Emboscada chama um Impacto Celeste gratuito no ponto atingido, se o falcão estiver livre. Uma ativação por Recuo, compartilhada pelas flechas do Leque; não duplica o bônus de Emboscada. Cada ponto depois do primeiro acrescenta 10% ao multiplicador desse Impacto. Se o falcão estiver ocupado, o acerto consome a oportunidade sem guardar um Impacto para depois.

**Impacto Feroz:** após qualquer Impacto Celeste, três rajadas circulares de seis penas saem do ponto do impacto, a primeira após 0,15 s e as seguintes a cada 0,2 s. Usam o dano de Penas Voadoras e +10% por ponto depois do primeiro no aperfeiçoamento. As penas seguem em linha reta, respeitam paredes e não geram novos Impactos.

### Falcão

Com o selo **Falcão** (Caça, nível 2), um falcão acompanha a Arqueira em órbita de 1,5 u, voando a cerca de 2,2 u de altura. Ele não tem vida, não pode ser atingido e não bloqueia ninguém.

- **Automático:** a cada 2,5 s, mergulha no inimigo vivo mais próximo da Arqueira, até 8 u e com linha de visão, causando 35% do dano. Depois volta à órbita.
- **Comando (F):** 10 foco, recarga de 8 s (reduzida pelos itens). Manda o falcão ao inimigo mais perto do ponto mirado, até 3,5 u da mira e 14 u da Arqueira, com 120% do dano. Sem alvo válido, o comando não gasta foco nem inicia a recarga.
- **Marca:** o alvo do comando fica marcado por 4 s (anel dourado no chão) e recebe +15% de dano das flechas da Arqueira (Disparo, Perfurante, Leque e Chuva).
- **Escala:** cada ponto no selo soma +10% ao dano do falcão.
- **No HUD:** o botão da postura passa a mostrar `FALCÃO · F` e a recarga.

### Marca do Caçador e ocupação do falcão

O aperfeiçoamento **Marca do Caçador** (1 ponto, nível 6, requer Falcão) evolui o mesmo comando F. Mantém o mergulho comandado e o custo de 10 foco; a recarga passa a 12 s. Ao comandar, aplica imediatamente uma marca de 8 s, com anel dourado seguindo a presa. Ela recebe **+20% de todo dano**, aplicado uma única vez pelo caminho central de dano, incluindo flechas, fogo, falcão e aliados. Não acumula com a marca antiga de +15% de flechas. Só uma presa pode estar marcada: novo comando remove a marca anterior. O comando exige linha de visão; sem alvo válido não gasta foco nem recarga.

A presa marcada tem prioridade nos mergulhos automáticos enquanto estiver visível e até 8 u da Arqueira. Fora disso, o falcão pode atacar outros inimigos. A marca termina por tempo, morte da presa, morte da Arqueira ou limpeza da cena; não entra no save. Durante Rasante Relâmpago e Impacto Celeste, o falcão não usa mergulhos automáticos, Penas Voadoras nem outro comando ativo. As ações de falcão bloqueadas não gastam foco nem recarga. O Rasante pode continuar após uma esquiva da Arqueira, mas morte e troca de cena o removem.

## Ações do Mercenário

| Ação | Custo / recarga | Tempo | Efeito |
|---|---|---|---|
| Virote pesado | — / 0,8 s | 0,80 s, solta em 0,36 s | 150% do dano. Virote a 28 u/s, alcance 12 u. Atravessa até 2 inimigos extras (+1 por ponto em Perfuração), perdendo 25% a cada um. Empurra 0,35 u. |
| Rajada | 24 vigor / 7 s | 0,80 s | Três virotes, em 0,25, 0,40 e 0,55 s, com 70% do dano cada; cada um atravessa um inimigo, perdendo 25%. |
| Bomba de fragmentação | 20 vigor / 6 s | 0,60 s, arremesso em 0,30 s | Arco de 0,6 s até o ponto mirado (entre 1,5 e 9 u). A marca de queda fica no chão durante o voo. Explode em raio 2,6 (+12% por ponto em Estilhaços) com 160% do dano e empurra 1 u para fora; paredes bloqueiam a explosão. |
| Mina de pólvora | 25 vigor / 9 s | 0,60 s, assenta em 0,40 s | Mina à frente dos pés. Arma em 1 s (o anel muda de cor) e explode quando um inimigo chega a 1,4 u: raio 6 (+Estilhaços), 220% do dano, empurrão de 1 u. No máximo duas, e a mais antiga sai. Duram 25 s. |
| Molotov (antiga Garrafa incendiária, id `firebomb`) | 30 vigor / 12 s | 0,60 s, arremesso em 0,30 s | Arco de 0,55 s até o ponto mirado. Incendeia o chão em raio 2,4 por 4 s, com 30% do dano a cada 0,5 s em quem estiver dentro (9 pulsos). |
| Rede de Caça | 15 vigor / 9 s | 0,60 s, arremesso em 0,30 s | Arco de 0,55 s até o ponto mirado (entre 1,5 e 9 u), com a marca de queda no chão. A rede cobre raio 2,4: 30% do dano e 50% de lentidão por 3 s (+0,5 s por ponto depois do primeiro), com anel bege sob quem ficou preso. Chefes recebem o dano, mas não ficam lentos. Paredes bloqueiam. |
| Armadilha de Urso | 20 vigor / 10 s | 0,60 s, assenta em 0,40 s | Armadilha à frente dos pés. Arma em 0,6 s (anel cinza que clareia) e fecha no primeiro inimigo que chega a 0,9 u: 120% do dano e o prende por 2 s (chefes ficam 50% mais lentos). No máximo duas, e a mais antiga sai. Duram 30 s. |

Explosões, chuva e fogo não ferem o jogador. Chefes recebem dano, mas não são empurrados nem desacelerados.

## Árvores

O orçamento é de 3 pontos por nível, incluindo o nível 1, recalculado ao carregar como no Guerreiro e na Druida. Os investimentos ficam em `character.marksmanRanks`. Nomes, textos, pontos, níveis, pré-requisitos e ramos vêm de [docs/habilidades/arvores.json](habilidades/README.md) (o ramo Pólvora do Mercenário passou a se chamar **Pólvora e Armadilhas**); as ações e números de combate continuam em `marksman-model.mjs`, com as novas sempre no fim da lista.

**Arqueira:**

| Ramo | Selo | Máx. | Requisito | Efeito |
|---|---|---|---|---|
| Arco | Disparo | 5 | — | +6% de dano do Disparo por ponto |
| Arco | Flecha Perfurante | 3 | — | Libera; +10% de dano por ponto |
| Arco | Tiro Seguidor | 5 | nível 4, Disparo | Libera |
| Arco | Saraivada Seguidora | 5 | nível 12, Tiro Seguidor | Libera |
| Arco | Chuva de Flechas | 5 | nível 12, Perfurante | Libera |
| Caça | Recuo | 3 | — | Libera; −0,5 s de recarga por ponto |
| Caça | Tiro de Emboscada | 3 | nível 6, Recuo | Depois do Recuo, o próximo Disparo, Perfurante ou Leque em até 3 s causa +15% por ponto (uma vez) |
| Caça | Falcão | 3 | nível 2 | Libera o falcão; +10% de dano dele por ponto |
| Caça | Penas Voadoras | 5 | nível 4, Falcão | Disparo automático de seis penas a cada 7 s |
| Caça | Impacto Celeste | 5 | nível 8, Falcão | Libera |
| Passivas | Precisão / Vitalidade / Concentração / Passo leve / Fôlego | 5 cada | — | +8% de dano / +10% de vida / +10% de foco / +3% de movimento / +0,4 vida/s |

**Mercenário:**

| Ramo | Selo | Máx. | Requisito | Efeito |
|---|---|---|---|---|
| Besta | Virote pesado | 5 | — | +6% de dano por ponto |
| Besta | Rajada | 3 | — | Libera; +10% de dano por ponto |
| Besta | Perfuração | 2 | nível 4, Virote | +1 inimigo atravessado por ponto |
| Pólvora | Bomba de fragmentação | 3 | — | Libera; +10% de dano por ponto |
| Pólvora | Estilhaços | 3 | nível 4, Bomba | +12% de raio da Bomba e da Mina por ponto |
| Pólvora | Mina de pólvora | 5 | nível 6, Bomba | Libera |
| Pólvora | Molotov | 5 | nível 6, Bomba | Libera |
| Pólvora | Rede de Caça | 3 | nível 2 | Libera; +0,5 s de lentidão por ponto depois do primeiro |
| Pólvora | Armadilha de Urso | 5 | nível 6, Rede de Caça | Libera |
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

Só na Arqueira (`fix_archer_weights` e `SOFT` no gerador):

- **Pesos.** A aljava e as flechas ficam rígidas no peito (`Spine2`), com transição curta para a capa. Os pesos automáticos da fonte prendiam a aljava ao ombro, ao braço, à coxa direita e à cabeça; por isso ela balançava com a corda e com a passada. A pele do ombro encostada na boca da aljava continua presa ao braço. No joelho, a troca coxa/canela agora é gradual em ±2,5 cm, e o cano da bota acompanha só a canela.
- **`idle`.** As pernas ficam quase retas. Nesta escala, cada centímetro de quadril abaixado dobra o joelho em cerca de 10°. O peso passa de um pé para o outro, o peito respira e a cabeça oscila com fase própria. Os braços acompanham o peito, e a mão livre fica solta ao lado da coxa.
- **Ritmo da passada.** No jogo, a fase do ciclo vem da distância percorrida dividida por `stride` / `strafeStride` em `v2/assets/models.json`. O jogador anda a 6 u/s; com a passada antiga (1,43 u), o ciclo rodava a 4,2 por segundo, quase 3× o ritmo do clipe no Blender. Com pernas de ~0,9 u, essa velocidade é de corrida. Por isso o `walk` da Arqueira virou uma corrida leve de 2,3 u por ciclo (~2,6 ciclos/s), e o clipe tem 13 quadros (0,4 s), o mesmo ritmo do jogo.
- **`walk` (corrida).** O apoio é curto, há fase de voo e o calcanhar sobe alto na volta. O quadril fica mais baixo no meio do apoio, com contrarrotação entre quadril e ombros e o tronco inclinado à frente. A mão livre corre com o cotovelo a 90°, e o arco vai baixo, balançando menos.
- **`strafe_left` / `strafe_right` (chassé).** O pé guia abre, o de trás fecha sem passar dele (folga mínima de 12 cm entre os tornozelos) e há um salto curto. O quadril vai sobre o pé que apoia. São 1,72 u por ciclo e 10 quadros (0,3 s).
- **`shoot` / `shoot_up` (gerador).** A linha da flecha passa abaixo do capuz, que desce até ~0,70. A âncora fica logo atrás da cabeça, onde a mão continua visível de cima, com o cotovelo para trás na linha da flecha. Depois da soltura, a mão desce pela lateral até o repouso.
- **`shoot` / `shoot_up` (versão atual, editada no Blender).** As duas ações em `blender/models/archer_hero.blend` não saem mais do gerador.
  - O `shoot` foi posado à mão: a mão da corda recolhe no lado direito do peito, fora da silhueta da cabeça vista de cima. A ação passou por uma limpeza: quaternions com sinal coerente, puxada em dois quadros (corda no 5, peito no 6, âncora no 7), sem chaves fora de 1–16 e sem curvas de escala. A tensão máxima vai do quadro 8 ao 12 e cobre a soltura do Disparo (52%) e a da Flecha Perfurante (73%).
  - O `shoot_up` deriva do `shoot`. A sequência foi reencaixada em 19 quadros, com ancoragem até 46% e tensão até 80%; as solturas da Chuva de Flechas, do Impacto Celeste e das Penas Voadoras (50–60%) caem nela. O tronco inclina 0,7 rad para trás e o braço do arco sobe mais 0,4 rad. O arco gira na mão até ficar perpendicular à flecha e inclina 0,15 rad de lado, para longe da cabeça. A flecha sobe 44–49°, e o arco não fica a menos de 3,4 cm da cabeça.
  - **Rodar `ranged_heroes.py -- archer` de novo apaga essas duas ações.** Antes disso, exporte-as do `.blend` ou passe as poses para o gerador.

O Mercenário mantém os clipes e pesos originais.

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
| `bowShot` | Disparo, Flecha Perfurante, Tiro Seguidor, Saraivada Seguidora e Chuva de Flechas (corda) |
| `crossbowShot` | Virote pesado e cada virote da Rajada (estalo e baque) |
| `bombThrow` | Arremesso da Bomba, do Molotov e da Rede de Caça (sopro com pavio) |
| `powderBlast` | Explosão da Bomba e da Mina |
| `mineArm` | Mina e Armadilha de Urso terminando de armar (dois cliques metálicos) |
| `fireIgnite` | Molotov acendendo o chão |
| `falconCry` | Comando F do falcão e início do Impacto Celeste |
| `windCut` | Recuo, cada mergulho do falcão, Penas Voadoras e a rede caindo |
| `heavySlam` | Impacto Celeste atingindo a área |
| `swordSlash` | Armadilha de Urso fechando |

As ações dos atiradores não tocam mais o `raio` (som do Tiro de Osso); a esquiva continua com ele, como nas outras classes. Os impactos continuam com o `hit` comum.

## Leitura do combate

- O tiro do jogador tem um traço em linha na cor da classe: verde na Arqueira, âmbar no Mercenário. Flechas inimigas continuam como orbe amarelo, sem traço.
- A bomba e a garrafa voam como uma esfera escura com pavio aceso, sobre a marca de queda no chão. A mina mostra um anel claro enquanto arma e um anel laranja com o raio de disparo quando armada.
- A Flecha Perfurante mostra a linha do tiro durante a carga, e a Chuva marca a área antes das ondas.
- Inimigos marcados pelo falcão têm um anel dourado.
- O alvo travado pela Saraivada Seguidora tem um anel dourado durante a rajada; as flechas do Tiro Seguidor e da Saraivada curvam no ar, então uma esquiva lateral rápida ainda escapa.
- O Impacto Celeste marca a área no chão enquanto o falcão desce; o dano só vem quando ele chega.
- A rede voa com a cor da corda, sobre a marca de queda; quem fica preso tem um anel bege. A armadilha mostra um anel cinza enquanto arma, claro quando armada, e o inimigo preso ganha um anel próprio.

## Verificação

- Regras:
  - `node --test v2/tests/marksman.test.mjs`: registro, saves, atributos, tiro básico, perfuração, paredes, esquiva, barra e catálogo.
  - `node --test v2/tests/marksman-skills.test.mjs`: árvores e orçamento, passivas, bloqueio sem selo, as oito habilidades originais, falcão automático, comando, marca e bônus, limpeza na morte e na troca de cena.
  - `node --test v2/tests/marksman-new-skills.test.mjs`: curva do Tiro Seguidor, trava e perseguição da Saraivada, atraso e empurrão do Impacto Celeste, uma pena por alvo, lentidão da rede (e chefes), armadilha armando, prendendo e no limite de duas.
  - `node --test v2/tests/skill-loadout.test.mjs`: barra montável, selo exigido, save e ativação pelo slot.
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
- Habilidades novas: `node v2/tests/marksman-new-skills-browser-check.cjs` confere os selos no painel, o seletor da barra, cada habilidade nova em combate com captura, chão claro e qualidade baixa, e a barra no save, sem erros de página. Evidências em [review/v2/marksman-new-skills](../review/v2/marksman-new-skills/).

## Limites conhecidos

- Números iniciais, sem campanha completa jogada com essas classes.
- Animações procedurais de primeira versão; sem clipe de reação a dano (`hit`). O Recuo é um salto curto, sem cambalhota.
- Recuo e Mina ainda prendem o personagem (pose de corpo inteiro).
- O falcão não pode ser alvo nem morrer e voa através de paredes; o mergulho automático exige linha de visão a partir da Arqueira.
- A bomba voa sobre obstáculos; só a explosão é bloqueada por paredes.
- O retrato 2D do menu existe só para o Necromante; as demais classes usam o modelo 3D.

## Revisões aprovadas em 09/11/2026

A Flecha de Fogo (`fechadefogo`, id preservado) está integrada como ação equipável: 15 foco, recarga 4 s, alcance 13 u, 100% do dano no contato e queimadura por 4 s (15% a cada 0,5 s, renovada sem acumular). A Flecha Explosiva requer esse nó e é uma ação distinta: 25 foco, recarga 7 s, alcance 13 u e 160% do dano em raio 2,5 ao tocar inimigo, parede ou fim do alcance; não deixa queimadura. A explosão respeita paredes.

Penas Voadoras é **passiva periódica**, sem slot nem custo de foco: dispara seis penas a cada 7 s quando houver presas visíveis até 8 u. Mantém uma pena por alvo e direciona as restantes pela mira. Espera o Impacto Celeste terminar; pausa congela sua execução. Barras antigas com a ação recebem outra opção pela normalização da barra, preservando os pontos do nó. O Impacto Celeste usa o raio revisado de **4,5 u**, mantendo dano, atraso e custo.

A Mina de Pólvora usa o raio revisado de **6 u**, antes de Estilhaços (+12% de raio por ponto). Gatilho continua em 1,4 u, duração 25 s, limite duas minas, dano 220%, custo 25 e recarga 9 s. Perfuração do Mercenário passa a exigir nível 6; Estilhaços e Mina também exigem nível 6. Essas mudanças são de regra/balanceamento.

Regras e integração verificadas por `skill-ideas-revision.test.mjs`; conferência visual em `skill-ideas-revision-browser-check.cjs`, ambos em `v2/tests/`. Evidências em [review/v2/skill-ideas-revision](../review/v2/skill-ideas-revision/). O simulador de balanceamento não modela essas novas rotações; os números ainda precisam de campanha completa jogada.

## Progressão por pontos corrigida (09/11/2026)

Na Arqueira, Tiro Seguidor, Chuva de Flechas, Saraivada Seguidora, Impacto Celeste, Penas Voadoras e Flecha Explosiva passam de um para cinco pontos. A Flecha de Fogo já aceitava cinco, mas faltava aplicar a escala no runtime; agora impacto e queimadura escalam juntos. No Mercenário, Mina de Pólvora, Molotov e Armadilha de Urso também passam a cinco pontos.

O primeiro ponto conserva o dano atual; cada ponto seguinte soma +10% do dano base da própria habilidade, até +40%. A escala vale por projétil, onda, pulso ou explosão, sem multiplicar quantidade, raio, duração, custo ou recarga. Penas continua passiva, sem slot e sem custo. Molotov aumenta cada pulso; Estilhaços continua responsável pelo raio da Mina. Investimentos existentes são mantidos, sem conceder ranks adicionais ao carregar. Evidências em [review/v2/skill-rank-scaling](../review/v2/skill-rank-scaling/).

## Sinergias de escola (09/11/2026)

Além da progressão própria, cada ponto investido em uma habilidade do ramo fortalece em **2% do dano base** as outras habilidades de dano desse mesmo ramo. Os bônus são somados aos próprios, sem realimentação, sem contar passivas gerais ou bônus de equipamento. Dano contínuo e invocações recebem a escola correspondente; vida, custos, recargas e controle preservam suas regras. A árvore mostra o bônus recebido e suas fontes, ou a contribuição dos nós de suporte. A [regra completa de progressão e sinergias](habilidades/sinergias.md) descreve variantes e exceções. Essa mudança é de balanceamento e passa a beneficiar os ranks já investidos nos saves.
