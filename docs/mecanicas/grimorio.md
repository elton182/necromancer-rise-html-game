# Grimório dos Mortos (árvores de habilidades)

O Grimório reúne toda a progressão de habilidades em **duas árvores**:
**Minions** (Carne, Ossos e Espíritos) e **Profana** (Ossos, Sangue e Sombras).
São **42 nós** em seis escolas, com **12 especializações finais**.

Abra pela pausa (**ESC → Habilidades**), pelo contador `✦ N pts` do HUD ou pelo
**Altar do Grimório** no hub.

Fontes: `build-simulator/model.js` (grafo, efeitos, validação; compartilhado com o
[simulador de builds](../../build-simulator/README.md)) e `scripts/skill-trees.js`
(integração com o combate, menu, devolução e migração).

## Regras

- **Orçamento**: 3 pontos por nível acima do 1 (`3 × (nível − 1)`), compartilhados
  entre as duas árvores. Nível máximo 60.
- **Ranks**: nós comuns aceitam até **5 pontos**; especializações finais, **1**.
- **Estrutura de cada escola**: uma raiz que se divide em dois ramos de três nós.

  ```text
                 Raiz (nível 1)
                /              \
        Ramo A1 (nível 6)   Ramo B1 (nível 6)
              |                  |
        Ramo A2 (nível 12)  Ramo B2 (nível 12)
              |                  |
        Final A (nível 22) ✕ Final B (nível 22)
  ```

- **Pré-requisito**: cada nó exige o nível indicado e **2 pontos** no nó anterior.
- **Exclusividade**: os dois ramos intermediários podem ser combinados, mas as duas
  especializações finais da mesma escola são mutuamente exclusivas.
- **Habilidades base**: Tiro de Osso e Dash funcionam sem pontos. Investir nelas
  aumenta o efeito e abre seus descendentes.
