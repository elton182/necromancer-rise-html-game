# V2 — inimigos e Rei Caído (E8)

A arena da V2 usa os seis índices de `ENEMY_TYPES`, na ordem original. Fontes:
`v2/scripts/enemies.mjs`, `fallen-king.mjs`, `training-model.mjs` e os modelos
canônicos em `scripts/`. Execute `node v2/tools/build.cjs` na raiz para gerar
catálogo, parâmetros, modelos compartilhados e a distribuição offline. Não edite
`enemy-types.mjs`, `enemy-rules.mjs` ou `shared-*.mjs` diretamente.

## Encontros e escala

**Encontro de treino** (1–60) escolhe a composição e a escala, sem desbloqueios ou
recompensa de conclusão. Não é a Arena Infinita da E10. São oito inimigos e o Rei.
A composição usa `CryptHoundModel.arenaTypes` e `WarAcolyteModel.arenaTypes`: só
Guerreiros no primeiro encontro, introdução isolada do cão no quarto, acólito no
sexto, depois combinações. No sexto em diante, os espaços 6 e 8 recebem as
raridades mágica e rara. A escolha persiste; saves anteriores começam no encontro 1.

Vida, dano e XP usam `EquipmentModel.waveStats`; velocidade e intervalos corpo a corpo usam
`COMBAT_TUNING`; cão/acólito e o ataque básico a distância preservam os overrides
dos runtimes atuais (incluindo o intervalo de 1,9 s a distância). As raridades de `ExpeditionModel.tiers` multiplicam os atributos
uma vez, incluindo XP, e fornecem chance e pesos de loot. O nível dos itens ainda
é o campo separado **Nível dos itens do treino**, até os modos E9/E10.
O Rei usa os atributos do chefe do Extermínio com a escala do encontro; não
recebe multiplicadores de elite. Ouro, XP e loot passam pela recompensa única da E7.

## Arquétipos

| Índice | Tipo | Comportamento e resposta |
| --- | --- | --- |
| 0 | Guerreiro | Persegue e ataca perto; Golpe pesado avisa um círculo na própria posição antes do dano. Saia do círculo. |
| 1 | Arqueiro | Atira a distância e recua devagar quando pressionado; Tiro forte trava a direção, avisa o trajeto e dispara uma flecha mais rápida. Desloque-se de lado ou use cobertura. |
| 2 | Bruto | Corpo maior e ataque corpo a corpo; Salto devastador marca o destino, sobe e só causa dano no pouso. Saia da marca. |
| 3 | Mago Vivo | Projéteis mágicos e recuo; Erupção trava a posição do alvo e deixa fogo por três segundos, com dano a cada segundo. Saia da área e não volte enquanto estiver ativa. |
| 4 | Cão de Cripta | Investida com preparação, trajetória travada, varredura contra alvos e obstáculos, parada no primeiro contato e recuperação. Desvie de lado ou use sólidos/Muralha. |
| 5 | Acólito de Guerra | Litania prepara e canaliza aura de 5,5 u durante quatro segundos. Reforça em 30% o dano dos aliados elegíveis, sem empilhar. Matar a fonte encerra o bônus imediatamente. |

Os números dos especiais vêm de `MOB_ABILITIES` mais os ajustes vigentes de
`COMBAT_TUNING.specials`; cão e acólito executam os próprios modelos canônicos.
Alvos seguem a preferência atual: aliado próximo a menos de cinco unidades,
senão jogador. As áreas podem atingir jogador e horda pelo dano comum.
Projéteis varrem a trajetória e respeitam sólidos e Muralha; a Muralha absorve
o dano e pode ser destruída. O Dash, defesa, barreira e Escudo de Ossos continuam
no caminho comum. O fogo já lançado continua após morrer o mago, como na fonte;
projéteis já lançados também continuam; preparações da fonte morta são canceladas.

## Rei Caído

`FallenKingModel.update/pose` determina as fases, recargas e progresso dos clipes:

