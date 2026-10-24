# Equipamentos e loot

Equipamentos são a segunda camada de progressão, ao lado do
[Grimório](grimorio.md). Eles não mudam a aparência de Zephyr.

Fontes: `scripts/equipment-model.js` (geração, validação, bônus e estimativas,
compartilhado com o [simulador de balanceamento](../../balance-simulator/README.md))
e `scripts/equipment.js` (inventário, drops, mercador, filtro e waves).

## Espaços de equipamento

| Espaço | Atributo base (fixo) | Afixos possíveis |
|---|---|---|
| ⚚ Cajado | Dano mágico base (+10 a +12 no nível 1) | Dano mágico %, mana, regeneração, dano da horda %, vida da horda %, recarga |
| ▤ Grimório | Dano base da horda (+3 a +5 por aliado no nível 1) | Dano da horda %, vida da horda %, mana, regeneração, dano mágico % |
| ♜ Vestimenta | Vida máxima de Zephyr | Vida, mana, vida da horda %, regeneração, recarga |
| ♙ Capuz | Mana máxima | Mana, vida, regeneração, dano mágico %, dano da horda %, vida da horda % |
| ♟ Botas | Velocidade de movimento | Movimento %, vida, mana, regeneração, vida da horda %, recarga |
| ◉ Anel esquerdo / direito | Regeneração de mana | Vida, mana, dano mágico %, dano da horda %, vida da horda %, regeneração, recarga |

Todos os tipos também podem rolar **pontos de habilidade** (nível 4+) e, em raros e
épicos, **pontos de escola** (nível 8+). Cajado e grimório podem ser usados
juntos. Os dois anéis são intercambiáveis.

## Raridade

| Raridade | Cor | Afixos aleatórios | Chance |
|---|---|---:|---:|
| Comum | Cinza claro | 0 | 60% |
| Mágico | Azul | 2 | 28% |
| Raro | Amarelo | 3 | 10% |
| Épico | Roxo | 4 | 2% |

O atributo base não ocupa espaço de afixo, e o mesmo afixo não se repete numa peça.
Chefes nunca deixam peças comuns: as chances viram 70% mágico, 25% raro e 5% épico.

## Valores

Cada peça tem um **nível**. O fator de escala é `1 + 0,12 × (nível − 1)`.

| Atributo | Tipo | Valor de referência no nível 1 |
|---|---|---|
| Dano mágico base (cajado) | Fixo | 10, 11 ou 12 |
| Dano base da horda (grimório) | Fixo | 3, 4 ou 5 |
| Vida máxima de Zephyr | Fixo | 12 |
| Mana máxima | Fixo | 8 |
| Velocidade de movimento (botas) | Fixo | 0,05 u/s |
| Regeneração de mana | Fixo | 0,4/s |
| Dano mágico | % | 4% |
| Dano da horda | % | 4% |
| Vida da horda | % | 12% |
| Movimento | % | 1% |
| Redução de recarga | % | 1% |

- Valores fixos de cajado e grimório sorteiam um inteiro da faixa e multiplicam
  pela escala.
- Os demais sorteiam entre **70% e 130%** da referência e multiplicam pela escala.
- Limites totais: **Movimento** até +30%, **Redução de recarga** até 50% e
  velocidade final até 5,2 u/s.

