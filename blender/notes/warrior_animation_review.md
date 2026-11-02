# Revisão de animação do Guerreiro

## Brief

Personagem estilizado existente para Three.js/WebGL 2; orçamento preservado de 4.594 triângulos, um material e textura 1024². GLB autocontido, origem no centro das solas. Oito clipes de runtime preservados; sem nova malha, dependências ou mudanças nas regras do combate.

Skills aplicadas: blender-director (planejamento), animation (fases, arcos e continuidade), rigging (alvos e polos), stylized-style (silhueta), asset-optimization/export-pipeline (orçamento e exportação), qa-review (conferência visual). Referências de combate e caminhada lidas em `animation/references/` da instalação das skills. A convenção de IDs do projeto prevalece sobre prefixos genéricos das skills.

## Alterações

- Combo encadeado: finais de slash_1 e slash_2 coincidem com os inícios dos cortes seguintes.
- Preparação em 36% do clipe e impacto em 50%, preservando a aplicação de dano; passagem da espada mais rápida.
- Quadril acompanha a torção, cabeça compensa parcialmente e escudo abre passagem no encadeamento.
- Caminhada com fase de apoio a velocidade constante, balanço elevado e contato do pé articulado.
- Estocada e escudo usam recuo preparatório, transferência de peso e recuperação.
- Idle sutil; pegada e centro dos pés mantidos. In-place: deslocamento real continua no motor.

## QA

**Resultado: APROVADO PARA REVISÃO NO JOGO.**

A checagem MCP confirmou oito ações únicas, 4.594 triângulos, até quatro influências por vértice, matrizes finitas, ausência de trilhas de escala, loops e ligações do combo com diferença abaixo de 0,0001. Essa checagem cobre animação e orçamento; não constitui nova validação de toda a topologia importada.

Inspeção por quadros no Blender: três quartos e perfil de caminhada, cortes, estocada e escudo. Conferência Three.js e capturas em `../../review/v2/warrior-motion/`. Prévia GIF desacelerada: `../previews/warrior_motion.gif`. Auditoria: `../previews/warrior_animation_validation.json`.

Não houve alteração de balanceamento. A inspeção artística final permanece iterativa: a prévia foi entregue para avaliação do ritmo e das poses pelo usuário.

## Segunda revisão: corpo inteiro

A extensão do braço usa o comprimento do úmero e antebraço, com margem para evitar travamento. A rotação foi distribuída por pelve, três segmentos da coluna e clavículas; quadril mais baixo e pivô dos pés permitem maior flexão dos joelhos. O limite anatômico de alcance é respeitado pelo solver. Não há mudança na geometria, nos tempos de dano ou nas oito ações exportadas.

A auditoria considera apenas as ações das oito trilhas do Guerreiro: ações de outros objetos da sessão Blender não são contadas nem removidas. As amplitudes dos cotovelos e joelhos agora são medidas por quadro. Cortes e estocada devem passar por menos de 20° de flexão do cotovelo; terceiro corte e estocada devem ultrapassar 40° nos joelhos.

## Revisão manual de slash_1

O usuário editou os frames 1–13 na ação ativa slash_1. A continuação 14–15 e recuperação 16–22 foram aplicadas por `scripts/warrior_slash_recovery.py`, com conferência numérica de que os frames 1–13 mantiveram suas transformações. Snapshot autoral em `reference/warrior/slash_1_user_poses.json`; cena atual em `models/warrior.blend`. A trilha NLA slash_1 agora referencia a ação editada pelo usuário. A integração ao jogo permanece pausada por solicitação do usuário; não regenerar a cena procedural descartando essas poses manuais.

## Ligação autoral no frame 19

O usuário refez a slash_1 e aprovou até o frame 14. A ação estava terminando no frame 18; a pose mantida no frame 19 foi materializada como último keyframe e copiada para a entrada da slash_2. Frames 1–14 foram conferidos intactos. A preparação da slash_2 foi suavizada nos frames 2–7, preservando do frame 8 em diante. As poses estão em `reference/warrior/slash_combo_user_poses.json`; aplicação por `scripts/warrior_slash_link.py`. Continuidade conferida considerando a equivalência de sinais dos quaternions. Integração no jogo continua pausada.

## Slash_3 manual ascendente

O usuário concluiu slash_2 em 17 frames. `scripts/warrior_slash_upward.py` inicia slash_3 exatamente na pose terminal de slash_2, sem modificar essa ação. Frames 1–6 viram o punho, 6–17 sobem a diagonal e 17–22 mantêm o final pouco acima do ombro. O início autoral e sua origem estão em `reference/warrior/slash_3_start_pose.json`. Cena salva e inspecionada em três quartos; recuperação à guarda e integração no jogo continuam pendentes de revisão do usuário.

## Integração autoral concluída

A pedido do usuário, os clipes manuais 19/17/13 frames foram exportados para o jogo por `warrior_export_manual.py`. Não se regeneraram poses. A ação idle vazia foi recuperada de `backups/warrior_before_user_walk_refine.blend`; o vínculo walk à malha foi desligado, preservando a ação no rig. O GLB contém oito animações, com início em zero e durações 0,60 / 0,533 / 0,40 s para os cortes. Relatório de exportação: `previews/warrior_manual_export.json`.

A ligação slash_2 → slash_3 tem diferença de matriz zero. A ligação slash_1 → slash_2 tem pequena diferença principalmente na mão, mantida para preservar o trabalho autoral e suavizada pelo crossfade existente no jogo; valores em `previews/warrior_manual_joins.json`. Prévia dos três cortes no Three.js em `previews/warrior_motion.gif`. Testes de combate, progressão e saves: 56 aprovados. Conferência do navegador inclui cliques físicos, sequência 1/2/3, ausência de combo automático por botão mantido, expiração da janela, passivas e alinhamento do modelo.

## Thrust autoral curto e limpeza final

A estocada editada pelo usuário tem 12 frames a 30 fps. Avanço ocorre entre 0,20 e 0,367 s; impacto coincide com a extensão no frame 12 e há 0,12 s de recuperação. Área agora é uma cápsula de raio 0,85 cobrindo avanço e ponta, com extensão de 3,4 unidades além da posição final. O caminho existente de dano continua aplicando 220% uma única vez por alvo, com bloqueio de paredes. Conferência em navegador acertou alvos no trajeto e na ponta e não acertou o alvo lateral externo.

Foram removidas cinco ações órfãs/duplicadas e a trilha Action Stash. A cena e o GLB agora contêm somente idle, walk, slash_1, slash_2, slash_3, thrust, shield_bash e death. Oito ações e oito trilhas foram verificadas na sessão Blender. As poses dos cortes e a caminhada não foram regeneradas. Validação de regras e regressões: 57 testes aprovados.