- Corte Real: direção travada, setor de 120° e alcance 2,8 u; contato depois da preparação.
- Queda do Rei: destino limitado a sete unidades, altura lógica, impacto de raio 2,6 u somente ao pousar.
- Abaixo de 50% da vida: fase 2, recargas reduzidas e Chamado da Coroa; dois Guerreiros por chamado, no máximo quatro vivos.
- Morte cancela o golpe, remove avisos, zera altura e desfaz os reforços vivos sem XP ou loot adicional.

### Revisão do Rei na v2 (mudança de regra)

Os números acima são os do modelo canônico, que a v1 continua usando sem alterações. A v2 aplica por cima dele
os ajustes de `V2_KING` em `v2/scripts/fallen-king.mjs`, sem mexer em `shared-fallen-king.mjs`. O teste que compara o
modelo da v2 com o canônico segue valendo. Pares `[fase I, fase II]`:

| Regra | Fase I | Fase II |
| --- | --- | --- |
| Corte Real: alcance e abertura | 3,36 u e 144° (×1,2 / ×1,2) | 3,64 u e 150° (×1,3 / ×1,25, abertura limitada a 180°) |
| Queda do Rei: raio do impacto | 3,9 u (×1,5) | 4,42 u (×1,7) |
| Chão em chamas após a Queda | raio 80% do impacto, 3 s, 30% do dano do Rei por segundo | 4,5 s, 40% do dano por segundo |
| Relógio do modelo (preparação, golpe, recarga, intervalo) | ×1 | ×1,3 |
| Velocidade de caminhada | ×1 | ×1,3 |
| Intervalo entre golpes | 0,9 s | no máximo 0,35 s |
| Corte encadeado | não | depois de um Corte, um segundo Corte imediato; o seguinte volta ao normal |

O gatilho dos golpes (alcance de 2,8 u para o Corte, 2,5–9 u para a Queda) é o do modelo; só a área que causa dano
cresce. O aviso no chão usa os mesmos números e o dano continua sendo aplicado só no contato real.

O modelo do Rei foi redimensionado de 3,2 u para 4,4 u de altura (`height` em `v2/assets/models.json`, sem mexer no
raio de colisão de 0,48 u nem nos alcances).

A **transição** para a fase II acontece abaixo de 50% da vida. Se houver um golpe em andamento, ele termina; depois o
Rei levanta a arma por 0,9 s, bate no chão por 0,35 s e recupera por 0,5 s, sem atacar (cerca de 1,75 s). A onda de
fogo que sai dali é só visual. Esse tempo livre é o intervalo de respiro do jogador. Morte do Rei, inclusive durante o rugido,
limpa a transição, avisos e o chão em chamas dele; as chamas deixadas por Magos Vivos continuam como
antes.

O fogo da Queda passa por `hostileZones`, como a Erupção do Mago Vivo: a horda o evita como área perigosa e o dano
usa o caminho comum de `dealDamage`. Esta mudança afeta todos os modos que usam o Rei (campanha, Expedições, Arena de
treino e Conquista).

Avisos são derivados do estado real e não aplicam dano. O setor é preenchido;
marcas circulares indicam salto e invocação. Horda de grupos reais considera os
avisos hostis para evasão; a aura do acólito não é tratada como área de dano.
Pausa congela a simulação; menu, morte do jogador e reinício limpam projéteis,
fogo, habilidades e estados temporários. O chão e as entidades nunca entram no save.

## Modelos e validação

Na entrega original da E8, quinze GLBs eram incorporados ao HTML. Os tipos usavam os assets existentes:
`raider`, `lowpoly_earcher`, `corrupted`, `skeleton_mage`, `mob_cryptHound` e
`mob_warAcolyte`. Cão, acólito e Rei têm clipes específicos; os outros usam o ataque
normalizado para preparação e ação. Não houve alteração de malhas ou cenas Blender.
Os nomes e a raridade ficam sobre os inimigos; silhueta e avisos complementam a cor.

