# ☠ Necromancer's Rise

Jogo de ação top-down feito em HTML5 Canvas 2D, em um único arquivo, sem dependências. Você é um necromante: lança feitiços, ergue mortos-vivos para lutar ao seu lado e sobrevive a ondas de inimigos.

### ▶ [Jogar agora](https://elton182.github.io/necromancer-rise-html-game/)

[![Tela inicial do jogo](docs/tela-inicial.jpg)](https://elton182.github.io/necromancer-rise-html-game/)

## Como jogar

| Tecla | Ação |
|---|---|
| `W A S D` | Mover o necromante |
| Clique esquerdo / `1` | Lançar Raio Necrótico |
| Clique direito / `2` | Lançar Mãos dos Mortos |
| `3` / `4` | Lançar Chuva de Ossos / Explosão de Almas, quando aprendidas |
| `ESPAÇO` | Escudo de Carne (15 MP + zumbi; sem zumbi, também consome HP) |
| `Q` | Configurar um grupo de invocação |
| `Shift` + clique direito | Reunir a horda (no chão) ou mandar atacar (no inimigo) |
| `R` | Reanimar minion caído |
| `E` | Portal / interagir |
| `F1`–`F5` | Usar itens do inventário |
| `ESC` | Pausa: Personagem, Habilidades, Horda e Sistema |
| `H` | Ajuda com controles e explicação dos recursos |

Também dá para jogar com controle (gamepad).

Na campanha, o Ato I libera **Raio Necrótico** na Cripta (mouse 1 ou `1`, 20 MP), **Zumbis** na Floresta (`Q`), **Mãos dos Mortos** na Trilha (mouse 2 ou `2`, 35 MP) e **Escudo de Carne** no Posto (`Espaço`, 15 MP). Mouse e teclas lançam suas habilidades diretamente, na direção da mira. No controle, LB/RB ainda escolhem a magia e A/RT lançam.

Mãos dos Mortos reduz a velocidade dos inimigos em 40% por uma área de 5 segundos (20% para o deslocamento normal de chefes). Escudo de Carne sacrifica o zumbi mais ferido e absorve 70% de seu HP máximo por 8 segundos. O zumbi ocupa seu espaço e recupera em 20 segundos; `R` não antecipa essa recuperação. Sem zumbi vivo, a habilidade cobra 15% do HP máximo por um escudo de 25%, sem permitir que o custo mate Zephyr.

Saves anteriores são migrados automaticamente. Upgrades removidos de Nova são reembolsados em almas, e Bastião devolve seu ponto para permitir escolher Carne Reforçada.

Para verificar sintaxe e regras das habilidades: `node game_check.js`.

A horda só escolhe alvos a até 8 unidades de Zephyr. Ao ultrapassar essa região ou perder um alvo que se afasta, os aliados retornam até chegar a 3 unidades do personagem. Comandos de ataque e reunião respeitam o mesmo limite. Separações extremas, como em transições, recuperam o aliado perto do personagem.

Na pausa, Personagem reúne status e melhorias gerais; Habilidades reúne árvore e evoluções; Horda reúne integrantes, invocação e melhorias; Sistema reúne controles, opções e saves. Loja e missões continuam disponíveis pelos serviços do mundo e mapa. O HUD distingue o vínculo reservado da mana e mostra os atalhos de cada habilidade.

O HUD de combate usa o Relicário de Zephyr: reservatórios de vida e mana ladeiam as ações diretas, com experiência e nível na base. Abaixo das habilidades ficam os slots de grupos. A Ajuda (`H`) reúne as instruções, sem uma faixa permanente sobre o combate.

### Grupos de invocação

Você começa com **3 slots de grupos**. Cada slot de **Zumbi invoca 3 zumbis**; cada slot de **Arqueiro Ósseo invoca 2 arqueiros**. Esqueleto guerreiro e Espectro começam com 1 por slot. O primeiro grupo de zumbis é concedido ao aprender invocação na campanha, ou ao começar o modo livre.

Clique no slot para escolher seu tipo, reforçar unidades que faltam ou liberar o grupo. A troca valida os custos antes de remover os aliados anteriores. Mana e almas são cobradas por criatura nova; no hub, a mana não é cobrada. Criaturas caídas ou sacrificadas continuam vinculadas ao grupo, e sacrifícios bloqueiam a troca até sua recuperação.

| Marco | Slots disponíveis |
|---|---:|
| Inicial | 3 |
| Conclusão do Ato I | +1 |
| Nível 12 | +1 |
| Nível 15 | +1 |
| Nível 20 | +1 |

Os marcos são independentes e permitem chegar a **7 slots**. A árvore contém Legião Putrefata e Maré dos Mortos (+1 zumbi por grupo cada) e Salva Sepulcral (+1 arqueiro por grupo). Depois de aprender uma expansão, clique no slot para reforçar o grupo.

Slots de grupos substituem as antigas vagas individuais e o limite de vínculo. Saves anteriores agrupam os aliados existentes e reembolsam as melhorias removidas de vagas/vínculo. Grupos excedentes ficam em reserva e podem ser restaurados em um slot vazio. Configuração, HP e recuperação de sacrifício são salvos.


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
