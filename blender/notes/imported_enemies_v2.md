# Inimigos importados da v2 — primeira passagem

Fontes originais preservadas em `../reference/imported_enemies/`, com hashes no manifesto dessa pasta. Os seis personagens já vieram com skin; acessórios são malhas rígidas. Nenhum original tinha clipes. Esferas auxiliares sem modificador Armature foram excluídas dos exports novos.

## Arquivos e reprodução

- `../scripts/audit_imported_enemies.py`: auditoria dos dez arquivos, relatório em `../../review/v2/imported-enemies/audit.json`.
- `../scripts/imported_enemy_humanoids.py`: gerar com `-- --character=knight`, `mage`, `thief` ou `griffin`.
- `../scripts/imported_enemy_beasts.py`: gerar com `-- --character=wolf` ou `spider`.
- As saídas são `../models/v2_enemy_<personagem>.blend` e `../exports/v2_enemy_<personagem>.glb`.
- `../scripts/stage_imported_enemies.py`: executar na sessão Blender via MCP para criar cena separada e preservar a anterior. Carrega fontes editáveis e ações, sem executar reset de cena. A propriedade `review_clips` de cada armature mapeia nomes lógicos às ações carregadas, evitando colisão com ações já abertas.
- `../models/v2_imported_enemies_review.blend`: cena de revisão salva pela sessão MCP, separada do arquivo do Rei.
- `../scripts/preview_imported_knight.py`: prévias Cycles, também aceita `-- --character=<personagem>`. Prévias são evidências de iteração; após editar uma fonte, gerar novamente antes de considerá-las atuais.

Exemplo na raiz, com Blender instalado:

```powershell
blender --background --threads 4 --python blender/scripts/imported_enemy_humanoids.py -- --character=knight
node v2/tools/build.cjs
node --test v2/tests/imported-enemies.test.mjs v2/tests/enemies.test.mjs
node v2/tests/imported-enemies-browser-check.cjs
```

O cavaleiro leva espada e escudo; ladrão leva adaga; mago leva cajado de fogo. Os acessórios são presos ao osso da mão e exportados no mesmo GLB. O posicionamento da espada/adaga considera o eixo principal da geometria e um ponto de empunhadura, não apenas o centro da caixa delimitadora.

## Animação e limites

### Revisão do cavaleiro

O gerador de humanoides aplica `../scripts/knight_animation.py` ao cavaleiro depois dos refinamentos compartilhados. Esse módulo também permite atualizar as ações existentes na sessão MCP com `animate_knight(arm, actions)`, passando o mapa de clipes do rig. A preparação pesada mantém a guarda e corta no final; `heavy_attack` continua o golpe e `recover` retorna à guarda, com poses de fronteira correspondentes. O ataque comum começa no contato e retorna à guarda, acompanhando o dano imediato já existente no motor. Dano, alcance, recarga e tempos do runtime permanecem iguais.

**Revisão de movimento do cavaleiro:** os clipes foram refeitos por `../scripts/v2_enemy_knight_motion.py` (`blender --background blender/models/v2_enemy_knight.blend --python blender/scripts/v2_enemy_knight_motion.py`; grava `.blend` e `.glb`; na sessão MCP defina `KNIGHT_EXPORT = False` para só pré-visualizar), no lugar da animação de `knight_animation.py`. Mesmos nomes e comprimentos; o corte pesado mantém o contato no último quadro de `heavy_windup`, e o ataque comum continua começando no contato. Encaixe rígido das armas na primeira execução: a espada tem a empunhadura (16% do cabo) no centro do punho direito, com o ângulo lâmina×antebraço limitado a 35°–115°; o escudo foi centralizado no punho esquerdo e afastado até a face interna passar da mão (antes o punho ficava na frente do escudo), e gira só em torno do antebraço. Marcas `grip_fit` e `outer_normal` nos objetos evitam refazer o ajuste.

A caminhada inclui quadril, tornozelos e oscilação dos braços; reação e morte têm maior participação do tronco e relaxamento dos membros. Continua sendo um ciclo no lugar, sem IK de apoio contínuo. As sequências de ataque, preparação pesada, continuação, recuperação, caminhada e morte foram inspecionadas no Blender via MCP. A cena editável e o GLB foram salvos, e a distribuição deve ser regenerada pelo build habitual.

Todos têm descanso, caminhada, ataque, reação e morte. Cavaleiro tem preparação pesada, ataque pesado e recuperação; mago tem conjuração e Erupção; lobo tem preparação, investida e recuperação; ladrão, grifo e aranha têm preparação e contato próprios. O runtime aciona os estados especiais, e a reação visual só substitui descanso/caminhada, sem conceder interrupção de ataque.

