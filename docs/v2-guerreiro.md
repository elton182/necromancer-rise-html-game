# Guerreiro / Soldado — primeira versão jogável

Implementado na v2. Novo Jogo oferece Necromante e Guerreiro, com classe e progresso por personagem. Saves anteriores sem classe continuam Necromantes.

## Ações

Cada clique executa um único corte. O próximo clique avança a sequência se ocorrer até 0,45 s após o término do corte anterior; depois disso, reinicia no primeiro. Durante a recuperação, após o impacto, é possível reservar apenas o próximo corte com um novo clique. Cliques anteriores ao impacto são ignorados e segurar o botão do controle não repete o ataque. Pausa congela a janela; esquiva, morte, outra habilidade e troca de cena encerram a sequência. A direção fica fixa durante a ação; o jogador pode cancelar com a esquiva C. Morte e troca de cena encerram a ação. O recurso usa o campo de mana existente no save, apresentado como vigor para o Guerreiro; animações não aplicam dano diretamente.

| Comando | Ação | Regra inicial |
|---|---|---|
| Clique / 1 | Três cortes | Sem custo; durações de 0,60 / 0,533 / 0,40 s por corte. Impacto em 0,367 / 0,267 / 0,267 s após iniciar cada corte; 55%, 65% e 90% do dano físico; alcance 2,6; arco 144°. |
| Botão direito / 2 | Estocada avançada | Requer um ponto em Estocada. 20 vigor, recarga 5 s. Avança até 5 unidades entre 0,20 e 0,367 s, buscando terminar a 2,2 unidades da mira. Impacto no frame 12 (0,367 s), 220% de dano. Cápsula com raio 0,85 cobre todo o avanço até 3,4 unidades à frente da posição final, incluindo o raio do alvo. Não atravessa sólidos nem concede invulnerabilidade. A pose final é mantida por 0,12 s de recuperação; total de 0,487 s. |
| 3 / Q | Golpe de escudo | Requer um ponto em Golpe de escudo. 15 vigor, recarga 7 s. Impacto em 0,3 s, 130% de dano; alcance 1,8 e arco 117°. Empurra 0,8 unidade respeitando colisões. Recuperação total 0,8 s. |
| R / 5 (manter) | Corte tornado | Requer nível 6 e um ponto em Estocada. Custa 5 vigor ao iniciar e 12/s durante o giro. Acerta em 360°, raio 2,7, por 65% do dano a cada 0,3 s (primeiro impacto após 0,15 s). Movimento a 55% da velocidade; termina ao soltar, pausar, esquivar, morrer ou esgotar vigor. Recarga de 3 s ao encerrar. |
| T / 6 | Arremesso de escudo | Requer nível 6 e um ponto em Golpe de escudo. Custa 20 vigor, recarga 7 s. Lança após 0,18 s; viaja a 14 u/s por 0,55 s e retorna ao jogador, ou volta antes ao atingir sólido. Cada alvo recebe 120% de dano uma vez na ida e outra na volta. Sem bloqueio ou golpe de escudo durante o voo. |
| C / E / 4 | Esquiva | Reutiliza a esquiva existente. |

Alcances incluem o raio do alvo. Paredes bloqueiam os impactos. O avanço físico usa colisão contínua; inimigos fora do arco não são atingidos. Cada impacto passa pelo caminho de dano, morte e recompensa existente, uma única vez. O Guerreiro começa sem horda e não pode reanimar ou equipar ações do Necromante.

## Árvore, atributos e equipamentos

O treinamento tem três ramos: **Espada**, **Escudo** e **Passivas**. Três pontos por nível, incluindo o nível 1. O orçamento é recalculado pelo nível: personagens existentes recebem automaticamente os pontos adicionais, preservando os investimentos. Só os Cortes e a Esquiva funcionam sem investimento. O primeiro ponto em Estocada ou Golpe de escudo libera a habilidade; até lá, o slot mostra "Libere na árvore", e o comando não gasta vigor nem inicia recarga. Os nós de Cortes, Estocada e Golpe de escudo melhoram o dano em 6%, 10% e 10% por ponto (limites 5, 3 e 3), incluindo o primeiro. Tornado e Arremesso são desbloqueios de um ponto. Personagens que já gastaram todos os pontos em outros nós só liberam essas habilidades com os pontos do próximo nível. Investimentos em `character.warriorRanks` respeitam nível, pré-requisito e orçamento ao carregar; os três IDs antigos foram preservados.

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

Primeiro arsenal: espada de uma mão, escudo, armadura, elmo, botas e dois anéis. Espada tem dano-base; escudo, chance de bloqueio; armaduras mantêm defesa garantida. Afixos marciais incluem dano, vida, armadura, bloqueio, recuperação de vida/vigor, vigor, movimento e recarga. Mercador, loot, comparação, forja e save usam o catálogo de `warrior-equipment.mjs`; os itens do Necromante não mudaram. A redução de recarga dos itens (até 50%) afeta Estocada, Escudo, Tornado e Arremesso; os tempos dos cortes autorais ficam preservados.

Saves antigos do Guerreiro recebem espada e escudo iniciais uma única vez (`warriorEquipmentVersion: 1`). Cajado e grimório antigos permanecem guardáveis, mas não são equipáveis pela classe. Peças antigas comuns de armadura e anéis continuam utilizáveis; seus afixos mágicos/de horda ficam inativos. Trocar de personagem mantém catálogos e inventários separados.

Ideias para uma próxima revisão, **ainda não implementadas**: Quebra-guarda (Estocada contra alvo atingido pelo escudo) e Segundo fôlego (bloqueio ajuda a sustentar o Tornado). Avaliar duração, custo e limites antes de incluí-las.

## Modelo e animações

