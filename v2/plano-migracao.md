# Migração de Necromancer’s Rise para 3D — v2

Última atualização: 28/10/2026.

## Ponto de retomada

**Estado: E3 concluída — movimento, câmera, colisões e animações implementados.**
A arena da v2 abre por
[index.html](index.html) ou [necromancer-3d.html](necromancer-3d.html).

**Próxima etapa: E4 — dano e combate básico.** Inventariar os caminhos reais de
dano a player, minions e inimigos, `castRaio`, colisão de projéteis e Dash no
HTML atual e seus wrappers. Portar primeiro Tiro de Osso e Dash, substituindo
a magia experimental sem copiar valores de propostas antigas. Reutilizar a
varredura de `terrain.mjs` e as poses sincronizadas para trajetórias e impacto.

Último trabalho concluído: `terrain.mjs` define a cena física compartilhada com
o renderizador, varredura de círculos contra paredes/pilares/limites, resolução
de sobreposição, deslizamento e rotas para os atores. Mira recalculada após
movimento/zoom/resize; animações amostradas pela pose/tempo/distância da simulação.
Entrada básica de controle padrão implementada e testada por Gamepad API simulada.
Os saves da E2 continuam compatíveis; novos dados físicos/poses são transitórios.
Campanha, progressão, combate real e aplicação dos atributos importados pendentes.

Arquivos para retomar: [guia da v2](README.md),
[contrato de saves](../docs/v2-saves.md), [movimento](../docs/v2-movimento.md),
`scripts/terrain.mjs`, `scripts/training-model.mjs`, `scripts/renderer.mjs`
e `scripts/session.mjs`,
relativos a esta pasta.
Modelos de regras existentes ainda não foram integrados; o boss usa o golpe
simplificado, não `FallenKingModel`. Não considerar E4–E8 entregues.

Verificação da E3: 27 testes de regras/colisão/saves; checks de movimento e
regressão no Edge headless; 76 cenários do jogo atual aprovados. Mira verificada
com mouse parado, zoom e redimensionamento; colisões, rotas, controle simulado,
pausa e pose também exercitados. Evidências em [review/v2/e3](../review/v2/e3/);
E1/E2 preservadas. Capturas próximas e com horda nos dois fundos inspecionadas.
Controle físico, revisão artística de todos os clipes e desempenho em outras
máquinas continuam pendentes; o combate ainda é experimental.

## Objetivo e decisões estabelecidas

- Migrar o jogo completo para modelos 3D em tempo real, mantendo a identidade,
  o combate no plano do chão, a necromancia e a horda.
- Manter câmera top-down inclinada, com apresentação isométrica no estilo Diablo.
  A base aprovada usa câmera ortográfica, sem rotação livre.
- Desenvolver em `v2/`, mantendo a distribuição atual e o laboratório disponíveis.
- Reutilizar os modelos atuais e suas cenas editáveis; animações precisam
  acompanhar a regra real de preparação, impacto, recuperação e morte.
- Aproveitar a base Three.js local do protótipo. A distribuição deve continuar
  abrindo diretamente como HTML autocontido, sem servidor, CDN ou instalação.
- Preservar IDs, formatos persistidos e diferenças intencionais entre modos.
  A migração visual não autoriza mudar balanceamento silenciosamente.
- Cenário ainda sem direção artística final: começar com geometria provisória;
  avaliar objetos Blender e peças modulares depois de validar câmera e colisões.

Decisão implementada para os saves durante o desenvolvimento: chave exclusiva
`necromancer_rise_3d_save`, formato `necromancer-rise-3d`, versão 1, com importação
explícita e validada do save antigo. **A chave existente
`necromancer_v2` já pertence ao jogo atual**; o nome da pasta nova não autoriza
sobrescrevê-la. Veja o [contrato](../docs/v2-saves.md) para defaults e limites.

## O que já existe e o que isso comprova

