# Simulador matemático de balanceamento

Primeira implementação da Etapa 0 do [plano de equipamentos e waves](../docs/plano-equipamentos-waves.md). Funciona em Node.js, sem dependências, sem modificar o jogo ou seus saves.

```powershell
node balance-simulator/run.js
node --test balance-simulator/model.test.js
```

O comando padrão executa oito sementes para cada combinação de duas regras, três builds e três políticas de equipamentos: 144 trajetórias de arena e 144 de campanha. Cada trajetória de arena tem 20 tentativas, com avanço condicionado à vitória. Uma derrota preserva XP das mortes e repete a wave disponível. A campanha tem quatro tentativas de fase por trajetória, repetindo fases em caso de derrota.

Os resultados ficam em `balance-simulator/reports/latest/`:

- `README.md`: resumo, hipóteses e alertas.
- `encounters.csv`: números por encontro, incluindo XP, nível, dano causado/recebido, mana, mortes da horda, loot, equipamentos e ouro.
- `summary.csv`: taxa de conclusão e percentis de tempo, sobrevivência e utilidade dos itens por cenário/tentativa.
- `report.json`: configuração exata, hashes das fontes, dados completos e resumos.

Relatórios gerados são ignorados pelo Git. Não há timestamp nos dados: mesma configuração, fontes e semente produzem o mesmo relatório.

## Configurar cenários

```powershell
node balance-simulator/run.js --waves 40 --runs 30 --seed 182 --out balance-simulator/reports/experiment-1
node balance-simulator/run.js --config balance-simulator/scenarios/stress.json --out balance-simulator/reports/stress
```

`--waves` conta tentativas, não garante que o personagem alcançará essa wave. `--config` aceita um JSON parcial sobre [config.json](config.json); flags numéricas prevalecem. O cenário de stress compara dois perfis de jogador e avanço com farm. Farm repete uma wave duas posições abaixo da desbloqueada a cada terceira tentativa. As listas `scenarios.rules`, `builds`, `gear`, `profiles` e `routes` permitem reduzir ou expandir o produto de cenários.

Para experimentar curvas de XP e dificuldade:

```json
{
  "xp": { "growth": 1.25 },
  "proposed": { "hpGrowth": 1.10, "damageGrowth": 1.06 },
  "scenarios": { "rules": ["proposed"], "builds": ["hybrid"], "gear": ["none", "loot"] }
}
```

Essa alteração da XP vale para todos os cenários do experimento. Para preservar a referência atual, execute o padrão e a alternativa em diretórios diferentes. O relatório salva todas as configurações para comparação.

## Regras modeladas

`source.js` extrai tipos de inimigo, aliados e seus overrides, escolas, fases, encontros da cripta/trilha e Capitão do código existente. O simulador compartilha `scripts/equipment-model.js` com o jogo para geração de itens, bônus temporários e curva atual da arena. As fórmulas antigas têm verificações de correspondência no adaptador; mudança detectada interrompe a execução. Os hashes do jogo, árvore e modelo de equipamentos identificam qual versão foi usada, mas não substituem revisar o adaptador quando o combate mudar.

`current/none` é o controle sem equipamentos para a versão atual. No modo infinito usa a curva compartilhada (+12% de vida, +8% de dano e +4% de XP compostos por wave) e limite de 60 inimigos. Para comparar com as regras anteriores à integração, use `"rules": ["legacy", "current"]`: `legacy` preserva a escala linear de vida do spawn e o multiplicador adicional antigo do infinito. Campanha inclui monstros de treino, oito emboscadas da cripta, seis waves da arena, nove emboscadas da trilha, Capitão e três grupos de reforços. XP e ouro de conclusão da fase são concedidos uma vez. Ouro dos inimigos usa a regra atual e a probabilidade configurada de coleta.

`proposed` usa as curvas alternativas da configuração, limite de quantidade de inimigos e uma dificuldade explícita por fase. A quantidade de encontros narrativos permanece igual. Alterar essa configuração não modifica o jogo: o modo `current` continua usando os valores do módulo compartilhado.