Original fornecido pelo usuário: `blender/reference/warrior/warrior_source.glb`. A malha tem UV, material e rig humano; a espada original estava deslocada e o escudo abaixo da mão. O gerador reposiciona suas peças e atribui peso rígido às respectivas mãos.

A guarda revisada usa alvos explícitos para braços e pernas em `warrior_pose.py`: punho alinhado ao antebraço, cabo atravessando a palma, dedos flexionados e polegar em oposição. O combo retorna à guarda após o terceiro corte; as poses finais dos dois primeiros cortes são as poses iniciais do seguinte. Estocada e escudo retornam à guarda individualmente. Prévias Cycles reproduzíveis por `blender/scripts/warrior_review.py`, em `blender/previews/warrior_idle.png` e `warrior_grip.png`.

Fonte reproduzível: [warrior_motion.py](../blender/scripts/warrior_motion.py). Cena: [warrior.blend](../blender/models/warrior.blend). Export: [warrior.glb](../blender/exports/warrior.glb). Nesta entrega, a geração e as inspeções foram feitas pelo MCP do Blender. O script preserva uma cópia da sessão em `blender/backups/` e exporta somente o personagem selecionado.

Clipes: `idle`, `walk`, `strafe_left`, `strafe_right`, `slash_1`, `slash_2`, `slash_3`, `thrust`, `shield_bash`, `death`. Os três cortes variam preparação, torção e trajetória; a estocada alinha a lâmina para a frente no impacto. Registro em `v2/assets/models.json`; distribuição por `node v2/tools/build.cjs`.

## Verificação e limites

Testes de regras: `node --test v2/tests/warrior.test.mjs v2/tests/warrior-class.test.mjs`, além das regressões de equipamentos, combate, progressão e saves. Navegador: `node v2/tests/warrior-browser-check.cjs`, com Playwright e Edge em perfil isolado. Evidências em [review/v2/warrior](../review/v2/warrior/).

O arsenal e a árvore marciais estão integrados; o roteiro da campanha continua compartilhado. O balanceamento completo da campanha para o Guerreiro permanece pendente. Tornado reutiliza a pose de corte e rotação contínua do corpo; Arremesso reutiliza o gesto de escudo. Ainda não há clipes autorais específicos para essas duas habilidades. Testes de regras não substituem uma campanha completa jogada.

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

### Estocada autoral e área ampliada

O `thrust` editado pelo usuário tem 12 frames a 30 fps e foi exportado sem regenerar poses. O dano ocorre uma vez, quando o braço termina de estender, após resolver o avanço com a colisão existente. A faixa registra origem, direção e extensão percorrida, evitando perder alvos ultrapassados durante a investida. Paredes bloqueiam cada alvo por `lineClear`. Fora do raio lateral de 0,85 somado ao raio do alvo, não há dano. Um rastro dourado de 0,25 s mostra a cápsula usada para o acerto.

O `.blend` foi limpo: apenas as oito ações/trilhas usadas, sem Action Stash ou ações órfãs duplicadas. A limpeza faz backup antes e mantém os cortes e a caminhada aprovados.

### Escudo destacável e inimigo soldado

`warrior_equipment_export.py`, pelo MCP, importa temporariamente uma cópia de `warrior.blend`, preserva os oito clipes e exporta a máscara `_WARRIOR_SHIELD`. A geometria do escudo (65 vértices, 96 faces) também é exportada em `warrior_shield.glb`, usando os mesmos UVs e material. A fonte editável continua na cena do Guerreiro; a cena ativa do usuário não é salva nem alterada. No jogo, a máscara oculta só o escudo durante o voo ou sem equipamento de escudo, preservando a mão.

O jogador mantém o ID de modelo `warrior`. O inimigo do índice zero mantém suas regras e passa a usar `enemySoldier`, que aponta para `v2_enemy_knight.glb`, impedindo que o novo modelo do jogador substitua o inimigo anterior.

### Apresentação da árvore marcial

A aba Habilidades usa a linguagem visual do Grimório do Necromante: três ramos com selos selecionáveis, contadores de investimento, estados aprendidos/disponíveis/bloqueados e painel de detalhes com botão de investimento. Espada usa dourado, Escudo azul acinzentado e Passivas verde oliva. Guarda treinada aparece no ramo de Escudo para manter visível sua ligação a Retaliação, preservando seu ID e efeito passivo.

As quatro linhas contínuas mostram os pré-requisitos reais: Slash → Ímpeto, Estocada → Tornado, Golpe de escudo → Arremesso e Guarda treinada → Retaliação. Traços pontilhados apenas agrupam as passivas independentes e não impõem requisitos. Em telas estreitas, seletores alternam o ramo exibido, com os detalhes abaixo do grafo. A revisão muda a apresentação, sem alterar custos, níveis, pontos ou saves. Capturas em `review/v2/warrior/skill-tree.png` e `skill-tree-mobile.png`.

### Ciclo Tornado em ajuste no Blender

A fonte `blender/models/warrior.blend` possui agora a ação adicional `tornado`: frames 1–25 a 30 fps, volta completa, braço à frente do peito e palma para baixo. Foi deixada ativa no Pose Mode para revisão manual. As oito ações anteriores foram preservadas. A nova ação ainda não foi exportada ou ligada ao jogo, que continua usando a pose de `slash_2` e rotação pelo runtime. [Notas do ciclo](../blender/notes/warrior_tornado.md).

### Escolha dos slots

Clique em um slot da barra para escolher sua habilidade. A escolha troca as posições das duas ações e fica salva por personagem. Os atalhos e botões do mouse seguem o slot; recargas, custos e desbloqueios seguem a habilidade. Para o Tornado, mantenha pressionado o atalho do slot escolhido e solte para encerrar. Saves anteriores mantêm a ordem original.
