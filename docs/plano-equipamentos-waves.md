# Plano de implementação: equipamentos, loot e progressão por waves

Status: proposta para implementação. Os números abaixo são parâmetros iniciais de teste.

Andamento: simulador e primeira versão jogável implementados. O jogo inclui equipamentos, mochila/comparação, drops, compra/venda na vila, bônus de habilidades/escolas, seleção/regressão de waves e migração de saves. `scripts/equipment-model.js` é compartilhado com o simulador. Os valores continuam iniciais: o combate simulado usa aproximações e o balanceamento precisa ser acompanhado em partidas reais.

## 1. Escopo da primeira versão

- Sete espaços: cajado, grimório, corpo, cabeça, botas e dois anéis. Cajado e grimório podem ser usados juntos.
- Sem alteração visual do personagem ao equipar peças.
- Menu de equipamentos, mochila, comparação, equipar, desequipar e venda na vila.
- Equipamentos encontrados nos monstros e comprados aleatoriamente na vila.
- Dificuldade e nível dos equipamentos definidos pela wave efetivamente jogada.
- Seletor na vila para repetir waves desbloqueadas sem perder o recorde.
- Atributos numéricos e bônus de pontos em habilidades ou escolas específicas.
- Persistência e migração dos saves existentes.

## 2. Regras de itens

Cada peça tem um atributo base, determinado pelo tipo, e uma lista de atributos aleatórios. O atributo base não consome os espaços da raridade.

| Raridade | Cor | Atributos aleatórios |
| --- | --- | ---: |
| Comum | Branco | 0 |
| Mágico | Azul | 2 |
| Raro | Amarelo | 3 |
| Épico | Roxo | 4 |

Bases propostas: dano mágico no cajado, dano da horda no grimório, vida no corpo, mana na cabeça, movimento nas botas e regeneração de mana nos anéis.

O gerador escolhe tipo, nível, raridade e atributos compatíveis. Cada atributo tem identificador, peso, tipos permitidos, nível mínimo e faixa de valores. Não repetir o mesmo atributo numa peça. Evitar bônus sem efeito no combate atual.

Atributos iniciais: vida, mana, regeneração, dano mágico, dano e vida da horda, movimento, redução de recarga e pontos de habilidade/escola. Bônus de pontos ocupam um espaço normal de atributo aleatório.

Cada item salva ID único, versão, tipo, nome, raridade, nível, wave de origem, atributo base e atributos com seus valores já sorteados. Recarregar o save não sorteia o item novamente. Definir capacidade da mochila como configuração; proposta inicial: 60 peças, cada uma ocupando um espaço. Mochila cheia mantém o drop no chão e exibe aviso.

## 3. Pontos concedidos por equipamento

Exemplos: `+2 em Carne Reanimada`, `+1 em todas as habilidades da escola Carne` e `+1 em todas as habilidades de Ossos — Profana`.

As escolas atuais são Carne, Ossos e Espíritos em Minions; Ossos, Sangue e Sombras em Profana. Identificar escolas pelo ID e pela árvore, e sempre distinguir as duas escolas de Ossos na interface.

Regras propostas para a primeira versão:

- Separar pontos investidos, bônus dos equipamentos e pontos efetivos.
- O bônus fortalece somente nós com pelo menos um ponto investido. Se a habilidade ainda não foi aprendida, mostrar o bônus como inativo.
- Pontos dos itens não concedem pontos distribuíveis, não cumprem pré-requisitos e não liberam habilidades, bifurcações ou talentos finais.
- Bônus específico e bônus de escola somam entre si e entre peças.
- Nós numéricos podem ultrapassar o limite de investimento: por exemplo, 5 investidos + 2 de equipamento = 7 efetivos.
- Talentos finais e efeitos binários ficam fora dos bônus nesta versão. Cada nó declara se aceita pontos extras; revisar efeitos discretos, como quantidade de aliados, antes de permitir extrapolação.
- Sinergias que exigem pontos diretos continuam contando apenas os investidos. Os efeitos próprios dos nós elegíveis usam os pontos efetivos.
- Valores com limite natural, como redução de dano ou recarga, precisam de limites explícitos; proposta inicial: redução de dano até 75%, recarga até 50% e movimento adicional até 30%, sujeitos a teste.
- Faixa inicial: +1 a +2 para uma habilidade e +1 para uma escola. Bônus de escola aparece apenas em raros e épicos; níveis mínimos e pesos ficam na configuração.
- Desequipar remove imediatamente o bônus e atualiza personagem e aliados existentes, preservando vida proporcional, mortes e recargas. Trocar itens não cura nem ressuscita aliados.