| Entrega | Estado | Limite |
| --- | --- | --- |
| [Laboratório 3D](../tools/necromancer-3d-lab.html) | Implementado e aprovado visualmente pelo usuário | Arena experimental; não é campanha nem motor migrado |
| Player atual, esqueletos e zumbis | Importados e desenhados em tempo real | Materiais GLB não reproduzem necessariamente os shaders dos sprites |
| Fallen King v4 | Modelo e clipes importados | IA do laboratório usa golpe simplificado; não reproduz o modelo completo do boss |
| Até 64 aliados, qualidade baixa e fundos claro/escuro | Verificados no Edge, com capturas | Não equivale a benchmark em outras máquinas ou todos os modos |
| HTML offline | Aberto por `file://`, sem requisições HTTP no teste | Redistribuição em v2 ainda pendente |
| Movimento, magia, dano e esquiva do boss | Exercitados no laboratório | Custos, atributos, horda e progressão do jogo não foram migrados |

Evidências existentes: [fundo escuro](../review/3d-lab-dark.png),
[horda em fundo claro e qualidade baixa](../review/3d-lab-light-horde-low.png),
[boss](../review/3d-lab-fallen-king.png),
[exportação Blender](../review/3d-lab-export.log) e
[verificação do jogo anterior](../review/3d-lab-game-check.log).
São registros do protótipo, anteriores a esta etapa documental.

## Fontes a preservar

| Área | Fonte atual / referência | Tratamento na migração |
| --- | --- | --- |
| Motor e integrações centrais | `../necromancer-canvas.html` | Mapear dependências antes de extrair; não copiar atlas e código morto para o novo motor |
| Regras vigentes | [Guias de mecânicas](../docs/mecanicas/README.md) | Conferir com o código; propostas antigas não definem números atuais |
| Grimório | `../build-simulator/model.js`, `../scripts/skill-trees.js` | Compartilhar regras calculáveis; adaptar os vínculos com o motor |
| Equipamentos | `../scripts/equipment-model.js`, `../scripts/equipment.js` | Preservar geração, bônus, slots, inventário e recálculo proporcional de recursos |
| Maestrias | `../scripts/skill-mastery-model.js`, `../scripts/skill-mastery.js` | Preservar IDs, XP, especializações e aplicações únicas de bônus |
| Horda | `../scripts/minion-care.js`, `../scripts/minion-abilities.js` e motor | Preservar grupos, custos, comandos, alvo, morte e renascimento |
| Chefes e inimigos modulares | Pares `*-model.js` / runtime em `../scripts/` | Reutilizar os modelos e portar callbacks de dano, movimento e efeitos |
| Fallen King | `../scripts/fallen-king-model.js`, `../scripts/fallen-king.js` | Corte, salto, invocação e fase 2 reais; sincronizar com as animações v4 |
| Expedições | `../scripts/expedition-model.js`, `../scripts/expedition.js` | Preservar seleção, encontros, recompensas e retorno |
| Conquista | `../scripts/endgame-model.js`, `../scripts/endgame.js` | Preservar território, influência, maldições, encontros e persistência |
| Simulação | `../balance-simulator/source.js`, `../balance-simulator/model.js` | O adaptador lê definições e overrides atuais; não é motor de combate e tem limitações documentadas |
| Renderização experimental | `../tools/3d-lab/` | Ponto de partida visual; substituir regras simplificadas progressivamente |

Não usar somente as primeiras constantes do HTML como regra vigente: há
overrides e wrappers posteriores. O adaptador do simulador já demonstra esse
cuidado para `MINION_DEFS` e parâmetros de combate. Ele também lê sistemas
vizinhos; avaliar seu acoplamento antes de reutilizá-lo diretamente.

### Assets confirmados nesta investigação

| Personagem | Fonte / export atual |
| --- | --- |
| Player | `../blender/models/rigged_player.blend` → `../blender/exports/lab_player_current.glb` |
| Esqueleto | `../blender/reference/skeleton.glb` |
| Zumbi | `../blender/exports/lowpoly_zombie.glb` |
| Fallen King v4 | `../blender/models/boss_fallenKing_v4.blend` → `../blender/exports/lab_fallen_king_v4.glb` |

