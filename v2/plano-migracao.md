# Migração de Necromancer’s Rise para 3D — v2

Última atualização: 28/10/2026 (E9).

## Ponto de retomada

**Estado: E10 concluída no fluxo funcional — Arena clássica, Expedições e Conquista de Valdoria (boss provisório).** Abra [index.html](index.html) ou [necromancer-3d.html](necromancer-3d.html).

**Próxima etapa: E11 — acabamento, desempenho e substituição da distribuição**, além das HQs de história e da
tela de mapa da campanha (pedidos do usuário abaixo). A Pedra do Infinito (vila, tecla G) abre a aba Waves; a aba
Valdoria abre a Conquista ([Arena](../docs/v2-arena.md), [Expedições](../docs/v2-expedicoes.md), [Conquista](../docs/v2-conquista.md)).

**Decisão registrada (E10b):** o boss da Expedição do jogo antigo é o Guardião de Almas
(`soul-warden-model.js`/`soul-warden.js`), inexistente na v2. Por escolha do usuário a Expedição usa o **Rei Caído
provisório**, com a escala da wave do treino. Portar o Guardião de Almas continua pendente e substituirá o provisório.

**Pedidos do usuário ainda sem entrega (acabamento, fora da numeração):** histórias em quadrinhos das
fases (hoje só texto, uma passagem por vez) e a **tela de mapa da campanha na versão nova** do jogo atual
(hoje uma lista de cartões). Não foram iniciados.

Última entrega: mapa e histórias do Ato I, quatro fases com salas/portas, ondas,
emboscadas e Rei Caído; liberações, primeiro prêmio único, revisita e retorno por
morte/abandono. Vila com Bram, Lysa, Tilda, Vesper e mercador, interação G, ofertas,
missões em arena/trilha e Pergaminho. Continuar abre mapa/vila em campo limpo.
Veja [campanha, fontes, adaptações e limites](../docs/v2-campanha.md).

Fontes para retomar: scripts/campaign-model.mjs, campaign.mjs, campaign-panel.mjs,
session.mjs e save-model.mjs, relativos a v2/. tools/campaign-source.cjs extrai
as regras canônicas; campaign-rules.mjs e o HTML são gerados pelo build.
A fase/dificuldade determina o nível dos itens fora do treino. Grupos e jogador
se recuperam ao entrar em nova fase. A campanha antiga continua arquivada em
legacy.data, sem conversão automática de campanha/árvore/maestrias.

Interface: HUD e Relicário portados do jogo atual (ver [interface da V2](../docs/v2-interface.md)); fora da numeração das etapas.

Validação: testes da V2 e regressão do jogo anterior; checks Edge de campanha,
combate compartilhado, inimigos, movimento, horda, Grimório, magias, progressão,
equipamentos, modelos e saves. Evidências em [review/v2/e9](../review/v2/e9/).
O percurso controlado injeta abates para testar prêmios e transições; também
verifica disparo real, interação G, mercador, Pergaminho e recarga na vila.
Não equivale a validar dificuldade de uma partida completa ou desempenho.

Limites visuais: cenário modular simples, paredes baixas e NPCs existentes;
casas/decoração completa da vila e histórias em quadrinhos ficam para o acabamento
E11. Não houve nova produção de assets Blender nesta etapa. Controle físico e
outras máquinas não conferidos. Arena/Expedições/Conquista permanecem na E10.

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
| E4 — dano e combate básico | Concluída | E2, E3 |
| E5 — horda completa | Concluída | E4 |
| E6 — habilidades, Grimório e maestrias | Concluída | E4, E5 |
| E7 — progressão, equipamentos e loot | Concluída | E2, E4, E6 |
| E8 — inimigos e Fallen King completo | Concluída | Seis tipos, especiais, elites, composição e Rei integrados; evidências em review/v2/e8/ |
| E9 — campanha, vila e missões | Concluída (funcional) | Ato I, vila, missões e retornos; cenário básico, acabamento em E11 |
| E10 — Arena, Expedições e Conquista | Concluída (funcional): Arena clássica, Expedições e Conquista; boss provisório, tela de Valdoria em aba e sem os golpes/objetos regionais | E7–E9 |
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

