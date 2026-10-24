# Habilidades e slots

Zephyr usa **seis slots compartilhados** para magias, mobilidade e evocações.
Cada habilidade ocupa no máximo um slot. Uma habilidade só pode ser equipada
depois de aprendida no [Grimório](grimorio.md) (exceto Tiro de Osso e Dash, que
são iniciais).

Fontes: `necromancer-canvas.html` (`castRaio`, `castHands`, `castChuva`,
`castExplosao`, `castBarrier`, `castDash`, `ACTION_SKILLS`) e as regras que
`scripts/skill-trees.js` instala por cima delas.

## Slots e atalhos

| Slot | Teclado / mouse | Controle |
|---:|---|---|
| 1 | Clique esquerdo ou `1` | Slot selecionado com `A` ou `RT` |
| 2 | Clique direito ou `2` | (selecionar com `LB`/`RB`) |
| 3 | `Q` ou `3` | `X` |
| 4 | `E` ou `4` | `Y` |
| 5 | `R` ou `5` | `R3` |
| 6 | `T` ou `6` | (selecionar com `LB`/`RB`) |

Atalhos diretos, independentes do slot: `C` (ou `L3`) usa o Dash e `Espaço` usa
o Escudo de Carne, desde que estejam equipados em algum slot.

- **Trocar**: clique em um slot do HUD e escolha a habilidade. Escolher uma que já
  está em outro slot troca as duas de posição, sem reinvocar grupos.
- **Mira**: magias de área e comandos usam a posição do cursor (ou da mira do
  controle, com trava suave no inimigo mais próximo da linha de mira, até 12 u).
- **Tutorial de slots**: ao aprender uma habilidade equipável que ainda não está
  em nenhum slot, um diálogo pausa o jogo e mostra os seis slots com seus atalhos.
  É possível escolher depois; o botão **Alocar em um slot** nos detalhes do nó
  reabre o diálogo.
- **Botões estáveis**: os botões do HUD são preservados durante atualizações de
  mana e recarga, evitando cliques perdidos.

## Magias

