# Endgame — Conquista de Valdoria

Documento de design, iniciado em 25/10/2026. A primeira região já tem uma versão
jogável; regras e diferenças em relação às propostas abaixo estão em
[Conquista de Valdoria](mecanicas/conquista-valdoria.md). Os demais territórios,
o chefe dos fragmentos e a alquimia permanecem planejados.

## Direção acordada

- Conquistar territórios de Valdoria permanentemente.
- Completar expedições para aumentar uma barra de influência de Zephyr.
- Revelar e derrotar tenentes para abrir a fortaleza regional.
- Conquistar a fortaleza e reunir fragmentos para enfrentar um chefe especial.
- Escolher maldições entre opções sorteadas antes da expedição.
- Cada maldição aplica um ou mais debuffs; assumir mais risco melhora as
  recompensas, incluindo equipamentos mais fortes e drops especiais.
- Rejogar territórios conquistados em dificuldades maiores.
- Primeiro território: pântanos e peste, com identidade de decomposição.

## Ciclo de conquista

Vila → território → expedição e maldições → conclusão → influência →
tenentes → fortaleza → conquista e fragmento → chefe especial.

A influência representa o avanço de Zephyr sobre o domínio de Valdoria.
Conquista e progresso regional não regridem com morte ou abandono.

### Estrutura inicial proposta

| Influência | Desbloqueio |
|---|---|
| 0% | Expedições regionais |
| 30% | Primeiro tenente |
| 60% | Segundo tenente |
| 100% e ambos os tenentes derrotados | Fortaleza e comandante |

Os percentuais são propostas de ritmo, sujeitos a balanceamento. Tenentes
revelados permanecem disponíveis; o jogador pode enfrentá-los depois.

Influência é concedida uma única vez por conclusão de tentativa, nunca por
abates isolados. O ganho previsto aparece antes da partida. Maldições podem
aumentá-lo. Sem maldições, ainda é possível conquistar toda a região.

Após a conquista, a barra permanece completa. Dificuldades maiores oferecem
novos desafios e recompensas, sem exigir reconquistar a mesma região.
O fragmento e o desbloqueio da vila são recompensas únicas.

## Maldições sorteadas

### Funcionamento proposto

1. Cada oferta apresenta quatro maldições distintas.
2. O jogador aceita de zero a três.
3. A preparação mostra todos os debuffs, o ganho de influência e os patamares
   de recompensa antes de começar.
4. A escolha fica fixa durante a tentativa; trocar equipamentos ou habilidades
   não remove os efeitos.
5. Concluir uma expedição renova sua oferta. Morrer, abandonar, reabrir o menu
   ou recarregar o save preserva a oferta atual.

A oferta deve pertencer ao território e à dificuldade, para trocar de tela
não permitir sortear novamente a mesma atividade. Não há rerrolagem paga
prevista na primeira versão.

### Exemplos, com números ilustrativos

| Maldição | Debuffs | Peso inicial |
|---|---|---:|
| Fonte Seca | −40% de regeneração de mana | 1 |
| Carne Debilitada | −20% de vida máxima e −30% de cura recebida | 2 |
| Vínculo Instável | Maior tempo de renascimento das invocações | 2 |
| Poder Profanado | −20% de dano de Zephyr e da horda | 3 |

Os pesos somados definem o patamar de recompensa. Maldições com vários debuffs
devem mostrar cada penalidade separadamente. Debuffs semelhantes precisam de
limites e regras de combinação para evitar regeneração negativa ou estados
inviáveis.

Uma build pode suportar certas maldições melhor que outra: isso faz parte da
estratégia. O balanceamento deve avaliar conjuradores, invocadores e híbridos,
evitando que uma combinação sem custo relevante dê sempre o melhor prêmio.

## Recompensas

Separar dificuldade regional e intensidade das maldições:

- A dificuldade regional define a faixa básica de poder dos equipamentos.
- As maldições melhoram as recompensas dentro de limites explícitos e liberam
  acesso a afixos ou relíquias especiais conforme o patamar.
- A identidade do território define quais efeitos exclusivos podem cair.

Proposta de progressão: mais ouro e loot → melhores atributos → chance de afixos
exclusivos → acesso a relíquias regionais. Os patamares, chances e limites ainda
precisam ser definidos.

O chefe da expedição garante uma peça compatível com o patamar aceito; isso
não significa garantir um efeito exclusivo em toda tentativa. A interface deve
distinguir claramente recompensa garantida e chance de drop especial.

Conquista e fragmentos não exigem maldições. O jogador usa as maldições para
acelerar o avanço e buscar equipamentos melhores.

## Primeiro território — Pântano da Febre Negra

