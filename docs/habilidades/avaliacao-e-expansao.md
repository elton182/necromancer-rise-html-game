# Avaliação das revisões e expansão das classes

Proposta de design em 09/11/2026. Referência: [arvores.json](arvores.json), comparado com a versão no HEAD do Git e com os módulos atuais da v2. As sugestões abaixo ainda não foram aprovadas nem incorporadas ao catálogo ou ao jogo.

## Estrutura desejada

Interpretamos “dois ramos” como dois grandes conjuntos temáticos por classe, cada um com duas ou três colunas e três ou quatro nós por coluna: entre 12 e 24 nós temáticos por classe. Uma coluna pode conter habilidade, aperfeiçoamento, sinergia e especialização; não precisa conter quatro ações que ocupam a barra.

O catálogo chama os conjuntos maiores de `trees` e os agrupamentos internos de `branches`. Essa nomenclatura precisa ser considerada numa futura reorganização. As sequências deste documento indicam progressão temática, não uma decisão de transformar todos os nós em pré-requisitos obrigatórios.

Necromante e Mago servem como referência de profundidade e transformação das habilidades. Atualmente, porém, o Necromante tem três árvores (Minions, Profana e Morte); o Mago tem uma árvore com Fogo, Gelo, Arcano e Passivas. Nenhum deles corresponde literalmente à estrutura de dois conjuntos. Não proponho remover suas divisões nesta etapa.

Passivas universais de vida, recurso e regeneração podem ficar numa faixa comum, fora da contagem temática. Redistribuir as passivas entre os dois ramos é uma alternativa caso toda a interface deva ter somente dois painéis. As propostas não removem investimentos existentes nem definem uma migração.

| Classe | Nós no catálogo | Implementado / revisar / ideia | Diagnóstico |
|---|---:|---|---|
| Necromante | 61 | 61 / 0 / 0 | Referência de variedade; não precisa receber mais volume agora |
| Mago | 27 | 18 / 7 / 2 | Boa profundidade; há uma dependência que impede a leitura pelo build |
| Guerreiro | 25 | 14 / 5 / 6 | Ofensiva cresceu; Escudo e decisões defensivas precisam acompanhar |
| Druida | 23 | 18 / 1 / 4 | Tempestade e transformação têm identidade; Natureza precisa amadurecer |
| Arqueira | 17 | 14 / 2 / 1 | Precisa aprofundar flechas, movimentação e comando do falcão |
| Mercenário | 14 | 11 / 3 / 0 | Maior lacuna de volume e de especializações finais |

Status são os declarados pelo catálogo; não comprovam que a mecânica foi implementada.

## Avaliação das revisões

### Guerreiro

- **Impacto:** boa evolução da Estocada, transformando um ataque em linha num impacto ao colidir. Definir um único impacto por avanço e se ocorre no primeiro alvo ou no destino. Não disparar uma explosão por alvo perfurado.
- **Cadência:** boa opção para grupos dispersos, mas cinco saltos não devem repetir integralmente a Estocada de 220% em cada etapa. Proposta: primeiro golpe normal, saltos com dano reduzido, sem repetir o mesmo alvo, sem atravessar paredes e com possibilidade de interrupção. Deve continuar útil sem exigir Rastro.
- **Corte Espacial:** o desenho atual troca uma onda de 180%, no terceiro corte e com recarga de 8 s, por uma onda de 230% em todo corte e com o dobro do alcance. É uma mudança grande de função e poder. Preferência: manter a onda no terceiro corte e deixar o final ampliar largura/alcance, ou permitir ondas menores nos primeiros golpes. Evitar converter o Guerreiro inteiro num atirador sem custo.
- **Rastro:** combina com o percurso da Estocada e dá motivo para atravessar o grupo. Fogo precisa de justificativa na identidade da classe; alternativa: Rastro de Aço, com cortes residuais. Em ambos os casos, limitar a duração e impedir que trechos sobrepostos multipliquem o dano no mesmo alvo.
- **Ciclone e Furacão:** o código atual trata os dois como variantes alternativas com valores fixos; o catálogo agora exige Ciclone antes do segundo e dá cinco ranks a ambos. Escolher entre variantes irmãs de um ponto ou uma evolução cumulativa com regra própria. Comprar uma variante só para trocá-la depois enfraquece a escolha.
- **Tornados menores:** bom final para o giro se forem poucos, curtos e sem novos tornados gerados por eles. Aumentar somente o número de efeitos prejudica a leitura com horda.
- **Armadura de Espinhos:** favorecer bloqueio e proximidade em vez de premiar tomar dano indefinidamente. Retorno físico com recarga por atacante, sem refletir reflexões; definir se usa dano antes ou depois da mitigação.
- **Ricochete:** a perda de bloqueio enquanto o escudo voa já oferece uma contrapartida boa. Cinco saltos precisam de distância total ou duração máxima de voo; não só alcance entre alvos.