Verificação na raiz, com Node e Playwright/Edge disponíveis para os checks:

```powershell
$tests = (Get-ChildItem v2/tests/*.test.mjs).FullName
node --test $tests
node --test scripts/crypt-hound.test.js scripts/war-acolyte.test.js scripts/fallen-king.test.js
node v2/tests/enemies-browser-check.cjs
node v2/tests/browser-check.cjs
node game_check.js
```

Evidências em `review/v2/e8/`. As cenas controladas do navegador avançam a simulação
real e verificam seis modelos, especiais, salto, invocação e limpeza, nos dois fundos
e qualidade baixa. O check geral valida HTML copiado offline, saves, pausa e reinício.
Isso não valida campanha/Expedições/Conquista ainda não migradas, nem desempenho em
outras máquinas ou equilíbrio completo de IA; as fórmulas compartilhadas foram
preservadas, sem apresentar estimativas do simulador como teste da IA.

## Modelos importados — primeira passagem

Esta entrega acrescenta três entradas ao catálogo GLB e substitui três visuais hostis. Guerreiro usa o cavaleiro com espada/escudo; Mago Vivo usa o mago encapuzado com cajado de fogo; Cão de Cripta usa o lobo importado. Os modelos da horda permanecem separados. Fontes e comandos estão nas [notas dos assets](../blender/notes/imported_enemies_v2.md).

A extensão exclusiva da v2, em `v2/scripts/enemies.mjs`, acrescenta os índices 6 (Ladrão com adaga), 7 (Humanoide Grifo) e 8 (Aranha). Os seis índices canônicos não mudam. Esta primeira passagem reutiliza os atributos e recompensas do Guerreiro como base provisória. Nenhum dos três recebe magia, veneno, voo ou invisibilidade.

Os novos inimigos perseguem o alvo com navegação comum. Dentro do alcance de 1,4 u e com linha livre, travam alvo/direção e preparam por 0,25 s; o contato aplica o dano comum uma vez, seguido de ação até 0,4 s e recuperação até 0,6 s. Sair do alcance ou quebrar a linha evita o golpe; morte cancela a ação e pausa congela seu relógio. A cadência usa o intervalo corpo a corpo compartilhado. Ladrão, grifo e aranha entram por nível de progressão (`NEW_TYPE_LEVELS` em `enemies.mjs`), sempre no lugar de espaços de tipos básicos e preservando cão/acólito. Na Arena, aparecem a partir dos encontros 5, 7 e 9, com mais um espaço a cada 5 encontros. Na campanha (nível = 2×fase ou dificuldade da missão + onda; a cripta da fase 1 fica de fora), no mapa de Expedição (nível = onda + 2) e na Conquista (todos liberados), metade dos Guerreiros de cada composição é trocada pelos tipos liberados, em rodízio (Ladrão no nível 4, grifo no 6, aranha no 8). Não há mudança no formato do save.

Cavaleiro e mago agora mostram clipes próprios na preparação dos especiais e uma janela explícita de 0,3 s de execução/recuperação após o efeito. Nessa janela não se deslocam; o dano, alcance e instante lógico dos especiais foram preservados. Ataques comuns desses tipos ainda têm emissão/contato imediato, conforme a E8; os clipes começam na ação e retornam à guarda. A reação a dano só substitui descanso/caminhada no renderizador, sem atordoar nem cancelar golpes.

Verificação adicional: `node --test v2/tests/imported-enemies.test.mjs` e `node v2/tests/imported-enemies-browser-check.cjs`. Evidências em `review/v2/imported-enemies/`. Os movimentos são uma primeira passagem, com refinamento artístico de dedos, tecido e apoios ainda pendente.

### Revisão: harpia em voo baixo