Nome provisório. Antiga região de coleta de ervas medicinais de Valdoria,
transformada num depósito de corpos e tomada pela decomposição.
Zephyr conquista a fonte dessa força e pode incorporá-la à sua build.

### Identidade e perigos propostos

- Lodo, carne apodrecida, cadáveres e armaduras corroídas.
- Poças de decomposição com dano por permanência e áreas bem anunciadas.
- Infectados que incham antes de explodir, dando tempo para reposicionar a horda.
- Bolsões destrutíveis que contaminam partes do campo e abrem espaço seguro
  quando eliminados.

A leitura de ataques tem prioridade sobre a decoração. O cenário e os efeitos
devem continuar legíveis com muitas invocações na tela.

### Líderes propostos

| Encontro | Mecânica |
|---|---|
| Boticário Apodrecido, primeiro tenente | Frascos e caldeirões que contaminam o campo; destruir os caldeirões reduz a pressão |
| Guardiã dos Afogados, segundo tenente | Raízes e mortos do brejo exigem movimento de Zephyr e comandos da horda |
| Abade da Decomposição, comandante da Fortaleza do Brejo | Tenta consumir cadáveres para restaurar sua carne; destruir os restos impede a recuperação |

Nomes e encontros são propostas. As regras de cadáveres do Abade devem distinguir
restos do encontro de aliados caídos reanimáveis, evitando consumir a horda do
jogador sem um aviso e uma regra próprios.

### Podridão e equipamentos especiais

Proposta: Podridão causa dano ao longo do tempo e acumula até um limite.
Seus números, duração, renovação e atribuição de dano ainda serão definidos.
Nos equipamentos, é uma escolha opcional de build e funciona fora do pântano.

| Efeito proposto | Mudança na habilidade |
|---|---|
| Osso Carcomido | Tiro de Osso aplica Podridão |
| Carne Contagiosa | A explosão dos zumbis espalha cargas para inimigos próximos |
| Decomposição Súbita | Explosão Necrótica consome cargas para causar dano imediato |

Esses efeitos sugerem duas estratégias: espalhar dano contínuo ou consumir
cargas em uma explosão. Espalhamento precisa de limite para não gerar reações
infinitas. A proposta inicial limita a um efeito especial de peste ativo por
vez; permitir combinações entre os três fica para uma etapa posterior.

### Recompensa de conquista proposta

- Fragmento da Pestilência, concedido uma única vez.
- Mesa de Alquimia na vila: usar materiais de expedição para alterar um afixo.
- Dificuldades maiores e repetição dos encontros para buscar loot regional.

O sistema de alquimia, seus custos e limites ainda precisam de design próprio.

## Recorte para a primeira implementação

Implementar primeiro uma região completa, antes de produzir outros territórios:

1. Progresso regional persistente, barra de influência e desbloqueios.
2. Oferta persistente de maldições, seleção, efeitos e prévia de recompensas.
3. Expedições do pântano com crédito único de conclusão e recompensas por patamar.
4. Dois tenentes, fortaleza e conquista com fragmento único.
5. Podridão e um primeiro equipamento especial para validar o ciclo de loot.

Três territórios e um chefe final são uma proposta de expansão, não conteúdo
necessário para validar a primeira região. A Mesa de Alquimia e os outros
efeitos especiais entram após o ciclo principal funcionar.

Integrar com as fontes `scripts/expedition-model.js`, `scripts/expedition.js`
e os módulos de equipamento, respeitando a sincronização do HTML distribuído.
O novo progresso deve ser aditivo e migrar saves antigos sem apagar personagem,
equipamentos, maestrias, campanha ou recorde da Arena.

### Decisões pendentes antes de fechar o balanceamento

- Condição de acesso ao sistema e dificuldade inicial para personagens existentes.
- Quantas conclusões são necessárias entre os marcos de influência.
- Patamares de maldição, limites de poder e chances de drops especiais.
- Aplicação de maldições aos encontros diretos de tenentes e comandante.
- Quantidade de dificuldades regionais e como são desbloqueadas.
- Regras numéricas da Podridão e comportamento nos chefes.
- Demais territórios, seus fragmentos e o chefe especial final.

### Critérios de validação

- Morte, abandono e recarga preservam influência e a oferta de maldições.
- Recompensas de conclusão e fragmentos não podem ser concedidos duas vezes
  pela mesma conclusão.
- Sem maldições, todos os marcos de conquista continuam alcançáveis.
- Os debuffs e as recompensas correspondem ao mostrado na preparação.
- Builds de magia, horda e híbridas conseguem escolher riscos relevantes.
- Repetir uma região conquistada preserva seus desbloqueios.
- Saves existentes continuam carregando com progresso regional inicial vazio.