### Druida

- **Lobo → Mordida Pesada → Alcateia:** dá uma rota própria à Natureza. Recomendo um comando compartilhado, não uma nova tecla para cada lobo. O jogador escolhe presa e posição; os lobos executam.
- **Limite da alcateia:** a ideia atual pode chegar a quatro lobos (um inicial e três adicionais). Definir limite, morte e recuperação antes de expandir. Prefiro uma alcateia pequena, rápida e voltada a uma presa, para se distinguir da horda do Necromante.
- **Mordida Pesada:** o tipo atual é passiva, mas o texto diz “libera”. Escolher explicitamente entre ataque automático periódico e comando do jogador. A proposta abaixo usa um comando.
- **Planta Carnívora:** excelente para transformar Raízes em território perigoso. Preferência: brota automaticamente ao usar Raízes, no máximo uma planta; não ocupa slot adicional. Definir duração própria, vida e alcance, e permitir que seja destruída.
- **Corte Sangrento:** renovar o sangramento sem somar é uma boa regra. Pode alimentar um final de perseguição/execução, sem aumentar novamente todas as garras.
- **Selvagem:** gelo e sangramento podem coexistir como escolhas de controle ou pressão. Evitar exigir todos os golpes da transformação só para alcançar um final.

### Arqueira

- **Flecha de Fogo → Flecha Explosiva:** boa coluna, desde que fogo seja dano persistente e a explosiva troque parte dessa pressão por impacto imediato em área. Se a explosiva fizer tudo melhor, a primeira vira apenas pedágio.
- **Estado do catálogo:** `fechadefogo` está como implementado, mas não aparece no catálogo de ações de `marksman-model.mjs`, nem foi encontrada sua implementação em `marksman.mjs`. Tratar como pendência de integração, sem tomar o status como prova. Corrigir o nome exibido para “Flecha de Fogo”, preservando o identificador existente.
- **Impacto Celeste:** o falcão interromper seus ataques durante o mergulho dá uma contrapartida legível. Compartilhar ocupação do falcão com os outros comandos para impedir ações simultâneas incompatíveis.
- **Penas Voadoras:** o nó está como passiva, mas existe uma ação ativa no código. Escolher uma regra. Prefiro uma reação automática após um mergulho, com recarga própria, para não ocupar mais uma tecla e se distinguir do Tiro Seguidor.
- **Identidade:** manter precisão, perseguição, fogo nas flechas e cooperação com o falcão. Novas armadilhas explosivas combinam mais com o Mercenário.

### Mercenário

- **Perfuração:** já existe perda de dano por alvo atravessado, o que diferencia a besta da Flecha Perfurante. O final pode diminuir essa perda em vez de apenas atravessar mais inimigos.
- **Estilhaços:** hoje aumenta o raio, não a quantidade de fragmentos. O nome pode permanecer, mas a descrição deve deixar isso claro. Cuidado: aumentar raio também aumenta muito a área coberta.
- **Mina:** duas minas com tempo para armar já criam preparo e recuo. A expansão deve oferecer detonação controlada ou novas combinações, sem permitir estoque ilimitado antes de um chefe.
- **Rede e Armadilha de Urso:** oferecem boa base de controle. Contra chefes que não ficam presos, os finais precisam conservar alguma utilidade de dano ou preparação, sem retirar a identidade do controle.

### Mago