O Humanoide Grifo agora é apresentado como harpia em voo, preservando seu ID e índice. Asas e braços são independentes; o voo usa batimento e pernas recolhidas, a 0,85 u do chão com oscilação visual de 0,09 u. A morte desce ao chão em 0,8 s; pausa congela a oscilação. Colisões, obstáculos, alvos, alcance e dano continuam usando a projeção comum no chão, sem imunidade ou passagem por sólidos. O golpe preparado mantém a regra descrita acima.

Cavaleiro, mago e ladrão têm a altura corporal calibrada pelo player em descanso, sem contar seus equipamentos. Armas e escudo foram reduzidos e reposicionados sem mudar alcance ou colisão. As fontes Blender e a distribuição offline foram atualizadas.

## Leitura dos ataques

A erupção do Mago Vivo prepara por 2 segundos; o tiro básico permanece imediato. O alcance comum corpo a corpo inclui o raio do alvo. O cão tem altura visual de 0,95 unidade, sem alterar colisão. Personagens GLB usam toon em três faixas e contorno.

### Ladino Arqueiro e Orc (índices 9 e 10)

A extensão da v2 acrescenta dois tipos, sem mudar os índices 0–8. Os atributos são **provisórios**:

| Índice | Tipo | Modelo | Base | Comportamento e resposta |
| --- | --- | --- | --- | --- |
| 9 | Ladino Arqueiro | `enemyRogue` | Atributos e regras do Arqueiro (`rules:'Arqueiro'`) | Atira a distância e recua quando pressionado; Tiro forte trava a direção e avisa o trajeto. Desloque-se de lado ou use cobertura. |
| 10 | Orc | `enemyOrc` | Vida 75, dano 14, velocidade 1,5, escala 1,3 | Golpe de maça preparado: marca no chão um círculo de 1,6 u no ponto à frente (até 1,5 u) travado no início, prepara por 0,7 s e só causa dano no impacto (×1,25), em quem estiver na área. Saia do círculo. Recuperação até 1,2 s. |

O Orc usa a mesma máquina de golpes preparados dos tipos 6–8 (`STRIKE_CLIPS` e `SMASH` em `enemies.mjs`), com avisos limpos por morte e pausa. Entram por nível em `NEW_TYPE_LEVELS` (Ladino no nível 10, Orc no 12) e, na Arena, a partir dos encontros 11 e 13; quando faltam espaços de tipos básicos tomam o lugar do tipo 6–8 mais repetido. O Orc usa `heightScale` 1,3 em `models.json` sobre a altura do player.

Verificação: `node --test v2/tests/hooded-archer-orc.test.mjs`; no navegador, o Ladino atira e mantém distância e o Orc passa por `smash_windup`, `smash` e `recover` com aviso no chão (conferido no HTML gerado, servido localmente). O teste `v2/tests/imported-enemies-browser-check.cjs` foi atualizado para oito modelos, mas **não foi executado** (Playwright não está instalado neste ambiente).

### Bruto e Acólito de Guerra desativados

Os índices 2 (Bruto) e 5 (Acólito de Guerra) continuam existindo — saves, fontes compartilhadas, modelos GLB e testes dos modelos canônicos não mudam —, mas **nenhum modo os gera**. `DISABLED_TYPES` em `v2/scripts/enemies.mjs` troca o índice na criação (`spawnEnemy`) e na composição da Arena: Bruto → Orc (10) e Acólito de Guerra → Ladino Arqueiro (9). Isso vale para treino, Arena, campanha, Expedições e Conquista, porque todos passam por `spawnEnemy`. Com isso o Orc e o Ladino aparecem antes do nível em que `NEW_TYPE_LEVELS` os libera, ocupando os espaços antes do Bruto e do Acólito.

Para criar um deles em teste ou ferramenta, use `spawnEnemy(w,index,x,y,{legacy:true})`. As mecânicas (Salto devastador e Litania) seguem implementadas e testadas, apenas sem uso. O substituto muda o equilíbrio: o Orc tem 75 de vida contra 100 do Bruto, e a aura de reforço do Acólito deixa de existir. O Laboratório continua listando os dois modelos.