Como o dano entra na conta (veja [Personagem](personagem-e-progressao.md#atributos)):

```text
dano mágico = arredondar((40 + 4 × (nível − 1) + dano base do cajado) × (1 + dano mágico % / 100))
```

Exemplo: nível 12 (base 84), cajado +25 e afixo +10% → `(84 + 25) × 1,10 ≈ 120`.
O multiplicador de cada magia vem depois. O dano base do grimório soma-se ao dano
de cada aliado antes dos percentuais da horda e dos comandos.

## Pontos de habilidade nos itens

- `+1` ou `+2 em <habilidade>` (o +2 tem 25% de chance a partir do nível 12) e
  `+1 em toda a escola <escola>` (raros e épicos, nível 8+).
- Só fortalecem nós comuns que já tenham ao menos **1 ponto investido**. Com o nó
  ainda não aprendido, o afixo aparece como **inativo**.
- Não liberam pré-requisitos, não dão pontos distribuíveis e não afetam
  especializações finais.
- Podem passar do limite de 5 (por exemplo, `5 investidos + 2 de equipamento =
  7 efetivos`). O Grimório mostra essa soma nos detalhes do nó.
- Sinergias diretas entre nós continuam contando só os pontos investidos.

## Drops

| Fonte | Chance de equipamento |
|---|---|
| Monstro comum | 16% |
| Chefe | 100%, mágico ou melhor |
| Alvo de treino | 0% |

O **nível da peça** depende de onde ela caiu:

| Contexto | Nível |
|---|---|
| Arena Infinita | Wave atual |
| Campanha | Número da fase (1–4) |
| Missões do Modo Livre e da vila | Dificuldade da missão (1–3) |
| Mercador de relíquias | Maior wave desbloqueada |

- Peças no chão permanecem enquanto durar a tentativa (não expiram).
- Coleta automática a menos de 1,8 u. Com a mochila cheia, a peça fica no chão e
  aparece o aviso **Mochila cheia · I para equipamentos**.
- Ao sair da área pelo portal ou para o mapa, todas as peças permitidas pelo filtro
  são coletadas automaticamente. Se não couberem, o jogo pede confirmação antes de
  deixá-las para trás.
- Ao morrer, peças no chão são perdidas.

## Filtro de loot

Em **Opções** e no **Inventário (I)**: todos os equipamentos, mágico ou superior,
raro ou superior ou apenas épico.

- Peças abaixo do filtro ficam **ocultas no chão e não são coletadas**, nem ao
  sair da fase.
- Reduzir o filtro volta a mostrar as peças enquanto você estiver na mesma área.
- Ouro e orbes não são afetados. A preferência fica salva no navegador (`nr_opts`).

## Inventário

Abra com **I** ou **ESC → Equipamentos**.

- **Mochila**: 60 espaços, em duas bolsas de 30. Equipamentos vestidos não ocupam
  espaço; consumíveis ficam numa barra separada.
- **Personagem**: silhueta com os sete espaços nas suas posições. Ícone e borda
  indicam tipo e raridade.
- **Equipar**: clique para selecionar e use **Equipar**, ou arraste até um espaço
  iluminado. A peça antiga volta para a mochila. Anéis permitem escolher o lado.
- **Desequipar** exige espaço livre na mochila.
- **Comparar**: a tabela mostra base e afixos lado a lado (equipado x selecionado).
- **Status do personagem**: compara os atributos atuais com a prévia da troca.
- **Dano e DPS**: tabela com dano por uso, recarga, DPS potencial e DPS contínuo
  (limitado pela regeneração de mana) de cada habilidade. As estimativas assumem um
  alvo parado, todos os acertos, horda viva e próxima e cada habilidade sozinha:
  não são DPS total da build.
- **Bônus equipados**: soma de todos os atributos e pontos extras.
- **Vender** (só no hub do Modo Livre/vila): 15% do preço de compra. Em combate
  ou na campanha, a opção é **Descartar peça**.
- **Descartar tudo da mochila**: remove as peças das duas bolsas após
  confirmação, preservando equipados e consumíveis.

Trocas preservam a proporção de vida e mana de Zephyr e dos aliados e não
reiniciam recargas nem recuperações da horda.

## Mercador de relíquias

No hub do Modo Livre (a Vila de Eldrin, depois do Ato I), a aba **Equipamentos**
ou o botão **Relíquias** no Mercador vendem peças misteriosas:

- escolha o **tipo**; nível = maior wave desbloqueada;
- preço `25 + 10 × nível` de ouro;
- raridade sorteada (60/28/10/2%) e revelada após a compra.

| Nível | Preço | Venda de uma peça desse nível |
|---:|---:|---:|
| 1 | 35 | 5 |
| 5 | 75 | 11 |
| 10 | 125 | 18 |
| 20 | 225 | 33 |

## Formato e migração

Cada peça salva ID, versão (2), tipo, raridade, nível, wave de origem, base e
afixos já sorteados. Recarregar não sorteia de novo. Peças do formato 1 (base em
percentual) são convertidas mantendo identidade, raridade e afixos. Peças
inválidas ou duplicadas são descartadas ao carregar.