As cópias do player e boss são exportadas por
`../blender/scripts/export_3d_lab.py`, sem salvar as cenas originais.
Os caminhos `lab_*` são nomes do experimento; a nomenclatura definitiva e o
manifesto de assets da v2 serão definidos em E1/E3, sem apagar os arquivos atuais.

## Arquitetura pretendida

Estrutura criada na E1, dentro de `v2/`:

```text
v2/
  plano-migracao.md       # estado, decisões, pendências e retomada
  index.html             # entrada para a distribuição
  necromancer-3d.html     # distribuição autocontida gerada
  scripts/               # regras/adaptadores, estado, cenas, render, input e save
  assets/                # manifestos de modelos/empacotamento e licença Three.js
  tools/                 # empacotamento e ferramentas da v2
  tests/                 # testes de regras e navegador
  README.md              # abrir, empacotar e verificar esta distribuição
```

Fontes compartilhadas em `scripts/`, `build-simulator/` e `blender/` continuam
canônicas enquanto forem usadas pelas duas versões. Evitar cópias divergentes.
Se uma extração compartilhada for necessária, verificar ambas as distribuições.
Capturas e logs novos ficam em `review/v2/`; manuais detalhados, quando surgirem,
ficam em `docs/`. Este plano permanece em `v2/` como ponto de entrada solicitado.

Separações a estabelecer:

1. **Estado e regras:** mundo, entidades, progressão, habilidades e dano sem
   dependência de Three.js, DOM ou armazenamento.
2. **Simulação:** tempo em segundos, colisões no chão, alvos e interrupções.
   O relógio do combate deve comandar o instante do dano e a pose correspondente.
3. **Renderização:** modelos, câmera, luzes, materiais, animações e avisos.
   Posição lógica horizontal deve ter uma conversão única para o mundo 3D;
   altura visual de saltos não altera alcance ou colisão silenciosamente.
4. **Entrada e interface:** mouse/teclado/controle traduzidos em ações; HUD e
   menus podem continuar em HTML/CSS.
5. **Persistência e cenas:** saves versionados, carregamento e limpeza explícita
   de efeitos, alvos e bônus nas transições.

## Etapas e critérios de conclusão

Status permitidos: **pendente**, **em andamento**, **bloqueada** ou **concluída**.
Uma etapa só passa a concluída com seus critérios e evidências atendidos.
Pode ser dividida em subtarefas aqui, sem declarar o restante entregue.

| Etapa | Estado | Dependência |
| --- | --- | --- |
| E0 — prova visual e plano | Concluída | — |
| E1 — fundação e distribuição v2 | Concluída | E0 |
| E2 — estado, cenas e contrato de saves | Concluída | E1 |
| E3 — movimento, câmera, colisões e animações | Concluída | E1, contratos de E2 |
| E4 — dano e combate básico | Pendente | E2, E3 |
| E5 — horda completa | Pendente | E4 |
| E6 — habilidades, Grimório e maestrias | Pendente | E4, E5 |
| E7 — progressão, equipamentos e loot | Pendente | E2, E4; concluir com E6 |
| E8 — inimigos e Fallen King completo | Pendente | E4, E5; revisar com E6/E7 |
| E9 — campanha, vila e missões | Pendente | E5–E8 |
| E10 — Arena, Expedições e Conquista | Pendente | E7–E9 |
| E11 — acabamento, desempenho e substituição da distribuição | Pendente | E1–E10 |

### E1 — fundação e distribuição v2

- Criar a estrutura de fontes, manifestos e empacotamento em `v2/`.
- Separar render, entrada e ciclo do laboratório das regras experimentais.
- Carregar player, esqueletos, zumbis e boss atuais; manter licença da biblioteca.
- Definir quais fontes continuam compartilhadas; registrar ordem e dependências.
- Criar uma cena mínima navegável e diagnóstico de falha de carregamento/WebGL.

