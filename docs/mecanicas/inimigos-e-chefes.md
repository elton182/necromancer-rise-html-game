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

\* Já com o aumento de 15% aplicado a todos os monstros comuns.

- Ataque básico corpo a corpo a cada **1,1 s**; tiros comuns a cada **1,3 s**.
- Vida e dano mudam conforme o modo (veja [Escala de dificuldade](#escala-de-dificuldade)).
- No campo de waves, os inimigos calculam uma rota em volta de árvores e
  construções quando o caminho direto está bloqueado. A rota é recalculada quando
  o alvo se afasta ou quando a multidão empurra o inimigo para fora do caminho.

### Ataques especiais

Cada inimigo comum tem um especial com preparação visível. A primeira habilidade
fica pronta 0,75–1,25 s após o inimigo aparecer.

| Inimigo | Especial | Aviso | Recarga | Alcance | Efeito |
|---|---|---:|---:|---|---|
| Guerreiro | Golpe pesado | 0,5 s | 5 s | 2,2 | 1,6× o dano em raio 2,1 |
| Arqueiro | Tiro forte | 0,65 s | 5 s | 12 | Linha de tiro marcada; flecha de 1,9× com direção fixa, acerta o primeiro alvo |
| Mago Vivo | Erupção de fogo | 0,75 s | 6,5 s | 9 | Marca o chão; impacto de 1,2× e área de fogo por 3 s com pulsos de 0,3× por segundo, raio 2,2 |
| Bruto | Salto devastador | 0,65 s | 6 s | 2,5–7 | Marca o destino, salta e causa 2× ao cair, raio 2,6 |

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

| Wave | Tipos possíveis |
|---|---|
| 1 | Guerreiro |
| 2–3 | Guerreiro, Arqueiro |
| 4–5 | + Bruto |
| 6+ | + Mago Vivo |

- Os inimigos entram um a um, a cada 0,6–1,2 s.
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