`D` = dano mágico base ([Personagem](personagem-e-progressao.md#atributos)).
Os bônus "%" vêm do Grimório e dos pontos extras dos equipamentos. Todas as magias
com alvo têm **alcance 9**; fora dele, não são lançadas nem cobram mana.

| Habilidade | Custo | Recarga | Efeito | Escala com |
|---|---:|---:|---|---|
| 🦴 **Tiro de Osso** | 20 MP | 0,5 s | Projétil reto (14 u/s, percorre 9 u). Acerta o primeiro alvo no trajeto. Dano `D × 0,5 × (1 + Dano do Tiro %)` | Tiro de Osso, Chuva (sinergia), Perfuração, Estilhaços, Lança |
| ☄ **Chuva de Ossos** | 40 MP | 5 s | 7 fragmentos caem em sequência numa área de raio 2,5 em torno da mira. Cada um causa `D × 0,7 × (1 + Dano da Chuva %)` em raio 1 | Chuva, Tiro (sinergia), Estilhaços, Tempestade |
| ✦ **Explosão Necrótica** | 60 MP | 8 s | Explosão de raio 5,5 na mira. Dano `D × 2,5 × (1 + Necrótica % + Explosões %)` por alvo | Explosão Necrótica, Ritual, Carne Instável, Detonação |
| ▥ **Muralha de Corpos** | 35 MP | 12 s | Muro de 5 u, perpendicular à mira, por `5 s × (1 + Duração %)`. Bloqueia a passagem de inimigos, intercepta projéteis hostis (resistência `160 × (1 + Resistência %)`) e causa `D × 0,4` de dano de contato a cada 0,5 s | Muralha de Corpos |
| 🛡 **Escudo de Carne** | 15 MP | 12 s | Ver abaixo | Escudo, Bastião |
| ☽ **Maldição da Fraqueza** | 25 MP | 8 s | Inimigos em raio 4 da mira causam menos dano por 6 s: −3% por ponto (máximo 75%) | Maldição |

Detalhes por habilidade:

- **Tiro de Osso**
  - Perfuração: cada ponto permite atravessar +1 alvo. Cada inimigo só é atingido
    uma vez por projétil.
  - **Estilhaços** (com ao menos 1 ponto): dispara 3 ossos em leque, separados por
    ~15°, compartilhando a lista de acertos: cada inimigo leva no máximo um
    acerto por disparo. *(Comportamento e sprite próprios em finalização no
    working tree; ver `blender/bone_shard.py`.)*
  - Exemplo sem equipamento, nível 1: 20 de dano; derruba um Guerreiro (40 HP) em
    dois tiros e um Bruto (100 HP) em cinco.
- **Chuva de Ossos**: os fragmentos começam a cair 0,1 s após o lançamento, um a
  cada 0,08 s, e atingem o chão 0,3 s depois. Tempestade Óssea amplia a área
  (`raio × √(1 + Área %)`). O dano máximo em um alvo é o dos 7 fragmentos.
- **Muralha de Corpos**: inimigos no ar (durante um salto) não sofrem dano de
  contato. Cada projétil hostil interceptado reduz a resistência do muro pelo
  dano do projétil; ao zerar, o muro cai antes do tempo.
- **Escudo de Carne**: sacrifica o **zumbi vivo com menor proporção de vida**
  (empate: o mais próximo).
  - Absorção = `70% da vida máxima do zumbi × (1 + Absorção %)` por 8 s.
  - O zumbi sacrificado fica indisponível por **20 s** e não ativa Pacto de Sangue.
  - Sem zumbi vivo: custa 15% da vida máxima de Zephyr e gera escudo de 25% da
    vida máxima. Não pode ser usado se o custo mataria Zephyr.
  - Um novo escudo substitui o anterior (não acumula).
- **Maldição**: reaplicar renova a duração; o dano original volta quando o efeito
  termina.

## Dash

| Atributo | Valor |
|---|---|
| Custo | 0 MP |
| Distância | `4,5 u × (1 + Distância do Dash %)` em 0,18 s |
| Recarga | `3 s × (1 + Recarga do Dash %)`; o bônus da árvore é limitado a −50% |
| Direção | Direção do movimento; parado, usa a mira |
| Proteção | Ignora todo o dano durante o deslocamento |

- Obstáculos e limites da fase interrompem o dash (não atravessa paredes).
- **Véu Noturno**: após o dash, Zephyr recebe 25% menos dano por
  ~`1,18 s + 0,1 s por ponto`.
- Funciona no hub e em combate, mas não na pausa, mapas, cutscenes ou morte.

## Redução de recarga dos itens

O afixo **Redução de recarga** (até 50%) multiplica a recarga depois de aplicada,
com pisos: magias e comandos de evocação não ficam abaixo de 50% da recarga base,
Escudo de Carne não fica abaixo de 6 s e o Dash não fica abaixo de 1,5 s.

## Evocações nos slots

Equipar uma evocação traz o grupo inteiro e ocupa **um único slot**. Ativar o slot
usa o **comando especial** do grupo, que precisa ser liberado na árvore. Os
ataques básicos do grupo funcionam mesmo sem o comando.

| Evocação | Grupo base | Comando | Libera com | Recarga |
|---|---:|---|---|---:|
| 🧟 Zumbis | 3 | **Explosão**: detona o zumbi vivo mais próximo da mira. Dano `dano do zumbi × (1 + Explosão % + Explosões %) × 3,5` em raio 3,5 | Explosão Cadavérica | 1,2 s |
| ⚔ Esqueletos Guerreiros | 3 | **Reunir**: ordem de reunião na posição de Zephyr | Esqueletos | 4 s |
| 🏹 Esqueletos Arqueiros | 2 | **Tiro forte**: cada arqueiro vivo dispara uma flecha (18 u/s) no inimigo mais próximo da mira, com `dano × (1 + Tiro Sepulcral %) × 1,9` | Tiro Sepulcral | 7 s |
| 👻 Espectros | 2 | **Passo Espectral**: teleporta o grupo em círculo ao redor da mira, até 6 u de Zephyr | Passo Espectral | 8 s × (1 − 5% por ponto) |
| 👹 Abominação | 1 | **Salto Devastador**: salta até 7 u em direção à mira (limitado à região da horda) e causa `dano × (1 + Salto %) × 2,2` em raio 3 ao aterrissar | Colosso de Carne | 8 s |

- A **explosão de zumbi** detona apenas um por ativação. O detonado volta pelo
  renascimento normal (12 s); se todos estiverem detonados, o comando espera.
  Reanimação manual, dispensa ou troca de evocação não antecipam esse retorno.
- Equipar evocações em combate custa mana por integrante (veja [Horda](horda.md#custo-para-equipar));
  no hub é gratuito.
- Trocar uma evocação por magia dispensa o grupo. Não é possível trocar enquanto
  houver integrantes detonados ou sacrificados em recuperação.
- Atributos, IA e reanimação dos grupos estão em [Horda](horda.md).