- **Combustão e Estilhaçar:** repartir o mesmo teto em cinco ranks é coerente se a intenção for cobrar mais pontos pela especialização. Isso também reduz o ganho por ponto; não é só uma mudança visual da árvore.
- **Meteoro depois de Muralha:** a sequência faz sentido temático, mas obriga um jogador interessado em impacto a comprar uma ferramenta de chão. Manter essa exigência apenas se for uma coluna de domínio de área; uma conexão temática não precisa sempre virar dependência.
- **Familiar depois de Imbuir:** mesma questão. O familiar pode ser uma ramificação de Combustão sem exigir uma build de ataque básico imbuído.
- **Escudo Arcano:** “todo tipo de dano” e “até 30% da mana” deixam o custo indefinido. Proposta: escudo temporário que absorve usando mana com conversão explícita e limite total; acaba ao esgotar duração, absorção ou mana. Não dar imunidade ilimitada depois de gastar o teto.
- **Big Bang:** precisa de função diferente da Bola de Fogo e do Meteoro. Sugestão: esfera lenta que pode ser detonada manualmente na trajetória; exige escolher o instante e permite errar o ponto. Uma esfera por vez, sem atravessar paredes e com contrapartida de custo/recarga.
- **Clone:** já tem ação no código, mas requer Escudo Arcano, ainda em ideia. A leitura de `readSkillTrees` falhou por essa dependência. Resolver o vínculo ou implementar o escudo antes de marcar toda a rota como jogável. Não basta mudar o status do escudo.

## Propostas de colunas

**(nova)** indica uma habilidade sugerida neste documento. Nomes sem marca já existem no catálogo, inclusive quando ainda são ideias. Renomeações sugeridas estão indicadas. Cada conjunto abaixo tem três colunas de três ou quatro nós: de 21 a 24 nós temáticos por classe, além das passivas comuns.

### Guerreiro: Espada e Bastião

| Ramo | Coluna | Progressão sugerida |
|---|---|---|
| Espada | Cortes | Três Cortes → Ímpeto → Onda de Aço → Corte Espacial |
| Espada | Investida | Estocada → Impacto → Cadência → Rastro de Aço (proposta para Rastro) |
| Espada | Giro | Corte Vendaval → Ciclone → Furacão (correção de Furação) → Tornado (nome final a revisar) |
| Bastião | Guarda | Guarda Treinada → Retaliação → Armadura de Espinhos → Fortaleza Viva **(nova)** |
| Bastião | Escudo ofensivo | Golpe de Escudo → Arremesso de Escudo → Ricochete → Retorno Brutal **(nova)** |
| Bastião | Veterano | Postura de Batalha → Brado de Guerra → Último Fôlego **(nova)** → Estandarte de Batalha **(nova)** |

Reorganização proposta para Giro: Ciclone e Furacão viram alternativas no mesmo estágio; a última habilidade pode ser acessada por qualquer uma. A tabela não deve ser aplicada como cadeia obrigatória entre variantes.

- **Fortaleza Viva:** após permanecer brevemente sem se mover, fortalece a guarda frontal; mover-se encerra. Um arco visível mostra a direção protegida. Não concede invulnerabilidade.
- **Retorno Brutal:** se o escudo atingir alguém na volta, fortalece o próximo Golpe de Escudo por uma janela curta. Dá motivo para alinhar a trajetória de retorno.
- **Último Fôlego:** uma vez por recarga longa, bloquear com vida baixa devolve vigor e concede proteção breve. Precisa de bloqueio real, não ativa repetidamente por permanecer ferido.
- **Estandarte de Batalha:** variante do Brado, com recarga compartilhada. Deixa o benefício de recuperação num local visível por duração limitada; sair dele perde o benefício. Troca mobilidade por sustentação de posição.

### Druida: Elementos e Vida Selvagem

| Ramo | Coluna | Progressão sugerida |
|---|---|---|
| Elementos | Raios | Faísca → Corrente de Raios → Tempestade → Para-raios Vivo **(nova)** |
| Elementos | Ventos | Turbilhão → Tornado → Furacão |
| Elementos | Raízes | Raízes → Casca de Espinhos → Planta Carnívora → Jardim Predador **(nova)** |
| Vida Selvagem | Alcateia | Lobo → Mordida Pesada → Alcateia → Presa da Matilha **(nova)** |
| Vida Selvagem | Transformação | Forma de Lobo → Salto Feroz → Garra de Gelo → Corte Sangrento |
| Vida Selvagem | Sustentação | Rejuvenescer → Coração Selvagem → Uivo → Instinto de Sobrevivência **(nova)** |

Garra de Gelo e Corte Sangrento continuam opções de mesmo estágio. Rejuvenescer não deve se tornar pré-requisito obrigatório da transformação; Sustentação reúne sinergias, não uma cadeia rígida entre forma humana e lobo.

