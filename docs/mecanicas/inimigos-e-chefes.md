# Inimigos e chefes

O Reino de Valdoria envia a guarda dos vivos contra Zephyr. Todos os inimigos
comuns preparam seus ataques especiais com avisos visuais e podem ser evitados.

Fontes: `necromancer-canvas.html` (`ENEMY_TYPES`, `MOB_ABILITIES`, `startWave`,
`MISSION_TEMPLATES`, `CAPTAIN`, `capAI`) e `COMBAT_TUNING` em
`scripts/skill-trees.js`, aplicado por `scripts/equipment.js`.

## Inimigos comuns

| Inimigo | Vida | Dano | Velocidade* | Alcance | XP | Ouro |
|---|---:|---:|---:|---|---:|---:|
| Guerreiro | 40 | 8 | 2,3 | Corpo a corpo | 12 | 4 |
| Arqueiro | 25 | 12 | 3,2 | 7,5 (tiro) | 15 | 5 |
| Bruto | 100 | 18 | 1,4 | Corpo a corpo | 30 | 11 |
| Mago Vivo | 30 | 20 | 2,5 | 6,5 (tiro) | 25 | 9 |
| Cão de Cripta | 32 | 7 | 3,68 | 1 (mordida) | 16 | 6 |

\* Já com o aumento de 15% aplicado a todos os monstros comuns.

- Ataque básico corpo a corpo a cada **1,1 s**; tiros comuns a cada **1,3 s**. O Cão de Cripta morde a cada **1,2 s**.
- Acertos comuns não empurram os inimigos: causam dano e reação visual de impacto
  sem afastar o alvo dos ataques corpo a corpo da horda.