**Concluir quando:** a distribuição da v2 abre por `file://` sem rede nem erros,
há um comando reproduzível de empacotamento e a versão anterior permanece válida.
Ter uma arena nessa etapa ainda não significa migrar os modos do jogo.

**Entrega E1:** `node v2/tools/build.cjs`; módulos da v2 e quatro modelos
incorporados em `necromancer-3d.html`. Fontes e hashes em
`assets/build-manifest.json`; biblioteca canônica em `../tools/3d-lab/vendor/`,
GLBs canônicos em `../blender/`. Diagnóstico para WebGL/clipe ausente,
pausa na perda de foco, limpeza de entradas e reinício verificados.
Veja [README.md](README.md) para os comandos e limites.

### E2 — estado, cenas e contrato de saves

- Separar estado persistido de entidades e efeitos transitórios.
- Definir cenas e seus ciclos de entrada, atualização e saída; incluir pausa e morte.
- Definir chave exclusiva, versão e normalização do save da v2.
- Planejar e implementar importação explícita do formato atual, preservando IDs,
  equipamentos e progresso. Não descartar campos de sistemas ainda não migrados.
- Tratar arquivo/save inválido e falha de armazenamento sem perder dados existentes.

**Concluir quando:** salvar/carregar preserva estado, saves antigos têm defaults,
dados inválidos são tratados e testes isolados comprovam que `necromancer_v2`
não foi sobrescrita. A importação não promete restaurar modos ainda indisponíveis.

**Entrega E2:** snapshot persiste opções/resumo/arquivo antigo e exclui entidades,
vida do treino, posições e recargas. JSON inválido não é aplicado; importação
grava antes de trocar o estado em memória e preserva uma cópia do save da v2
substituído. Falhas de quota/acesso são mostradas e o treino continua utilizável.
Os normalizadores dos sistemas antigos foram consultados, mas não executados
sobre o arquivo preservado; sua aplicação acompanha a migração de cada sistema.

### E3 — movimento, câmera, colisões e animações

- Manter câmera ortográfica inclinada e movimento coerente com a tela.
- Converter mira da tela para o chão; tratar zoom e redimensionamento.
- Portar limites, sólidos e resolução de colisões, inclusive trajetórias rápidas.
- Sincronizar descanso, caminhada, conjuração, preparo, ataque, recuperação e morte.
- Conferir escala, pés, orientação e cajado; não normalizar por malhas auxiliares.
- Tratar foco perdido, pausa e limpeza de entradas; portar gamepad antes do fechamento.

**Concluir quando:** movimento e mira funcionam no tamanho real do jogo,
obstáculos não são atravessados e animações correspondem ao estado lógico.

**Entrega E3:** cena física de teste em `terrain.mjs`, renderizada pelos mesmos
dados; varredura e deslizamento, rotas, mira contínua, poses sincronizadas e
controle básico. Geometria específica de mapas é entregue com os respectivos
modos em E9/E10. Formação/separação da horda permanece em E5. Hardware de controle
ainda não conferido; navegação completa de menus/calibração continua em E11.
Confira [movimento da v2](../docs/v2-movimento.md) para contrato e limites.

### E4 — dano e combate básico

- Estabelecer um caminho único de dano por alvo: jogador, aliado e inimigo.
- Portar defesa, invulnerabilidade, morte, crédito de abate e callbacks de recompensa.
- Migrar primeiro Tiro de Osso e Dash com custos, recargas, alcance e colisão vigentes.
- Usar colisão ao longo do trajeto e acertar o primeiro alvo real; depois suportar
  perfuração e o conjunto compartilhado de acertos dos Estilhaços.
- Garantir execução única de impactos e cancelamentos em morte/reset/troca de cena.

**Concluir quando:** a primeira luta usa regras comparadas com as fontes atuais,
Dash protege apenas na janela correta e os testes cobrem quadros longos,
mana insuficiente, alvos mortos e reinício do encontro.

### E5 — horda completa