- **Para-raios Vivo:** a Corrente marca a presa inicial por tempo limitado; raios da Tempestade priorizam a presa enquanto ela estiver dentro da área. Não aumenta o total de raios. Permite concentrar dano sem automatizar o posicionamento da nuvem.
- **Jardim Predador:** a planta pode atacar outros inimigos presos pelas mesmas Raízes quando sua presa morre. Mantém uma planta, com alcance e duração limitados; não gera cópias por morte.
- **Presa da Matilha:** o comando de Mordida marca um alvo; os lobos priorizam essa presa por tempo limitado, sem atravessar obstáculos. Se ela morrer, retomam o comportamento normal.
- **Instinto de Sobrevivência:** encerrar a transformação voluntariamente deixa uma recuperação breve que termina ao voltar à forma de lobo. Um tempo mínimo transformado e uma recarga impedem cura por alternância rápida.

### Arqueira: Arquearia e Caçadora

| Ramo | Coluna | Progressão sugerida |
|---|---|---|
| Arquearia | Precisão | Disparo → Flecha Perfurante → Chuva de Flechas → Flecha de Execução **(nova)** |
| Arquearia | Perseguição | Tiro Seguidor → Saraivada Seguidora → Flecha Bifurcada **(nova)** |
| Arquearia | Flechas incendiárias | Flecha de Fogo → Flecha Explosiva → Brasas Persistentes **(nova)** → Disparo de Ignição **(nova)** |
| Caçadora | Evasão | Recuo → Tiro de Emboscada → Passo de Caça **(nova)** → Emboscada Perfeita **(nova)** |
| Caçadora | Falcão | Falcão → Impacto Celeste → Penas Voadoras → Caçada Conjunta **(nova)** |
| Caçadora | Leitura da presa | Olhar de Águia **(nova)** → Ponto Fraco **(nova)** → Tiro de Interrupção **(nova)** |

- **Flecha de Execução:** tiro preparado para alvo único ferido; preparação visível e cancelável. Precisa competir com a Perfurante em vez de ser melhor contra qualquer alvo.
- **Flecha Bifurcada:** a primeira morte causada por uma flecha seguidora libera dois fragmentos menores para alvos diferentes. Fragmentos não se dividem e não voltam ao alvo original.
- **Brasas Persistentes:** aumenta a duração da queimadura da Flecha de Fogo, sem empilhar queimaduras iguais.
- **Disparo de Ignição:** a Explosiva consome a queimadura aplicada pela Arqueira para acrescentar uma explosão limitada. Exige escolher entre deixar a queimadura correr e antecipar o dano; não consome queimadura de outra classe.
- **Passo de Caça:** Recuo concede movimento breve ao aterrissar; disparar encerra o benefício. É uma escolha de reposicionamento, sem imunidade contínua.
- **Emboscada Perfeita:** acertar o bônus de Emboscada num alvo marcado pelo falcão recupera parte do foco gasto. Uma ativação por Recuo, sem devolução repetida por projétil.
- **Caçada Conjunta:** depois do impacto do falcão, a próxima flecha da Arqueira nesse alvo fortalece o próximo mergulho automático. Não recarrega o próprio comando nem acumula sem limite.
- **Olhar de Águia:** comando marca uma presa dentro do alcance e da linha de visão. Só uma marca; expira ou termina com a morte. Não revela o mapa inteiro.
- **Ponto Fraco:** acertar a presa marcada após uma preparação breve concede bônus ao primeiro impacto. Movimento ou troca de presa reiniciam o preparo; não exige acertar uma parte minúscula do modelo.
- **Tiro de Interrupção:** disparo de baixo dano que interrompe preparações comuns sinalizadas como interrompíveis. Chefes recebem o dano e só perdem ataques cuja regra permita interrupção.

### Mercenário: Balística e Engenharia de Campo

| Ramo | Coluna | Progressão sugerida |
|---|---|---|
| Balística | Penetração | Virote Pesado → Perfuração → Virote Serrilhado **(nova)** → Rompe-armadura **(nova)** |
| Balística | Supressão | Rajada → Alimentador Rápido **(nova)** → Fogo de Cobertura **(nova)** → Rajada Concentrada **(nova)** |
| Balística | Sobrevivência | Escora de Tiro **(nova)** → Recuo Tático **(nova)** → Sangue-frio **(nova)** |
| Engenharia de Campo | Explosivos | Bomba de Fragmentação → Estilhaços → Carga Direcionada **(nova)** → Detonação em Cadeia **(nova)** |
| Engenharia de Campo | Armadilhas | Rede de Caça → Armadilha de Urso → Mina de Pólvora → Gatilho Remoto **(nova)** |
| Engenharia de Campo | Controle do terreno | Molotov → Pavio Lento **(nova)** → Bomba de Fumaça **(nova)** → Terra Arrasada **(nova)** |