- **Aprender x equipar**: nós que liberam ações (magias, Dash, evocações) só
  tornam a habilidade disponível; ela precisa ser colocada em um dos seis
  [slots](habilidades.md#slots-e-atalhos).
- **Bônus aditivos**: todos os percentuais de mesmo tipo são somados e aplicados
  sobre os atributos base do tipo e do nível, sem efeito composto.
- **Sinergias diretas**: algumas ligações entre nós contam **somente pontos
  investidos** (não recebem pontos extras de equipamento):
  - Tiro de Osso → dano da Chuva de Ossos;
  - Chuva de Ossos → dano do Tiro de Osso;
  - Abominação → dano e vida dos Zumbis;
  - Explosão Cadavérica → dano do Salto Devastador.
- **Pontos de equipamento**: afixos `+N em <habilidade>` ou `+1 em toda a escola`
  aumentam os pontos efetivos apenas de nós comuns que já têm ao menos 1 ponto
  investido, podendo passar de 5. Não contam como pré-requisito e não afetam
  finais. Veja [Equipamentos](equipamentos-e-loot.md#pontos-de-habilidade-nos-itens).
- **Limites**: redução de dano da Maldição até 75%; reduções de recarga do Dash e
  do Passo Espectral até −50%.

## Interface

- Abas **☠ Minions** e **✧ Profana**; cada escola mostra seu diagrama com as linhas
  de pré-requisito. Diamantes indicam finais exclusivos.
- Selecionar um símbolo mostra pontos, requisito ou motivo do bloqueio, efeitos
  por ponto, sinergias acumuladas da build e a soma
  `investidos + equipamento = efetivos`.
- **+ Investir ponto** gasta um ponto; **− Devolver ponto** mostra antes o custo e
  quantos pontos dependentes também serão devolvidos.

## Devolução e redistribuição

- Custo: **20 de ouro por ponto devolvido**, inclusive dos dependentes.
- **− Devolver ponto** remove um ponto do nó. Se algum descendente deixar de
  cumprir o requisito, ele também é devolvido (e cobrado).
- **Redistribuir** devolve tudo de uma vez pelo custo total.
- Permitido apenas **na vila/hub, no mapa da campanha ou pausado entre waves sem
  inimigos vivos**.
- Bloqueado enquanto houver aliados **detonados ou sacrificados** em recuperação
  (feche a pausa para o tempo avançar).
- Sem ouro suficiente, nada é alterado.
- Evocações e ações que deixam de estar aprendidas saem dos slots e o grupo é
  dispensado.

## Árvores completas

Valores "por ponto" multiplicam pelo número de pontos efetivos. Percentuais de dano
e vida dos minions somam-se aos bônus de equipamento (veja
[Horda](horda.md#atributos)).

### Carne (Minions)

Ramos: **Colosso de Carne** e **Horda Explosiva**.

| Nó | Nível | Pontos | Requer | Efeito por ponto | Descrição |
|---|---:|---:|---|---|---|
| ☠ **Zumbis** (raiz) | 1 | 5 | — | +4% dano de zumbis e abominações; +3% vida de zumbis e abominações | Evoca 3 zumbis. Cada ponto dá +4% de dano e +3% de vida a Zumbis e Abominações. |
| ♥ **Carne Reanimada** | 6 | 5 | 2 em Zumbis | +10% vida de zumbis e abominações | Aumenta a vida de Zumbis e Abominações. |
| ✹ **Explosão Cadavérica** | 6 | 5 | 2 em Zumbis | +12% dano da explosão de zumbi; +4% dano do salto devastador | Desbloqueia a detonação e aumenta seu dano. Cada ponto investido também dá +4% ao Salto Devastador da Abominação. |
| ♜ **Abominação** | 12 | 5 | 2 em Carne Reanimada | +10% dano da abominação; +15% vida da abominação; +4% dano de zumbis; +6% vida de zumbis | Evocação própria: +10% de dano e +15% de vida por ponto. Cada ponto investido também dá +4% de dano e +6% de vida aos zumbis, fortalecendo seus ataques e explosões. |
| ✷ **Carne Instável** | 12 | 5 | 2 em Explosão Cadavérica | +8% dano das explosões de zumbi e necrótica | Sinergia entre a explosão dos Zumbis e Explosão Necrótica da árvore Profana. |
| ♜ **Colosso de Carne** (final) | 22 | 1 | 2 em Abominação | +60% vida da abominação; +40% dano do salto devastador | Especialização: Abominação ganha vida e o comando Salto Devastador. Exclui Horda Explosiva. |
| ✹ **Horda Explosiva** (final) | 22 | 1 | 2 em Carne Instável | +2 zumbis adicionais; +40% dano da explosão de zumbi | Especialização: +2 zumbis e explosões mais fortes. Exclui Colosso de Carne. |

### Ossos (Minions)

Ramos: **Guarda Sepulcral** e **Legião de Arqueiros**.

| Nó | Nível | Pontos | Requer | Efeito por ponto | Descrição |
|---|---:|---:|---|---|---|
| ⚔ **Esqueletos** (raiz) | 1 | 5 | — | +4% dano de esqueletos e arqueiros | Evoca 3 guerreiros. Pontos fortalecem guerreiros e arqueiros. |
| ⛨ **Armadura Óssea** | 6 | 5 | 2 em Esqueletos | +10% vida de esqueletos e arqueiros | Aumenta a vida dos guerreiros e arqueiros. |
| ➶ **Arqueiros** | 6 | 5 | 2 em Esqueletos | +10% dano dos arqueiros | Desbloqueia 2 arqueiros e aprimora seu dano. |
| ⚔ **Ossos Afiados** | 12 | 5 | 2 em Armadura Óssea | +8% dano de esqueletos e arqueiros | Aprimora ataques dos dois tipos de esqueletos. |
| ➶ **Tiro Sepulcral** | 12 | 5 | 2 em Arqueiros | +15% dano do tiro sepulcral | Desbloqueia o disparo comandado dos arqueiros. |
| ⛨ **Guarda Sepulcral** (final) | 22 | 1 | 2 em Ossos Afiados | +60% vida dos guerreiros; +1 guerreiros adicionais | Especialização: guerreiros ganham resistência e +1 integrante. Exclui Salva Sepulcral. |
| ➶ **Salva Sepulcral** (final) | 22 | 1 | 2 em Tiro Sepulcral | +2 arqueiros adicionais; +40% dano do tiro sepulcral | Especialização: +2 arqueiros e tiro comandado mais forte. Exclui Guarda Sepulcral. |

### Espíritos (Minions)

Ramos: **Drenagem Vital** e **Cortejo Espectral**.

| Nó | Nível | Pontos | Requer | Efeito por ponto | Descrição |
|---|---:|---:|---|---|---|
| ♧ **Espectros** (raiz) | 1 | 5 | — | +8% dano dos espectros | Evoca 2 espectros e aumenta seu dano mágico. |
| ♥ **Drenar Vida** | 6 | 5 | 2 em Espectros | +2% roubo de vida dos espectros | Ataques dos espectros recuperam uma porcentagem do dano como vida própria. |
| ◇ **Essência Etérea** | 6 | 5 | 2 em Espectros | +8% vida dos espectros; +5% dano dos espectros | Aumenta a vida e o dano dos espectros. |
| ♥ **Vínculo Vital** | 12 | 5 | 2 em Drenar Vida | +3% cura compartilhada com zephyr | A cura produzida pelos espectros também ajuda Zephyr. |
| ➤ **Passo Espectral** | 12 | 5 | 2 em Essência Etérea | -5% recarga do passo espectral | Desbloqueia o comando de reposicionamento e aumenta sua frequência. |
| ♥ **Ceifadores Vitais** (final) | 22 | 1 | 2 em Vínculo Vital | +15% roubo de vida dos espectros | Especialização: amplia a drenagem de vida. Exclui Cortejo dos Mortos. |
| ♧ **Cortejo dos Mortos** (final) | 22 | 1 | 2 em Passo Espectral | +2 espectros adicionais; -25% tempo de renascimento dos espectros | Especialização: +2 espectros e recuperação mais rápida. Exclui Ceifadores Vitais. |

### Ossos (Profana)

Ramos: **Lança Perfurante** e **Tempestade Óssea**.

| Nó | Nível | Pontos | Requer | Efeito por ponto | Descrição |
|---|---:|---:|---|---|---|
| ➶ **Tiro de Osso** (raiz) | 1 | 5 | — | +10% dano do tiro de osso; +4% dano da chuva de ossos | Desbloqueia o projétil principal. Sinergia: +4% ao dano da Chuva por ponto direto. |
| ➳ **Perfuração** | 6 | 5 | 2 em Tiro de Osso | +1 alvos perfurados adicionais | Cada ponto permite atravessar um alvo adicional. |
| ☄ **Chuva de Ossos** | 6 | 5 | 2 em Tiro de Osso | +10% dano da chuva de ossos; +4% dano do tiro de osso | Desbloqueia dano em área. Sinergia: +4% ao dano do Tiro por ponto direto. |
| ✧ **Estilhaços** | 12 | 5 | 2 em Perfuração | +6% dano do tiro de osso; +6% dano da chuva de ossos | Tiro de Osso dispara 3 estilhaços em leque, cobrindo uma área maior; cada inimigo é atingido uma vez por disparo. Melhora o dano de Tiro e Chuva de Ossos. |
| ▥ **Muralha de Corpos** | 12 | 5 | 2 em Chuva de Ossos | +10% duração da muralha; +10% resistência da muralha | Desbloqueia a muralha e amplia sua duração e resistência a projéteis. |
| ➳ **Lança Sepulcral** (final) | 22 | 1 | 2 em Estilhaços | +60% dano do tiro de osso | Especialização: projétil de alto dano. Exclui Tempestade Óssea. |
| ☄ **Tempestade Óssea** (final) | 22 | 1 | 2 em Muralha de Corpos | +30% área da chuva de ossos; +35% dano da chuva de ossos | Especialização: amplia área e dano da Chuva. Exclui Lança Sepulcral. |

### Sangue (Profana)

Ramos: **Bastião de Carne** e **Ritual de Detonação**.

| Nó | Nível | Pontos | Requer | Efeito por ponto | Descrição |
|---|---:|---:|---|---|---|
| ⛨ **Escudo de Carne** (raiz) | 1 | 5 | — | +8% absorção do escudo de carne | Sacrifica um zumbi para proteger Zephyr. Herda o HP do zumbi aprimorado por Carne Reanimada. |
| ♥ **Vitalidade Profana** | 6 | 5 | 2 em Escudo de Carne | +8% vida de zephyr | Aumenta a vida máxima de Zephyr. |
| ✹ **Explosão Necrótica** | 6 | 5 | 2 em Escudo de Carne | +12% dano da explosão necrótica | Desbloqueia explosão em área com mana, sem coleta de souls. |
| ♱ **Pacto de Sangue** | 12 | 5 | 2 em Vitalidade Profana | +1% vida máxima recuperada por morte de aliado | Morte comum de aliado recupera vida de Zephyr. Não ativa em sacrifícios ou detonações. |
| ✷ **Ritual Instável** | 12 | 5 | 2 em Explosão Necrótica | +8% dano das explosões de zumbi e necrótica | Melhora Explosão Necrótica e Explosão Cadavérica. |
| ⛨ **Bastião de Carne** (final) | 22 | 1 | 2 em Pacto de Sangue | +60% absorção do escudo de carne | Especialização: amplia a absorção do escudo. Exclui Detonação Profana. |
| ✹ **Detonação Profana** (final) | 22 | 1 | 2 em Ritual Instável | +40% dano das explosões de zumbi e necrótica | Especialização: amplia as duas explosões. Exclui Bastião de Carne. |

### Sombras (Profana)

Ramos: **Caminhante do Véu** e **Senhor da Horda**.

| Nó | Nível | Pontos | Requer | Efeito por ponto | Descrição |
|---|---:|---:|---|---|---|
| ➤ **Dash** (raiz) | 1 | 5 | — | -3% recarga do dash | Desbloqueia a evasão e reduz sua recarga. |
| ➤ **Passo Prolongado** | 6 | 5 | 2 em Dash | +8% distância do dash | Aumenta a distância do Dash. |
| ◈ **Meditação Sombria** | 6 | 5 | 2 em Dash | +8% mana máxima; +8% regeneração de mana | Aumenta reserva e regeneração de mana. |
| ◇ **Véu Noturno** | 12 | 5 | 2 em Passo Prolongado | +10% duração da proteção após dash | A evasão deixa uma proteção breve. |
| ☽ **Maldição da Fraqueza** | 12 | 5 | 2 em Meditação Sombria | +3% redução de dano da maldição | Desbloqueia maldição que reduz o dano dos inimigos afetados. |
| ➤ **Caminhante do Véu** (final) | 22 | 1 | 2 em Véu Noturno | -25% recarga do dash; +25% distância do dash | Especialização: Dash mais frequente e longo. Exclui Aura das Sombras. |
| ☽ **Aura das Sombras** (final) | 22 | 1 | 2 em Maldição da Fraqueza | +30% dano da horda próxima | Especialização: aumenta o dano de toda a horda próxima. Exclui Caminhante do Véu. |

## O que cada nó desbloqueia

| Nó | Desbloqueia |
|---|---|
| Zumbis | Evocação Zumbis (3) |
| Explosão Cadavérica | Comando de explosão dos zumbis |
| Abominação | Evocação Abominação (1) |
| Colosso de Carne | Comando Salto Devastador da Abominação |
| Esqueletos | Evocação Esqueletos Guerreiros (3) e o comando Reunir |
| Arqueiros | Evocação Esqueletos Arqueiros (2) |
| Tiro Sepulcral | Comando de tiro forte dos arqueiros |
| Espectros | Evocação Espectros (2) |
| Passo Espectral | Comando de teletransporte dos espectros |
| Tiro de Osso / Dash | Já disponíveis desde o início |
| Chuva de Ossos | Magia Chuva de Ossos |
| Muralha de Corpos | Magia Muralha de Corpos |
| Escudo de Carne | Magia Escudo de Carne |
| Explosão Necrótica | Magia Explosão Necrótica |
| Maldição da Fraqueza | Magia Maldição da Fraqueza |

## Builds de exemplo

O simulador traz cinco builds de nível 30 prontas para comparação:

| Build | Foco |
|---|---|
| Colosso Imortal | Zumbis, Abominação com Colosso, Escudo e Bastião |
| Horda Explosiva | Detonação de zumbis, Explosão Necrótica e Detonação Profana |
| Legião de Arqueiros | Esqueletos, Salva Sepulcral, Maldição e Aura das Sombras |
| Tempestade de Ossos | Tiro, Chuva com Tempestade, Muralha e Caminhante do Véu |
| Ceifador Híbrido | Zumbis, Espectros vampíricos, Tiro, Chuva e Aura |

## Saves

O save registra `skillTreeVersion`, `skillRanks` e `skillGrants`. Saves de antes das
árvores recebem ranks vazios e exatamente `3 × (nível − 1)` pontos para
redistribuir; uma cópia do save original fica em `necromancer_v2_before_skill_trees`.
Detalhes em [Interface, opções e saves](interface-e-saves.md#migração-de-saves) e
em [arvores-habilidades-implementacao.md](../arvores-habilidades-implementacao.md).