- Portar cinco tipos, grupos por slot, capacidade, custos e fórmulas atuais.
- Preservar região em torno de Zephyr, formação, separação, perseguição e retorno.
- Portar comandos, esquiva de ameaças, regeneração, morte, renascimento,
  reanimação, sacrifícios e indisponibilidade após detonação.
- Integrar modelos atuais de arqueiro, espectro e Abominação; registrar assets
  que ainda precisem de produção. Modelo provisório deve ser identificado.

**Concluir quando:** formação e combate em grupo são legíveis, aliados respeitam
obstáculos e limites, e não há reinvocação gratuita que contorne custos/recargas.

### E6 — habilidades, Grimório e maestrias

- Reutilizar modelos de árvore e maestria; adaptar seus vínculos com o novo motor.
- Portar seis slots e atalhos existentes, pré-requisitos, exclusões e reembolso.
- Migrar as demais magias e comandos das evocações com duração e encerramento reais.
- Portar ganho de XP de habilidade, especializações e bônus sem aplicação duplicada.
- Recriar efeitos na posição real; conferir visibilidade em ambos os fundos.

**Concluir quando:** todas as ações equipáveis funcionam e HUD, custo, recarga,
árvore, maestria e efeito observado concordam. Preparação visual não adiciona
atraso de dano a uma magia originalmente imediata.

### E7 — progressão, equipamentos e loot

- Portar nível, XP, ouro, atributos, pontos e consumíveis.
- Compartilhar geração de itens, raridades, afixos, slots e cálculos de bônus.
- Portar bolsa, comparação, troca, venda, mercador, drops, orbes e filtro de loot.
- Preservar proporção de vida/mana ao recalcular atributos e as regras de cura ao subir nível.
- Integrar recompensas uma única vez por morte/conclusão e persistir progresso.

**Concluir quando:** o ciclo lutar → coletar → equipar → evoluir funciona,
itens e árvore produzem os mesmos atributos esperados e salvar/carregar não duplica loot.

### E8 — inimigos e Fallen King completo

- Mapear todos os tipos e consumidores, preservando IDs e índices de `ENEMY_TYPES`.
- Portar IA básica, especiais, raridades/elites, escalas e composição gradual.
- Integrar `FallenKingModel`: corte em cone, salto, invocação, fase 2 e cancelamentos.
- Usar `pose()` e fases lógicas para sincronizar os clipes v4; avisos devem
  corresponder à área real, ao momento do impacto e à possibilidade de esquiva.
- Verificar alvos jogador/minions e regras dos encontros que reutilizam o boss.

**Concluir quando:** tipos previstos estão representados com seus comportamentos,
o boss usa o modelo real e morrer durante a preparação impede impactos indevidos.
Clipes exportados sem ligação à IA não contam como habilidade migrada.

### E9 — campanha, vila e missões

- Portar tela inicial, continuar, mapa e quatro fases do Ato I, histórias e tutoriais.
- Portar salas, corredores, portas, travas de encontro e limites das fases.
- Portar Vila de Eldrin, NPCs, diálogos, interações, portais e missões disponíveis.
- Preservar liberações, recompensas da primeira conclusão, rejogar, morte e retorno.
- Avaliar cenário modular; resolver oclusão de personagem/avisos por paredes e objetos.

**Concluir quando:** um personagem novo completa o Ato I, acessa a vila e
revisita fases/missões sem perder progresso ou repetir recompensas exclusivas.

### E10 — Arena, Expedições e Conquista

- Portar seleção e conclusão de waves, recorde, escala e loot da Arena Infinita.
- Portar Expedições e suas recompensas/retornos usando os modelos existentes.
- Portar Conquista de Valdoria: mapa, influência, maldições, tenentes,
  fortaleza, fragmentos e demais regras vigentes da região implementada.
- Conferir diferenças intencionais de dano, progressão e recompensas entre modos.

**Concluir quando:** os três modos são jogáveis, recompensam e persistem
corretamente; sair, morrer ou carregar limpa efeitos temporários e retoma o fluxo correto.

