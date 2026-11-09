# Guerreiro / Soldado — primeira versão jogável

Implementado na v2. Novo Jogo oferece Necromante, Guerreiro e [Druida](v2-druida.md), com classe e progresso por personagem. Saves anteriores sem classe continuam Necromantes.

## Ações

Cada clique executa um único corte. O próximo clique avança a sequência se ocorrer até 0,45 s após o término do corte anterior; depois disso, reinicia no primeiro. Durante a recuperação, após o impacto, é possível reservar apenas o próximo corte com um novo clique. Cliques anteriores ao impacto são ignorados e segurar o botão do controle não repete o ataque. Pausa congela a janela; esquiva, morte, outra habilidade e troca de cena encerram a sequência. A direção fica fixa durante a ação; o jogador pode cancelar com a esquiva C. Morte e troca de cena encerram a ação. O recurso usa o campo de mana existente no save, apresentado como vigor para o Guerreiro; animações não aplicam dano diretamente.

| Comando | Ação | Regra inicial |
|---|---|---|
| Clique / 1 | Três cortes | Sem custo; durações de 0,60 / 0,533 / 0,40 s por corte. Impacto em 0,367 / 0,267 / 0,267 s após iniciar cada corte; 55%, 65% e 90% do dano físico; alcance 2,6; arco 144°. |
| Botão direito / 2 | Estocada avançada | Requer um ponto em Estocada. 20 vigor, recarga 5 s. Avança até 7 unidades entre 0,20 e 0,367 s, buscando terminar a 2,2 unidades da mira (até 08/11/2026 eram 5). Impacto no frame 12 (0,367 s), 220% de dano. Cápsula com raio 0,85 cobre todo o avanço até 3,4 unidades à frente da posição final, incluindo o raio do alvo: alcance total de 10,4 u. Não atravessa sólidos nem concede invulnerabilidade. A pose final é mantida por 0,12 s de recuperação; total de 0,487 s. |
| 3 / Q | Golpe de escudo | Requer um ponto em Golpe de escudo. 15 vigor, recarga 7 s. Impacto em 0,3 s, 130% de dano; alcance 1,8 e arco 117°. Empurra 0,8 unidade respeitando colisões. Recuperação total 0,8 s. |
| R / 5 (manter) | Corte tornado | Requer nível 6 e um ponto em Estocada. Custa 5 vigor ao iniciar e 12/s durante o giro. Acerta em 360°, raio 2,7, por 65% do dano a cada 0,3 s (primeiro impacto após 0,15 s). Movimento a 55% da velocidade; termina ao soltar, pausar, esquivar, morrer ou esgotar vigor. Recarga de 3 s ao encerrar. |
| T / 6 | Arremesso de escudo | Requer nível 6 e um ponto em Golpe de escudo. Custa 20 vigor, recarga 7 s. Lança após 0,18 s; viaja a 14 u/s por 0,55 s e retorna ao jogador, ou volta antes ao atingir sólido. Cada alvo recebe 120% de dano uma vez na ida e outra na volta. Sem bloqueio ou golpe de escudo durante o voo. |
| C / E / 4 | Esquiva | Reutiliza a [esquiva existente](v2-combate.md#esquiva-básica), com um rolamento de combate próprio (`dodge`). |
| Slot escolhido | Brado de Guerra | Requer nível 14 e um ponto no nó. Sem custo, recarga 18 s, efeito em 0,2 s, ação total de 0,5 s. Reduz em 30% a velocidade de movimento dos inimigos em raio de 6 (com o raio do alvo) por 4 s e dobra a recuperação de vigor por 6 s. Paredes bloqueiam o efeito. Reutiliza o clipe `shield_bash`. |
| Automática (terceiro corte) | Onda de Aço | Requer nível 10, um ponto em Slash e um ponto no nó. Não ocupa slot desde 08/11/2026: o terceiro corte do Slash a lança, sem custo, com recarga própria de 8 s (a redução de recarga dos itens vale). Lança no impacto do terceiro corte uma onda de 18 u/s por até 7 u, com largura lateral de 0,9 somada ao raio do alvo. Causa 180% de dano uma vez por alvo, atravessa inimigos e para na primeira parede. Reutiliza o clipe `slash_3`. |
| F / Select do controle | Postura de Batalha | Requer nível 10 e um ponto no nó. Fica fora dos seis slots; veja a seção abaixo. |

Alcances incluem o raio do alvo. Paredes bloqueiam os impactos. O avanço físico usa colisão contínua; inimigos fora do arco não são atingidos. Cada impacto passa pelo caminho de dano, morte e recompensa existente, uma única vez. O Guerreiro começa sem horda e não pode reanimar ou equipar ações do Necromante.

## Árvore, atributos e equipamentos

O treinamento tem quatro ramos: **Espada**, **Escudo**, **Passivas** e **Veterano**. Três pontos por nível, incluindo o nível 1. O orçamento é recalculado pelo nível: personagens existentes recebem automaticamente os pontos adicionais, preservando os investimentos. Só os Cortes e a Esquiva funcionam sem investimento. O primeiro ponto em Estocada ou Golpe de escudo libera a habilidade; até lá, o slot mostra "Libere na árvore", e o comando não gasta vigor nem inicia recarga. Os nós de Cortes, Estocada e Golpe de escudo melhoram o dano em 6%, 10% e 10% por ponto (limites 5, 3 e 3), incluindo o primeiro. Tornado e Arremesso são desbloqueios de um ponto. Personagens que já gastaram todos os pontos em outros nós só liberam essas habilidades com os pontos do próximo nível. Investimentos em `character.warriorRanks` respeitam nível, pré-requisito e orçamento ao carregar; os três IDs antigos foram preservados.

Passivas, com até cinco pontos cada:

- Maestria da espada: +8% de dano por ponto.
- Vitalidade: +10% de vida máxima por ponto.
- Disciplina defensiva: +4 de armadura por ponto.
- Fôlego de batalha: +0,4 vida/s por ponto.
- Guarda treinada: +3 pontos percentuais de bloqueio por ponto.
- Domínio dos equipamentos: +8% ao dano-base da espada equipada e à armadura dos itens por ponto.

Sinergias de até três pontos, disponíveis no nível 4:

- **Ímpeto** (requer Slash): acertar o terceiro corte fortalece a próxima Estocada em 10% por ponto, por até 4 s.
- **Retaliação** (requer Guarda treinada): bloquear fortalece em 10% por ponto o próximo Golpe ou Arremesso de escudo, por até 4 s.

O bônus não acumula em pilhas, é consumido ao iniciar a habilidade e desaparece na morte ou troca de cena. O recálculo dos atributos preserva a proporção de vida e vigor, sem curar.

A base marcial diverge agora dos atributos mágicos compartilhados: vida `120 + 18 × (nível − 1)`, vigor `80 + 4 × (nível − 1)`, dano `24 + 6 × (nível − 1)`, recuperação de vigor 5/s e movimento 6 u/s, antes de itens e passivas. O painel usa dano físico, vida, vigor, armadura, recuperação, movimento, recarga e defesa de escudo. Não calcula dano mágico ou DPS de horda para a classe.

A **defesa de escudo é uma chance de anular 100% de um ataque inimigo**, sorteada no caminho comum de dano antes de armadura e barreira. Exige escudo equipado e presente na mão. Base de 12 pontos percentuais mais a base do item, afixos e Guarda treinada, com teto de 75%. Não anula dano ambiental sem atacante inimigo. A armadura mantém a redução gradual existente, separada do bloqueio.

Primeiro arsenal: espada de uma mão, escudo, armadura, elmo, botas e dois anéis. Espada tem dano-base; escudo, chance de bloqueio; armaduras mantêm defesa garantida. Afixos marciais incluem dano, vida, armadura, bloqueio, recuperação de vida/vigor, vigor, movimento e recarga. Mercador, loot, comparação, forja e save usam o catálogo de `warrior-equipment.mjs`; os itens do Necromante não mudaram. A redução de recarga dos itens (até 50%) afeta Estocada, Escudo, Tornado, Arremesso, Brado e Onda; os tempos dos cortes autorais ficam preservados.

Saves antigos do Guerreiro recebem espada e escudo iniciais uma única vez (`warriorEquipmentVersion: 1`). Cajado e grimório antigos permanecem guardáveis, mas não são equipáveis pela classe. Peças antigas comuns de armadura e anéis continuam utilizáveis; seus afixos mágicos/de horda ficam inativos. Trocar de personagem mantém catálogos e inventários separados.

Desde 08/11/2026 a árvore vem de [docs/habilidades/arvores.json](habilidades/README.md) (nomes, textos, pontos, níveis, pré-requisitos e posição no painel), com os pais antes dos filhos na distribuição de pontos. Nós adicionados depois da primeira versão: **Ricochete** (Escudo, nível 8, requer Arremesso, até 3 pontos), **Onda de Aço** (Espada, nível 10, requer Slash), **Ciclone** e **Turbilhão** (Espada, nível 12, requerem Tornado), **Postura de Batalha** (Veterano, nível 10) e **Brado de Guerra** (Veterano, nível 14). Com eles a árvore soma 19 nós e 57 pontos e fica completa no nível 19. No nível 60 ainda sobram 123 pontos sem uso.

### Barra de habilidades

São seis slots para sete ações. Cortes e Esquiva ficam sempre na barra, em qualquer posição. Escolher uma ação que já está na barra troca as duas de lugar; escolher uma de fora substitui a do slot. O Brado começa fora da barra e precisa ser equipado depois de aprendido. Recargas continuam correndo quando a ação sai da barra. Saves antigos mantêm a ordem que tinham; uma barra salva com a Onda de Aço (índice 7, que saiu da barra) recebe no lugar dela a primeira ação que estiver fora (`warriorLoadout`).

### Ricochete

Ao atingir um inimigo na ida, o Arremesso salta para o inimigo vivo mais próximo em até 6 u, ainda não atingido na ida e sem parede no caminho. Cada ponto concede um salto, e cada salto reduz o dano em 20%: 120%, 96%, 77% e 61%, antes dos bônus. Inimigos atravessados no caminho de um salto também recebem o dano daquele salto. Sem outro alvo no primeiro acerto, o escudo segue reto como o Arremesso comum. Depois de iniciada, a cadeia termina ao acabarem os saltos ou os alvos, e o escudo volta. Se o alvo morrer no caminho, o escudo procura outro sem gastar salto.

O limite por inimigo continua em dois acertos: um na ida ou na cadeia e um na volta, que causa o dano cheio do Arremesso. Enquanto o escudo estiver no ar não há bloqueio nem Golpe de escudo, então mais saltos significam mais tempo exposto. O limite de segurança do voo passou a contar só o retorno, de até 2 s, para uma cadeia longa não fazer o escudo sumir no ar. O salto é mostrado por faísca no impacto e um rastro curto até o próximo alvo.

### Variantes do Tornado

Com o Tornado aprendido, cada nó libera uma variante. Só uma fica ativa, e o Tornado base continua disponível.

| Variante | Raio | Acerto a cada | Volta | Vigor | Movimento |
|---|---|---|---|---|---|
| Base | 2,7 | 0,3 s | 0,6 s | 12/s | 55% |
| Ciclone | 3,7 | 0,3 s | 0,6 s | 12/s | 40% |
| Turbilhão | 2,7 | 0,2 s | 0,4 s | 16/s | 55% |

A árvore não devolve pontos, então a escolha não depende do investimento: ela é feita no painel de detalhes dos nós do Tornado e salva em `character.warriorTornadoVariant`. A troca é recusada com um inimigo desperto a menos de 14 u e, no restante, vale ao iniciar o próximo giro. O dano por acerto, o custo inicial de 5 vigor e a recarga de 3 s não mudam.

### Postura de Batalha

Depois de aprendida, uma postura está sempre ativa, sem estado neutro. A primeira é a Defensiva.

| | Ofensiva | Defensiva |
|---|---|---|
| Dano causado | +20% | -15% |
| Dano recebido | +15% | -15% |
| Defesa de escudo | -10 pontos | +10 pontos |
| Vigor | Cada acerto de corte devolve 2 | Recuperação ×1,6 (de 5/s para 8/s na base) |
| Ao bloquear | Sem efeito adicional | Cura 2% da vida máxima |

A troca é instantânea, gratuita, não interrompe golpes e tem recarga de 6 s, que itens não reduzem. A defesa continua limitada a 75%, e sem escudo na mão não há bloqueio nem cura. O dano do Arremesso e da Onda é fixado no lançamento, com a postura daquele momento. Os efeitos são aplicados no cálculo de cada golpe e não entram em `warriorAttributes`: o painel de atributos mostra os valores sem postura, e a troca não altera vida nem vigor. Um anel no chão, na cor da postura, e o botão no HUD mostram qual está ativa. A escolha fica em `character.warriorStance`, e a recarga não é salva.

Ideias para uma próxima revisão, **ainda não implementadas**: Quebra-guarda (Estocada contra alvo atingido pelo escudo) e Segundo fôlego (bloqueio ajuda a sustentar o Tornado). Avaliar duração, custo e limites antes de incluí-las.

## Modelo e animações

Original fornecido pelo usuário: `blender/reference/warrior/warrior_source.glb`. A malha tem UV, material e rig humano; a espada original estava deslocada e o escudo abaixo da mão. O gerador reposiciona suas peças e atribui peso rígido às respectivas mãos.

A guarda revisada usa alvos explícitos para braços e pernas em `warrior_pose.py`: punho alinhado ao antebraço, cabo atravessando a palma, dedos flexionados e polegar em oposição. O combo retorna à guarda após o terceiro corte; as poses finais dos dois primeiros cortes são as poses iniciais do seguinte. Estocada e escudo retornam à guarda individualmente. Prévias Cycles reproduzíveis por `blender/scripts/warrior_review.py`, em `blender/previews/warrior_idle.png` e `warrior_grip.png`.

Fonte reproduzível: [warrior_motion.py](../blender/scripts/warrior_motion.py). Cena: [warrior.blend](../blender/models/warrior.blend). Export: [warrior.glb](../blender/exports/warrior.glb). Nesta entrega, a geração e as inspeções foram feitas pelo MCP do Blender. O script preserva uma cópia da sessão em `blender/backups/` e exporta somente o personagem selecionado.

Clipes: `idle`, `walk`, `strafe_left`, `strafe_right`, `slash_1`, `slash_2`, `slash_3`, `thrust`, `shield_bash`, `death`, `dodge`. Os três cortes variam preparação, torção e trajetória; a estocada alinha a lâmina para a frente no impacto. Registro em `v2/assets/models.json`; distribuição por `node v2/tools/build.cjs`.

## Verificação e limites

Testes de regras: `node --test v2/tests/warrior.test.mjs v2/tests/warrior-class.test.mjs v2/tests/warrior-slots.test.mjs v2/tests/warrior-skills.test.mjs`, além das regressões de equipamentos, combate, progressão e saves. Navegador: `node v2/tests/warrior-browser-check.cjs`, com Playwright e Edge em perfil isolado. Evidências em [review/v2/warrior](../review/v2/warrior/).

O arsenal e a árvore marciais estão integrados; o roteiro da campanha continua compartilhado. O balanceamento completo da campanha para o Guerreiro permanece pendente. Tornado reutiliza a pose de corte e rotação contínua do corpo; Arremesso e Brado reutilizam o gesto de escudo; Onda reutiliza o terceiro corte. Ainda não há clipes autorais específicos para essas habilidades. Os números de Ricochete, variantes, Postura, Brado e Onda são valores iniciais, sem validação em campanha completa. A lentidão do Brado aparece no movimento do inimigo, sem marca própria sobre ele. No controle, as ações da barra além do slot 1 e da esquiva seguem sem botão próprio. Testes de regras não substituem uma campanha completa jogada.

### Origem e enquadramento

O GLB fica sob `WarriorOrigin`, em (0, 0, 0), com o rig compensado pelo centro das solas na guarda. O deslocamento original de aproximadamente 0,37 unidade no plano do chão foi removido, mantendo os clipes locais. No menu, a prévia mede a pose idle após aplicar a rotação de apresentação para centralizar o enquadramento. O teste de navegador mede o centro entre os pés e exige distância inferior a 0,1 unidade da origem na escala do jogo.

O arquivo Blender e o GLB mantêm somente esses oito clipes. O gerador remove ações órfãs das gerações anteriores para evitar cópias com sufixos numéricos; ações de outros objetos em uso são preservadas.

### Revisão de animação com as skills

A revisão usa antecipação mais longa e passagem rápida pelo impacto, torção compartilhada entre quadril e tronco e passos com apoio/balanço separados. O escudo abre espaço para a espada durante a ligação do combo. A pegada, a origem, os IDs e os oito clipes são preservados.

As ações são **in-place**: `WarriorOrigin` permanece fixo; a simulação aplica movimento e colisão da estocada. Os deslocamentos pequenos do quadril são internos à pose. Não há mudança de dano, custo, alcance, recarga ou instante de impacto. Não há trilhas de escala nos ossos. Os nomes de ações seguem o contrato existente do jogo, em vez de renomear clipes com prefixos sugeridos pelas skills.

Dados de poses: `blender/scripts/warrior_motion_data.py`. Checagem de loops e continuidade: `blender/scripts/warrior_animation_check.py`, executada pelo MCP. Resultado em `blender/previews/warrior_animation_validation.json`. A malha mantém 4.594 triângulos, 3.500 vértices, um material e textura de 1024 × 1024.

Prévia Three.js: `node v2/tests/warrior-motion-browser-check.cjs`; depois `python blender/scripts/pack_warrior_motion_preview.py`. O GIF em `blender/previews/warrior_motion.gif` mostra os movimentos desacelerados para inspeção. Evidências de poses ficam em `review/v2/warrior-motion/`. O jogo mantém os tempos reais descritos na tabela de ações.

### Amplitude das articulações

A segunda revisão amplia a extensão do braço no impacto usando o alvo de mão e um alcance máximo com margem para não travar o cotovelo. A rotação passa por Hips, Spine, Spine1, Spine2 e clavículas; a cabeça compensa parte da rotação para manter a leitura da mira. Os joelhos flexionam ao baixar o quadril, com polos acompanhando a direção dos pés. Os pés pivotam nos cortes e a estocada tem base mais desencontrada.

A auditoria de poses registra a amplitude real das articulações por clipe em `warrior_animation_validation.json`. Nesta revisão, os cortes e a estocada atingem aproximadamente 9° de flexão do cotovelo no trecho de extensão; o terceiro corte atinge cerca de 86–88° nos joelhos. O limiar de continuidade entre os clipes continua sendo 0,0001. Oito clipes, origem e regras do combate são preservados.

### Caminhada aprovada pelo usuário

As cinco poses manuais do braço direito foram preservadas em `blender/reference/warrior/walk_user_poses.json` e distribuídas em um ciclo de 25 frames por `warrior_walk_refine.py`. O braço direito acompanha o pé esquerdo à frente; o escudo acompanha o lado oposto com 20% da oscilação anterior. O gerador reaplica esses dados manuais nas regenerações.

As pernas à mostra denunciavam a cadência de 5,3 passos por segundo a 4 u/s, e a velocidade da perna vem de velocidade ÷ passada, não do número de quadros. `warrior_walk_stride.py` alongou a passada para 2,2 u (3,6 passos por segundo), com cada pé no chão em 34% do ciclo e um breve instante no ar; os pés ficam a 0,39 u um do outro na lateral, sob os quadris; tronco e braços não mudaram. O passo lateral tem 1,8 u por ciclo (4,4 passos por segundo). Os dois valores ficam em `stride` e `strafeStride`, em `v2/assets/models.json`, e precisam concordar com os scripts para o pé não escorregar.

### Integração das edições manuais

Os três cortes autorais foram exportados diretamente da cena editada pelo usuário, sem executar o gerador procedural: slash_1 tem 19 frames, slash_2 tem 17 e slash_3 tem 13, a 30 fps. Exportador preservador da cena: `blender/scripts/warrior_export_manual.py`. Os clipes começam em zero no GLB; duplicatas de stash não são exportadas. A guarda vazia foi recuperada de um backup e o vínculo incorreto de walk à malha foi removido; a caminhada animada permanece no rig.

O jogo conserva as durações editadas. O primeiro impacto ocorre no frame 12; o segundo e o terceiro, no frame 9 de seus clipes. Dano, multiplicadores, arco, alcance e custos permanecem iguais. Cada clique executa apenas um corte; há 0,45 s após a conclusão para continuar. Em repouso, a pose final fica mantida nessa janela para a ligação ao corte seguinte. O controle exige soltar e apertar novamente, sem combo automático por botão mantido. Testes de navegador usam cliques reais para verificar sequência e expiração da janela.

### Caminhada e combo com movimento contínuo (2026-11-06)

`blender/scripts/warrior_fluid_motion.py`, executado na sessão do Blender via MCP sobre `models/warrior.blend`, substitui só as chaves de `walk`, `slash_1`, `slash_2` e `slash_3`; as outras ações não mudam. As poses são interpoladas por curvas Hermite com tangentes Catmull-Rom, então o movimento não para em cada chave. A tangente é zero nas pontas e nas chaves de antecipação. O quadril conduz, e Spine, Spine1 e Spine2 seguem com 0,5 e 1 frame de atraso. A cabeça compensa parte da torção para manter o olhar na mira. A pose de partida é o frame 1 do `idle`.

- **Combo:** a mão é definida no espaço do peito, para a torção do tronco carregar o golpe; a lâmina é definida no espaço do rig, porque essa é a direção que aparece na tela. O slash_1 é um corte diagonal da direita alta para a esquerda baixa: a espada para sobre o ombro nos frames 7–9, o quadril dispara no 10 e a lâmina chega no impacto, no frame 12. O slash_2 é um revés horizontal da esquerda para a direita, com impacto no frame 9. Ele termina com a espada aberta à direita, pose que também serve ao Corte tornado. O slash_3 desce de cima, com o quadril baixo e o calcanhar de trás erguido no impacto, no frame 9. Os pés giram sobre a planta, com o calcanhar levantando.
- **Tronco e pernas no combo (revisão do mesmo dia):** a torção aumentou nos três cortes. O quadril chega a ±0,5 rad e o peito soma mais ±0,5 rad. A inclinação para a frente no impacto também ficou maior, e a bacia tomba para o lado da perna que sustenta o peso (`hip_roll`). Os pés agora podem andar (`left_step`/`right_step`, deslocamento da planta no espaço do rig):
  - **slash_1:** o peso recua para a perna de trás e o pé da frente sai do chão. Na descida, ele avança um passo (0,068 do rig, cerca de 0,21 u) e depois recua meio passo no acompanhamento.
  - **slash_2:** o pé direito abre um passo para o lado no revés, e a base fica larga na pose final.
  - **slash_3:** o corpo sobe na ponta dos pés, o joelho da frente sobe e o pé bate à frente. O quadril desce 0,09 do rig no impacto.
  - **Ligação entre cortes:** a pose final de cada corte é a inicial do seguinte. Só a volta ao `idle` (mistura de 0,08 s) recolhe o meio passo restante, no máximo 0,04 do rig.
  - **Alcance das pernas:** o gerador informa `pe_fora_do_alcance` por clipe, e o valor foi 0,0 nos três.
  - **Backup:** a cena anterior a esta revisão está em `blender/backups/warrior_before_body_motion_20261106_193824.blend`.
- **Caminhada:** os pés repetem a trajetória de `warrior_walk_stride.py` (2,2 u por ciclo, sem escorregar). Foram acrescentados o sobe-e-desce do quadril, o balanço lateral sobre o pé de apoio, o giro e a queda da bacia, a contra-rotação dos ombros e o atraso do antebraço e do punho da espada. O braço da espada continua usando as cinco poses de `walk_user_poses.json`.
- Durações, frames de impacto, dano, alcance e recarga não mudaram. Evidências no jogo em `review/v2/warrior-fluid-motion/` (`combo-sheet.png`, `run-sheet.png`). A cena anterior está em `blender/backups/warrior_before_fluid_motion_original_20261104.blend`.

### Estocada autoral e área ampliada

O `thrust` editado pelo usuário tem 12 frames a 30 fps e foi exportado sem regenerar poses. O dano ocorre uma vez, quando o braço termina de estender, após resolver o avanço com a colisão existente. A faixa registra origem, direção e extensão percorrida, evitando perder alvos ultrapassados durante a investida. Paredes bloqueiam cada alvo por `lineClear`. Fora do raio lateral de 0,85 somado ao raio do alvo, não há dano. Um rastro dourado de 0,25 s mostra a cápsula usada para o acerto.

O `.blend` foi limpo: apenas as oito ações/trilhas usadas, sem Action Stash ou ações órfãs duplicadas. A limpeza faz backup antes e mantém os cortes e a caminhada aprovados.

### Escudo destacável e inimigo soldado

`warrior_equipment_export.py`, pelo MCP, importa temporariamente uma cópia de `warrior.blend`, preserva os oito clipes e exporta a máscara `_WARRIOR_SHIELD`. A geometria do escudo (65 vértices, 96 faces) também é exportada em `warrior_shield.glb`, usando os mesmos UVs e material. A fonte editável continua na cena do Guerreiro; a cena ativa do usuário não é salva nem alterada. No jogo, a máscara oculta só o escudo durante o voo ou sem equipamento de escudo, preservando a mão.

O jogador mantém o ID de modelo `warrior`. O inimigo do índice zero mantém suas regras e passa a usar `enemySoldier`, que aponta para `v2_enemy_knight.glb`, impedindo que o novo modelo do jogador substitua o inimigo anterior.

### Apresentação da árvore marcial

A aba Habilidades usa a linguagem visual do Grimório do Necromante: três ramos com selos selecionáveis, contadores de investimento, estados aprendidos/disponíveis/bloqueados e painel de detalhes com botão de investimento. Espada usa dourado, Escudo azul acinzentado e Passivas verde oliva. Guarda treinada aparece no ramo de Escudo para manter visível sua ligação a Retaliação, preservando seu ID e efeito passivo.

As linhas contínuas mostram os pré-requisitos reais: Slash → Ímpeto, Slash → Onda de Aço, Estocada → Tornado, Tornado → Ciclone, Tornado → Turbilhão, Golpe de escudo → Arremesso, Arremesso → Ricochete e Guarda treinada → Retaliação. Traços pontilhados apenas agrupam as passivas independentes e não impõem requisitos. Em telas estreitas, seletores alternam o ramo exibido, com os detalhes abaixo do grafo. A revisão muda a apresentação, sem alterar custos, níveis, pontos ou saves. Capturas em `review/v2/warrior/skill-tree.png` e `skill-tree-mobile.png`.

### Ciclo Tornado em ajuste no Blender

A fonte `blender/models/warrior.blend` possui agora a ação adicional `tornado`: frames 1–25 a 30 fps, volta completa, braço à frente do peito e palma para baixo. Foi deixada ativa no Pose Mode para revisão manual. As oito ações anteriores foram preservadas. A nova ação ainda não foi exportada ou ligada ao jogo, que continua usando a pose de `slash_2` e rotação pelo runtime. [Notas do ciclo](../blender/notes/warrior_tornado.md).

### Escolha dos slots

A aba Habilidades mostra somente a árvore da classe ativa. Ao trocar de um Necromante para um Guerreiro, o Grimório anterior fica oculto e a árvore do Guerreiro permanece disponível; pontos e habilidades continuam separados por personagem.

Clique em um slot da barra para escolher sua habilidade. A escolha segue as regras da seção Barra de habilidades e fica salva por personagem. Os atalhos e botões do mouse seguem o slot; recargas, custos e desbloqueios seguem a habilidade. Para o Tornado, mantenha pressionado o atalho do slot escolhido e solte para encerrar. Saves anteriores mantêm a ordem original.
