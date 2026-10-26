# Personagem e progressão

Zephyr é o único personagem jogável. Atributos, níveis e pontos de habilidade
são recalculados a partir do nível, dos pontos investidos no
[Grimório](grimorio.md) e dos [equipamentos](equipamentos-e-loot.md). Não existem
mais melhorias avulsas compradas com souls: souls não são coletadas nem gastas.

Fontes: `scripts/skill-trees.js` (`skillSync`, `onLevelUp`, `gainExp`) e
`scripts/equipment-model.js` (`spellDamage`, `moveSpeed`, `snapshot`).

## Atributos

`N` = nível do personagem. Percentuais da árvore e dos itens são somados antes de
multiplicar. Valores fixos dos itens entram onde indicado.

| Atributo | Fórmula |
|---|---|
| Vida máxima | `(100 + 10 × (N − 1)) × (1 + Vida de Zephyr %) + vida dos itens` |
| Mana máxima | `(80 + 5 × (N − 1)) × (1 + Mana máxima %) + mana dos itens` |
| Dano mágico base | `arredondar((40 + 4 × (N − 1) + dano base do cajado) × (1 + Dano mágico % dos itens))` |
| Regeneração de mana | `(4 + 0,3 × (N − 1)) × (1 + Regeneração de mana %) + regeneração dos itens` (por segundo) |
| Regeneração de vida | `0,2 × (N − 1)` por segundo |
| Movimento | `mínimo(5,2; (4 + movimento fixo dos itens) × (1 + Movimento % dos itens))` unidades/s |

O **dano mágico base** é a referência de todas as magias: cada habilidade aplica
seu próprio multiplicador depois (Tiro de Osso usa 50%, Chuva 70% por fragmento,
Explosão 250%; veja [Habilidades](habilidades.md)).

Exemplos sem equipamento e sem pontos em Vitalidade, Meditação ou Ossos:

| Nível | Vida | Mana | Dano mágico | Mana/s | Vida/s |
|---:|---:|---:|---:|---:|---:|
| 1 | 100 | 80 | 40 | 4,0 | 0 |
| 10 | 190 | 125 | 76 | 6,7 | 1,8 |
| 30 | 390 | 225 | 156 | 12,7 | 5,8 |
| 60 | 690 | 375 | 276 | 21,7 | 11,8 |

Ao recalcular atributos (subir de nível, investir, trocar equipamento), vida e mana
preservam a proporção atual. Trocar itens não cura nem reinicia recargas.

## Experiência e níveis

- Nível inicial 1, máximo **60**. No nível 60 a experiência para de acumular.
- XP para o próximo nível: `piso(100 × 1,4^(N − 1))`.
- Fontes de XP: monstros (valor do tipo, ajustado pela wave na Arena Infinita),
  conclusão de fases da campanha, missões e waves da Arena Infinita.
- Ao subir de nível: atributos recalculados, **+20 de vida** e **+5 de mana**
  imediatos (sem passar do máximo) e **+3 pontos de habilidade**.

| De → para | XP necessária |
|---|---:|
| 1 → 2 | 100 |
| 2 → 3 | 140 |
| 5 → 6 | 384 |
| 10 → 11 | 2 066 |
| 12 → 13 | 4 049 |
| 20 → 21 | 59 763 |
| 24 → 25 | 229 585 |

> Observação de balanceamento: a curva de 1,4× por nível cresce muito depressa.
> Os nós finais do Grimório exigem nível 22, o que hoje depende de um volume de XP
> muito acima do que a campanha e as primeiras waves entregam.

## Pontos de habilidade

Além desta progressão, cada habilidade equipável tem [maestria independente](maestrias.md),
com XP, nível e pontos próprios. Esses pontos não alteram o orçamento do Grimório.
No nível 60 do personagem, as habilidades equipadas continuam evoluindo.

- Orçamento total: **3 × (N − 1)** pontos, compartilhados entre Minions e Profana.
- Pontos não gastos aparecem no contador `✦ N pts` do HUD; clicar nele abre o Grimório.
- Ao chegar ao nível 2 pela primeira vez, um tutorial pausa o jogo e guia os três
  primeiros investimentos (estado salvo em `skillTutorialState`).