### E11 — acabamento, desempenho e substituição da distribuição

- Completar menus, ajuda, opções, áudio, gamepad e exportação/importação de saves.
- Revisar materiais, sombras, oclusão, efeitos, interface e leitura da horda.
- Medir em cenas fixas com quantidades e configurações registradas; distinguir
  desempenho com GPU real de execução automatizada/headless.
- Otimizar recursos compartilhados, animações, descarte e chamadas de desenho;
  decidir instancing/LOD a partir das medições, sem presumir ganho.
- Validar todos os fluxos e compatibilidade de saves antes de alterar a entrada
  principal do projeto. Manter a versão anterior acessível durante a transição.

**Concluir quando:** a matriz funcional está completa, os critérios de desempenho
definidos a partir de hardware de referência foram atendidos e a distribuição
autocontida passou na regressão completa. Registrar a decisão de tornar a v2
a entrada principal; não fazer isso implicitamente ao criar a pasta.

## Validação por entrega

- Documentação: conferir fontes, caminhos, links e estado; não executar geradores.
- Regras: testes Node dos modelos afetados e testes novos para riscos reais.
- Motor/HTML: `node game_check.js` para a distribuição atual; verificações
  específicas da v2 devem ser criadas em E1. O check antigo sozinho não valida 3D.
- Navegador: perfil/armazenamento isolado, erros de página, comportamento observável,
  offline por `file://`, pausa, morte, reinício e mudanças de cena.
- Visual: tamanho real, fundo claro e escuro, grupos, horda e qualidade baixa.
- Balanceamento: comparar regras atuais, atualizar o adaptador quando necessário
  e respeitar os limites descritos no simulador; não substituir teste de IA por estimativa.
- Evidências: `review/v2/<etapa>/`, com capturas e um registro curto do que foi
  exercitado e do que permaneceu sem validação.

## Como atualizar e retomar

Ao terminar ou interromper uma sessão:

1. Atualizar **Ponto de retomada** com etapa/subtarefa, arquivos alterados,
   pendências concretas e a próxima ação executável.
2. Atualizar os estados da tabela; marcar conclusão somente após os critérios.
3. Registrar decisões novas, desvios de regra e limitações de validação.
4. Acrescentar uma linha ao histórico com links para evidências, quando houver.
5. Preservar mudanças locais e conferir novamente as fontes se outro trabalho
   tiver alterado o jogo, os assets ou seus caminhos desde a sessão anterior.

Não é necessário pedir uma nova aprovação entre subtarefas já autorizadas.
Uma nova solicitação de documentação durante a implementação suspende o código.
Este plano registra a direção; não dispara execução automática.

### Histórico de sessões

| Data | Etapa | Resultado / onde parou | Verificação |
| --- | --- | --- | --- |
| 28/10/2026 | E0 | Protótipo aprovado; pasta `v2/` e plano criados. Implementação suspensa para documentação. Próximo: E1. | Fontes e caminhos conferidos; apenas documentação nesta entrega. Testes anteriores estão vinculados na seção de evidências. |
| 28/10/2026 | E1 | Fundação implementada após pedido de início. Render, simulação e controles separados; distribuição offline e manifestos prontos. Próximo: E2. | Sete testes de simulação, Edge offline e 76 cenários do jogo atual passaram. Capturas e logs em `review/v2/e1/`. |
| 28/10/2026 | E2 | Cenas e persistência própria implementadas. Importação preserva o JSON antigo; continuar abre uma arena limpa. Próximo: E3. | Testes de regras/saves e navegador com dados fictícios; falhas de armazenamento, cancelamento e preservação verificados. Evidências em `review/v2/e2/`. |
| 28/10/2026 | E3 | Cena com sólidos, varredura, navegação, mira contínua, poses sincronizadas e controle básico. Próximo: E4. | 27 testes de regras, dois checks Edge e 76 cenários antigos aprovados. Controle simulado; evidências em `review/v2/e3/`. |
