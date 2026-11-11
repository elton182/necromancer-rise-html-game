# V2 — Grimório e maestrias (E6)

O Grimório distribui os pontos do Necromante entre Minions, Profana e Morte; maestrias usam sua progressão própria. O catálogo e a disposição dos nós vêm de [habilidades/arvores.json](habilidades/arvores.json), filtrados pelo build; as mecânicas permanecem nos módulos do jogo. Veja [o contrato do catálogo](habilidades/README.md) e [a Forma de Lich](v2-morte-lich.md).

O personagem ganha 3 pontos por nível, incluindo o nível 1. Os perfis de teste da arena são ferramentas de desenvolvimento, não o estado inicial de Novo Jogo. Árvores e maestrias importadas da v1 permanecem arquivadas conforme o [contrato de saves](v2-saves.md).

## Investimento e devolução

O catálogo `docs/habilidades/arvores.json` define os nós, níveis mínimos, pré-requisitos e pontos jogáveis. O modelo compartilhado `build-simulator/model.js` continua fornecendo as fórmulas e sinergias da base do Grimório. Selecionar um
nó apenas mostra seus detalhes; **Investir ponto** gasta um ponto.
O orçamento é de três pontos por nível, incluindo o nível 1, como nas outras classes (`budget` em `v2/scripts/full-build.mjs`). Saves existentes recebem os 3 pontos a mais ao carregar, sem perder investimentos. O modelo compartilhado da versão legada mantém `3 × (nível − 1)`.

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
`v1/necromancer-canvas.html` por `v2/tools/combat-source.cjs`; a vida dos
inimigos de treino não mudou. Sem grupos reais, abates não concedem maestria.
O check do Grimório ainda injeta XP fictício para conferir a interface; o
check das magias confere o XP de abates reais.

`horde.mastery` é opcional no save versão 1 e recebe defaults canônicos em
arquivos anteriores. O snapshot preserva perfil e maestrias, junto dos estados
dos integrantes da E5. Veja o [contrato de saves](v2-saves.md).

## Nós exclusivos da v2 vindos do arquivo (08/11/2026)

O Grimório estendido (`v2/scripts/full-build.mjs`) acrescenta os nós jogáveis de [docs/habilidades/arvores.json](habilidades/README.md) que o modelo compartilhado não tem, sem alterar `build-simulator/model.js` nem a versão legada. Seguem as mesmas regras de nível, 2 pontos no pré-requisito, exclusividade e orçamento. O painel posiciona os selos pelo arquivo (até três por linha).

| Nó | Escola | Nível / máx. | Requisito | Efeito |
|---|---|---|---|---|
| Cão Zumbi | Carne | 12 / 5 | Carne Reanimada; exclui a Abominação | Grupo permanente de 2 cães; preparo grátis, 20 MP por novo cão ao equipar em combate. +10% dano e +5% vida por ponto. Caçada no slot: salto na mira, 140% do dano, recarga 6 s, sem custo adicional. |
| Cérbero | Carne | 22 / 1 | Cão Zumbi | Um cão permanente, escala 1,45, triplo da vida e 160% do dano base. Mordida Feroz automática em cone de 100° até 1,9 u, com 160% desse dano. Arte provisória: cão maior, modelo de três cabeças pendente. |
| Magos | Ossos | 6 / 5 | Esqueletos | Grupo permanente de 2 magos; preparo grátis, 30 MP por novo mago ao equipar em combate. Orbes a cada 1,6 s até 7,5 u; +8% dano e +5% vida por ponto. Descarga no slot: 190% do dano com estilhaço de 60% até 1,5 u, recarga 7 s, sem custo adicional. |
| Raio Necrótico | Ossos | 12 / 3 | Magos | O orbe vira um raio instantâneo de 8 u que atravessa a linha, com 137,5% do dano do ataque do mago (+10% por ponto). |
| Ruptura Necrótica | Ossos | 22 / 1 | Raio Necrótico | Especialização: inimigos mortos pelos magos explodem em raio 2 com 60% do dano mágico. |

Cães, Cérbero e magos são tipos permanentes em `horde.mjs`: ocupam vagas, recebem ordens, regeneram e são salvos com vida, morte, recuperação e reserva. Morte comum renasce em 12 s; reanimação manual custa 30 MP. Seus atributos agora seguem a escala por nível da horda, em vez de percentuais da vida/dano de Zephyr. As definições exclusivas ficam em `v2/tools/horde-source.cjs`; a versão legada permanece igual. Ainda não têm maestrias dedicadas. O Golem de Gelo permanece temporário em `companions.mjs`.

**Área das explosões:** Explosão Cadavérica e Carne Instável ganharam no arquivo o efeito "Tamanho da área de explosão", +3% por ponto. Na v2 ele aumenta o raio da explosão dos zumbis (`horde.mjs`) e da Explosão Necrótica (`spells.mjs`). A versão legada não muda.

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
