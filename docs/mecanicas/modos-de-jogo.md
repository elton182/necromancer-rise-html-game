# Modos de jogo e mundo

O jogo tem uma campanha curta (Ato I, a demo atual) e um endgame com hub, missões
e arena sem fim. Campanha e Modo Livre usam **o mesmo personagem e o mesmo save**:
nível, pontos, equipamentos, ouro e progresso circulam entre eles.

Fontes: `necromancer-canvas.html` (`CAMP_STAGES`, `STAGE_KINDS`, `STORY`,
`MISSION_TEMPLATES`, `VIL_NPC`, `startVillageRoute`, `startEndless`) e
`scripts/equipment.js` (seleção de waves).

## Tela inicial

| Opção | O que faz |
|---|---|
| Continuar | Carrega o save do navegador no modo em que foi salvo |
| Nova Campanha | Começa o Ato I do zero (pede confirmação e apaga o save existente) |
| Modo Livre | Com um save de campanha, abre o Modo Livre com o mesmo personagem. Sem save de campanha, começa um personagem novo (apaga o save existente) |
| Opções | Áudio, gráficos, horda, loot, controle e saves (veja [Interface](interface-e-saves.md)) |
| Créditos / Sair | — |

Existe um único save por navegador. O cartão da tela inicial mostra modo, fase,
nível, wave, ouro e quando o jogo foi salvo.

## Campanha — Ato I: O Despertar de Zephyr

**Premissa**: no Reino de Valdoria, o aprendiz Zephyr descobre uma fórmula de
ressurreição. O rei proíbe a magia, a casa de Zephyr é incendiada e sua família
morre. Na forca, ele jura vingança. Um ano depois, desperta como necromante no
fundo de uma cripta.

A campanha é jogada num **mapa** com quatro fases em sequência. Cada fase tem uma
história em quadrinhos antes e depois da primeira conclusão. Fases concluídas podem
ser rejogadas a qualquer momento, sem perder progresso.

