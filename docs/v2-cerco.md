# Cerco ao Ritual — defesa do Obelisco de Almas

Modo de endgame da v2, acessível pelo botão **Cerco ao Ritual** no painel da Vila de Eldrin após concluir o Ato I. É independente da Arena, das Expedições e da Conquista: não altera os recordes desses modos.

## Partida

O jogador escolhe um grau liberado (1–20), um modificador e uma runa equipada. Zephyr começa com a build e a horda atuais, vida e mana restauradas pelo mesmo fluxo dos demais modos. O obelisco começa com **20 de integridade** e o ritual com **240 de essência**.

Há **oito ondas**, iniciadas manualmente pelo painel, permitindo preparar as defesas entre elas. Aproxime Zephyr de um dos oito pedestais numerados (até 3,2 unidades): o painel aparece automaticamente e seleciona o pedestal mais próximo. Ao se afastar, o painel e o anel de alcance somem. Os números também aparecem no chão. É possível construir e melhorar durante a invasão. Longe dos pedestais, o combate mostra apenas o resumo do ritual no topo; entre ondas, um painel curto permite iniciar a próxima onda e anuncia suas rotas. O pedestal selecionado exibe um anel: numa torre construída, corresponde ao alcance real. As marcas no chão e as linhas do minimapa mostram as rotas.

- A rota **Oeste** entra na onda 1 e resiste a Gelo.
- A rota **Norte** entra na onda 3 e resiste a Ossos.
- A rota **Leste** entra na onda 5 e resiste a Peste.
- Resistência reduz à metade o dano daquele tipo e, no Gelo, também a desaceleração; nunca confere imunidade. A rota e a resistência são anunciadas antes da onda.
- Invasores seguem os pontos da rota até o obelisco. Param para atacar Zephyr ou aliados a menos de 1,35 unidade. A horda e os guardiões podem segurar o avanço, mas sofrem dano pelo caminho comum de combate.
- Cada invasor que chega retira 1 de integridade; o chefe retira 8. Um vazamento não paga XP, essência ou loot.
- O último invasor da onda 8 é um chefe com o modelo do **Rei Caído**, nove vezes a vida e duas vezes o dano do invasor daquela onda. Ele segue a rota e usa o ataque de contato do cerco; não usa os especiais de campanha. Sua rota é anunciada antes da onda.
- Vitória exige eliminar todos os invasores da oitava onda com o obelisco intacto. Destruição do obelisco congela o encontro; morte de Zephyr usa o fluxo normal de derrota. Voltar à vila remove estruturas, guardiões, filas e efeitos. A partida não é retomada ao carregar um save.

## Defesas e essência

| Defesa | Custo inicial | Alcance inicial | Efeito de grau 1 |
| --- | ---: | ---: | --- |
| Torre de Ossos | 80 | 7 | 28 de dano em um alvo a cada 0,9 s; prioriza quem está próximo do obelisco |
| Sepultura Gélida | 70 | 5,5 | 5 de dano em área a cada 1,2 s; lentidão de 45% por 1,5 s |
| Caldeirão da Peste | 100 | 5 | 9 de dano em todos no alcance a cada 0,6 s |
| Cripta dos Guardiões | 90 | 5 de patrulha | Dois esqueletos: 80 de vida e 16 de dano a cada 1 s; reanima somente os caídos a cada 12 s |

Torres têm três graus. Melhorar custa `custo inicial × (grau atual + 1)`. Cada grau extra acrescenta 65% ao dano original e 0,5 de alcance às torres de disparo/pulso. No Gelo, cada grau também acrescenta 6 pontos percentuais à lentidão. Na Cripta, cada grau acrescenta 80 de vida base e 10 de dano base aos guardiões. Melhorar guardiões vivos preserva sua proporção de vida. As estruturas são indestrutíveis e não bloqueiam caminhos.

Cada abate concede **12 de essência**, ou **80** pelo chefe, uma única vez. Ondas 1–7 concluídas concedem `75 + 10 × onda` adicionais. Essência só existe na partida, não é ouro e não persiste. Abates também seguem as regras comuns de XP, maestria, ouro, orbes e filtro de equipamentos. O nível do loot é `8 + 3 × grau do cerco`; o chefe sempre deixa equipamento pelo fluxo comum. Mochila cheia e coleta no retorno seguem as regras dos demais modos.

## Escala, modificadores e runas

Por onda, nascem `8 + 2 × onda` invasores, separados por 0,75 s e distribuídos em rodízio entre as rotas abertas. Vida: `(58 + 15 × onda) × (1 + 0,22 × (grau − 1))`; velocidade: `1,1 + 0,035 × onda`; dano de contato: `(9 + onda) × (1 + 0,15 × (grau − 1))`. A torre recebe multiplicador de dano `1 + 0,18 × (grau − 1)`; guardiões também escalam vida em 15% por grau. As fórmulas vigentes ficam em `siege-model.mjs` e `siege-combat.mjs`.

**Ritual estável** mantém os valores. **Legião couraçada** aumenta a vida invasora em 30%. **Marcha implacável** aumenta sua velocidade em 20%. Ambos os modificadores concedem 25% a mais de ouro e XP de conclusão e dois fragmentos, em vez de um.

Vitória concede `180 + 120 × grau` de ouro, `240 + 160 × grau` de XP, fragmentos rúnicos e libera o grau seguinte, até 20. Repetir um grau continua dando recompensas, mas o resultado só pode ser aplicado uma vez por partida.

Uma runa pode ser equipada antes da partida. Cada tipo de torre tem sua própria runa de nível 0–3; evoluções custam 2, 3 e 4 fragmentos. Cada nível acrescenta 12% à potência da torre correspondente. No Gelo, também multiplica a lentidão (limite de 70% antes da resistência). Na Cripta, melhora vida/dano dos guardiões e divide a recarga de reanimação pela raiz quadrada desse multiplicador. O progresso `character.siege` guarda graus, vitórias, fragmentos, runa equipada e níveis; saves antigos recebem padrões. Runas não alteram outros modos.

## Fontes e validação

- Regras/mapa: `v2/scripts/siege-model.mjs`; fluxo: `siege.mjs`; combate: `siege-combat.mjs`.
- Interface: `siege-panel.mjs`; marcas no cenário: `siege-scene.mjs`; efeitos: `vfx.mjs`.
- Obelisco e torres: `blender/scripts/siege_structures.py`, cenas em `blender/models/`, GLBs em `blender/exports/`, registro em `v2/assets/models.json`.
- Na raiz: `node v2/tools/build.cjs`, `node --test v2/tests/siege.test.mjs`, `node v2/tests/siege-browser-check.cjs` (Playwright e Edge com WebGL 2), `node v2/tests/siege-simulation.mjs`.
- Evidências em `review/v2/siege/`: conferência offline com armazenamento isolado, quatro torres, grupo/horda, claro/escuro, qualidade baixa, vitória e derrota. A vitória do teste de navegador usa dano acelerado para validar integração.
- A simulação no motor compara uma estratégia fixa de torres sozinhas com uma build Nv.24 usando horda e Tiro automático, sem movimentação/esquiva. Não valida todas as builds nem os vinte graus. O simulador matemático de `balance-simulator/` não modela este modo.