Rede, Urso e Mina podem ter entradas independentes. Não exigir comprar três ferramentas diferentes só para conseguir detonação remota. Fumaça também deve poder ser escolhida sem obrigar uma build inteira de incêndio.

- **Virote Serrilhado:** o Virote Pesado deixa sangramento no primeiro alvo; renova sem somar. A perfuração continua sendo a vantagem contra filas.
- **Rompe-armadura:** atingir repetidamente o mesmo alvo com o Virote Pesado aplica uma redução breve e limitada de armadura. Definir quais defesas podem ser reduzidas e impedir valores negativos não previstos.
- **Alimentador Rápido:** a Rajada termina antes, sem aumentar quantidade ou dano por virote. Libera o jogador mais cedo para se mover.
- **Fogo de Cobertura:** variante da Rajada que espalha os tiros num cone e reduz brevemente a velocidade dos alvos comuns, perdendo concentração de dano.
- **Rajada Concentrada:** variante alternativa, com dispersão mínima e maior compromisso de movimento. Compartilha recarga com Rajada e Cobertura; nenhuma precisa da outra como pedágio.
- **Escora de Tiro:** ficar parado por um curto preparo fortalece o próximo Virote Pesado; movimento encerra o preparo. Sem acúmulo indefinido.
- **Recuo Tático:** a esquiva solta a escora e prepara uma recolocação rápida da próxima armadilha, uma vez por recarga. Não coloca nem detona explosivos gratuitamente.
- **Sangue-frio:** detonar uma armadilha em inimigo próximo devolve vigor uma vez por intervalo. Apoia o estilo de preparar e recuar, sem retorno por cada vítima da mesma explosão.
- **Carga Direcionada:** variante da Bomba que troca parte do raio por um cone orientado na direção do arremesso. Área marcada antes da explosão e recarga compartilhada.
- **Detonação em Cadeia:** uma Bomba pode acionar minas já armadas dentro de sua área. Não cria minas nem reinicia detonações; limite de duas minas continua valendo.
- **Gatilho Remoto:** variante da Mina com comando de detonação das minas armadas. Reutiliza o slot da própria mina enquanto houver cargas; não permite minas adicionais.
- **Pavio Lento:** o Molotov demora mais para incendiar e mantém uma área de fogo por mais tempo. Variante para antecipar a rota do grupo, com contrapartida de atraso.
- **Bomba de Fumaça:** nuvem temporária que impede inimigos comuns de iniciar novos tiros através dela. Projéteis já disparados continuam; a fumaça não é uma parede invulnerável.
- **Terra Arrasada:** a primeira explosão de Mina dentro do fogo do Molotov produz um pulso incendiário adicional e consome essa interação naquela poça. Sem renovação infinita do chão em chamas.

## Critérios antes de implementar

1. Priorizar Mercenário e Arqueira, depois Bastião e Natureza. Evitar aumentar novamente o volume do Necromante antes de fechar as lacunas.
2. Escolher quais sugestões entram. As tabelas são opções de composição, não uma lista de implementação autorizada.
3. Dar um ponto a variantes que só mudam o funcionamento; usar múltiplos pontos somente com ganho explícito e implementado por rank.
4. Separar desbloqueio de estilo e imposto de pontos: efeitos de mesmo estágio podem ser irmãos, mesmo quando aparecem lado a lado numa coluna.
5. Reservar ações de barra para decisões frequentes. Finais podem transformar comandos existentes ou reagir ao combate, respeitando os seis slots.
6. Especificar custo, duração, alcance, recarga, alvo, limites, comportamento contra chefes e encerramento por morte/troca de cena. Os conceitos acima ainda não têm números aprovados.
7. Conferir orçamento de pontos e saves antes de mudar ranks ou dependências. Não inferir equilíbrio a partir da contagem de nós.

## Verificação desta avaliação

- Conferidos os nós e status do catálogo atual e as mudanças em relação ao HEAD.
- Conferidos os pontos citados em `warrior-model.mjs`, `warrior.mjs`, `marksman-model.mjs`, `marksman.mjs`, `druid-model.mjs`, `druid.mjs` e no adaptador `skill-tree-source.cjs`.
- Executada diretamente a leitura de `readSkillTrees`: falhou na dependência `mage/clone → escudoArcano`, cujo status é `ideia`.
- Nenhuma alteração no catálogo, nos saves, no runtime ou na distribuição. Não foram executados build, testes de combate ou validação visual; a avaliação é documental, não de balanceamento jogado.