Esta é a primeira passagem de animação sobre pesos importados, preservando texturas/PBR dos arquivos fornecidos. Foram inspecionadas poses e caminhadas na sessão MCP e capturas no navegador. Isso não equivale a acabamento manual de todos os dedos, tecido, contatos e apoios. Os rigs não têm IK de apoio contínuo; a locomoção usa ciclos no lugar sincronizados pela distância percorrida. O rig da aranha tem nomes de cadeias inconsistentes; o script usa sua hierarquia, sem assumir que os nomes correspondem à anatomia.

Evidências e resultados: `../../review/v2/imported-enemies/`. O teste de navegador verifica os clipes, matrizes finitas, carregamento offline, ausência de esferas auxiliares e erros de página, fundos claro/escuro, qualidade baixa e uma cena com horda. Não é benchmark em hardware de referência nem aprovação artística final.

## Revisão de equipamentos e voo

A revisão foi feita na sessão Blender aberta via MCP. Espada, escudo, adaga e cajado foram reduzidos para 0,52 / 0,34 / 0,42 / 0,84 unidades (a adaga foi ampliada de 0,22 para 0,42 por ficar pequena em jogo) da fonte, respectivamente, e reposicionados na pegada de descanso. O escudo cobre o antebraço e o cajado fica vertical nessa pose. O arquivo `../scripts/imported_humanoid_refinements.py` é compartilhado entre o gerador e a revisão ao vivo. `../scripts/export_refined_enemies.py` exporta somente a cena temporária ativa, usando trilhas NLA com nomes canônicos, sem sobrescrever o arquivo aberto.

A harpia mantém o ID `griffinHumanoid` / modelo `enemyGriffin`. Penas foram separadas em duas malhas, com ossos `WingLeft`, `WingRight` e pontas independentes, ligados ao tronco. Os braços continuam livres para o ataque. As asas foram elevadas até a linha dos ombros; volumes fechados cobrem o encaixe nas costas, e fragmentos remanescentes da ligação aos braços foram removidos. O clipe `fly` executa o batimento; os clipes de ataque também mantêm as asas ativas. A fonte editável inclui corpo, asas, encaixes e ações.

No jogo, os três humanos usam a altura corporal do player em descanso, excluindo equipamentos da medição. A v2 preserva a escala original do player. A harpia voa baixo, a 0,85 u com oscilação de 0,09 u, sombra no chão mesmo em qualidade baixa e descida ao morrer em 0,8 s. Sua projeção no chão mantém colisões, seleção, alcance, dano e vulnerabilidade comuns. O voo visual não concede imunidade nem passagem por paredes.

## Ladino Arqueiro e Orc

Fontes em `../reference/imported_enemies/`: `hooded_rogue.glb`, `stylized_bow.glb`, `orc.glb`, `orc_spiked_wooden_mace.glb` (hashes no manifesto). Ambos usam o rig Mixamo de 65 ossos do ladrão. Gerar com `-- --character=rogue` ou `orc` em `../scripts/imported_enemy_humanoids.py`; saídas `../models/v2_enemy_<personagem>.blend` e `../exports/v2_enemy_<personagem>.glb`.

- **Ladino:** clipes `idle`, `walk`, `attack` (puxa a corda e solta), `recover`, `hit`, `death`. O arco é alinhado pelo eixo principal da malha (vinha inclinada ~22°), com a barriga para a frente, e preso ao punho esquerdo na pose de guarda. A cada quadro a mão gira no próprio eixo para o arco ficar na vertical (0–6,6° medidos).
- **Orc:** 28 peças rígidas juntadas numa malha (28 materiais). Clipes `idle`, `walk`, `attack`, `smash_windup`, `smash`, `recover`, `hit`, `death`. A maça atravessa o punho direito (centro calculado pelos vértices da mão e dedos) e é orientada a cada quadro: ereta, armada atrás do ombro e depois caindo à frente. A morte escala os deslocamentos pela altura do corpo.
- **Orc, revisão de movimento:** os clipes foram refeitos por `../scripts/v2_enemy_orc_motion.py` sobre o `.blend` existente (`blender --background blender/models/v2_enemy_orc.blend --python blender/scripts/v2_enemy_orc_motion.py`; grava `.blend` e `.glb`; na sessão MCP defina `ORC_EXPORT = False` para só pré-visualizar, pois o exportador GLB não roda nesse contexto). Mesmos nomes e comprimentos. Idle com respiração e troca de peso; walk com passada, balanço de quadril e contragiro do tronco; `attack` diagonal; `smash_windup` com a maça acima da cabeça e `smash` batendo no chão à frente; `hit` e `death` (cede os joelhos e tomba de costas). Os pés são acompanhados ao chão por quadro.
- **Encaixe da maça:** na primeira execução o script refaz o encaixe (marca `grip_fit` no objeto): eixo real da malha vira o +Z, o ponto de empunhadura (25% do cabo) fica no centro do punho fechado e o cabo cruza o punho no sentido dos nós dos dedos. A cada quadro o ângulo entre cabo e antebraço é limitado a 55°–125°, para o cabo não correr dentro do braço.
- Limites: sem refino manual de dedos, tecido e apoios; a maça encosta no chão na morte e no impacto da pancada (tolerância de poucos milímetros no impacto). Conferido no Blender via MCP (todos os clipes) e no HTML gerado (poses estáticas); o `v2/tests/imported-enemies-browser-check.cjs` não foi executado (Playwright ausente).