## IA tática (posicionamento)

`v2/scripts/enemy-tactics.mjs` decide **onde** o inimigo quer estar; ataque, dano, alcance, recarga, preparação e avisos continuam em `enemies.mjs` e não mudaram. O módulo não conhece DOM nem Three.js e guarda só o estado transitório `e.tac` (fora do save; recomeça quando o alvo muda). Os números ficam em `TUNING`. Vale para o treino, a campanha, as Expedições, a Arena e a Conquista; o Rei Caído e os inimigos do cerco têm movimento próprio e ficam de fora.

| Papel | Tipos | Comportamento |
| --- | --- | --- |
| Frente | Guerreiro (0), Bruto (2), Orc (10) | Avançam pela frente, em leque (afastam-se uns dos outros). **Só três atacam o jogador ao mesmo tempo** (dois por aliado); os demais esperam numa roda a `alcance + 2` u, contornando devagar (50% da velocidade), e ocupam a vaga de quem morre ou se afasta. Depois de 6 s esperando entram mesmo sem vaga. Quem já está ao alcance ataca sempre. |
| Flanco | Cão de Cripta (4), Ladrão (6), Aranha (8) | Contornam o alvo em espiral até uns 4,5 u e só então avançam, quando chegam a ~130° do eixo de onde vem a linha de frente, ou seja, **pelas costas** de quem enfrenta os guerreiros. Se já estão a menos de 1,2 u do alcance, ou passam 5 s em órbita, investem direto. |
| Distância | Arqueiro (1), Mago Vivo (3), Harpia (7), Ladino Arqueiro (9) | Posicionam-se a 85% do alcance, **espalhados em leque** (≈46° entre si) ao redor do eixo da frente. Param para atirar; entre disparos dão passos laterais curtos; abaixo de 50% do alcance (mín. 3 u) recuam em vez de ficar a 2,6 u como antes. Sem linha livre ou fora do alcance, vão para o próprio lugar do leque. |

O eixo da frente é a direção do jogador (ou do aliado) até quem já tem vaga na linha de frente; sem guerreiros, é a direção do próprio inimigo. A cadência, o alcance de ataque, os especiais e as raridades não mudam. O que muda é a pressão: antes todos chegavam juntos pelo mesmo lado; agora a frente fica limitada, os atiradores ficam fora do alcance curto e os ladrões obrigam o jogador a olhar para trás. Mudança de regra: o recuo dos atiradores deixou de ser fixo em 2,6 u. Menos atacantes simultâneos na frente reduz o dano recebido em hordas grandes; isso não foi reavaliado no `balance-simulator`, que não modela esse comportamento.

Verificação: `node --test v2/tests/enemy-tactics.test.mjs` e `node v2/tests/enemy-tactics-browser-check.cjs` (capturas em `review/v2/enemy-tactics/`). Ainda não há aviso visual de flanco; a leitura vem do movimento em arco.

### Harpia: penas arremessadas (alcance médio)

A Humanoide Grifo (índice 7) agora ataca a distância média e deixou de ser flanqueadora: mantém-se a cerca de 5,5 u em voo, como um atirador, e só usa a garra quando o alvo chega ao alcance dela (1,4 u). Os números ficam em `FEATHER` (`enemies.mjs`):

| Regra | Valor |
| --- | --- |
| Gatilho | Alvo entre 2,6 e 6,5 u, com linha livre e recarga zerada (a primeira rajada sai ~1 s após o encontro). |
| Preparação | 0,6 s (`feather_windup`): asas erguidas e braços abertos. A direção trava no início e **três trajetos** (leque de ±0,2 rad ≈ 11°) aparecem no chão até 8,5 u. |
| Lançamento | `feather` (0,3 s) + recuperação até 1 s no total. Três penas a 13 u/s, alcance 8,5 u, **45% do dano da harpia cada** (rajada completa = 135%). |
| Recarga | 2,6 s entre rajadas; a garra tem recarga própria de 0,6 s depois de uma rajada. |
| Resposta | As penas voam retas: sair da linha durante a preparação desvia de todas. Sólidos e Muralha as bloqueiam como flechas; a Muralha absorve e pode quebrar. |

