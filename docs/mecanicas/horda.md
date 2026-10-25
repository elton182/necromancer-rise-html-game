# Horda (evocações e aliados)

A horda é formada pelos grupos de mortos-vivos equipados nos
[slots de habilidade](habilidades.md#evocações-nos-slots). Cada tipo de evocação é
liberado no [Grimório](grimorio.md) e ocupa um slot com o grupo inteiro.

Fontes: `necromancer-canvas.html` (`MINION_DEFS`, `updateMinionIntent`,
`configureSummonSlot`, `killMinion`), `scripts/skill-trees.js`
(`skillMinionStats`, `summonGroupSize`, `activateSummonSkill`) e
`scripts/minion-care.js` (reanimação e esquiva) e `scripts/minion-abilities.js`
(habilidades automáticas).

## Tipos de evocação

| Tipo | Libera com | Grupo | Vida base* | Dano base | Velocidade | Alcance | Ataque a cada |
|---|---|---:|---:|---:|---:|---:|---:|
| 🧟 Zumbi | Zumbis | 3 (+2 Horda Explosiva) | 195 | 11 | 3,4 | 1,5 | 1,2 s |
| ⚔ Esqueleto Guerreiro | Esqueletos | 3 (+1 Guarda Sepulcral) | 75 | 14 | 3,8 | 1,6 | 0,9 s |
| 🏹 Esqueleto Arqueiro | Arqueiros | 2 (+2 Salva Sepulcral) | 60 | 13 | 3,2 | 7,5 | 1,1 s |
| 👻 Espectro | Espectros | 2 (+2 Cortejo dos Mortos) | 53 | 22 | 4,6 | 2,0 | 0,7 s |
| 👹 Abominação | Abominação | 1 | 600 | 30 | 2,7 | 2,1 | 1,25 s |

\* Vida no nível 1, sem bônus (já inclui o multiplicador de 1,5× aplicado a todos
os minions). Os aliados são mais rápidos que os monstros comuns.

## Atributos

`N` = nível de Zephyr.

```text
Vida máxima = (vida do tipo × 1,5 + 6 × (N − 1)) × (1 + bônus de vida %)
Dano base   = dano do tipo + (N − 1) + dano base da horda (grimório equipado)
Dano final  = dano base × (1 + bônus de dano % + Aura % + bônus do comando %)
Regeneração = 1% da vida máxima por segundo
```

Zumbis, guerreiros e Abominação recebem **20% menos dano** de ataques e áreas.
A redução é aplicada uma vez por acerto, com arredondamento e mínimo de 1 para
acertos positivos. Arqueiros e espectros recebem o dano integral. O renascimento
automático continua trazendo 50% da vida; a reanimação manual, 60%.

Bônus de vida e dano somam, por tipo:

| Tipo | Vida | Dano |
|---|---|---|
| Zumbi | Zumbis e Abominações; Vida de Zumbis (Abominação) | Zumbis e Abominações; Dano de Zumbis (Abominação) |
| Abominação | Zumbis e Abominações; Vida da Abominação | Zumbis e Abominações; Dano da Abominação |
| Guerreiro | Esqueletos e Arqueiros; Vida dos Guerreiros | Esqueletos e Arqueiros |
| Arqueiro | Esqueletos e Arqueiros | Esqueletos e Arqueiros; Dano dos Arqueiros |
| Espectro | Vida dos Espectros | Dano dos Espectros |

Em todos os tipos entram também **Vida da horda %** e **Dano da horda %** dos
equipamentos. **Aura das Sombras** soma +30% de dano aos aliados a até 8 unidades
de Zephyr. **Vida máxima de Zephyr** nos itens não afeta a horda.

Mudanças de árvore ou equipamento atualizam os aliados já invocados, preservando a
proporção de vida.

## Quantos grupos ao mesmo tempo

A horda tem **espaços de grupo** que limitam quantas evocações diferentes podem
estar equipadas:

| Espaços | Requisito |
|---:|---|
| 3 | Inicial |
| 4 | Concluir o Ato I (fase 4 da campanha) |
| 5 | Nível 12 |

Como existem cinco tipos, o quinto espaço já permite equipar todos.

## Custo para equipar

Equipar uma evocação **em combate** custa mana por integrante invocado; no hub/vila
é gratuito. Reequipar o mesmo tipo cobra apenas os integrantes que faltam.

| Tipo | Mana por integrante |
|---|---:|
| Zumbi | 20 |
| Abominação | 25 |
| Esqueleto Guerreiro | 30 |
| Esqueleto Arqueiro | 30 |
| Espectro | 45 |

## Morte, renascimento e reanimação

| Situação | Retorno automático | Pode reanimar manualmente? |
|---|---|---|
| Morte comum | 12 s, volta com 50% da vida perto de Zephyr | Sim |
| Espectro com Cortejo dos Mortos | 12 s × 0,75 = 9 s | Sim |
| Detonado (explosão de zumbi) | 12 s | Não |
| Sacrificado (Escudo de Carne) | 20 s | Não |

- **Reanimar** (`V`, o aviso clicável no HUD ou **Pausa → Horda**): traz de volta o
  caído comum mais próximo por **30 MP**, com **60%** da vida.
- O tempo mínimo de renascimento é 4 s.
- Os tempos avançam em combate e na vila, mas não com o jogo pausado; também ficam
  salvos.
- Detonados e sacrificados bloqueiam trocar ou dispensar o grupo e devolver pontos
  até se recuperarem.
- **Pacto de Sangue**: cada morte comum de aliado cura Zephyr em 1% da vida máxima
  por ponto. Sacrifícios e detonações não contam.

## Comportamento (IA)

- **Região da horda**: os aliados só escolhem alvos dentro de um raio ao redor de
  Zephyr, configurável em **Pausa → Horda** ou **Opções**:
  - Próximo: 8 unidades;
  - Amplo: 16 unidades (padrão);
  - Distante: 24 unidades.
- **Escolha de alvo**: cada aliado procura o inimigo mais próximo de si a cada
  0,3 s. Mantém o alvo atual, a menos que outro esteja claramente mais perto
  (1,5 u ou mais). Zumbis, guerreiros e Abominação priorizam inimigos a até 6 u
  de Zephyr, considerando a distância de interceptação e a proximidade do
  personagem. Essa proteção pode interromper uma perseguição distante;
  comandos manuais de ataque continuam tendo prioridade.
- **Perseguição**: se não se aproximar de um alvo que foge por 2,5 s, desiste
  dele por 3 s.
- **Retorno**: ao sair da região, o aliado volta a pelo menos 5 u/s (1,5× a
  própria velocidade). Pode retomar o combate ao chegar a 70% do raio da região
  se houver um alvo válido; sem alvo, volta à formação a 3 u de Zephyr. Se apenas
  o alvo sair da região, o aliado escolhe outro sem precisar recuar.
  Separações extremas (mais de 3× o alcance), como em
  transições de fase, reposicionam o aliado ao lado do personagem.
- **Sem alvo**: os aliados orbitam Zephyr.
- **Esquiva**: zumbis, guerreiros e arqueiros tentam sair de áreas anunciadas,
  fogo persistente, linhas de tiro forte, investidas do Capitão e trajetórias de
  projéteis hostis.
  - Reação após 0,12–0,16 s, com intervalo de 1,35 s entre esquivas.
  - Escolhe entre 16 direções a 2,2 ou 3,5 u, respeitando obstáculos e a região
    da horda.
  - Não dá invulnerabilidade.

## Habilidades automáticas

Além do ataque básico, cada aliado tem uma habilidade própria que usa sozinho, sem
comando do jogador. Fonte: `scripts/minion-abilities.js` (`MINION_ABILITIES`).

| Tipo | Habilidade | Recarga | Efeito |
|---|---|---:|---|
| 🧟 Zumbi | Mordida Pútrida | 7 s | 150% de dano no alvo e 35% de lentidão por 3 s |
| ⚔ Esqueleto Guerreiro | Golpe Giratório | 6 s | 130% de dano em todos os inimigos a até 2,2 u |
| 🏹 Esqueleto Arqueiro | Rajada Tripla | 8 s | 3 flechas de 90% de dano em até 3 alvos diferentes |
| 👻 Espectro | Investida Fantasma | 9 s | Atravessa o alvo a até 5 u, reaparece atrás dele e causa 200% de dano |
| 👹 Abominação | Rugido Pútrido | 10 s | 100% de dano a até 3 u e 35% de lentidão por 2 s, sem empurrão |

- A porcentagem é sobre o dano final do aliado (inclui Aura e bônus de grimório e
  equipamentos).
- A recarga é individual e só começa quando a habilidade é usada. A primeira
  depois de invocar ou renascer sai após 30–75% da recarga, para o grupo não
  disparar junto.
- Só dispara em combate, com o alvo vivo, dentro da região da horda e ao alcance.
  Não dispara enquanto o aliado retorna, esquiva, salta ou com a horda reunindo.
- Chefes não ficam lentos; sofrem apenas o dano.
- Ao disparar, o nome da habilidade aparece sobre o aliado; inimigos lentos ganham
  um anel verde. A lista fica em **Pausa → Horda**.

## Comandos

- **`Shift` + clique direito** (ou `LT` no controle):
  - com inimigo a até 4 u do ponto clicado, a horda **ataca**, priorizando alvos
    perto do ponto;
  - sem inimigo perto, a horda se **reúne** no ponto.
  - O ponto é limitado à região da horda e a ordem dura 14 s, com marcador no chão.
- **Comandos especiais** de cada grupo: ativando o slot da evocação (veja
  [Habilidades](habilidades.md#evocações-nos-slots)).

## Painel da horda

**Pausa → Horda** lista integrantes, vida, regeneração e estado (vivo, caído,
detonado, sacrificado, retornando), com botões de reanimação e a configuração de
alcance. Fora da pausa, o HUD mostra o aviso `V · Reanimar agora (30 MP)` quando há
um caído comum.
