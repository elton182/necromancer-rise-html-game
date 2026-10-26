# Mecânicas do jogo

Referência das regras de **Necromancer's Rise** como estão implementadas no código.
Os números foram conferidos em `necromancer-canvas.html` e nos módulos de
`scripts/` e `build-simulator/` em 24/10/2026 (versão 0.5 mais as alterações locais
de Estilhaços). São valores iniciais de protótipo, ainda sem balanceamento
fechado por partidas completas.

## O ciclo do jogo

1. **Lutar**: Zephyr usa magias e mobilidade nos seis slots de habilidade, enquanto
   a horda de mortos-vivos ataca sozinha dentro de uma região ao redor dele.
2. **Coletar**: monstros deixam ouro, orbes de vida/mana e equipamentos.
3. **Evoluir**: cada nível dá 3 pontos para o Grimório (duas árvores, seis escolas)
   e os equipamentos somam atributos e pontos extras.
4. **Escolher o desafio**: campanha (Ato I), missões no hub/vila ou a Arena
   Infinita, onde o recorde de waves define o nível do loot à venda.

## Guias

| Guia | Assunto |
|---|---|
| [Personagem e progressão](personagem-e-progressao.md) | Atributos, fórmulas, XP, pontos, morte, consumíveis, orbes e ouro |
| [Habilidades e slots](habilidades.md) | Seis slots, todas as magias, Dash, comandos das evocações, recargas |
| [Grimório dos Mortos](grimorio.md) | Regras das árvores, os 42 nós com efeitos, devolução de pontos |
| [Maestrias](maestrias.md) | Níveis e XP das 12 habilidades, bônus automáticos e árvores com pontos próprios |
| [Horda](horda.md) | Tipos de evocação, atributos, IA, alcance, reanimação, comandos |
| [Inimigos e chefes](inimigos-e-chefes.md) | Tipos, especiais, composição e escala das waves, chefes e Capitão |
| [Equipamentos e loot](equipamentos-e-loot.md) | Espaços, raridades, afixos, drops, filtro, inventário, mercador |
| [Modos de jogo e mundo](modos-de-jogo.md) | Campanha, Modo Livre, missões, Vila de Eldrin, trilhas, Arena Infinita |
| [Conquista de Valdoria](conquista-valdoria.md) | Pântano, influência, maldições sorteadas, tenentes, fortaleza, fragmento e Podridão |
| [Interface, controles e saves](interface-e-saves.md) | Teclado, controle, HUD, pausa, opções, saves e migração |

## Convenções

- **u** = unidade de distância do mundo. O campo de waves tem raio 28; o hub, 18.
- **D** = dano mágico base de Zephyr; **N** = nível do personagem; **W** = contador de waves.
- Percentuais de mesmo tipo são **somados** antes de multiplicar.
- Ao mudar um valor no código, atualize o guia correspondente. As fontes de cada
  regra aparecem no início de cada página.