Penas já lançadas continuam depois da morte da harpia; preparação em andamento é cancelada (sem penas, avisos limpos). Pausa congela a preparação. O estado fica em `e.volley`, fora do save. O dano passa por `dealDamage` como qualquer projétil hostil; a pena é um modelo 3D do Blender (`harpyFeather`) que gira no eixo, mais um rastro leve em `vfx.mjs`. Mudança de regra: a harpia deixou de ser puramente corpo a corpo e de flanquear.

Verificação: `node --test v2/tests/harpy-feathers.test.mjs` e `node v2/tests/harpy-feathers-browser-check.cjs` (capturas em `review/v2/harpy-feathers/`).

## Especiais novos: Uivo, Saraivada e Pancada no Chão

Três especiais da v2 (números em `HOWL`, `RAIN` e `SLAM`, `enemies.mjs`). Cada um tem preparação com aviso, dano só no instante real, recarga, e é cancelado se o dono morre na preparação; a pausa congela o relógio. O estado fica em `e.howl`, `e.rain` e `e.slam`, fora do save. Nada disso toca `shared-crypt-hound.mjs` (a investida do cão continua a canônica).

| Inimigo | Especial | Regra |
| --- | --- | --- |
| Cão de Cripta (4) | **Uivo** | Com o alvo a até 12 u e fora da investida, uiva por 1,7 s (clipe `howl`, anel roxo inofensivo que cresce em 1,1 s). Ao fim da preparação chama **2 cães** ao redor, se o uivante ainda estiver vivo. No máximo 4 reforços vivos por cão e 10 cães no total. Reforços **não uivam**, **não dão XP nem loot** (`summoned`, `rewarded`, xp 0) e continuam vivos se o cão que os chamou morrer. Recarga de 16 s; primeira vez entre 4 e 7 s. |
| Arqueiro (1) e Ladino Arqueiro (9) | **Saraivada** | Com o alvo entre 3,5 e 9 u, trava a **posição do alvo**, prepara por 1 s com um círculo de 2,8 u no chão e dispara as flechas para o alto. Elas caem 0,9 s depois (zona com `delay`: o aviso continua e o horda a evita) e causam **um único dano de 110%** a todos na área. Recarga de 9 s; primeira entre 5 e 8 s. A queda já lançada acontece mesmo se o arqueiro morrer; a preparação em andamento é cancelada. Sem linha livre não é exigida (as flechas passam por cima). |
| Orc (10) | **Pancada no Chão** | Com o alvo a até 3,4 u e linha livre, trava um ponto 1,9 u à frente, prepara 1,1 s (clipe `smash_windup`, aviso de 3,2 u) e bate o porrete: **dano em área de 180%** a quem estiver no círculo (jogador e horda), com onda de choque. Total de 2 s, recarga de 7 s; primeira entre 3 e 5 s. A pancada comum de 1,6 u continua como ataque básico. |

Mudanças de regra: os arqueiros e o cão ganharam especiais novos (antes só tinham o tiro forte e a investida), e o Orc ganhou um segundo golpe de área maior. O equilíbrio não foi reavaliado no `balance-simulator`, que não modela esses comportamentos.

Visual: o uivo usa o clipe novo `howl` do lobo (Blender: `imported_enemy_beasts.py -- --character=wolf`), a saraivada faz flechas caírem e ficarem fincadas (`arrowRain` em `vfx.mjs`) e a pancada usa a runa de perigo e a onda de choque já existentes.

Verificação: `node --test v2/tests/special-attacks.test.mjs` e `node v2/tests/special-attacks-browser-check.cjs` (capturas em `review/v2/special-attacks/`).