O combate avança em passos de tempo. Contabiliza mana, recargas, regeneração, dano real limitado à vida restante, ataques de aliados, suas mortes/renascimentos, ataques comuns e especiais dos monstros e coleta de vida/mana. Tiro de Osso, Chuva de Ossos e ataques básicos de zumbis, esqueletos e arqueiros são representados. As builds distribuem pontos válidos automaticamente segundo prioridades declaradas em `model.js`.

O adaptador lê `COMBAT_TUNING` do jogo: Tiro com multiplicador de 0,5, intervalos de ataque mais curtos, preparação/recarga dos especiais e chances reduzidas de orbes. O gerador padrão usa 16% de chance de equipamento; orbes têm 16% de chance total, dividida em 25% de vida e 75% de mana (4% e 12% por inimigo). A explosão comandada do zumbi é testada diretamente no jogo, pois comandos da horda ainda não entram na simulação de DPS.

## Equipamentos hipotéticos

- `none`: nenhum equipamento.
- `reference`: sete peças fixas de nível 5 para isolar um conjunto reproduzível.
- `loot`: começa sem itens; recebe drops, equipa peças úteis e, nas visitas à vila da arena, vende peças rejeitadas/substituídas e compra até uma peça se houver ouro. Na campanha, guarda peças sem comprar/vender durante as fases.

Cada raridade tem 0/2/3/4 atributos aleatórios além da base. Pontos de habilidade/escola ocupam um atributo, somam sobre nós aprendidos, podem ultrapassar o teto de investimento e não liberam skills ou talentos finais. Sinergias de pontos diretos de Tiro/Chuva não recebem pontos temporários. As duas escolas de Ossos usam IDs diferentes.

A política escolhe a troca que aumenta uma utilidade explícita: DPS sustentado aproximado de Tiro e horda, ponderado por vida, mana e movimento. Ela não escolhe por raridade. O gerador usa os atributos permitidos por slot no jogo, além da base. Preços, probabilidades e faixas podem ser experimentados pela configuração sem alterar o jogo. Tipos de bônus que não entram nas ações modeladas não devem ser considerados balanceados por este relatório.

Uma comparação adicional repete o encontro com o mesmo nível/build e sem itens. O CSV mostra impacto em vida, dano do Tiro e DPS efetivo. DPS efetivo inclui mana, overkill e sobrevivência; para comparar apenas um atributo, use também dano por acerto e utilidade. A semente inicial do combate é igual, mas ações extras alteram o consumo de aleatoriedade durante a simulação.

O nível do drop usa a wave jogada na arena e o número da fase na campanha; a oferta e o preço da loja usam a maior wave desbloqueada. Os drops são gerados após a luta e equipados entre encontros; itens não coletados numa derrota são considerados perdidos. Para não esconder a distribuição, os controles sem equipamentos também registram drops hipotéticos, sem equipá-los. Na arena, o modelo pressupõe uma visita à vila após cada encontro, enquanto o jogador pode optar por continuar diretamente.

## Limites e leitura dos alertas

Este é um modelo exploratório, não uma reprodução completa da IA. Precisão, esquiva, cobertura de área, inimigos simultâneos e aggro são hipóteses configuráveis. A Chuva resolve sete fragmentos sem geometria; não modela dash defensivo, muralha, escudo, maldição, comandos especiais da horda ou habilidades próprias do Capitão. Esses efeitos estão listados no relatório.

XP e novas skills são aplicadas depois de cada encontro; não existe cura de level-up no meio da luta. Cada encontro começa com recursos e aliados recuperados. A escala dos inimigos de campanha é fixada na entrada da fase. Tempos de deslocamento na campanha não entram no cálculo; XP/minuto mede combate e intervalos, não o tempo real de uma sessão.

Alertas destacam baixa sobrevivência, encontros rápidos/lentos, chefe demorado, poucos acertos suportados, saltos de dificuldade, estagnação de nível, dependência dos itens e farm mais eficiente que avanço. Ajuste os alvos em `targets`; não trate a ausência de alertas como certificação de equilíbrio. Compare percentis entre sementes e confira amostras em partidas antes de alterar os números do jogo.

As próximas etapas são ampliar a fidelidade dos efeitos necessários às builds e conferir os relatórios em partidas reais. Itens, bônus de escolas e curva atual de waves já usam uma fonte compartilhada com o jogo.