**Entrega E4:** dano comum com defesa compartilhada, barreira/bloqueio, linha
de frente, morte/crédito único; tiro e Dash com fontes atuais. Bônus de
perfuração/estilhaços/recargas possuem infraestrutura testada, sem concessão
gratuita nem aplicação de builds importadas. Projéteis atravessam sólidos como
na implementação atual; Dash é bloqueado. Veja o [contrato E4](../docs/v2-combate.md).

### E5 — horda completa

- Portar cinco tipos, grupos por slot, capacidade, custos e fórmulas atuais.
- Preservar região em torno de Zephyr, formação, separação, perseguição e retorno.
- Portar comandos, esquiva de ameaças, regeneração, morte, renascimento,
  reanimação, sacrifícios e indisponibilidade após detonação.
- Integrar modelos atuais de arqueiro, espectro e Abominação; registrar assets
  que ainda precisem de produção. Modelo provisório deve ser identificado.

**Concluir quando:** formação e combate em grupo são legíveis, aliados respeitam
obstáculos e limites, e não há reinvocação gratuita que contorne custos/recargas.

**Entrega E5:** implementação e limites descritos no [guia da horda](../docs/v2-horda.md).
Cinco tipos, seis slots, comandos e estados de recuperação integrados à arena.
Abominação provisória identificada; personagem importado ainda arquivado.

### E6 — habilidades, Grimório e maestrias

- Reutilizar modelos de árvore e maestria; adaptar seus vínculos com o novo motor.
- Portar seis slots e atalhos existentes, pré-requisitos, exclusões e reembolso.
- Migrar as demais magias e comandos das evocações com duração e encerramento reais.
- Portar ganho de XP de habilidade, especializações e bônus sem aplicação duplicada.
- Recriar efeitos na posição real; conferir visibilidade em ambos os fundos.

**Concluir quando:** todas as ações equipáveis funcionam e HUD, custo, recarga,
árvore, maestria e efeito observado concordam. Preparação visual não adiciona
atraso de dano a uma magia originalmente imediata.

**Checkpoint E6a:** árvore e maestrias integradas às ações já migradas;
[contrato e limites](../docs/v2-grimorio.md).

**Checkpoint E6b:** cinco magias restantes equipáveis, com custos, recargas,
efeitos, interrupções e visuais; [guia e limites](../docs/v2-magias.md).

