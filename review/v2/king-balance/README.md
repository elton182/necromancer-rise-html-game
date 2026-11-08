# Rei Caído — simulações de balanceamento (07/11/2026)

Simulador: `node v2/tests/king-simulation.mjs [--runs N] [--hpmult N] [--only fase4,...] [--profiles medio,...] [--out pasta]`.
Usa o motor real da v2 (`session.mjs` → `training-model` → `fallen-king.mjs`), arena de treino só com o Rei.

- Perfis: `medio` (nível 12, árvore reduzida, 8 aliados), `forte` (`TEST_PROFILE`, nível 24, 10 aliados), `solo` (nível 24 sem grupos).
- Encontros: atributos de cada modo — `fase4` (Capitão: 20 000 de vida, 46 de dano), `expedicao-w5`/`-w12` e `treino` (base 350/1000 de vida).
- Bot: mira e lança o Tiro de Osso sem parar. `parado` não anda; `esquiva` sai dos avisos e das chamas (Dash com aviso > 70%) e mantém 5,5–9 u do Rei.
- O dano é atribuído pela pilha de chamadas: `cone` = Corte, `area` = Queda, `ring` = Giro, `line` = Brasas, zona do Rei = chamas.

## Pastas

- `baseline/` — regras atuais, 6 sementes por cenário.
- `proposta-p1/` — protótipo rodado numa cópia temporária dos scripts (o jogo não foi alterado): `prototype.diff` mostra a mudança;
  rodado com `--hpmult 12`, 5 sementes. Na época o simulador ainda não aplicava `V2_KING.hp`.
- `implementado/` — regras já no jogo (`V2_KING` em `v2/scripts/fallen-king.mjs`), 6 sementes. O simulador agora aplica
  `V2_KING.hp` aos encontros fora da Fase 4, como o jogo.
- `browser/` — `node v2/tests/king-attacks-browser-check.cjs`: Giro, Brasas e Queda em Zephyr no arquivo gerado,
  com chão escuro em qualidade alta e chão claro em qualidade baixa.

## Limites

Bot simples: não usa Muralha, Escudo, comandos ou reanimação da horda, e a esquiva é grosseira contra a Queda. A Fase 4 real só
libera Zumbis, Muralha e Escudo; os perfis aqui têm mais grupos. O guerreiro não foi simulado. Há aleatoriedade fora de
`w.random` no motor: a mesma semente pode variar um pouco (ex.: `medio fase4 esquiva` venceu 100% numa rodada e 60% noutra).
