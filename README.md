# ☠ Necromancer's Rise

Jogo de ação top-down feito em HTML5 Canvas 2D, em um único arquivo, sem dependências. Você é um necromante: lança feitiços, ergue mortos-vivos para lutar ao seu lado e sobrevive a ondas de inimigos.

### ▶ [Jogar agora](https://elton182.github.io/necromancer-rise-html-game/)

[![Tela inicial do jogo](docs/tela-inicial.jpg)](https://elton182.github.io/necromancer-rise-html-game/)

## Como jogar

| Tecla | Ação |
|---|---|
| `W A S D` | Mover o necromante |
| Clique esquerdo / `1` | Ativar habilidade do slot 1 |
| Clique direito / `2` | Ativar habilidade do slot 2 |
| `Q` / `3` | Ativar habilidade do slot 3 |
| `E` / `4` | Ativar habilidade do slot 4 |
| `R` / `5` | Ativar habilidade do slot 5 |
| `T` / `6` | Ativar habilidade do slot 6 |
| Clique no botão do HUD | Escolher a habilidade daquele slot |
| `C` | Dash, quando equipado em um slot |
| `Shift` + clique direito | Reunir a horda (no chão) ou mandar atacar (no inimigo) |
| `V` | Reanimar aliado caído, exceto sacrificado ou detonado |
| `G` | Portal / interagir |
| `F1`–`F5` | Usar itens do inventário |
| `ESC` | Pausa: Personagem, Habilidades, Horda e Sistema |
| `H` | Ajuda com controles e explicação dos recursos |

Também dá para jogar com controle (gamepad).

### Dash e ataques especiais

Zephyr começa com **Dash** (`C`, ou L3 no controle, quando equipado): percorre até 4,5 unidades em 0,18 s, com recarga de 3 s e sem custo de mana. Usa a direção do movimento; parado, usa a mira. Durante o deslocamento, evita dano. Obstáculos e limites da fase interrompem o dash.

Os inimigos básicos preparam seus ataques especiais com avisos visuais:

| Inimigo | Habilidade | Comportamento inicial |
|---|---|---|
| Guerreiro | Golpe pesado | Avisa por 0,65 s; dano de 1,6× em raio 2,1; recarga de 7 s |
| Arqueiro | Tiro forte | Avisa a linha de tiro por 0,9 s; flecha de 1,9× de dano com direção fixa; recarga de 7 s |
| Mago Vivo | Erupção de fogo | Marca o chão por 1 s; impacto de 1,2× e três pulsos de 0,3× em raio 2,2; recarga de 9 s |
| Bruto | Salto devastador | Avisa o destino por 0,85 s; salta e causa 2× de dano em raio 2,6 ao cair; recarga de 8 s |

Sair da região marcada evita o impacto. Inimigos mortos durante a preparação não completam a habilidade. Chefes mantêm suas habilidades próprias, e alvos de treino não usam esses ataques. Os valores são iniciais e ainda precisam de balanceamento em uma partida.

As seis habilidades iniciais do painel são **Tiro de Osso**, **Muralha de Corpos**, **Zumbis**, **Abominação**, **Esqueletos arqueiros** e **Dash**. As opções ainda não aprendidas ficam bloqueadas até sua liberação na campanha ou árvore. Clique em qualquer slot para trocar sua habilidade; magias e evocações usam os mesmos seis espaços. No controle, LB/RB escolhem o slot e A/RT ativam.

**Muralha de Corpos** custa 35 MP e ergue um muro por 5 segundos, com dano de contato. O muro impede a passagem de inimigos e intercepta seus projéteis. **Tiro de Osso** custa 20 MP. Escudo de Carne pode ser equipado entre as opções adicionais: sacrifica um zumbi e reserva seu lugar até a recuperação.

Saves anteriores são migrados automaticamente. Upgrades removidos de Nova são reembolsados em almas, e Bastião devolve seu ponto para permitir escolher Carne Reforçada.

Para verificar sintaxe e regras das habilidades: `node game_check.js`.

A horda só escolhe alvos a até 8 unidades de Zephyr. Ao ultrapassar essa região ou perder um alvo que se afasta, os aliados retornam até chegar a 3 unidades do personagem. Comandos de ataque e reunião respeitam o mesmo limite. Separações extremas, como em transições, recuperam o aliado perto do personagem.

Na pausa, Personagem reúne status e melhorias gerais; Habilidades reúne árvore e evoluções; Horda reúne integrantes, invocação e melhorias; Sistema reúne controles, opções e saves. Loja e missões continuam disponíveis pelos serviços do mundo e mapa. O HUD distingue o vínculo reservado da mana e mostra os atalhos de cada habilidade.

O HUD de combate usa o Relicário de Zephyr: vida integrada ao painel esquerdo e mana ao direito, com um espaço livre entre os painéis. As seis habilidades ficam divididas entre os dois lados. A Ajuda (`H`) reúne as instruções.

### Evocações nos slots de habilidades

Equipar uma evocação traz seu grupo automaticamente: **3 zumbis**, **2 esqueletos arqueiros** ou **1 abominação**. O grupo ocupa um único slot de habilidade. Ativar esse slot comanda a habilidade especial, liberada na árvore:

| Evocação | Comando | Recarga |
|---|---|---:|
| Zumbis | Explode apenas um zumbi vivo por ativação, próximo da mira | 1,2 s |
| Esqueletos arqueiros | Cada arqueiro vivo dispara um tiro forte | 7 s |
| Abominação | Salta e causa dano em área ao aterrissar | 8 s |

O zumbi detonado permanece vinculado ao slot e aguarda o renascimento normal (12 segundos, modificado pelas melhorias). Se todos forem detonados, o comando aguarda até algum voltar. Reanimação manual, dispensa e troca de evocação não antecipam essa recuperação. Os tempos de recuperação também são salvos.

### Grimório de habilidades

Na pausa, **Habilidades** abre o Grimório dos Mortos, com moldura de metal escuro e latão alinhada ao Relicário do HUD. Cada habilidade tem uma aba com seu próprio ramo, pré-requisitos e melhorias. As evoluções com almas aparecem somente na habilidade selecionada. Os bônus que afetam toda a horda ficam em uma aba geral, e os investimentos de saves anteriores são mantidos.

Os ramos são diagramas gravados em pedra: símbolos quadrados ligados por trilhas mostram a progressão, com estados de bloqueio, disponibilidade e aprendizado. Selecione um símbolo para consultar descrição, pré-requisito e custo; o botão de aprender ou evoluir realiza a compra. As evoluções com almas fazem parte do mesmo diagrama. Em telas pequenas, os detalhes ficam abaixo da árvore.

Muralha possui melhorias de duração (5 → 7 s) e dano (+50%); Dash, recarga (3 → 2,4 s) e distância (4,5 → 6 unidades). Zumbis podem melhorar o dano da explosão (+50%), arqueiros o tiro forte (+40%) e Abominação o impacto (+30% de dano e raio de 3 → 4 unidades). Cada melhoria custa um ponto e respeita os pré-requisitos exibidos no seu ramo.

Legião Putrefata e Maré dos Mortos aumentam os zumbis por grupo; Salva Sepulcral aumenta os arqueiros. Grupos de saves antigos são migrados; os não equipados ficam em reserva. Os antigos marcos de grupos são preservados para compatibilidade, mas o painel de combate usa seis slots compartilhados entre magias e evocações.

### Vila, campanha e missões

O quadro **Mapa da Campanha** na vila permite voltar ao mapa e rejogar fases sem perder o progresso. Interaja com `G`. As missões da vila podem oferecer arenas ou trilhas de rolagem lateral, com três emboscadas e chefe no trecho final. A recompensa é concedida uma vez e, ao chegar ao final da trilha, o retorno à vila é automático. Fases laterais da campanha rejogadas após liberar a vila também retornam automaticamente, após a sequência de conclusão. Na primeira passagem do Ato I, a história mantém o retorno ao mapa até a vila ser liberada.

## Rodando localmente

Não precisa de build nem servidor: basta abrir `necromancer-canvas.html` no navegador.

## Estrutura

| Arquivo | Descrição |
|---|---|
| `necromancer-canvas.html` | **Versão atual** do jogo (Canvas 2D, sprites embutidos) |
| `index.html` | Entrada do GitHub Pages, redireciona para a versão atual |
| `necromancer-game.html` | Versão anterior (Three.js) |
| `necromancer-demo.html` | Demo visual inicial |
| `blender/` | Modelos, rigs e scripts Python que geram os spritesheets |

### Pipeline de sprites (Blender)

Os personagens (necromante, zumbi e esqueleto) são modelados e animados por script no Blender e renderizados como spritesheets de 8 direções com shader toon:

![Personagens renderizados no Blender](blender/preview_mobs.png)

- `necromante.py`, `mob.py` — constroem modelo, rig e animações (`.blend` / `.glb`)
- `sprites.py` — renderiza o spritesheet (`*_sheet.webp`) e os metadados (`*_sheet.json`)
- `render.py` — renders de preview
- `toon.py`, `common.py` — utilitários compartilhados

Exemplo:

```bash
blender -b -P blender/sprites.py -- blender/necromante.blend blender necromante
```
