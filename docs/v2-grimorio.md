# V2 — Grimório e maestrias (E6)

Integração da árvore e das maestrias, entregue na E6a e completada com as
magias da E6b e o XP de maestria por abates. A arena possui um botão **Grimório e
maestrias**, com as abas Minions, Profana e Maestrias. A edição usa o perfil
da arena; árvore, maestrias e barra do personagem antigo seguem arquivadas. O perfil
básico de nível 1 só ganha pontos ao subir de nível (3 por nível, E7). Para experimentar, use a build de teste da horda
de nível 24 e seus pontos ainda disponíveis.

> A aba **Morte** (árvore da Forma de Lich) e os novos rótulos das abas estão em [v2-morte-lich.md](v2-morte-lich.md#10-integração-etapa-4-29102026).

## Investimento e devolução

O modelo canônico `build-simulator/model.js` define os nós, níveis mínimos,
pré-requisitos, pontos, sinergias e especializações exclusivas. Selecionar um
nó apenas mostra seus detalhes; **Investir ponto** gasta um ponto.
O orçamento continua sendo três pontos por nível após o primeiro.

Devolver um ponto remove também dependentes que perderem o pré-requisito e
cobra 20 de ouro por ponto efetivamente devolvido. Ouro insuficiente preserva
o estado inteiro. O ouro usado é o campo nativo da v2; a chave e o arquivo
antigo não são alterados. Ganhar ouro no treino ainda depende da E7.

A edição desta primeira parte exige o menu e **Grupos reais**. Durante combate,
morte ou recuperação de integrante sacrificado/detonado, investir, devolver
e redistribuir maestria ficam bloqueados. Abrir durante a luta pausa e permite
consulta. Fechar mantém a pausa; retomar continua sendo explícito.

Alterar o perfil recalcula os grupos e preserva proporção de saúde e tempos
de recuperação. Evocações desaprendidas perdem slots e reservas correspondentes.
Não existe bônus permanente acumulado a cada atualização.

## Bônus já conectados

- Tiro de Osso: dano, perfuração, estilhaços e redução de recarga da maestria.
- Dash: recarga, distância e proteção posterior do Véu, com composição dos
  bônus da árvore e da maestria.
- Aliados: atributos da árvore, dano/saúde/movimento/regeneração da maestria
  e redução de recarga dos comandos e habilidades automáticas.
- Decomposição dos zumbis: mordidas automáticas renovam quatro segundos de
  dano periódico; não somam várias instâncias do mesmo efeito.

Desde a E6b, Chuva de Ossos, Explosão Necrótica, Muralha de Corpos, Escudo
de Carne e Maldição também são equipáveis e recebem os bônus da árvore e da
maestria; veja [magias da v2](v2-magias.md). Vida e reserva de mana do jogador
continuam básicas até a integração dos atributos.

## Maestrias e persistência

O modelo `scripts/skill-mastery-model.js` é compartilhado, sem copiar regras
de investimento, normalização ou XP para o novo runtime. Cada ação dos seis
slots é uma especialização; somente equipada ela ativa seus bônus. Ao sair
da barra, níveis, XP e pontos permanecem guardados. Redistribuição da maestria
é gratuita e não devolve nem consome pontos do Grimório.

O contrato `gainMastery(session, amount)` distribui uma recompensa válida às
ações equipadas, usando o limite e a recuperação de XP do modelo original.
Quando algum nível sobe, recalcula atributos sem reiniciar a luta e o painel
mostra "Maestria ↑" com as habilidades que subiram; XP sem novo nível não
recalcula a horda.

## XP de maestria por abates

Como no jogo atual, cada inimigo derrubado concede seu XP às ações equipadas
uma única vez, não importa se o golpe final veio de Zephyr, de uma magia ou
de um aliado. No jogo atual isso acontece no wrapper de `gainExp`, antes do XP
do personagem; na v2, a morte em `combat.mjs` chama `onEnemyDeath`, e a sessão
encaminha o XP do inimigo para `rewardKill`. O XP do personagem, ouro e drops
continuam na E7 e devem usar o mesmo gancho, mantendo a maestria antes do
personagem.

Os inimigos da arena ainda são de treino (E8). Até lá, cada zumbi de treino
vale o XP do Guerreiro (`ENEMY_TYPES[0]`, o mesmo que o Rei Caído invoca) e o
chefe vale o XP do Rei Caído na missão Extermínio. Os dois valores são lidos de
`necromancer-canvas.html` por `v2/tools/combat-source.cjs`; a vida dos
inimigos de treino não mudou. Sem grupos reais, abates não concedem maestria.
O check do Grimório ainda injeta XP fictício para conferir a interface; o
check das magias confere o XP de abates reais.

`horde.mastery` é opcional no save versão 1 e recebe defaults canônicos em
arquivos anteriores. O snapshot preserva perfil e maestrias, junto dos estados
dos integrantes da E5. Veja o [contrato de saves](v2-saves.md).

## Fontes, verificação e retomada

- [Regras e integração](../v2/scripts/grimoire.mjs),
  [interface](../v2/scripts/grimoire-panel.mjs) e
  [ponte das maestrias](../v2/scripts/mastery.mjs).
- `shared-build.mjs` e `shared-mastery.mjs` são gerados das fontes canônicas
  por `node v2/tools/build.cjs`, executado na raiz.
- Regras: `node --test v2/tests/grimoire.test.mjs`.
- Navegador: `node v2/tests/grimoire-browser-check.cjs`, com Playwright e Edge,
  armazenamento isolado e evidências em [review/v2/e6a](../review/v2/e6a/).

Conferidos investimento pela interface, aplicação de bônus, ponto próprio de
maestria, salvar/recarregar, bloqueio em combate, pausa e ambos os fundos.
Regressões de horda, movimento, combate e saves também foram executadas.
As magias restantes foram entregues na E6b ([guia](v2-magias.md)); as
verificações atuais gravam em [review/v2/e6b](../review/v2/e6b/). Os atributos
e a importação do personagem pertencem à E7.