| Fase | Tipo | Descrição | Recompensa (primeira vez) |
|---:|---|---|---|
| 1 ⚰️ A Cripta Esquecida | Exploração de salas | Quatro salas ligadas por corredores e portas seladas. A primeira tem três alvos de treino; as demais têm 2, 3 e 3 levas de inimigos. Cada porta abre ao limpar a sala. | 30 ouro, 140 XP |
| 2 🌲 Floresta de Eldrin | Arena com ondas | Sobreviver a seis waves da Guarda Real, sem chefe (multiplicador de inimigos 0,95). | 60 ouro, 220 XP |
| 3 🍂 Trilha dos Vigias | Rolagem lateral 2.5D | Seguir para a direita. Em cada uma das quatro clareiras a tela trava até todos os vigias caírem (2, 2, 2 e 3 levas). | 90 ouro, 320 XP |
| 4 🛡️ Posto do Capitão | Chefe | Luta em quatro fases contra o [Capitão da Guarda](inimigos-e-chefes.md#capitão-da-guarda-chefe-do-ato-i). | 150 ouro, 520 XP |

- Inimigos ficam mais fortes a cada fase (veja
  [Escala de dificuldade](inimigos-e-chefes.md#escala-de-dificuldade)).
- A campanha **não concede nem bloqueia habilidades**: tudo vem do Grimório.
  Os tutoriais de fase cobrem movimento, comandos e avisos de combate.
- Morrer numa fase devolve Zephyr ao mapa com 50% da vida.
- Ao concluir a fase 4 pela primeira vez: final do Ato I, aviso de **fim da demo**
  e liberação da **Vila de Eldrin**. O quarto espaço de grupo da horda também é
  liberado.
- Depois de liberar a vila, rejogar uma fase de rolagem lateral leva de volta à
  vila automaticamente após a sequência de conclusão. Na primeira passagem, a
  história mantém o retorno ao mapa.

Trocas de modo:

- No mapa, **Modo Livre / Vila de Eldrin** leva ao hub com o mesmo personagem.
- No Modo Livre, **ESC → Voltar à história** retoma a campanha (mesmo antes de
  liberar a vila). Durante uma tentativa em andamento, o jogo pede confirmação.
- **Sistema → Mapa da Campanha** também está disponível no hub.

## Modo Livre (hub)

O Modo Livre começa na Vila de Eldrin, mesmo sem concluir o Ato I. O hub mantém:

| Ponto | Interação (`G`) |
|---|---|
| 📜 Quadro de Missões | Escolher uma missão |
| 🛒 Mercador | Comprar [consumíveis](personagem-e-progressao.md#consumíveis) |
| ⚗ Altar do Grimório | Abrir as árvores de habilidades |
| 🧟 Cemitério | Gerenciar a horda |
| Portal | Abrir o quadro de missões |

Na pausa do hub também ficam as abas **Equipamentos** (mercador de relíquias e
venda de peças) e **Waves** (entrada na Arena Infinita pela wave escolhida). Essas
funções existem desde o início do Modo Livre, mas não
durante a campanha.

## Missões

Três modelos, oferecidos pelo quadro do hub e pelos moradores da vila:

| Missão | Dificuldade | Waves | Inimigos | Chefe |
|---|---|---:|---:|---|
| ⚔ Extermínio | ★ | 4 | ×1,0 | Guardião dos Ossos |
| 💀 Horda Infernal | ★★ | 6 | ×1,4 | Lich Guerreiro |
| 💥 Eliminação | ★★★ | 3 | ×1,8 | Hidra Pútrida |

- O bioma é sorteado: cemitério, floresta, vila, deserto ou neve.
- Depois da última wave, o chefe aparece. Derrotá-lo conclui a missão.
- **Recompensa**:
  - ouro `piso(base × 0,6 + aleatório de 0 a 30)`;
  - XP base de 200, 380 ou 550;
  - bases e chefes escalam `× (1 + 0,08 × (nível − 1))`.
- Missões do quadro mostram um capítulo de história ao final.
- Para sair da arena, vá até o portal e use `G` (encerra a tentativa).

## Vila de Eldrin

Disponível desde o início no Modo Livre e liberada ao concluir o Ato I na campanha,
mantém os serviços do hub. Acrescenta:

| Ponto | Função |
|---|---|
| 🧔 Bram, o ferreiro | Missões Extermínio, Horda Infernal ou Eliminação |
| 👵 Lysa, a anciã | Missões Horda Infernal ou Eliminação |
| 🧒 Tilda | Missões Extermínio ou Horda Infernal |
| ♾ Pedra do Infinito | Arena Infinita e seleção de waves |
| 🗺 Mapa da Campanha | Voltar ao mapa e rejogar fases |
| Mercador de relíquias | Aba Equipamentos (comprar e vender peças) |

**Pedidos dos moradores**

- Recompensas 25% maiores que as do quadro.
- **Outro pedido** sorteia uma nova oferta.
- Metade das ofertas é uma arena com waves e chefe. A outra metade é uma **trilha
  de Eldrin** em rolagem lateral:
  - três emboscadas pelo caminho, com o chefe da missão na última;
  - em cada emboscada a tela trava até todos caírem;
  - o portal fica bloqueado até a trilha ser concluída;
  - ao chegar ao fim, a recompensa é concedida uma vez e o retorno à vila é
    automático.

## Arena Infinita

O Modo Livre também oferece a [Conquista de Valdoria](conquista-valdoria.md),
pela aba **VALDORIA** da pausa ou pela Pedra do Infinito. O primeiro território
é um pântano de decomposição, com influência, maldições, tenentes e fortaleza.
Sua progressão é independente do recorde da Arena descrito abaixo.

O seletor **Modelo de waves** em **ESC → Waves** oferece **Expedição** (padrão)
e **Arena clássica** (o sistema anterior, preservado). A preferência fica salva
nas opções do navegador. Ambos compartilham recorde, desbloqueios e personagem.

### Expedição

- Cada wave gera um mapa de 156 × 80 unidades, com câmera acompanhando o jogador,
  uma trilha livre até o chefe e áreas laterais para explorar.
- O ciclo de biomas é cemitério, floresta, deserto, tundra e vila. O traçado,
  posições dos encontros e cenário mudam com a wave, inclusive ao repetir o ciclo.
- Há 12 grupos de 6–8 inimigos (84 monstros) e um boss, todos posicionados na entrada. Os inimigos
  só entram em combate ao detectar Zephyr, seus minions ou sofrer dano. Não há
  spawns periódicos, perseguidores surgindo com o tempo nem objetivos para liberar o boss.
- Mágicos: vida ×1,9, dano ×1,3, velocidade ×1,08 e XP ×2; chance de equipamento
  de 55%, sempre mágico ou melhor. Raros: vida ×3,4, dano ×1,65, velocidade ×1,12
  e XP ×4; equipamento garantido, raro (85%) ou épico (15%). Comuns: 16% de drop.
  Os multiplicadores são aplicados sobre a escala da wave. Cor e rótulo identificam cada elite.
- O boss usa um dos três chefes existentes e garante equipamento raro (75%) ou
  épico (25%). Sua morte conclui a wave, concede a recompensa e libera a seguinte;
  não é preciso eliminar os outros grupos.
- Depois do boss, continue explorando ou use **G no portal final** para avançar.
  Os minions seguem com a mesma vida, atributos e recuperação; a transição não
  cura nem ressuscita aliados. Equipamentos são recolhidos antes da troca; se a
  mochila encher, libere espaço antes de avançar. A wave 1000 encerra a sequência.
- O portal inicial e a pausa permitem retornar à vila. O minimapa mostra a
  trilha, os encontros, o boss e os portais. O HUD indica a distância até o boss.

### Arena clássica

Acessada pela **Pedra do Infinito** na vila ou pela aba **ESC → Waves** em
qualquer hub do Modo Livre.

- **Seleção de wave**: escolha qualquer wave já desbloqueada. Concluir a maior
  disponível libera a seguinte, até 1000. Repetir waves anteriores preserva o
  recorde, com dificuldade e nível de loot menores.
- **Escala**: vida ×1,12, dano ×1,08 e XP ×1,04 por wave, até 60 inimigos (veja
  [Inimigos](inimigos-e-chefes.md#escala-de-dificuldade)).
- **Recompensa por wave concluída**: `3 + 2 × wave` de ouro e `20 + 8 × wave` de
  XP, além do que os monstros deixam.
- **Loot**: o nível das peças é a wave atual. O mercador vende peças do nível da
  maior wave desbloqueada.
- **Saída**: voltar ao portal (`G`) ou **Pausa → Voltar à vila** encerra a corrida;
  tudo o que foi ganho fica. Morrer também encerra, mantendo o recorde.