Na árvore, apresentar `3 investidos + 2 de equipamento = 5 efetivos`. Na comparação, mostrar o resultado líquido da troca, incluindo a perda de bônus de escola.

## 4. Waves, dificuldade e recompensas

Separar os estados: maior wave concluída, maior wave desbloqueada, wave selecionada na vila e wave ativa da tentativa. Um personagem novo começa com a wave 1 desbloqueada; concluir a maior disponível libera a seguinte.

O seletor oferece waves entre 1 e a maior desbloqueada. A escolha vale ao iniciar uma nova tentativa na vila. Retornar a uma wave anterior mantém o recorde e reduz dificuldade e nível do loot. Morrer ou abandonar não desbloqueia a próxima.

Usar uma função central de dificuldade por wave para calcular vida, dano, quantidade/composição de inimigos, XP, ouro e nível dos itens. Preservar os modificadores de cada tipo de monstro e missão. Aplicar os multiplicadores uma única vez, inclusive em chefes e habilidades especiais.

Curva inicial para validar: vida × `1,12^(wave-1)` e dano × `1,08^(wave-1)`. Quantidade e ritmo de surgimento precisam de limites para manter desempenho; evoluir a composição e os atributos após esse limite. A curva deve ser configurável e testada junto da progressão dos itens.

O nível do loot segue a wave ativa, nunca o recorde pessoal. Definir uma tabela explícita de nível/faixa de atributos por wave; começar com nível do item igual à wave, sem presumir que seja igual ao nível do personagem. Peças podem ser equipadas imediatamente na primeira versão.

Separar dificuldade de wave e contagem narrativa: a wave de dificuldade não deve alterar quantas emboscadas ou etapas uma missão exige. Campanha e rotas recebem uma wave de dificuldade explícita; o seletor atua inicialmente nas tentativas de waves da vila. Atribuir uma wave fixa a cada fase da campanha para seus drops, preservando ordem e recompensas únicas da história.

## 5. Drops e mercador

- Chance inicial independente dos drops de vida/mana: 8% por monstro comum.
- Chefes: uma peça garantida, com raridade mínima mágica. Não gerar uma segunda peça pela regra de monstro comum.
- Raridades comuns: 60% comum, 28% mágico, 10% raro, 2% épico. Para chefes, redistribuir os pesos apenas entre mágico, raro e épico.
- Drop no chão com ícone, nome e cor da raridade; coleta por proximidade e aviso discreto.
- Equipamentos não expiram durante a tentativa. Na saída voluntária, recolher os que couberem e avisar se houver peças restantes antes da transição. A derrota perde apenas peças ainda não coletadas.
- Mercador: escolher o tipo e ver preço, nível da oferta e chances antes de comprar. Pagamento em ouro revela uma peça aleatória.
- Nível da oferta baseado na maior wave desbloqueada. O preço usa esse mesmo nível; regredir a wave selecionada não barateia a oferta.
- Validar espaço e saldo antes de cobrar. Venda remove apenas itens na mochila e informa o valor antes da ação.

## 6. Ordem de implementação e entregas

### Etapa 0 — Simulador matemático de balanceamento