## Player (necromante): revisão de movimento

Clipes `idle` (48 quadros, loop), `walk` (16, loop), `cast` (9) e `death` (19) refeitos por `../scripts/v2_player_motion.py` a partir de `../models/rigged_player.blend` (`blender --background blender/models/rigged_player.blend --python blender/scripts/v2_player_motion.py`; grava `../models/v2_player.blend` e `../exports/v2_player.glb`, sem alterar o arquivo de origem; na sessão MCP defina `PLAYER_EXPORT = False` para só pré-visualizar). Em `v2/assets/models.json` o player aponta para esses arquivos e `durations.idle` passou a 2 s (48 quadros a 24 fps); walk (0,667 s), cast (0,375 s) e morte (≈0,8 s) mantêm a duração anterior, então o ritmo do jogo não muda.

- **Cajado:** o objeto tinha uma restrição `COPY_ROTATION` herdada da cena de sprites, que o mantinha sempre na vertical; o script a remove, e o cajado passa a acompanhar a mão. O encaixe usa o eixo real da malha, empunhadura a 47% a partir do pé do cajado, centro do punho calculado por ajuste de círculo nos vértices dos dedos curvados e escala do armature preservada. A cada quadro o ângulo cajado×antebraço é limitado a 55°–125°; medido: idle 119–123°, walk 115–125°, cast 55°, morte 55–125°.
- **Pernas:** o modelo nasce com as pernas abertas (pés a ±0,27 u contra quadris a ±0,15 u); `LEG_CLOSE` (0,12 rad) aproxima as coxas em todos os clipes, deixando os pés a ≈±0,18 u. A amplitude da passada foi mantida: o pé apoiado anda ≈0,09 u por quadro, igual ao ciclo de 1,5 u em 16 quadros, sem deslizar.
- **Cast:** a preparação recua o tronco, o braço esquerdo estende à frente e o cajado aponta à frente e para cima; o disparo continua saindo no início do clipe, e o último quadro sustenta a pose enquanto a carga do Tiro de Osso segura o clipe.
- **Altura:** os pés são acompanhados ao chão por quadro; a altura em descanso ficou ≈0,5% menor que a do clipe antigo, e os humanoides que usam a altura do player acompanham (diferença imperceptível).
- Limites: não há clipes de dash ou reação para o player (o jogo mantém o descanso no dash); sem refino manual de dedos e capuz. Conferido no Blender via MCP, no HTML gerado (sem erros de console) e nos 370 testes de `v2/tests/*.test.mjs`; o teste de navegador com Playwright não foi executado.

## Harpia: arremesso de penas

Dois clipes novos no GLB da harpia, `feather_windup` (14 quadros: asas erguidas, braços abertos para trás, tronco recuado) e `feather` (10 quadros: braços lançados à frente, asas recolhidas, tronco inclinado), gerados por `imported_enemy_humanoids.py -- --character=griffin` e `imported_humanoid_refinements.py`. A pena em voo é um modelo estático à parte, `v2_harpy_feather.glb`, gerado por `blender/scripts/v2_harpy_feather.py` (0,86 u, cálamo marfim, lâmina marrom recortada com ponta escura; ponta no eixo +X). Registrados em `v2/assets/models.json` como `harpyFeather` e nos clipes exigidos de `enemyGriffin`. A pena e as poses foram conferidas no Blender aberto via MCP, numa cena de revisão já removida.

## Lobo: uivo

Clipe novo `howl` (24 quadros, sem loop) no GLB do lobo, gerado por `imported_enemy_beasts.py -- --character=wolf`: a cabeça se ergue em ~25% do clipe, segura o grito com leve tremor no peito e volta ao final. Conferido no Blender aberto via MCP (cena de revisão removida). Registrado em `v2/assets/models.json` nos clipes exigidos de `cryptHound`. Limitação: a cadeia de membros do lobo é um rig importado sem rótulos confiáveis, então só a cabeça e a coluna foram animadas.
