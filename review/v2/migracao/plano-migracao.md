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
fases (hoje só texto, uma passagem por vez) e a **tela de mapa da campanha na versão nova** do jogo atual.
O mapa passou a ser um atlas em pergaminho no estilo de Valdoria (`campaign-atlas.mjs`); as HQs não foram iniciadas.

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

### Registro: editor de mapas da campanha

Os mapas da campanha nova (mundo e prólogo) passam a ser editáveis, com salvamento automático. Foram acrescentados relevo, água, rios e superfícies com efeito no jogo, estilo por mapa, configuração de spawn e o kit `mapKit`. Vila, defesa de Jacarandá e fases antigas do Ato I ficam de fora. Balanceamento do terreno pendente. Veja [o guia](../docs/v2-mapas.md).

O editor passa a ter cliente próprio, só para desenvolvimento (etapa 1 de 5), com mapas em arquivos em `v2/assets/maps/`. Etapa 2: a vista 3D é refeita por camadas e já constrói o mapa, com seleção e alças. Adiantado a pedido: giro livre, com colisor rotacionado; colisão e cenário por setores, em todo o jogo. Propostas, ainda não feitas: escala por eixo, modos repetir/escalar, grade e ímã; relevo em tempo real no 3D e fim da vista 2D; saída da aba Mapas da distribuição.

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
| Player | `../blender/models/v2_necromancer.blend` → `../blender/exports/v2_necromancer.glb` (clipes refeitos por `../blender/scripts/v2_necromancer_motion.py` a partir de `rigged_player.blend`) |
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
| 30/10/2026 | Vila de Eldrin — fatia vertical do acabamento visual (E11) | Kit modular no Blender (`v2_village_kit.glb`: enxaimel, telhas, empenas, chaminé, poste, poço, cerca, barril, caixote) montado a partir dos colisores; chão pintado em textura gerada; poças de luz; tone mapping ACES, céu pré-filtrado e sol quente só na vila. Peças antigas do modelo medieval retiradas da periferia da vila (seguem no treino). Vegetação do kit `v2_nature_kit.glb` com vento e transparência pontilhada do cenário à frente do jogador (oclusão), também só na vila. Colisão, regras e outros mapas inalterados. Próximo: decidir a extensão a cripta, floresta, trilha e posto; vegetação e oclusão. | 373 testes v2 passaram; build OK; conferência no navegador integrado (vila escura, claro/baixa, cripta inalterada, reentrada na vila), sem erros de página (só o 404 do favicon no servidor local). Playwright indisponível: `village-browser-check` não reexecutado. Desempenho não medido. Evidências e antes/depois em `review/v2/village-kit/`. |

### 29/10/2026 — Defesa inerente dos equipamentos

Vestimenta, capuz e botas recebem defesa garantida por nível, além da base anterior. Só o bônus percentual de defesa participa do sorteio. Itens antigos são migrados para a versão 3, convertendo o afixo plano em percentual com o mesmo número. O simulador utiliza os bônus do modelo compartilhado. Validado: testes de equipamentos, combate e Forma da Morte, testes do simulador, `game_check.js` e conferência de equipamentos da v2 no Edge (inclui save/reload, fundo claro/escuro e qualidade baixa). O check legado chegou às verificações de navegação após validar equipamentos e persistência, mas falhou na expectativa de `VILLAGE() === false` após liberar Eldrin; esse fluxo não foi alterado. Capturas legadas novas em `review/v2/guaranteed-defense/`; capturas históricas preservadas.
# Áudios produzidos — 29/10/2026

Integrados Crypt of Stone (cripta, MP3 em loop), Necromantic Threshold (portal),
Warning Signal (início de onda) e Crowned in Bone (subida de nível), com efeitos WAV
mono e fallback procedural. Arquivos incorporados pelo catálogo `assets/music.json`.
Verificação: build, 28 testes de áudio e `node v2/tests/audio-browser-check.cjs`
no Edge com perfil isolado; decodificação real, música em loop e efeitos sem loop,
sem erros de página ou requisições remotas. Evidência: `review/v2/audio/audio-result.json`.
Pendente: avaliação auditiva em partida, equilíbrio de volumes e emenda musical.


### Ajuste — Possessão do Espectro (29/10/2026)