Criar primeiro um script independente, executado com Node.js, para comparar o comportamento atual com o sistema proposto. A implementação foi autorizada após a elaboração deste plano; manter a simulação separada do jogo nesta etapa para orientar as tabelas e curvas iniciais.

#### Dados de entrada e rastreabilidade

- Levantar os valores efetivamente usados no jogo: XP necessária por nível, XP por inimigo, recompensas de fases/missões/waves, quantidade e composição de monstros, atributos do personagem, habilidades, aliados e chefes.
- Distinguir regras atuais de hipóteses propostas. Registrar a origem dos valores e a versão da configuração no relatório. Conferir sobrescritas das funções no HTML para não usar uma regra antiga como referência.
- Reutilizar o modelo das árvores e, quando implementados, os módulos puros de itens e waves, evitando fórmulas diferentes no jogo e no simulador.
- Configurar curvas de dificuldade, XP, nível e atributos dos drops, raridades, preços, builds, equipamentos, duração dos encontros e comportamento do jogador sem editar o motor da simulação.
- Usar uma semente de aleatoriedade e executar várias tentativas por cenário para medir a variação dos drops e da progressão.

#### Progressão por fase e wave

- Calcular XP de cada tipo de monstro, XP de conclusão, total da etapa, XP acumulada, nível antes/depois e progresso até o próximo nível.
- Separar recompensas únicas da campanha das recompensas repetíveis. Repetir uma fase não deve simular novamente uma recompensa exclusiva da primeira conclusão.
- Medir tempo por etapa, tempo para subir de nível, quantidade de waves por nível e XP por minuto. Incluir tentativas fracassadas e a política de recompensas parciais explicitamente.
- Simular avanço contínuo, repetição de uma wave anterior e retorno à progressão. Diferenciar wave ativa, maior desbloqueada e contador narrativo da missão.
- Comparar a curva atual de XP com alternativas configuráveis. A regra atual cresce por `floor(100 * 1,4^(nível-1))`, com limite de nível 60; verificar se o ganho das etapas acompanha esse crescimento.

#### Loot e impacto de equipar

- Medir nível dos drops, quantidade de peças por etapa, distribuição das raridades, valores dos atributos e frequência de bônus de habilidade/escola.
- Simular mochila, escolha de itens, compra aleatória e venda. Usar uma política de equipamento explícita por build, em vez de assumir que toda peça de maior raridade é uma melhoria.
- Comparar o mesmo personagem e o mesmo encontro sem equipamento, com conjunto fixo de referência e com equipamento obtido durante a progressão. Manter nível e pontos investidos iguais na comparação isolada do impacto dos itens.
- Exibir diferença absoluta e percentual em vida, mana, dano por acerto, DPS, regeneração, sobrevivência e tempo para concluir a wave.
- Medir separadamente bônus diretos, `+X em uma habilidade` e `+X em uma escola`, incluindo acúmulo entre peças, bônus inativos e efeitos ao ultrapassar o limite de investimento.
- Recalcular o estado completo após cada troca, respeitando as regras de pontos temporários e de sinergias diretas. Não considerar troca de equipamento como cura ou reinício de recarga.

#### Combate e sobrevivência

- Estimar dano por acerto e DPS de cada habilidade e da horda, considerando mana, recargas, tempo de atividade, quantidade de alvos e disponibilidade dos aliados.
- Medir vida e dano dos monstros, acertos necessários para matar, tempo para matar um monstro, tempo para eliminar o grupo e duração de chefes.
- Medir dano recebido por acerto e por segundo, acertos até a morte, vida perdida por encontro, tempo até morrer e efeito das fontes de recuperação e proteção que forem modeladas.
- Incluir vida, dano, mortes, tempo de renascimento e participação da horda. Não presumir que todos os aliados ficam vivos e atacam continuamente.
- Declarar hipóteses de precisão, evasão, movimentação, concentração de ataques, inimigos simultâneos e acerto das habilidades especiais. Esses valores são parâmetros de cenário, não fatos extraídos apenas dos atributos.
- Usar uma simulação por passos de tempo ou eventos para contabilizar recargas, mana, mortes e recuperação. Fórmulas de DPS e tempo para matar servem como verificações auxiliares.
- Rotular como não modelados os efeitos ainda sem suporte. A estimativa matemática não substitui a validação de posicionamento e comportamento em partidas reais.

