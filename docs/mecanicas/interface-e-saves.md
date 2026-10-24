# Interface, controles, opções e saves

Fontes: `necromancer-canvas.html` (HUD, `tPause`, `tOptions`, gamepad `PAD`,
`saveGame`, `loadGame`), `scripts/menu.css`, `scripts/equipment.js` e
`scripts/skill-trees.js`.

## Controles

### Teclado e mouse

| Tecla | Ação |
|---|---|
| `W A S D` / setas | Mover |
| Clique esquerdo / `1` | Slot 1 |
| Clique direito / `2` | Slot 2 |
| `Q` / `3` · `E` / `4` · `R` / `5` · `T` / `6` | Slots 3 a 6 |
| `Shift` + clique direito | Comandar a horda: atacar perto do ponto ou reunir |
| `C` | Dash (se equipado) |
| `Espaço` | Escudo de Carne (se equipado) |
| `V` | Reanimar o aliado caído mais próximo (30 MP) |
| `G` | Interagir com NPCs / usar o portal |
| `F1`–`F5` | Usar consumíveis |
| `I` | Inventário e equipamentos |
| `H` | Ajuda (controles e explicação dos recursos) |
| `ESC` | Pausa / fechar janelas |
| Clique num slot do HUD | Trocar a habilidade daquele slot |
| Clique no contador de pontos | Abrir o Grimório |

### Controle (gamepad)

| Botão | Em combate | Em menus |
|---|---|---|
| Analógico esquerdo / direcional | Mover | Navegar |
| Analógico direito | Mirar (trava suave em inimigos até 12 u) | — |
| `RT` | Usar o slot selecionado (repete a cada 0,28 s) | — |
| `A` | Usar o slot selecionado | Confirmar |
| `LB` / `RB` | Slot anterior / próximo | Aba anterior / próxima |
| `X` / `Y` / `R3` | Slots 3 / 4 / 5 | — |
| `L3` | Dash | — |
| `LT` | Comandar a horda na mira | — |
| `B` | Portal / interagir | Voltar |
| `Select` | Reanimar | — |
| `Start` | Pausa | Fechar |

No hub, `A` ou `B` falam com o NPC próximo. Em cutscenes, `A`/`RB` avançam e
`◀` volta. Uma legenda na tela mostra os botões ativos. **Opções → Calibrar
controle** remapeia o analógico direito em controles fora do padrão.

## HUD de combate (Relicário de Zephyr)

- Vida integrada ao painel esquerdo e mana ao direito, com espaço livre entre os
  dois.
- Os seis slots de habilidade ficam divididos entre os lados (3 + 3), com atalho,
  recarga e disponibilidade de mana.
- Contador `✦ N pts`, que abre o Grimório.
- Texto de wave/missão, barra de chefe (o Capitão mostra fase e escudo) e minimapa.
- Aviso clicável `V · Reanimar agora (30 MP)` quando há aliado caído.
- Barra de consumíveis (`F1`–`F5`).

## Menu de pausa

Todas as abas usam a mesma janela, com cabeçalho, resumo do personagem (retrato,
nível, vida, mana, ouro e pontos), navegação e área de rolagem.

| Aba | Conteúdo |
|---|---|
| Personagem | Atributos de Zephyr |
| Habilidades | [Grimório dos Mortos](grimorio.md) |
| Horda | Integrantes, reanimação, configuração das evocações e alcance da horda |
| Sistema | Salvar (só no hub), exportar save, história, ajuda, mapa da campanha, opções e apagar progresso |
| Equipamentos | [Inventário](equipamentos-e-loot.md#inventário) e, no hub, mercador de relíquias |
| Waves | Seleção da Arena Infinita (só no hub do Modo Livre) |

Ações laterais conforme o contexto: **Continuar**, **Ajuda**, **Voltar ao mapa**
(fase da campanha), **Voltar à vila** (trilha ou Arena Infinita), **Voltar à
história** (Modo Livre) e **Menu principal**.

## Opções

Disponíveis na tela inicial e em **Sistema → Opções**. Ficam salvas no navegador
(`nr_opts`).

| Opção | Valores |
|---|---|
| Volume / Música | 0–100 |
| Gráficos | Automático, Alta, Média, Baixa (mais FPS) |
| Alcance da horda | Próximo (8), Amplo (16, padrão), Distante (24) |
| Filtro de loot | Todos, mágico+, raro+, apenas épico |
| Pausar ao perder foco | Ligado por padrão. Desligado, o jogo continua ao trocar de janela (o navegador ainda pode reduzir a execução de abas ocultas) |
| Som | Ligado / desligado |
| Calibrar controle | Assistente de mapeamento do analógico |
| Tela cheia | Alterna |
| Necromante | Sprite 3D (renderizado no Blender) ou desenhado |

Só na tela inicial: **Importar save**, **Exportar save**, **História** (cenas já
liberadas) e **Apagar save**.

## Saves

O jogo roda inteiro no navegador e guarda tudo no `localStorage`:

| Chave | Conteúdo |
|---|---|
| `necromancer_v2` | Save do personagem (único) |
| `necromancer_v2_before_skill_trees` | Cópia do save anterior às árvores, criada uma vez |
| `nr_opts` | Opções, filtro de loot, alcance da horda, mapeamento do controle |
| `necromancer_story` | Cenas de história já vistas |

**O que o save guarda**: nível, XP, vida/mana, ouro, consumíveis, ranks do
Grimório, slots de ação, grupos da horda (vida e tempos de recuperação de cada
integrante), equipamentos, mochila, progresso de waves, recorde da Arena Infinita,
progresso da campanha e modo (campanha ou livre).

**Quando salva**:

- ao entrar no hub ou no mapa;
- ao investir ou devolver pontos fora de combate;
- ao equipar, comprar, vender ou coletar equipamento;
- ao concluir waves da Arena Infinita e fases da campanha;
- manualmente em **Sistema → Salvar** (no hub).

**Exportar/Importar** gera e lê um arquivo JSON do save, útil para backup ou para
trocar de navegador.

### Migração de saves

Ao carregar, o save passa por migrações idempotentes, em ordem:

1. **Habilidades antigas** (`abilityVersion`) e **grupos da horda**
   (`summonSlotVersion`, slots de ação).
2. **Equipamentos** (`equipmentVersion` 2): peças inválidas ou duplicadas são
   descartadas, peças do formato 1 são convertidas e o recorde antigo da arena
   vira `waveProgress`.
3. **Árvores de habilidades** (`skillTreeVersion` 1):
   - saves legados recebem ranks vazios e `3 × (nível − 1)` pontos;
   - souls e melhorias antigas são removidas;
   - atributos são reconstruídos a partir do nível, preservando a proporção de
     vida/mana;
   - ouro, inventário, experiência e campanha são mantidos;
   - slots de habilidades não aprendidas ficam vazios.

Saves sem investimento em Zumbis perdem os antigos zumbis gratuitos; quem já
investiu mantém a evocação.