- Vida e dano mudam conforme o modo (veja [Escala de dificuldade](#escala-de-dificuldade)).
- No campo de waves, os inimigos calculam uma rota em volta de árvores e
  construções quando o caminho direto está bloqueado. A rota é recalculada quando
  o alvo se afasta ou quando a multidão empurra o inimigo para fora do caminho.

### Ataques especiais

Cada inimigo comum tem um especial com preparação visível. A primeira habilidade
fica pronta 0,75–1,25 s após o inimigo aparecer; para o Cão de Cripta, após 2 s de atividade.

| Inimigo | Especial | Aviso | Recarga | Alcance | Efeito |
|---|---|---:|---:|---|---|
| Guerreiro | Golpe pesado | 0,5 s | 5 s | 2,2 | 1,6× o dano em raio 2,1 |
| Arqueiro | Tiro forte | 0,65 s | 5 s | 12 | Linha de tiro marcada; flecha de 1,9× com direção fixa, acerta o primeiro alvo |
| Mago Vivo | Erupção de fogo | 0,75 s | 6,5 s | 9 | Marca o chão; impacto de 1,2× e área de fogo por 3 s com pulsos de 0,3× por segundo, raio 2,2 |
| Bruto | Salto devastador | 0,65 s | 6 s | 2,5–7 | Marca o destino, salta e causa 2× ao cair, raio 2,6 |
| Cão de Cripta | Investida da Cripta | 0,75 s | 7 s após recuperação | 2,5–7 | Corredor de 1 u, direção fixa, até 6 u a 12 u/s; primeiro alvo recebe 1,6×; recuperação imóvel de 1 s. Para no cenário e na Muralha; Dash protege Zephyr. |

- Sair da região marcada evita o golpe; sair do fogo evita os pulsos seguintes.
- Inimigos mortos durante a preparação não completam a habilidade.
- Os especiais podem acertar Zephyr e os aliados. A horda tenta se esquivar deles
  (veja [Horda](horda.md#comportamento-ia)).
- Chefes usam suas próprias IAs; alvos de treino não atacam.

## Composição das waves

Usada nas missões, na arena da campanha e na Arena Infinita.

- **Quantidade**: `piso((4 + 2 × W + piso(W / 3)) × multiplicador da missão)`,
  onde `W` é o contador de waves. Na Arena Infinita, limitada a **60**.
- **Tipos**: cada inimigo sorteia um tipo entre os liberados pela wave:

  Na campanha, os quatro tipos originais mantêm chances iguais entre os liberados.
  Fora da campanha, a wave 4 começa com um Cão e depois Guerreiros (4 s até o próximo spawn);
  a wave 5 mistura dois Cães e Guerreiros. Da wave 6 em diante, `piso(total × 0,2)`
  vagas são Cães; as demais sorteiam os quatro tipos originais com chances iguais.

| Wave | Tipos possíveis |
|---|---|
| 1 | Guerreiro |
| 2–3 | Guerreiro, Arqueiro |
| 4–5 | + Bruto |
| 6+ | + Mago Vivo |

- Nas expedições, waves 1–3 mantêm a composição original. Na wave 4, o primeiro grupo tem um Cão à frente e cinco Guerreiros; o segundo tem dois Cães e seis Guerreiros. Da wave 5 em diante, cada grupo substitui `piso(tamanho × 0,2)` integrantes por Cães, preservando raridade e semente.
- Os inimigos entram um a um, a cada 0,6–1,2 s (exceto a introdução isolada do Cão).
- Entre waves há uma pausa de cerca de 5 s.

## Escala de dificuldade

| Contexto | Vida | Dano | XP |
|---|---|---|---|
| Arena Infinita, wave `n` | × 1,12^(n−1) | × 1,08^(n−1) | × 1,04^(n−1) |
| Missões do Modo Livre e da vila (arena) | × (1 + 0,12 × W) | base | base |
| Campanha, fase `f` | × (1 + 0,18 × (f−1) + 0,02 × (N−1)), depois × (1 + 0,12 × W) | × (1 + 0,1 × (f−1)) | base |
| Trilhas da vila | × multiplicador da missão × (1 + 0,05 × (N−1)) | × raiz quadrada do mesmo fator | base |

`N` = nível de Zephyr; `W` = contador de waves da área.

> Observação: no Modo Livre o contador global de waves (`wave`) não é zerado
> entre missões e fica salvo. Missões seguidas ficam progressivamente mais
> numerosas e resistentes, e o contador também herda a última wave jogada na Arena
> Infinita.

Referência da Arena Infinita:

| Wave | Vida | Dano | XP | Inimigos |
|---:|---:|---:|---:|---:|
| 1 | ×1,00 | ×1,00 | ×1,00 | 6 |
| 5 | ×1,57 | ×1,36 | ×1,17 | 15 |
| 10 | ×2,77 | ×2,00 | ×1,42 | 27 |
| 20 | ×8,61 | ×4,32 | ×2,11 | 50 |
| 30 | ×26,75 | ×9,32 | ×3,12 | 60 (limite) |

## Chefes de missão

Aparecem depois da última wave da missão. Usam IA corpo a corpo simples e têm
dano base 30% maior (já incluído na tabela). Vida e dano escalam com o nível de
Zephyr: `× (1 + 0,08 × (N − 1))`.

| Chefe | Missão | Vida base | Dano base | Velocidade | XP |
|---|---|---:|---:|---:|---:|
| Guardião dos Ossos | Extermínio | 350 | 19,5 | 1,6 | 100 |
| Lich Guerreiro | Horda Infernal | 600 | 32,5 | 2,0 | 180 |
| Hidra Pútrida | Eliminação | 950 | 49,4 | 1,3 | 280 |

Chefes sempre deixam uma peça de equipamento **mágica ou melhor** e o triplo de ouro.
Nas trilhas da vila, o chefe da missão aparece na última emboscada.

## Capitão da Guarda (chefe do Ato I)

Chefe da fase 4, **Posto do Capitão**. Surge cerca de 3,6 s após o início da fase.

| Atributo | Valor |
|---|---|
| Vida | 20 000 |
| Dano | 35,75 × 1,3 (escala da fase 4) ≈ 46 |
| Velocidade | 2,0 (+12% a cada escudo quebrado) |
| Alvo | Aliado a menos de ~4,5 u dele; senão, Zephyr |

**Fases**: a luta tem quatro fases, com limiares em **75%, 50% e 25%** da vida.

1. Ao cruzar um limiar, o Capitão fica **imune**, volta ao centro da arena e
   chama **6, 8 ou 10** guardas de reforço.
2. O escudo só cai quando pelo menos 3 s passaram e todos os reforços morreram.
3. Ao cair, o Capitão fica **atordoado por 2,2 s**.
4. Um único golpe nunca pula um limiar: o dano é limitado para parar no próximo.

**Ataques**

| Ataque | Disponível | Aviso | Efeito |
|---|---|---|---|
| Golpe | Sempre | — | Dano normal; 20% mais frequente a partir da fase 3 |
| Investida | Sempre (alvo a mais de 4,5 u) | Linha de 13 u por 0,95 s (0,75 s da fase 3) | Avança a 15 u/s por 0,6 s, 1,5× de dano em quem atravessar |
| Investida dupla | Fase 3+ | — | Encadeia uma segunda investida antes do atordoamento |
| Pancada | Fase 2+ (alvo a menos de 9 u) | Círculo de raio 3,3 por 1 s | 1,6× de dano na área |
| Pancada tripla | Fase 4 | Dois círculos extras de raio 3 | 1,6× em cada área |

Depois de uma investida, o Capitão fica exposto (atordoado) por 1,5 s (1 s na fase
4). As recargas encurtam a cada fase: investida 7 → 5,5 → 4,5 s; pancada 10 → 8 → 6 s.

> Observação de balanceamento: os 20 000 de vida são muito altos para o nível
> típico de quem chega à fase 4. Vale revisar esse valor com partidas reais.

## Alvos de treino

A primeira sala da Cripta tem três esqueletos de treino (28 de vida), que não
atacam, não se movem e não deixam ouro nem equipamento.

## Carcereiro das Almas — expedições

Chefe exclusivo do final das expedições, com modelo, rig e sete animações
produzidos no Blender. Os chefes das missões e da campanha continuam em seus
encontros. Atributos base: 480 HP, 20 de dano, velocidade 1,45; vida, dano e XP
recebem a progressão da wave. Fica inativo até Zephyr ou a horda se aproximarem.

- **Sentença do Carcereiro:** martelada em círculo de raio 2,8, com aviso de
  1,2 s e dano de 1,8 vezes o ataque. O ponto marcado fica fixo: sair evita o golpe.
- **Almas Condenadas:** leque de cinco projéteis após 1,35 s de aviso; cada
  projétil causa 0,8 vezes o ataque e respeita a colisão normal com a horda e muralhas.
- **Jaula rompida:** aos 50% de vida, o leque passa a sete projéteis, as recargas
  caem a 78% e o ciclo ganha **Selos da Prisão**: três círculos de raio 2,
  anunciados por 1,5 s, com dano de 1,35 vezes o ataque.

A horda reconhece os avisos e tenta esquivar. O Dash protege contra impactos
durante sua invulnerabilidade. Morrer cancela ataques e projéteis restantes do
chefe, garante o loot raro ou épico da expedição e libera o portal para o próximo
bioma. Modelo editável: `blender/boss_soulWarden.blend`.