**Entrega E6:** XP de maestria por abates com crédito único, ligado à morte
em `combat.mjs`; [contrato](../docs/v2-grimorio.md#xp-de-maestria-por-abates).
XP do personagem, ouro e drops continuam na E7; tipos reais de inimigos, na E8.

### E7 — progressão, equipamentos e loot

- Portar nível, XP, ouro, atributos, pontos e consumíveis.
- Compartilhar geração de itens, raridades, afixos, slots e cálculos de bônus.
- Portar bolsa, comparação, troca, venda, mercador, drops, orbes e filtro de loot.
- Preservar proporção de vida/mana ao recalcular atributos e as regras de cura ao subir nível.
- Integrar recompensas uma única vez por morte/conclusão e persistir progresso.

**Concluir quando:** o ciclo lutar → coletar → equipar → evoluir funciona,
itens e árvore produzem os mesmos atributos esperados e salvar/carregar não duplica loot.

**Entrega E7:** regras e fontes, decisões e limites no [guia](../docs/v2-progressao.md).
XP, nível, ouro, orbes, drops e equipamentos pagam uma vez por morte, depois da maestria;
atributos vêm de `EquipmentModel.snapshot` (nível + árvore + itens) com proporção preservada;
bolsa, comparação, filtro, mercador/venda no menu e consumíveis; saves validados e importação
do arquivo antigo aplicando nível, XP, ouro, equipamentos e consumíveis. O Pergaminho aguarda a
E9 e o nível dos itens do treino é uma configuração explícita até a E10.

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

**Entrega E8:** [regras, fontes, assets e validação](../docs/v2-inimigos.md).
Catálogo preservado, seis especiais e composição gradual, escala e raridade compartilhadas;
Rei real com poses sincronizadas, invocação e cancelamento ao morrer.

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
| 28/10/2026 | E4 | Tiro de Osso, Dash, mana e caminho comum de dano migrados. Parâmetros extraídos das fontes e APIs de equipamento compartilhadas. Próximo: E5. | 41 testes v2, 35 de equipamentos, três checks Edge e 76 cenários antigos aprovados. Evidências em `review/v2/e4/`. |
| 28/10/2026 | E5 | Horda de cinco tipos, grupos/slots, comandos, recuperação e persistência. Próximo: E6. | Testes de regras e quatro checks Edge; evidências em `review/v2/e5/`. Arte dedicada da Abominação pendente. |
| 28/10/2026 | E6a | Grimório, investimento/devolução, maestrias persistidas e bônus das ações existentes. Próximo: E6b. | Testes de regras e navegador em `review/v2/e6a/`. Magias restantes e recompensa de abate ainda pendentes. |
| 28/10/2026 | E6b | Cinco magias equipáveis, parâmetros das fontes atuais, limpeza e visuais legíveis nos dois fundos. Próximo: E7, fechando o XP de maestria da E6. | 77 testes v2, 41 de equipamento/maestria, 76 cenários antigos e sete checks Edge. Evidências em `review/v2/e6b/`. |
| 28/10/2026 | E6 | XP de maestria por abates via `onEnemyDeath`, valores lidos das fontes; E6 concluída. Próximo: E7. | 80 testes v2, 41 de equipamento/maestria, 76 cenários antigos e sete checks Edge. Evidências em `review/v2/e6b/`. |
| 28/10/2026 | E7 | Progressão, recompensa única por abate, drops, equipamentos, mochila, filtro, mercador no menu, consumíveis F1–F5 e saves validados; importação do arquivo antigo aplica nível, XP, ouro, equipamentos e consumíveis. Próximo: E8. | 115 testes v2, 70 de equipamento/maestria/árvore, 76 cenários antigos e checks Edge de combate, movimento, horda, Grimório, magias, modelos, progressão e equipamentos. O check de regressão geral passou isolado (4 execuções), mas falhou uma vez dentro da rodada em lote sem mensagem capturada: tratar como intermitente até reproduzir. Evidências em `review/v2/e7/`. |

| 28/10/2026 | E7 — retomada | Conferência da pendência de regressão: nenhuma falha funcional reproduzida nesta execução isolada. A ocorrência anterior em lote permanece sem causa identificada; E8 não iniciada. | 35 testes de progressão/equipamentos passaram; regressão geral Edge offline passou, sem erros de página nem requisições HTTP. Resultado atualizado em `review/v2/e7/browser-result.json`. |
| 28/10/2026 | E7 — diagnóstico em lote | Checks de progressão, equipamentos e regressão geral passaram em sequência. Diagnóstico do check geral agora preserva a pilha completa de erro. A falha histórica não foi reproduzida nesta rodada; causa não identificada. | Logs completos em `review/v2/e7/retomada-*-browser-check.cjs.log` e `retomada-browser-check.cjs.log`; armazenamento isolado. E8 não iniciada. |

| 28/10/2026 | E8 — fontes | Catálogo canônico com guarda de índices e modelo compartilhado do Rei Caído gerados pelo build, com proveniência. Integração ao combate e validação visual pendentes. | Build executado; nove testes de catálogo/modelo do chefe passaram. |

| 28/10/2026 | E8 — Rei Caído | Modelo compartilhado integrado: corte em cone, salto, fase 2, invocação e limpeza dos reforços sem loot ao morrer. Aviso setorial e poses seguem o modelo. Demais arquétipos pendentes. | 118 testes v2 e 76 cenários antigos passaram; regressão Edge offline passou. Capturas de preparação em `review/v2/e8/` são estados montados; não validam toda a IA. Logs em `review/v2/e8-*.log`. |

| 28/10/2026 | E8 concluída | Seis tipos e especiais, composição gradual, escala e elites, projéteis/Muralha e Rei completo; modelos existentes incorporados. Próximo: E9. | 133 testes v2, 21 dos modelos canônicos, 76 cenários antigos; dez checks Edge (incluindo modelos), offline e armazenamento isolado. Capturas, resultados e logs em `review/v2/e8/`; última conferência de inimigos/horda: 31 testes e check Edge final aprovados. |

| 28/10/2026 | E9 | Ato I, histórias, instruções, salas/portas, ondas, trilhas, vila/NPCs, missões e Pergaminho; prêmios únicos e saves com retorno limpo. Próximo: E10. | Testes e logs em `review/v2/e9/`; percurso controlado, disparo real, G/mercador/Pergaminho e recarga verificados. Cenário básico; dificuldade e desempenho não medidos. |

| 28/10/2026 | Mapa do Posto do Capitão (cenário, parte do acabamento E11) | Arena do chefe com paliçada, torres, plataforma com runas, tendas e mobiliário militar; centro livre para o Rei Caído. As quatro fases do Ato I agora têm mapa próprio. Próximo: E10. | 207 testes v2 passaram, incluindo `outpost.test.mjs`; conferência manual no navegador integrado (chegada, plataforma e chefe, fundo escuro), sem erros novos de console. Playwright indisponível: checks de navegador não reexecutados; fundo claro, desempenho e dificuldade não medidos. Veja [campanha](../docs/v2-campanha.md#posto-do-capitão-mapa-da-fase-4). |

| 28/10/2026 | Mapa da Trilha dos Vigias (cenário, parte do acabamento E11) | Faixa com mata de outono, cerca, lanternas, torres, barricadas desenhadas e acampamento final; obstáculos só nas bordas das clareiras. Corrigida a troca de todos os sólidos ao ativar/concluir emboscada. Próximo: E10. | 204 testes v2 passaram, incluindo `trail.test.mjs`; conferência manual no navegador integrado (início, emboscada, barricada e acampamento, fundo escuro), sem erros de console. Playwright indisponível: checks de navegador da campanha não reexecutados; fundo claro/qualidade baixa e desempenho não conferidos nesta fase. Veja [campanha](../docs/v2-campanha.md#trilha-dos-vigias-mapa-da-fase-3). |

| 28/10/2026 | Mapa da Cripta Esquecida (cenário, parte do acabamento E11) | Lajes, paredes altas/baixas, 12 pilares e 6 sarcófagos com colisão, portões, tochas, tapete e ossos; sombra do sol passa a seguir o jogador. Próximo: E10. | 186 testes v2 passaram, incluindo `crypt.test.mjs`; conferência manual no navegador integrado (escuro e claro/baixa), sem erros de console. Playwright indisponível: checks de navegador da campanha não reexecutados. Dificuldade, desempenho da sombra de 2048 e oclusão não medidos. Veja [campanha](../docs/v2-campanha.md#cripta-esquecida-mapa-da-fase-1). |

| 28/10/2026 | Mapa da Vila de Eldrin (cenário, parte do acabamento E11) | Vila com 11 construções, praça com poço, ruas, barracas e colisões; NPCs e portal livres e alcançáveis. Próximo: E10. | 181 testes v2 passaram, incluindo `village.test.mjs`; conferência manual no navegador integrado (escuro e claro/baixa), sem erros de console. Playwright indisponível: `village-browser-check` e `campaign-browser-check` não reexecutados, sem capturas em `review/`. Oclusão por casas e desempenho não medidos. Veja [campanha](../docs/v2-campanha.md#vila-de-eldrin-mapa). |

| 28/10/2026 | Mapa da fase 2 (cenário, parte do acabamento E11) | Floresta de Eldrin com colisores, decoração procedural e paleta própria; a fase 2 usa o mapa. Próximo: E10. | 156 testes v2 passaram, incluindo `forest.test.mjs`; conferência manual no navegador integrado (escuro, claro/baixa, onda ativa), sem erros de console. Playwright indisponível: `campaign-browser-check` não reexecutado e sem capturas em `review/`. Dificuldade e desempenho não medidos. Veja [campanha](../docs/v2-campanha.md#floresta-de-eldrin-mapa-da-fase-2). |

| 28/10/2026 | UI/HUD (entre E9 e E10) | HUD e Relicário do jogo atual portados: frascos, seis slots, minimapa, barra do chefe, cinco abas, ajuda H e seletor de habilidade. Equipamentos/Grimório viraram abas do Relicário. Retomado após interrupção: build, check de UI (dois erros de teste corrigidos) e demais checks Edge adaptados aos controles movidos; botão Menu agora fecha o diálogo. Próximo: E10. | 149 testes v2 e 13 checks Edge aprovados (UI, geral, movimento, combate, horda, Grimório, magias, progressão, equipamentos, campanha, vila, inimigos, importados, modelos). Jogo anterior (`game_check.js`) não reexecutado: nenhum arquivo dele foi alterado. Evidências em `review/v2/ui/`. Controle físico não conferido. |

| 28/10/2026 | UI/HUD — tela inicial e equipamentos | Tela inicial da v1 portada (arte, seis botões, cartão do save, opções, créditos, sair); aba Equipamentos refeita no layout do jogo anterior (boneco, mochila, arrastar/soltar, comparação, coluna Dif., mercador) e cabeçalho/rodapé do Relicário. Abas Waves/Valdoria ficam para E10. Verificações antigas passaram a acionar os controles do painel de teste por `tests/legacy-controls.cjs`. Outro processo alterou o custo do Tiro de Osso (5 MP no nível 1, sobe até 20) durante a sessão: ajustei apenas os limites de mana de `combat-browser-check.cjs`. | 182 testes v2 e 14 checks Edge aprovados (inclui `title-browser-check.cjs`); evidências em `review/v2/ui/`. Tela inicial e equipamentos conferidos em 1440×900; controle físico não conferido. |

| 28/10/2026 | E10a — Arena clássica | Pedra do Infinito na vila (G) abre a aba Waves; seleção de wave, corrida sem fim com escala, recompensa por wave, recorde persistente, mercador por wave liberada, saída por G/morte. `character.waveProgress` e `settings.waveMode` no save; importação aproveita `camp.eb`. Expedições e Conquista seguem pendentes (E10b/E10c). | 195 testes v2 (9 novos em `arena.test.mjs`); conferência manual no navegador integrado, sem erros de console. Playwright indisponível: checks de navegador não reexecutados. Dificuldade, desempenho e waves altas não medidos. Evidências em `review/v2/e10/`; guia em [docs/v2-arena.md](../docs/v2-arena.md). |

| 28/10/2026 | E10b — Expedições | Mapa 156 × 80 u por wave e bioma, 84 encontros dormentes (acordam a 11 u/7 u ou ao sofrer dano; perdem o alerta a 30 u), raridades, boss, portal final e avanço mantendo a horda; boss é o **Rei Caído provisório** (o Guardião de Almas não existe na v2). Expedição é o modelo padrão da aba Waves. Conquista segue pendente (E10c). | 216 testes v2 (9 novos em `expedition.test.mjs`); navegador integrado: entrada, grupo acordando, boss derrotado com recorde, G levando à wave 2, sem erros de console. Playwright indisponível: checks de navegador não reexecutados. Dificuldade, desempenho e horda no mapa grande não medidos. Guia em [docs/v2-expedicoes.md](../docs/v2-expedicoes.md); evidências em `review/v2/e10/`. |

| 28/10/2026 | E10c — Conquista de Valdoria | Aba Valdoria com mapa de 17 rotas (Canvas), dificuldade, maldições, encontros e recompensas; rotas jogáveis sobre o mapa da Expedição (biomas pântano/rio/montanha, escala regional, infectados e poças com aviso); maldições nos atributos, dano e horda; loot regional, cajado Osso Carcomido e Podridão; influência, rotas, fragmento e dificuldade seguinte pelo modelo compartilhado; `character.conquest` no save e na importação. Boss: Rei Caído provisório; sem caldeirões, restos e golpes regionais (só existem com `?bosses=classic` no jogo antigo). E10 concluída no fluxo funcional. | 229 testes v2 (10 novos em `conquest.test.mjs`); navegador integrado: mapa, rota no pântano, líder derrotado, G reabrindo a aba. Playwright indisponível: checks de navegador não reexecutados. Dificuldade, equilíbrio e desempenho não medidos; uma carga do HTML truncado por build concorrente foi refeita. Guia em [docs/v2-conquista.md](../docs/v2-conquista.md); evidências em `review/v2/e10/`. |

| 28/10/2026 | UI/HUD — árvore de habilidades e maestrias | Aba Habilidades refeita no layout do Grimório anterior (nós com ícones, linhas, detalhe, Minions/Profana/Maestrias, seis cartões de especialização) e Redistribuir tudo (`resetRanks`, 20 ouro/ponto). Tutoriais de primeiros pontos não portados. | 230 testes v2 (novo: redistribuição total) e checks Edge de UI, Grimório, magias, progressão, equipamentos, horda, campanha e tela inicial aprovados; evidências em `review/v2/ui/`. Outro processo editava `app.mjs`/`game-ui.mjs` em paralelo (E10); não toquei nesses arquivos. |