O slot `specter` possui cadáveres por 60 s, com custo de 45 MP, limite de grupo, exclusão de chefes e limpeza transitória. Regras e limites em [horda](../docs/v2-horda.md#possessão-espectro). Ataques básicos preservados por categoria; especiais hostis e revisão visual dedicada permanecem pendentes.

- Piloto de Valdoria: bifurcação nas expedições do pântano, formações defensivas, acampamento raro no desvio e patrulha na convergência. Validação visual e balanceamento do percurso pendentes.

### Ajuste — foice, Lança e Escudo (29/10/2026)

Colheita Tripla passa ao clique sem custo e sem recarga entre combos; Gancho
do Túmulo substitui Arco Ceifador mantendo IDs. Marca Ceifado conecta
Colheita, Giratória, Gancho e Ciclone. Lança Sepulcral carrega pelo clique e
dispara ossos em V. Escudo usa GLB próprio de placas de carne/costelas com
leitura de absorção e impacto, preservando suas regras. Ver
[Morte](../docs/v2-morte-lich.md) e [magias](../docs/v2-magias.md).
Testes de regras e verificação no HTML autocontido; evidências em
`review/v2/combat-rework/`. Balanceamento em partidas reais permanece pendente.

### Bran, o ferreiro

Integrado à Vila de Eldrin com GLB fornecido e animação idle. Serviços em Equipamentos: aprimoramento garantido até +5 (25% de base e defesa garantida por grau) e substituição de um afixo escolhido por outro aleatório, pagos em ouro. Campo opcional persistido `enhancement`; missões existentes preservadas. Regras e custos em `docs/v2-progressao.md`; verificação específica em `v2/tests/bran.test.mjs` e `v2/tests/bran-browser-check.cjs`.

### Cerco ao Ritual — endgame de defesa de torres

Implementado na v2: entrada pela Vila de Eldrin após o Ato I, oito ondas com três rotas progressivas e chefe, quatro defesas com três graus, essência transitória, integridade do obelisco, vinte graus, modificadores e runas persistidas. Obelisco e torres são GLBs animados gerados pelo Blender. Regras e limites de validação em `docs/v2-cerco.md`; evidências em `review/v2/siege/`. Balanceamento amplo dos graus altos permanece pendente.

A interface de construção do cerco passou a ser contextual: aparece até 3,2 unidades do pedestal mais próximo, seleciona esse ponto automaticamente e fecha ao sair do alcance. O anel acompanha essa seleção. Durante a invasão, longe dos pedestais, fica apenas o resumo do ritual no topo; entre ondas há preparação compacta. Conferido no navegador com construção, melhoria, afastamento, vitória e derrota.

### E11 — receita visual compartilhada com o mapa integrado

Vila e mapas personalizados de floresta usam a mesma receita de iluminação, também na prévia 3D.
Materiais dos kits isolados por família; cripta com paredes opacas e oclusão localizada, vento na vegetação,
paleta das casas abandonadas e poças de luz das tochas. Testes de integração dos modelos e build executados.
Aprovação visual e desempenho permanecem pendentes. Ver `docs/v2-mapas.md`.

### Campanha integrada — mundo ampliado e quests de reconstrução

Mundo de Eldrin ampliado para 360 × 360, com Mina de Valfundo, Serraria do Vale, Cemitério antigo e mata nas bordas. São 21 grupos de inimigos com tipos misturados, escala por região e líderes de elite. Após o resgate de Oren, abrem-se **O ferreiro de Eldrin** (libertar Bran na mina e reacender a forja, que dá acesso aos equipamentos) e **Madeira para Eldrin** (três pilhas guardadas na serraria). Regras, save e limites em `docs/v2-campanha.md`; testes em `v2/tests/campaign-world.test.mjs` e `v2/tests/campaign-world-browser-check.cjs`. Balanceamento e reconstrução visual da vila permanecem pendentes.


## ARANDU — apresentação inicial (31/10/2026)

Entregues menu baseado na referência visual, seleção apenas do Necromante com GLB animado, nome próprio e múltiplos personagens preservando o save ativo histórico. Fontes e limitações em [interface](../docs/v2-interface.md) e [saves](../docs/v2-saves.md). Build e testes de regras/saves/campanha executados; conferência no Edge e capturas em `review/v2/arandu-title/`. A campanha ainda começa no mundo integrado existente: caravana, queda na caverna e Jacarandá permanecem planejados.


## ARANDU — primeira versão da abertura (31/10/2026)

Integrados conversa na caravana, defesa contra bandidos, flecha/queda roteirizada, saída do esconderijo com pista de Nilo, mensageiro e defesa de Jacarandá. O reencontro conclui com Nilo sequestrado e acesso ao abrigo e quests existentes. Saves anteriores mantêm sua abertura. Fonte e critérios em [v2-prologo-arandu.md](../docs/v2-prologo-arandu.md). Kit estático gerado no Blender, build, suíte completa e percurso controlado no Edge executados; evidências em `review/v2/arandu-prologue/`. Ainda sem validação de dificuldade por partida completa, viagem em movimento ou animações exclusivas de queda/sequestro.


### Revisão: conversa na carroça em movimento

A abertura parada foi substituída pela viagem com carroça aberta, rodas em movimento, cavalo GLB com rig/clipes e passageiros a bordo. Balões alternam interlocutores, terminando na interrupção do cocheiro e chamada pelo nome. Frenagem, pausa, câmera próxima e retomada dos controles ao desembarcar integradas. Build, suíte da v2 e check `caravan-travel-browser-check.cjs` executados; evidências em `review/v2/arandu-travel/`. Pose de assento e dublagem continuam fora desta versão.


### Introdução textual do ARANDU

Adicionada antes da carroça, apresentando o mundo, Ferrabrás, Alvorada, Itavera e a busca do aventureiro por fama, riqueza e poder. Confirmação manual inicia a viagem; leitura registrada sem interferir em saves existentes. Build, testes de prólogo/saves e check visual da viagem executados. Evidências em `review/v2/arandu-intro/`.


### Acabamento da carroça do ARANDU

Modelo aberto/coberto refinado no gerador Blender: rodas com raios, madeira, ferragens, bancos, lanternas, bagagem e lona curva. Sem alteração das regras. Exportação via MCP, build e conferência no Edge; capturas em `review/v2/arandu-travel/`.


## ARANDU — mapas no editor e queda integrada (01/11/2026)

Emboscada e caverna registradas como modelos e bases do editor, com peças próprias e prévia 3D. Fonte única de mapas e inimigos em `prologue-map-data.mjs`; cópias editadas ficam na biblioteca, sem publicar alterações na campanha automaticamente. Queda revisada com recorte do terreno, poço GLB, fragmentos, câmera de descida e clipe próprio em cópia do player. Transição para a caverna preserva saves e regras; aterrissagem ainda não tem animação própria. Build, suíte da v2 e checks do editor/prólogo no Edge executados. Guias: [mapas](../docs/v2-mapas.md) e [abertura](../docs/v2-prologo-arandu.md); evidências em `review/v2/arandu-editor/` e `review/v2/arandu-prologue/`.


### Caverna narrativa — entregue em 01/11/2026

Chegada com recuperação e rastros, conversa dos guardas persistida, carga opcional, ordens em três páginas e transição textual à saída. Novo kit Blender de depósito, escoramentos e formações, integrado à campanha e ao editor. Build, suíte da v2 e check direcionado da caverna no Edge executados; evidências em `review/v2/arandu-cave-story/`. Aproximação dos guardas alterada para permitir exploração inicial; dificuldade ainda sem partida completa.


### Continuidade visual do terreno — entregue em 01/11/2026

Piso prolongado além do enquadramento com transição de textura e névoa, compartilhado pelo jogo e pela prévia do editor. Limites de movimento preservados, recorte da queda aplicado também à extensão. Build, check de sete mapas no Edge e regressão da queda concluídos. Evidências em `review/v2/map-horizon/` e `review/v2/arandu-fall/`.

### Guerreiro / Soldado — base inicial

Classe selecionável, modelo com equipamentos vinculados e animações, combo de três cortes, estocada com avanço, golpe de escudo e três passivas persistidas. Regras e limites em [v2-guerreiro](../docs/v2-guerreiro.md). Balanceamento completo e equipamento exclusivo seguem pendentes.


### Mata contínua da floresta — 01/11/2026

A borda dos cenários de floresta recebeu árvores GLB instanciadas além do limite jogável, até a névoa. Mesma apresentação no jogo e na prévia do editor; sem mudanças em colisões e navegação. Build e check visual de horizonte no Edge concluídos. Evidências em `review/v2/map-horizon/`.


### Jacarandá intacta após a vitória — 01/11/2026

O mundo contínuo de campanhas com prólogo concluído incorpora a mesma vila completa da defesa, com colisões e decoração correspondentes. Composição também aplicada a saves já concluídos, sem novo formato ou recompensa adicional. Testes de prólogo e mundo contínuo executados, incluindo retomada e acesso às quests.

Acabamento da caverna do prólogo: nove salas com portas alternadas, três nichos investigáveis e continuação rochosa além dos limites. Borda infinita é requisito visual de toda fase; não muda limites físicos.


### Árvore e arsenal do Guerreiro — 02/11/2026

Três ramos marciais (Espada, Escudo e Passivas), Tornado mantido, Arremesso de escudo, bloqueio integral por chance, recuperação de vida e duas sinergias temporárias. Arsenal inicial de espada de uma mão e escudo, com loot, mercador, comparação, forja e migração sem apagar peças antigas. Atributos próprios sem dano mágico/DPS de horda; soldado inimigo mantém o modelo anterior. Guia: [Guerreiro](../docs/v2-guerreiro.md). Evidências no Edge em `review/v2/warrior/`. Balanceamento de campanha e clipes autorais de Tornado/Arremesso permanecem pendentes.

Refinamento visual da árvore marcial: selos com ícones vetoriais, ramos conectados, cores e estados próprios, painel de investimento e seleção de ramo no celular. Conferência de seleção, pré-requisitos visuais e investimento pelo check do Guerreiro no Edge. Regras e saves preservados.

Novas habilidades do Guerreiro: Ricochete, variantes Ciclone e Turbilhão do Tornado, Postura de Batalha (F), Brado de Guerra e Onda de Aço, com quarto ramo Veterano e barra de seis slots para oito ações. Regras em [v2-guerreiro.md](../docs/v2-guerreiro.md); testes em `v2/tests/warrior-skills.test.mjs`; evidências em `review/v2/warrior/`. Números iniciais, sem balanceamento de campanha.


### Comparação de equipamentos e NPCs dos modos — 02/11/2026

Diferenças de status destacadas com sinal, seta e cores para ganho/perda. Jacarandá recebe Guardião das Ondas, Cartógrafa de Valdoria e Mestre do Cerco, com acesso por G aos modos existentes, sem exigir o Ato I. Entradas também mantidas em Eldrin; retorno restaura a praça e preserva quests e progressão dos modos. Regras em `village-services.mjs`; evidências no Edge em `review/v2/village-services/`.
# Atualização visual da Druida — 2026-11-07

Integrados os modelos Tripo fornecidos para Flora e lobisomem, com cenas editáveis
e gerador próprio de animações. Mantidos IDs, escala registrada e regras de combate.
Novos ciclos de descanso/caminhada/morte e ações específicas das duas formas.
Build, 12 testes de regras e conferência de navegador aprovados; evidências em
`review/v2/druid-tripo/`. Transformação ainda usa clarão, sem clipe dedicado.


Segunda passagem das animações da Druida: caminhada com contraposição do corpo e articulação dos pés, respiração com movimentos defasados, preparação/recuperação dos ataques e pouso do Salto Feroz. Build, 12 testes e navegador aprovados; evidências em review/v2/druid-motion-polish/. Sem IK de contato em terreno irregular.

Correção da locomoção da Druida: compensada a orientação lateral do rosto na fonte Tripo, adicionadas passadas laterais nas duas formas e autoria com IK assada dos tornozelos. Mantida a mira do cursor e ativada a mistura walk/strafe/ré já existente. Build, 23 testes e navegador com deslocamento nas quatro teclas aprovados. Evidências em review/v2/druid-direction/.

Refino das passadas da Druida e do lobo: corrigida a velocidade do pé de apoio em relação ao stride, reduzida a abertura das pernas e estabilizada a orientação do pé com IK assada. Transferência lateral do quadril e alcance das pernas revisados. Build e 23 testes aprovados; evidências e auditoria em review/v2/druid-gait/.

Postura de marcha humana da Flora refeita: tronco e quadril preparados para avançar, cotovelo livre flexionado, balanço do braço mais legível e base dos pés mais estreita. Passada visual 1,9 sem alterar velocidade. Build, 23 testes, cenário de combate e teste específico de mistura idle/locomoção aprovados; evidências em review/v2/druid-walk-posture/.

Alinhamento facial da Flora corrigido na bind pose: malha e repouso do esqueleto ajustados antes da autoria, substituindo o offset insuficiente dos clipes. Conferência frontal sem ação ativa e prévia Cycles em review/v2/druid-face/front-rest.png. Build e 23 testes aprovados.

Movimentação e ataques do lobo: guarda comum entre descanso, locomoção e ações; garras alternadas refeitas com preparação de quadril/ombro, extensão e recuperação; patas apoiadas por IK assada nos golpes e no Uivo. Conferidos clipes no Blender e deslocamentos nas quatro teclas, duas garras, salto e Uivo no navegador. Build e 23 testes aprovados; evidências em review/v2/druid-wolf-motion/. Tempos de impacto e regras preservados.

Flora humana migrada para o modelo fornecido em pose T. Fonte preservada em blender/reference/flora-tripo/druid-t-source.glb; cena e export flora_tripo_druid_t. Animações adaptadas à base neutra, sem correção facial herdada; cajado separado e rigidamente preso à mão. Lobo e regras preservados. Build, 23 testes e navegador com magias/transformação/deslocamentos aprovados. Evidências em review/v2/druid-t-pose/.

# Arqueira e Mercenário jogáveis, etapa 1 — 2026-11-08

Novo Jogo oferece Arqueira (arco) e Mercenário (besta), com modelos Tripo do usuário, arma presa à mão e sete clipes gerados por `blender/scripts/ranged_heroes.py`. Tiro básico com projétil real (flecha de alvo único; virote que atravessa até três inimigos com queda de 25%), esquiva comum, base marcial própria e catálogo marcial sem espada e escudo. Criado `class-registry.mjs` para as telas consultarem as cinco classes. Testes `v2/tests/marksman.test.mjs` e `marksman-browser-check.cjs`; evidências em `review/v2/marksman/`. Pendentes: árvore, habilidades especiais, bombas do Mercenário, arcos e bestas como itens, sons próprios e camada de tronco para atirar andando. [Guia](../docs/v2-arqueira-mercenario.md).
Flora humana recebeu nova pegada de cajado no idle e na marcha, com fechamento dos dedos, transporte da haste acima do piso e revisão da fase do braço livre e da rolagem dos pés. Evidência em review/v2/flora-pegada/.
Corrigida a inversão dos joelhos na locomoção humana da Flora. Perfil animado e medição de caminhada e passos laterais em review/v2/flora-joelho/.

# Arqueira e Mercenário, etapa 2 — 2026-11-08

Árvores próprias (Arco/Caça/Passivas e Besta/Pólvora/Passivas) em `character.marksmanRanks`, com barra fixa de seis ações. Arqueira: Flecha Perfurante, Recuo, Chuva de Flechas, Leque, Tiro de Emboscada e o **Falcão** (modelo Tripo do usuário, `blender/scripts/falcon.py`): companheiro que mergulha sozinho e, pelo F, marca um alvo para +15% de dano das flechas. Mercenário: Rajada, Perfuração, Bomba de fragmentação, Estilhaços, Mina de pólvora e Garrafa incendiária. Clipes novos `shoot_up`, `leap_back`, `throw` e `plant`; efeito `lob` no VFX. Testes `marksman-skills.test.mjs` e `marksman-browser-check.cjs` ampliados; evidências em `review/v2/marksman/`. Pendentes: arcos e bestas como itens, sons próprios, camada de tronco para atirar andando. [Guia](../docs/v2-arqueira-mercenario.md).

# Arqueira e Mercenário, etapa 3 — 2026-11-08

Arco e Besta como itens (`marksman-equipment.mjs`): slot próprio por classe, dano-base somado ao dano físico, afixos próprios, arma inicial no Novo Jogo e entrega única para personagens anteriores (`marksmanEquipmentVersion`). Mercador, loot, forja, comparação e inventário usam o catálogo da classe. Sons procedurais novos (`bowShot`, `crossbowShot`, `bombThrow`, `powderBlast`, `mineArm`, `fireIgnite`, `falconCry`) ligados pelos eventos de combate; as ações dos atiradores deixaram de tocar o som do Tiro de Osso. Testes `marksman-equipment.test.mjs` e `marksman-browser-check.cjs` ampliados. [Guia](../docs/v2-arqueira-mercenario.md).

A forma de lobo passou a caminhar em quatro apoios. As garras têm cortes descendente e ascendente, e o Salto Feroz pousa nas dianteiras. Build, 23 testes e cenário de movimento e combate no navegador aprovados. Prévias em review/v2/lobo-quadrupede/.

Ajustes de jogabilidade dos atiradores (2026-11-08): atirar andando com camadas de tronco e pernas no renderizador (`layered` em `models.json`), fator de velocidade por ação, tiro contínuo segurando o botão esquerdo ou a tecla 1, tolerância de acerto na faixa do Tiro de Osso (antes 0,48 u) e mira do mouse na altura do tronco para Arqueira e Mercenário. As checagens `gear` e `movement` passaram a esperar o quadro em vez de um tempo fixo, por causa do redesenho de 1 s com o jogo pausado.

Galope da forma de lobo integrado à locomoção direcional, com impulsão das traseiras, aterrissagem das dianteiras e suspensão. Prévia animada e medições em review/v2/lobo-galope/.

# Mago jogável — 2026-11-08

Sexta classe: fogo, gelo e arcano sobre o motor dos atiradores (Seta Arcana, Bola de Fogo, Rajada de Gelo, Teleporte, Meteoro; Combustão, Estilhaçar e Eco Arcano), catálogo arcano compartilhado e sons próprios. Modelo Tripo do usuário com os pesos do rig corrigidos por `blender/scripts/mage_hero.py` (cajado, barba, aba do chapéu, luvas e barra do manto). Testes `mage.test.mjs` e `mage-browser-check.cjs`; evidências em `review/v2/mage/`. [Guia](../docs/v2-mago.md).

## Novo modelo T do Mago — 2026-11-08

Malha T do usuário preservada em `blender/models/mage_hero_t_source.blend`. Rig novo de 29 ossos,
com manto, barba e ponta do chapéu; cajado reaproveitado do anterior e preso à mão direita.
O gerador `blender/scripts/mage_hero_t.py` reutiliza a lógica de movimento anterior, adapta as
proporções e exporta oito clipes a 30 FPS para `mage_hero_t.glb`, agora registrado em `mageHero`.
Blocking CONSTANT preservado, prévias PBR animadas e auditoria de pesos, ciclos, pés, solo e
rigidez do cajado em `blender/previews/mage_hero_t/`. Build, testes da classe e conferência de
navegador aprovados; capturas novas em `review/v2/mage-t/`. Arquivos antigos e regras de combate
preservados. Limites da revisão e tabela de eventos no [guia do Mago](../docs/v2-mago.md#modelo-e-rig).

## Revisão da Druida humana — 2026-11-08

`flora_human_motion.py` reaproveita o rig e a locomoção da base T preservada, corrige pesos
do capuz e solas e acrescenta dois ossos de capa (67 no total). Conjurações, golpe do cajado,
esquiva e contato da morte com o chão revistos, com nove Actions a 30 FPS. Fonte editável
`blender/models/flora_human_revised.blend`; GLB atual registrado em `druid`. Lobo e regras
de combate preservados. Blocking, prancha, GIFs e auditoria por frame em
`blender/previews/flora_human_review/`. Build, 12 testes da classe e navegador (magias,
transformação e mistura de locomoção) aprovados; evidências em `review/v2/flora-human-review/`.
[Pipeline e eventos](../docs/v2-druida.md#base-humana-atual--pose-t).

## Revisão da Druida lobo — 2026-11-08

`flora_wolf_motion.py` parte da base preservada `flora_tripo_wolf.blend` e gera
`flora_wolf_revised.blend` / `.glb`, agora registrado em `druidWolf`. Rig com 68 ossos:
cauda independente das coxas, dois segmentos com atraso e controle de mandíbula.
Galope e arcos das garras reaproveitados; apoios medidos na malha, traseiras fixas no
uivo, esquiva quadrúpede e morte lateral reconstruída. Dez Actions a 30 FPS, blocking
CONSTANT, renders PBR, prancha, GIFs e auditoria em `blender/previews/flora_wolf_review/`.
Build, 12 testes e cenário de navegador com garras alternadas, salto, uivo, quatro
direções e qualidade baixa aprovados, sem erros de página ou requisições externas.
Evidências em `review/v2/flora-wolf-review/`. Modelo humano e regras preservados.
[Durações, eventos e limites](../docs/v2-druida.md#forma-de-lobo-atual).

Garras com corpo inteiro (2026-11-08): variante `flora_wolf_dynamic` integrada a `druidWolf`,
preservando `flora_wolf_revised`. Preparação pelo quadril, excursão de cerca de 55° do tórax,
avanço/cruzamento do peso, calcanhar elevado e pivô da perna de impulso sobre os dedos.
Apoios opostos fixos e cortes descendente/ascendente com recuperação própria. Gerador
`flora_wolf_motion.py -- --dynamic`; mesmas durações, impacto e regras. Auditoria passou
para giro, deslocamento do quadril, articulação da perna, contato e ausência de arraste
horizontal do pivô. Build, 12 testes e navegador com as duas garras aprovados.
Prévias em `blender/previews/flora_wolf_dynamic/`; evidências em `review/v2/flora-wolf-dynamic/`.

Locomoção humana do Mago (2026-11-08): `mage_hero_gait.py` refaz caminhada e os dois passos
laterais no modelo atual, com apoio contínuo, balanço do pé com tangentes suaves,
rolamento de calcanhar/ponta, contraposição do quadril/ombros e braço livre mais baixo.
Cajado transportado acima do piso, manto/barba/chapéu com atraso. Mantidos rig de 29 ossos,
frames 1–25 a 30 FPS, strides, velocidade e ações de combate. Auditoria passou para
apoios compensados pelo deslocamento, joelhos, loops, piso e pegada. Build e oito testes
da classe aprovados; navegador cobriu frente, ré, laterais, mistura diagonal, conjuração
andando e grupo com chão claro/qualidade baixa, sem erros de página ou requisições externas.
Prévias em três vistas em `blender/previews/mage_gait/`; capturas em `review/v2/mage-gait/`.

Árvores pelo arvores.json e barra montável (2026-11-08): `docs/habilidades/arvores.json`, editado em
`tools/skill-tree-editor.html`, passa a definir nome, texto, pontos, nível, pré-requisitos, ramos e posição no
painel das árvores do Guerreiro, da Druida e dos atiradores (`skill-tree-source.cjs` → `skill-tree-data.mjs`);
só nós `implementado`/`revisar` entram. Revisões: Estocada avança 7 u (alcance 10,4 u), Onda de Aço dispara no
terceiro corte sem ocupar slot, Leque → Tiro Seguidor (flechas que curvam) e Garrafa → Molotov, com ids preservados.
Novas: Saraivada Seguidora, Impacto Celeste e Penas Voadoras (Arqueira), Rede de Caça e Armadilha de Urso (Mercenário).
Barra montável (`skill-loadout.mjs`, `character.skillLoadout`) nos atiradores e na forma humana da Druida.
Build, suíte de regras e verificações de navegador do Guerreiro e das habilidades novas aprovadas; evidências em
`review/v2/marksman-new-skills/`. O Necromante segue em `build-simulator/model.js`, conferido contra o arquivo por teste.
[Árvores](../docs/habilidades/README.md) · [Arqueira e Mercenário](../docs/v2-arqueira-mercenario.md).

Ideias da Druida, do Mago e do Necromante (2026-11-08): desenhadas em `docs/habilidades/arvores.json` e implementadas.
Druida: Turbilhão, Tornado e Furacão (vento) e, no lobo, Corte Sangrento e Garra de Gelo. Mago: Setas Perseguidoras, Esfera de
Gelo, Familiar de Fogo e Golem de Gelo. Necromante: Cão Zumbi, Cérbero, Magos, Raio e Ruptura Necrótica, como nós exclusivos da v2
no Grimório estendido (o modelo compartilhado não muda), e a área das explosões de Explosão Cadavérica e Carne Instável.
Companheiros invocados em `companions.mjs` (tinta e escala por ator no renderizador). Build, 606 testes e verificação de
navegador das três classes aprovados; evidências em `review/v2/class-ideas/`.

Horda permanente do Necromante (2026-11-08): Cão Zumbi, Cérbero e Esqueletos Magos passam a grupos em `horde.mjs`, com vaga, ordens, reserva, regeneração, morte, reanimação e save. Slots ativam Caçada/Descarga Sombria. Atributos passam à escala da horda; custos e comandos documentados no Grimório e em `arvores.json`. Corrigida consulta de maestrias ausentes; arte e maestrias dedicadas continuam pendentes. Build, suíte de 615 testes e check de navegador das três classes aprovados; evidências em `review/v2/class-ideas/`. O check antigo `horde-browser-check.cjs` excedeu a espera antes da captura do salto da Abominação, após registrar grupos e salva do arqueiro; essa verificação adicional não foi concluída.

Ferramentas de teste (2026-11-08): botão Testes e aba do Relicário com ajuste de nível e ouro, restauração de vida/recurso e proteção dos investimentos ao reduzir nível. Regras das seis classes, build, integridade da distribuição e cliques/layout desktop e celular verificados; evidências em `review/v2/test-tools/`.

Repouso e pegada do Mago (2026-11-09): `mage_hero_t.py` gera idle de 121 frames/4 s, braço livre relaxado, apoio assimétrico, pés fixos e movimentos secundários com atraso. Polegar da mão direita corrigido para cima em todos os clipes; antebraço acompanha a palma e o bind da haste mantém o cajado na mesma trajetória. Cena, GLB e distribuição regenerados. Auditoria dos oito clipes, testes da classe e navegador (ciclo, retorno de caminhada/conjuração, grupo em piso claro/escuro e qualidade baixa) aprovados. Prévias em `blender/previews/mage_idle/`; evidências em `review/v2/mage-idle/`. Não foi jogada a campanha completa.

Encaixe do cajado do Mago (2026-11-09): deslocamento da haste no bind coloca a abertura da malha antiga dentro da pegada. Mantidos rig e clipes; cena, GLB e HTML regenerados. Detalhes de repouso, caminhada e conjurações em `blender/previews/mage_idle/grip/`; auditoria dos oito clipes aprovada.

## Habilidades do Mago, segunda leva — 2026-11-09

Árvore do Mago rebalanceada para 5 pontos (o primeiro ponto mantém o número antigo) e oito
ações novas implementadas em `marksman.mjs`: Muralha de Fogo (queimadura), Imbuir Fogo e Gelo,
Nova de Gelo e Chuva de Fogo (variantes com recarga dividida), Avalanche, Raio Arcano canalizado
(segurar e soltar a tecla ou o botão do slot) e Clone Arcano (repete os feitiços com 50% do dano).
Meteoro, Familiar e Estilhaçar passaram a exigir Muralha, Imbuir Fogo e Imbuir Gelo. A tabela de
dano do painel ganhou notas e deixou de mostrar valores inválidos para Familiar e Golem.
Build, testes da v2 e os cenários de navegador do Mago, da segunda leva e de `class-ideas`
aprovados, sem erros de página. Evidências em `review/v2/mage-new-skills/`. Números iniciais,
sem partida de campanha. [Regras](../docs/v2-mago.md#segunda-leva-09112026).

Reconstrução da pegada do Mago (2026-11-09): substitui o ajuste que escondia a abertura. `mage_hero_grip.py` preserva a cabeça do cajado, reconstrói a haste como superfície fechada e troca a mão esticada por luva compacta já fechada, com quatro dedos curvos e polegar oposto. Punho sob a manga; mão e cajado rigidamente ligados ao mesmo osso, mantendo o idle e os oito clipes. Cena, GLB e HTML regenerados. Auditoria verifica pesos da luva, ausência de bordas abertas na haste, ciclos, pés e rigidez; navegador aprovou repouso e retorno de caminhada/conjuração, piso claro/escuro em qualidade baixa, sem erros. Prévias da pegada em quatro vistas em `blender/previews/mage_idle/grip/`; evidências de navegador em `review/v2/mage-idle/`. Conferidas poses representativas; campanha completa não jogada.

Falanges na mão original do Mago (2026-11-09): substituída a luva rígida reconstruída pela malha e textura originais, com 15 ossos novos (três por dedo na mão direita), pesos por falange e oposição do polegar. Rig com 44 ossos, mantendo IDs antigos, idle, oito clipes e haste contínua. `mage_hero_fingers.py` centraliza controles, ossos e pesos. Cena, GLB e HTML regenerados. Auditoria confirmou posições e UVs idênticas à fonte, todas as falanges com pesos, ciclos/pés/cajado aprovados. Navegador confirmou as 15 falanges no idle e na camada de conjuração, transições e qualidade baixa sem erros ou requisições externas. Comparação aberta/pegada em `blender/previews/mage_finger_rig/`; detalhes nos clipes em `blender/previews/mage_idle/grip/`.