- Redistribuir custa **20 de ouro por ponto devolvido**. Regras completas em
  [Grimório](grimorio.md#devolução-e-redistribuição).

## Habilidades iniciais

Um personagem novo começa com **Tiro de Osso** e **Dash** equipados, sem
minions. Todas as outras magias e evocações são aprendidas no Grimório; a
campanha não concede nem bloqueia habilidades.

## Dano recebido e morte

Ordem de absorção de um golpe em Zephyr:

1. Durante o deslocamento do **Dash**, o dano é ignorado.
2. Com **Véu Noturno** ativo após o dash, o dano é multiplicado por 0,75.
3. A **Defesa** reduz o dano conforme o nível do monstro, até 70%.
4. O **Escudo de Carne** absorve até esgotar; só o excedente passa.
5. O consumível **Escudo de Ossos** bloqueia um golpe inteiro.
6. O restante sai da vida.

Com vida 0:

- **Modo Livre / vila**: tela "VOCÊ MORREU" e, após 3 s, volta ao hub com 50% da
  vida. A tentativa termina; equipamentos que estavam no chão são perdidos.
  Na Arena Infinita, o recorde atingido é mantido.
- **Campanha**: tela "VOCÊ CAIU" e, após 3 s, volta ao mapa da campanha com 50% da
  vida. A fase pode ser tentada de novo.

Não há perda de ouro, experiência ou itens da mochila ao morrer.

## Consumíveis

Comprados no Mercador do hub/vila com ouro e usados com `F1`–`F5` (ordem da barra
de inventário):

| Item | Preço | Pilha | Efeito |
|---|---:|---:|---|
| ❤️ Poção de Vida | 30 | 5 | +50 de vida |
| 💙 Poção de Mana | 25 | 5 | +40 de mana |
| 🛡 Escudo de Ossos | 45 | 3 | Bloqueia o próximo golpe recebido |
| 💣 Bomba de Almas | 55 | 3 | 80 de dano em raio 5 ao redor de Zephyr |
| 📜 Pergaminho | 20 | 5 | Teleporta para o portal da arena |

## Orbes e ouro

| Drop | Chance por monstro | Efeito | Duração no chão |
|---|---|---|---|
| Ouro | Sempre (exceto alvos de treino) | `máximo(2, arredondar(XP × 0,35))`; chefes ×3 | 45 s |
| Orbe de mana | 12% | Restaura 40% da mana máxima | 22 s |
| Orbe de vida | 4% | Restaura 30% da vida máxima | 22 s |

A coleta é automática por proximidade: orbes a menos de ~1,3 unidade; ouro e
equipamentos a menos de 1,8. Ouro e orbes não passam pelo [filtro de loot](equipamentos-e-loot.md#filtro-de-loot).


## Defesa de Zephyr

Capuzes, vestimentas e botas podem sortear o atributo adicional **Defesa**.
Os pontos das peças equipadas são somados; sem equipamento com esse atributo, a defesa é zero.
Itens antigos continuam válidos, sem ganhar atributos retroativamente.

A redução é `mínimo(70%; Defesa / (Defesa + K))`, com `K = 20 + 5 × (nível do monstro − 1)`.
O intervalo útil vai de zero até `7/3 × K` pontos, quando atinge o teto; pontos acima disso
não aumentam a redução contra aquele nível. Por exemplo, 20 pontos reduzem 50% contra nível 1,
33,3% contra nível 5 e 23,5% contra nível 10.

O nível usa a referência de progressão do inimigo (`gearWave`): fase na campanha,
wave na Arena e nível regional na Conquista. Ataques sem fonte usam a progressão da cena.
Projéteis mantêm a fonte e áreas persistentes guardam seu nível.
A defesa atua em todo dano recebido por Zephyr, após o Véu Noturno e antes do Escudo de Carne.
Dash e Escudo de Ossos preservam suas proteções. A mitigação de 70% limita apenas a defesa;
outras proteções continuam funcionando em conjunto.

O inventário compara pontos de defesa e mitigação contra um monstro do nível do jogador.
A estimativa de combate do simulador também aplica defesa; não substitui validação da IA no jogo.