#### Cenários mínimos

- Builds focadas em magia, horda e combinação das duas, com distribuição de pontos válida para cada nível.
- Jogadores com diferentes taxas de acerto/evasão e uso de habilidades.
- Progressão sem equipamento, com equipamento de referência e com loot aleatório equipado pela política da build.
- Sequências de sorte baixa, mediana e alta no loot; apresentar percentis entre várias sementes.
- Monstros comuns, grupos mistos, chefes, fases da campanha e waves repetidas para farm.
- Troca de uma peça e de um conjunto inteiro para isolar o valor de bônus específicos e de escola.

#### Relatórios e critérios de conclusão

Gerar CSV e JSON para análise, além de um resumo Markdown com configuração, hipóteses, tabelas e alertas. Incluir por fase/wave: nível do personagem, XP recebida, XP restante, nível dos drops, upgrades equipados, DPS, vida/dano dos inimigos, dano recebido, duração, resultado e ouro líquido. Apresentar mediana e percentis de duração, sobrevivência e qualidade do equipamento entre as tentativas.

Definir faixas-alvo configuráveis para tempo por wave, tempo para matar monstros/chefes, acertos suportados e ritmo de evolução. Marcar saltos de dificuldade, estagnação de nível, dependência excessiva de loot raro, bônus dominantes e farm anterior mais eficiente que avançar. Não ajustar automaticamente todos os números para uma única build: comparar as alternativas e registrar os efeitos de cada mudança.

Validar casos simples calculáveis à mão: XP com múltiplas subidas de nível, recompensa única, dano por acerto, mana limitada, recarga, mortes de aliados, bônus temporários, distribuição de loot e reprodutibilidade pela semente. Comparar amostras com o jogo atual antes de usar o relatório para decidir o balanceamento.

Entrega: simulador reproduzível, cenários de referência e relatório comparando regras atuais com as propostas. Escolher as curvas iniciais com base nesses resultados e depois conferir as previsões em partidas reais.

### Etapa 1 — Modelo e regras puras

Criar módulos locais de itens e waves, com tabelas configuráveis, gerador com aleatoriedade injetável e cálculo de bônus. Incorporar os módulos ao HTML por script, seguindo o padrão das árvores, para manter o jogo distribuído em um único HTML sem dependências de execução.

Entrega: geração reproduzível, validação de itens e cálculo da dificuldade sem depender de interface ou combate.

### Etapa 2 — Persistência

Adicionar mochila de equipamentos, espaços equipados e progresso de waves ao save. Migrar saves antigos com equipamentos vazios e progresso recuperado apenas quando houver evidência confiável; caso contrário, iniciar na wave 1. Validar IDs, valores, slots e limites ao carregar.

Salvar pontos investidos e itens, recalculando os bônus efetivos ao carregar. Não persistir bônus dos equipamentos como pontos permanentes nem como aumentos cumulativos dos atributos base.

Entrega: salvar/carregar mantém exatamente as peças e o progresso, sem duplicação ou perda dos consumíveis e habilidades existentes.

### Etapa 3 — Integração de atributos e habilidades

Criar uma única rotina de recálculo: atributos base do personagem → pontos investidos e bônus temporários → efeitos da árvore e dos itens → limites → atualização dos aliados. Adaptar os consumidores de efeitos, sem usar pontos temporários na validação de investimento ou desbloqueio.

Entrega: equipar, trocar e desequipar aplicam os bônus uma vez; habilidades, movimento, recargas e horda refletem a troca corretamente.

### Etapa 4 — Menu de equipamentos

Adicionar aba na pausa e atalho `I`, sete slots, mochila, detalhes, comparação e ações de equipar/desequipar. Anéis permitem escolher o espaço. Exibir raridade também por texto, nível, atributo base, atributos aleatórios e bônus inativos. Bloquear a propagação do clique para ataques e respeitar pausa, telas pequenas e navegação por controle.

Entrega: montar uma build pela interface e conferir seus efeitos na árvore e no resumo do personagem.

### Etapa 5 — Progressão e seletor de waves

Centralizar escala, integrar inimigos e chefes, registrar conclusão e adicionar seletor na vila. Mostrar wave, nível do loot, modificadores de vida/dano e recorde. Revisar transições, morte e contadores de missão para evitar avanço duplo ou início na wave seguinte à selecionada.

Entrega: iniciar na wave escolhida, desbloquear a seguinte ao vencer e repetir anteriores com recompensas correspondentes.

### Etapa 6 — Drops

Integrar geração à morte dos monstros, renderização no chão, coleta, mochila cheia e limpeza/transição de fase. Usar o contexto de dificuldade do inimigo morto para determinar o loot.

Entrega: obter, coletar, equipar e salvar itens de uma tentativa completa.

### Etapa 7 — Economia da vila

Adicionar compra misteriosa por tipo e venda, usando o mesmo gerador dos drops. Configurar preços e retorno de venda para impedir que comprar e vender gere ouro sem combate.

Entrega: ciclo completo de jogar, coletar, comparar, vender e comprar.

### Etapa 8 — Verificação e balanceamento

Executar os checks existentes e acrescentar testes de regras e integração relevantes. Fazer uma partida manual cobrindo vila, combate, retorno, campanha e recarga do save. Ajustar curva e economia a partir de tempo para matar, sobrevivência, frequência de upgrades e ouro obtido por tentativa.

## 7. Critérios de aceite

- Toda peça tem exatamente a quantidade de atributos de sua raridade, sem repetições inválidas.
- Bônus de skill e escola somam, desaparecem ao desequipar e nunca alteram pontos investidos ou liberam pré-requisitos.
- Bônus dormentes e talentos excluídos seguem as regras; efeitos discretos e reduções respeitam limites.
- Trocar itens repetidamente ou recarregar o save não acumula bônus, cura nem reinicia recargas.
- Vida, dano, habilidades de chefes e loot usam a wave ativa e escalam uma única vez.
- Completar, morrer, abandonar e repetir waves preservam corretamente desbloqueios e recorde.
- Regressar de wave reduz o nível do loot; o mercador mantém o nível e preço ligados ao recorde desbloqueado.
- Compra sem saldo/espaço não cobra; venda não duplica ouro; nenhum item é equipado em dois slots.
- Saves anteriores, missões, campanha e consumíveis continuam funcionais.
- Sincronizar os módulos para o HTML não apaga a integração. Rodar `node game_check.js`, `node --test build-simulator/model.test.js` e `node --test scripts/skill-trees.test.js`, além dos testes novos.

## 8. Pontos de integração existentes

- `necromancer-canvas.html`: estado do jogador, `startWave`, `endWave`, criação/morte de inimigos, drops, loja, menu de pausa e save/load.
- `scripts/skill-trees.js`: `skillRank`, `skillEffects`, `skillSync`, integração das escolas, árvore e efeitos no combate. Alterar a fonte e regenerar o bloco incorporado.
- `build-simulator/model.js`: regras de pontos investidos; preservar validação e orçamento. Se houver suporte a bônus para calcular efeitos, usar uma entrada separada sem contaminar o estado da build.
- `scripts/sync-skill-trees.js`: sincronização das fontes com o HTML distribuído.
- `game_check.js` e testes das árvores: proteção contra regressões de combate, progressão e persistência.

Fora desta versão: conjuntos, gemas, fabricação, rerrolagem, efeitos lendários exclusivos e mudanças de aparência.
