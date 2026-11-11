# Árvores de habilidades

> Gerado por `tools/skill-tree-editor.html` a partir de `docs/habilidades/arvores.json` (fonte da verdade). Não edite este arquivo à mão.

Atualizado em 2026-11-10.

## Necromante

_A morte não é o fim, mas apenas outro começo._

Recurso: **mana** · 61 nós · 231 pontos para completar.

### Minions

#### Carne — Especializações: Colosso de Carne ou Horda Explosiva

- **Zumbis** (`zombie`) — evocação · implementado · nível 1 · até 5 pontos
  Evoca 3 zumbis. Cada ponto dá +4% de dano e +3% de vida a Zumbis e Abominações.
  - Uso: tecla: Slot da barra · recarga: 1,2 s
  - Por ponto: +4 Dano de Zumbis e Abominações; +3 Vida de Zumbis e Abominações
  - Notas: Custo de horda: 20. Comando: Explosão (detona um zumbi).

- **Explosão Cadavérica** (`burst`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Desbloqueia a detonação e aumenta seu dano. Cada ponto investido também dá +4% ao Salto Devastador da Abominação.
  - Requer: Zumbis
  - Por ponto: +12 Dano da explosão de Zumbi; +4 Dano do Salto Devastador; +3 Tamanho da área de explosão
  - Notas: Tamanho da área de explosão: +3% por ponto no raio da explosão dos zumbis e da Explosão Necrótica (só na v2).

- **Carne Reanimada** (`vigor`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta a vida de Zumbis e Abominações.
  - Requer: Zumbis
  - Por ponto: +10 Vida de Zumbis e Abominações

- **Cão Zumbi** (`caoZumbi`) — evocação · implementado · nível 12 · até 5 pontos
  Grupo permanente de 2 cães zumbis que ocupa uma vaga da horda. Mordem a cada 0,9 s e usam atributos próprios da horda, com escala por nível. Morrem, podem ser reanimados por 30 MP e renascem automaticamente. O slot comanda a Caçada: salto na mira com dano de 140% na aterrissagem. Exclui a Abominação.
  - Uso: tecla: Slot da barra · alvo: Caçada: inimigo até 4 u da mira, dentro da região da horda · elemento: sombra · custo: 0 mana · recarga: 6 s · alcance: 1,4 u · dano: 100% do dano do cão por mordida; Mordida Feroz automática: 160%; Caçada: 140%
  - Requer: Carne Reanimada
  - Exclui: Abominação
  - Por ponto: +10% de dano e +5% de vida dos cães
  - Leitura no combate: Cães visíveis no campo; cada mordida mostra o impacto no alvo.
  - Decisão: Pressão rápida em alvos isolados, em troca da Abominação.
  - Notas: Preparo grátis; equipar no combate custa 20 MP por novo cão. Sem duração limite. Regeneração, reserva e save seguem a horda. Arte provisória: cryptHound com tinta. Maestria dedicada ainda não definida.

- **Abominação** (`abom`) — evocação · implementado · nível 12 · até 5 pontos
  Evocação própria: +10% de dano e +15% de vida por ponto. Cada ponto investido também dá +4% de dano e +6% de vida aos zumbis, fortalecendo seus ataques e explosões.
  - Uso: tecla: Slot da barra · recarga: 8 s
  - Requer: Carne Reanimada
  - Exclui: Cão Zumbi
  - Por ponto: +10 Dano da Abominação; +15 Vida da Abominação; +4 Dano de Zumbis; +6 Vida de Zumbis
  - Notas: Custo de horda: 25. Comando: Salto com impacto.

- **Carne Instável** (`unstable`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Sinergia entre a explosão dos Zumbis e Explosão Necrótica da árvore Profana.
  - Requer: Explosão Cadavérica
  - Por ponto: +8 Dano das explosões de Zumbi e Necrótica; +3 Tamanho da área de explosão
  - Notas: Tamanho da área de explosão: +3% por ponto no raio da explosão dos zumbis e da Explosão Necrótica (só na v2).

- **Cerberus** (`cerberus`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização do grupo permanente: um só cão, maior, com o triplo da vida e 160% do dano base de um cão. A Mordida Feroz automática atinge um cone de 100° até 1,9 u. Mantém morte, reanimação e save da horda.
  - Uso: tecla: Automática (Cão Zumbi) · elemento: sombra · alcance: 1,9 u · dano: 160% do dano base do cão; Mordida Feroz: 160% desse dano em cone
  - Requer: Cão Zumbi
  - Leitura no combate: Um só cão, maior; o arco da mordida aparece à frente dele.
  - Decisão: Troca a pressão de dois alvos por dano em área à frente.
  - Notas: Arte provisória: um cryptHound maior, com tinta avermelhada; modelo de três cabeças pendente.

- **Colosso de Carne** (`colossus`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: Abominação ganha vida e o comando Salto Devastador. Exclui Horda Explosiva.
  - Requer: Abominação
  - Exclui: Horda Explosiva
  - Por ponto: +60 Vida da Abominação; +40 Dano do Salto Devastador

- **Horda Explosiva** (`plague`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: +2 zumbis e explosões mais fortes. Exclui Colosso de Carne.
  - Requer: Carne Instável
  - Exclui: Colosso de Carne
  - Por ponto: +2 Zumbis adicionais; +40 Dano da explosão de Zumbi

#### Ossos — Especializações: Guarda Sepulcral ou Legião de Arqueiros

- **Esqueletos** (`skeleton`) — evocação · implementado · nível 1 · até 5 pontos
  Evoca 3 guerreiros. Pontos fortalecem guerreiros e arqueiros.
  - Uso: tecla: Slot da barra · recarga: 4 s
  - Por ponto: +4 Dano de Esqueletos e Arqueiros
  - Notas: Custo de horda: 30. Comando: Reunir.

- **Armadura Óssea** (`armor`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta a vida dos guerreiros e arqueiros.
  - Requer: Esqueletos
  - Por ponto: +10 Vida de Esqueletos e Arqueiros

- **Arqueiros** (`archer`) — evocação · implementado · nível 6 · até 5 pontos
  Desbloqueia 2 arqueiros e aprimora seu dano.
  - Uso: tecla: Slot da barra · recarga: 7 s
  - Requer: Esqueletos
  - Por ponto: +10 Dano dos Arqueiros
  - Notas: Custo de horda: 30. Comando: Tiro forte.

- **Magos** (`mages`) — evocação · implementado · nível 6 · até 5 pontos
  Grupo permanente de 2 esqueletos magos que ocupa uma vaga da horda. Lançam orbes sombrios a cada 1,6 s até 7,5 u, usando atributos próprios da horda, com escala por nível. Morrem, podem ser reanimados por 30 MP e renascem automaticamente. O slot comanda a Descarga Sombria.
  - Uso: tecla: Slot da barra · alvo: Descarga: inimigo até 4 u da mira, dentro da região da horda · elemento: sombra · custo: 0 mana · recarga: 7 s · alcance: 7,5 u · dano: 100% do dano do mago por orbe; Orbe Sombrio automático: 180%; Descarga Sombria: 190%, com estilhaço de 60% até 1,5 u
  - Requer: Esqueletos
  - Por ponto: +8% de dano e +5% de vida dos magos
  - Leitura no combate: Orbes roxos visíveis em voo.
  - Decisão: Dano à distância que não depende da linha de frente.
  - Notas: Preparo grátis; equipar no combate custa 30 MP por novo mago. Sem duração limite. Regeneração, reserva e save seguem a horda. Arte provisória: skeleton com tinta roxa. Maestria dedicada ainda não definida.

- **Ossos Afiados** (`blades`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Aprimora ataques dos dois tipos de esqueletos.
  - Requer: Armadura Óssea
  - Por ponto: +8 Dano de Esqueletos e Arqueiros

- **Tiro Sepulcral** (`shot`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Desbloqueia o disparo comandado dos arqueiros.
  - Requer: Arqueiros
  - Por ponto: +15 Dano do Tiro Sepulcral

- **Raio Necrótico** (`raioNecrotico`) — aperfeiçoamento · implementado · nível 12 · até 3 pontos
  Os magos trocam o orbe por um raio instantâneo que atravessa todos os inimigos numa linha de 8 u. Multiplica o dano do ataque por 1,375, mais 10% por ponto.
  - Uso: tecla: Automática (Magos) · elemento: sombra · alcance: 8 u · dano: 137,5% do dano do ataque do mago, mais 10% por ponto
  - Requer: Magos
  - Por ponto: +10% de dano do raio por ponto
  - Leitura no combate: Raio roxo do mago até o fim da linha.
  - Decisão: Posicione a horda para alinhar os inimigos.

- **Guarda Sepulcral** (`guard`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: guerreiros ganham resistência e +1 integrante. Exclui Salva Sepulcral.
  - Requer: Ossos Afiados
  - Exclui: Salva Sepulcral
  - Por ponto: +60 Vida dos Guerreiros; +1 Guerreiros adicionais

- **Salva Sepulcral** (`salvo`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: +2 arqueiros e tiro comandado mais forte. Exclui Guarda Sepulcral.
  - Requer: Tiro Sepulcral
  - Exclui: Guarda Sepulcral
  - Por ponto: +2 Arqueiros adicionais; +40 Dano do Tiro Sepulcral

- **Ruptura Necrótica** (`rupturaNecrotica`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: inimigos mortos pelos magos explodem em raio 2, com 60% do dano mágico em quem estiver perto.
  - Uso: tecla: Automática (Magos) · elemento: sombra · raio: 2 u · dano: 60% em área
  - Requer: Raio Necrótico
  - Leitura no combate: Anel roxo de ruptura no corpo que caiu.
  - Decisão: Encadeia mortes em grupos fracos.
  - Notas: Renomeada de "Explosão Necrótica" (id explosaoNecrotica) para não repetir o nome da magia nova da Profana.

#### Espíritos — Especializações: Drenagem Vital ou Cortejo Espectral

- **Espectros** (`specter`) — evocação · implementado · nível 1 · até 5 pontos
  Evoca 2 espectros e aumenta seu dano mágico.
  - Uso: tecla: Slot da barra · recarga: 8 s
  - Por ponto: +8 Dano dos Espectros
  - Notas: Custo de horda: 45. Comando: Passo Espectral.

- **Drenar Vida** (`drain`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Ataques dos espectros recuperam uma porcentagem do dano como vida própria.
  - Requer: Espectros
  - Por ponto: +2 Roubo de vida dos Espectros

- **Essência Etérea** (`ethereal`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta a vida e o dano dos espectros.
  - Requer: Espectros
  - Por ponto: +8 Vida dos Espectros; +5 Dano dos Espectros

- **Vínculo Vital** (`bond`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  A cura produzida pelos espectros também ajuda Zephyr.
  - Requer: Drenar Vida
  - Por ponto: +3 Cura compartilhada com Zephyr

- **Passo Espectral** (`step`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Desbloqueia o comando de reposicionamento e aumenta sua frequência.
  - Requer: Essência Etérea
  - Por ponto: -5 Recarga do Passo Espectral

- **Ceifadores Vitais** (`vampire`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: amplia a drenagem de vida. Exclui Cortejo dos Mortos.
  - Requer: Vínculo Vital
  - Exclui: Cortejo dos Mortos
  - Por ponto: +15 Roubo de vida dos Espectros

- **Cortejo dos Mortos** (`procession`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: +2 espectros e recuperação mais rápida. Exclui Ceifadores Vitais.
  - Requer: Passo Espectral
  - Exclui: Ceifadores Vitais
  - Por ponto: +2 Espectros adicionais; -25 Tempo de renascimento dos Espectros

### Profana

#### Ossos — Especializações: Lança Perfurante ou Tempestade Óssea

- **Tiro de Osso** (`bolt`) — ativa · implementado · nível 1 · até 5 pontos
  Desbloqueia o projétil principal. Sinergia: +4% ao dano da Chuva por ponto direto.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: sombra · custo: 20 mana · recarga: 0,5 s · alcance: 9 u · dano: 50%
  - Por ponto: +10 Dano do Tiro de Osso; +4 Dano da Chuva de Ossos

- **Perfuração** (`pierce`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Cada ponto permite atravessar um alvo adicional.
  - Requer: Tiro de Osso
  - Por ponto: +1 Alvos perfurados adicionais

- **Chuva de Ossos** (`rain`) — ativa · implementado · nível 6 · até 5 pontos
  Desbloqueia dano em área. Sinergia: +4% ao dano do Tiro por ponto direto.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: sombra · custo: 40 mana · recarga: 5 s · alcance: 9 u · raio: 2,5 u · dano: 70% × 7 ossos
  - Requer: Tiro de Osso
  - Por ponto: +10 Dano da Chuva de Ossos; +4 Dano do Tiro de Osso

- **Estilhaços** (`shards`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Tiro de Osso dispara 3 estilhaços em leque, cobrindo uma área maior; cada inimigo é atingido uma vez por disparo. Melhora o dano de Tiro e Chuva de Ossos.
  - Requer: Perfuração
  - Por ponto: +6 Dano do Tiro de Osso; +6 Dano da Chuva de Ossos

- **Muralha de Corpos** (`wall`) — ativa · implementado · nível 12 · até 5 pontos
  Desbloqueia a muralha e amplia sua duração e resistência a projéteis.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · custo: 35 mana · recarga: 12 s · duração: 5 s · alcance: 9 u · dano: 40% a cada 0,5 s
  - Requer: Chuva de Ossos
  - Por ponto: +10 Duração da Muralha; +10 Resistência da Muralha

- **Lança Sepulcral** (`lance`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: projétil de alto dano. Exclui Tempestade Óssea.
  - Requer: Estilhaços
  - Exclui: Tempestade Óssea
  - Por ponto: +60 Dano do Tiro de Osso

- **Tempestade Óssea** (`storm`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: amplia área e dano da Chuva. Exclui Lança Sepulcral.
  - Requer: Muralha de Corpos
  - Exclui: Lança Sepulcral
  - Por ponto: +30 Área da Chuva de Ossos; +35 Dano da Chuva de Ossos

#### Sangue — Especializações: Bastião de Carne ou Ritual de Detonação

- **Escudo de Carne** (`shield`) — ativa · implementado · nível 1 · até 5 pontos
  Sacrifica um zumbi para proteger Zephyr. Herda o HP do zumbi aprimorado por Carne Reanimada.
  - Uso: tecla: Slot da barra · alvo: próprio (sacrifica um zumbi) · custo: 15 mana · recarga: 12 s
  - Por ponto: +8 Absorção do Escudo de Carne
  - Notas: Também custa 15% da vida.

- **Vitalidade Profana** (`vitality`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta a vida máxima de Zephyr.
  - Requer: Escudo de Carne
  - Por ponto: +8 Vida de Zephyr

- **Explosão Necrótica** (`nova`) — ativa · implementado · nível 6 · até 5 pontos
  Desbloqueia explosão em área com mana, sem coleta de souls.
  - Uso: tecla: Slot da barra · alvo: área ao redor · elemento: sombra · custo: 60 mana · recarga: 8 s · raio: 2,2 u · dano: 250%
  - Requer: Escudo de Carne
  - Por ponto: +12 Dano da Explosão Necrótica

- **Pacto de Sangue** (`pact`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Morte comum de aliado recupera vida de Zephyr. Não ativa em sacrifícios ou detonações.
  - Requer: Vitalidade Profana
  - Por ponto: +1 Vida máxima recuperada por morte de aliado

- **Ritual Instável** (`ritual`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Melhora Explosão Necrótica e Explosão Cadavérica.
  - Requer: Explosão Necrótica
  - Por ponto: +8 Dano das explosões de Zumbi e Necrótica

- **Bastião de Carne** (`bastion`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: amplia a absorção do escudo. Exclui Detonação Profana.
  - Requer: Pacto de Sangue
  - Exclui: Detonação Profana
  - Por ponto: +60 Absorção do Escudo de Carne

- **Detonação Profana** (`detonation`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: amplia as duas explosões. Exclui Bastião de Carne.
  - Requer: Ritual Instável
  - Exclui: Bastião de Carne
  - Por ponto: +40 Dano das explosões de Zumbi e Necrótica

#### Sombras — Especializações: Caminhante do Véu ou Senhor da Horda

- **Dash** (`dash`) — ativa · implementado · nível 1 · até 5 pontos
  Desbloqueia a evasão e reduz sua recarga.
  - Uso: tecla: Slot da barra · alvo: direção do movimento · recarga: 3 s · preparação: 0,18 s · alcance: 4,5 u
  - Por ponto: -3 Recarga do Dash

- **Passo Prolongado** (`stride`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta a distância do Dash.
  - Requer: Dash
  - Por ponto: +8 Distância do Dash

- **Meditação Sombria** (`meditate`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta reserva e regeneração de mana.
  - Requer: Dash
  - Por ponto: +8 Mana máxima; +8 Regeneração de mana

- **Véu Noturno** (`veil`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  A evasão deixa uma proteção breve.
  - Requer: Passo Prolongado
  - Por ponto: +10 Duração da proteção após Dash

- **Maldição da Fraqueza** (`curse`) — ativa · implementado · nível 12 · até 5 pontos
  Desbloqueia maldição que reduz o dano dos inimigos afetados.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · custo: 25 mana · recarga: 8 s · duração: 6 s · raio: 4 u
  - Requer: Meditação Sombria
  - Por ponto: +3 Redução de dano da Maldição

- **Caminhante do Véu** (`walker`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: Dash mais frequente e longo. Exclui Aura das Sombras.
  - Requer: Véu Noturno
  - Exclui: Aura das Sombras
  - Por ponto: -25 Recarga do Dash; +25 Distância do Dash

- **Aura das Sombras** (`aura`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: aumenta o dano de toda a horda próxima. Exclui Caminhante do Véu.
  - Requer: Maldição da Fraqueza
  - Exclui: Caminhante do Véu
  - Por ponto: +30 Dano da horda próxima

### Morte

#### Foice — Especializações: Ciclone da Morte ou Executor

- **Forma da Morte** (`lichform`) — ativa · implementado · nível 1 · até 5 pontos
  Libera a transformação em Lich, com barra de almas no lugar da mana, +25% de dano e +25% de defesa enquanto ativa. Cada ponto aumenta as almas máximas.
  - Uso: tecla: Slot da barra · alvo: próprio · custo: 50 mana · recarga: 20 s · preparação: 0,9 s
  - Por ponto: +5 Almas máximas
  - Notas: Troca mana por almas; +25% de dano e defesa na forma.

- **Foice Longa** (`reach`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta o alcance dos golpes da foice e o dano da Ceifada.
  - Requer: Forma da Morte
  - Por ponto: +6 Alcance da foice e dano da Ceifada

- **Foice Giratória** (`spinning`) — ativa · implementado · nível 6 · até 5 pontos
  Libera o arremesso; cada passagem prolonga Ceifado em 1 s, até 4 s. Aumenta seu dano.
  - Uso: tecla: Slot da forma · alvo: direção da mira · custo: 15 mana · recarga: 6 s · alcance: 11 u · dano: 120%
  - Requer: Forma da Morte
  - Por ponto: +5 Dano da Foice Giratória

- **Colheita Tripla** (`triple`) — ativa · implementado · nível 12 · até 5 pontos
  Substitui o golpe do clique por três golpes gratuitos. O finalizador aplica Ceifado; aumenta seu dano.
  - Uso: tecla: Clique (forma) · alvo: cone à frente · custo: 0 mana · recarga: 0 s · alcance: 3,4 u · dano: 100% / 110% / 200%
  - Requer: Foice Longa
  - Por ponto: +5 Dano da Colheita Tripla

- **Gancho do Túmulo** (`arc`) — ativa · implementado · nível 12 · até 5 pontos
  Puxa inimigos na linha da mira; puxa mais os Ceifados. Chefes recebem lentidão. Aumenta seu dano.
  - Uso: tecla: Slot da forma · alvo: linha da mira · custo: 25 mana · recarga: 8 s · alcance: 8 u · dano: 110%
  - Requer: Foice Giratória
  - Por ponto: +5 Dano do Gancho do Túmulo

- **Ciclone da Morte** (`cyclone`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: libera a órbita de 360°, que consome Ceifado para um impacto com +75% de dano por alvo. Exclui Executor.
  - Uso: tecla: Slot da forma · alvo: área ao redor · custo: 40 mana · recarga: 14 s · raio: 4,5 u · dano: 80% por passagem
  - Requer: Colheita Tripla
  - Exclui: Executor
  - Por ponto: +10 Dano do Ciclone da Morte

- **Executor** (`executor`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: o golpe final da Colheita causa dano extra em alvos com pouca vida e marca por mais tempo. Exclui Ciclone da Morte.
  - Requer: Gancho do Túmulo
  - Exclui: Ciclone da Morte
  - Por ponto: +50 Dano do golpe final em alvos fracos

#### Colheita — Especializações: Ceifador de Almas ou Avatar da Morte

- **Colheita de Almas** (`harvest`) — ativa · implementado · nível 1 · até 5 pontos
  Cada espírito absorvido rende mais almas.
  - Por ponto: +8 Almas por espírito

- **Fome Eterna** (`hunger`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Reduz a drenagem passiva de almas.
  - Requer: Colheita de Almas
  - Por ponto: -6 Drenagem de almas

- **Chamado Espectral** (`callspirit`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta o raio em que os espíritos são absorvidos.
  - Requer: Colheita de Almas
  - Por ponto: +0,3 Raio de absorção

- **Recipiente** (`vessel`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Aumenta as almas máximas.
  - Requer: Fome Eterna
  - Por ponto: +4 Almas máximas

- **Lamento** (`wail`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Absorver um espírito recupera uma parte da vida máxima.
  - Requer: Chamado Espectral
  - Por ponto: +0,5 Vida máxima por espírito (%)

- **Ceifador de Almas** (`reaper`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: elites e chefes rendem o dobro de almas. Exclui Avatar da Morte.
  - Requer: Recipiente
  - Exclui: Avatar da Morte
  - Por ponto: +100 Almas de elites e chefes

- **Avatar da Morte** (`avatar`) — especialização · implementado · nível 22 · até 1 ponto
  Especialização: a forma reduz o dano recebido e a transformação é mais rápida. Exclui Ceifador de Almas.
  - Requer: Lamento
  - Exclui: Ceifador de Almas
  - Por ponto: -25 Dano recebido na forma; -33 Duração da transformação

## Guerreiro

_O aço não hesita; quem o empunha também não._

Recurso: **vigor** · 25 nós · 111 pontos para completar.

### Espada — Precisão e impacto

- **Slash · Três cortes** (`slash`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano dos cortes por ponto. O ataque básico já está disponível. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Clique esquerdo · alvo: cone à frente (144°) · elemento: físico · custo: 0 vigor · recarga: 0,6 s · alcance: 2,6 u · dano: 55% / 65% / 90% (três cortes)

- **Estocada** (`thrust`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a estocada (botão direito / 2): avança até 7 u na direção da mira e perfura até 3,4 u à frente, com 220% do dano. +10% de dano por ponto. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Botão direito / 2 · alvo: linha à frente · elemento: físico · custo: 20 vigor · recarga: 5 s · alcance: 10,4 u · raio: 0,85 u · dano: 220%
  - Notas: Alcance total 10,4 u = avanço de até 7 u + ponta de 3,4 u (antes: avanço de até 5 u).

- **Corte Vendaval** (`tornado`) — ativa · implementado · nível 6 · até 5 pontos
  Segure a tecla do slot: golpes circulares de 65% do dano a cada 0,3 s, raio 2,7 e movimento a 55%. Custa 5 de vigor ao iniciar e 12 por segundo. +10% de dano por ponto depois do primeiro. Evolui cumulativamente com Ciclone e Furacão. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: R / 5 · alvo: área ao redor · elemento: físico · custo: 5 vigor · recarga: 3 s · raio: 2,7 u · dano: 65% por giro (a cada 0,3 s)
  - Por ponto: +10% de dano depois do primeiro ponto
  - Notas: Gasto contínuo: 12 vigor/s; recarga de 3 s ao encerrar. Soltar, esquivar ou esgotar o vigor encerra.

- **Ímpeto** (`momentum`) — sinergia · implementado · nível 4 · até 3 pontos
  Completar os três cortes fortalece em 10% por ponto a próxima estocada, por 4 s. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Slash · Três cortes

- **Impacto** (`impacto`) — aperfeiçoamento · implementado · nível 8 · até 5 pontos
  Cada etapa da Estocada que acertar causa uma onda de choque de raio 2,5 no primeiro inimigo atingido: 90% do dano físico. +15 pontos percentuais desse dano por ponto depois do primeiro. Uma onda por etapa. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Estocada) · raio: 2,5 u · dano: 90% a 150%
  - Requer: Estocada
  - Por ponto: +15 pontos percentuais de dano depois do primeiro ponto

- **Ciclone** (`tornadoCyclone`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Evolui o Corte Vendaval: raio 3,7 e movimento a 40%. Cada ponto depois do primeiro acrescenta 0,25 u de raio e +8% de dano ao giro. Mantém os benefícios quando evolui para Furacão. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Corte Vendaval
  - Por ponto: +0,25 u de raio e +8% de dano depois do primeiro ponto
  - Notas: Evolução cumulativa; não exige selecionar variante.

- **Onda de Aço** (`steelWave`) — aperfeiçoamento · implementado · nível 10 · até 3 pontos
  O terceiro corte lança uma onda de 7 u com 180% do dano, sem custo e com recarga de 8 s. Atravessa inimigos e para em paredes. +10% de dano por ponto depois do primeiro. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática: terceiro corte do Slash · alvo: linha à frente · elemento: físico · custo: 0 vigor · recarga: 8 s · alcance: 7 u · dano: 180%
  - Requer: Ímpeto
  - Por ponto: +10% de dano depois do primeiro ponto
  - Leitura no combate: Arcos curtos em sequência mostram a posição real da onda.
  - Decisão: Recompensa completar o combo de três cortes em vez de interromper com outras ações.
  - Notas: Deixou de ocupar slot da barra: barras salvas com a Onda de Aço recebem outra ação no lugar.

- **Cadência** (`cadencia`) — aperfeiçoamento · implementado · nível 8 · até 5 pontos
  Após acertar com a Estocada, avança automaticamente em até mais cinco presas diferentes, a até 6 u por etapa. Cada etapa mantém 60% do dano da anterior. Não atravessa paredes nem repete alvos; esquivar interrompe. +10% do dano dos avanços adicionais por ponto depois do primeiro; mantém cinco avanços no máximo. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Estocada) · alcance: 6 u
  - Requer: Impacto
  - Por ponto: +10% do dano dos avanços adicionais por ponto depois do primeiro; mantém cinco avanços no máximo
  - Notas: Sem custo adicional; Impacto também segue a redução de dano de cada etapa.

- **Furacão** (`tornadoWhirl`) — aperfeiçoamento · implementado · nível 18 · até 5 pontos
  Evolui o Ciclone: golpes a cada 0,2 s, mantendo a área e o movimento do Ciclone, por 16 vigor/s. Cada ponto depois do primeiro reduz o intervalo em 0,01 s, acrescenta +8% de dano ao giro e +1 vigor/s de consumo. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Ciclone
  - Por ponto: −0,01 s entre golpes, +8% de dano e +1 vigor/s depois do primeiro ponto
  - Notas: Evolução cumulativa. O id tornadoWhirl é preservado nos saves.

- **Corte Espacial** (`corteEspacial`) — aperfeiçoamento · implementado · nível 22 · até 5 pontos
  Todo corte do ataque básico dispara uma onda em linha reta de 14 u com 230% do dano físico. Atravessa inimigos, para em paredes, sem custo nem recarga própria. Substitui o disparo da Onda de Aço. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Três cortes) · custo: 0 vigor · recarga: 0 s · alcance: 14 u · dano: 230%
  - Requer: Onda de Aço
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Notas: Valores mantidos por decisão do usuário em 09/11/2026.

- **Rastro** (`rastro`) — aperfeiçoamento · implementado · nível 22 · até 5 pontos
  A Estocada e os avanços da Cadência deixam fogo no percurso por 3 s. Cada inimigo recebe 15% do dano físico como fogo a cada 0,5 s; +15% desse dano por ponto depois do primeiro. Trechos sobrepostos não somam dano. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Estocada) · elemento: fogo · duração: 3 s · raio: 0,7 u · dano: 15% a cada 0,5 s
  - Requer: Cadência
  - Por ponto: +15% de dano do rastro depois do primeiro ponto

- **Tornado** (`tornado2`) — aperfeiçoamento · implementado · nível 22 · até 5 pontos
  Enquanto o Furacão gira, libera um pequeno tornado a cada 0,8 s na direção do golpe. Cada tornado avança 6 u e fere cada inimigo uma vez com 35% do dano físico. +10% de dano por ponto depois do primeiro. Para em paredes. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Furacão) · alcance: 6 u · dano: 35%
  - Requer: Furacão
  - Por ponto: +10% de dano depois do primeiro ponto

### Escudo — Guarda e retaliação

- **Golpe de escudo** (`bash`) — ativa · implementado · nível 1 · até 3 pontos
  Libera o golpe de escudo (3 / Q). +10% de dano por ponto. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: 3 / Q · alvo: cone à frente (117°) · elemento: físico · custo: 15 vigor · recarga: 7 s · alcance: 1,8 u · dano: 130%

- **Guarda treinada** (`shieldDefense`) — passiva · implementado · nível 1 · até 5 pontos
  +3 pontos percentuais de bloqueio com escudo por ponto Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.

- **Arremesso de escudo** (`shieldThrow`) — ativa · implementado · nível 6 · até 5 pontos
  T/6: escudo atinge na ida e no retorno. Sem bloqueio enquanto está no ar. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: T / 6 · alvo: direção da mira · elemento: físico · custo: 20 vigor · recarga: 7 s · alcance: 8 u · dano: 120% (ida e volta)
  - Requer: Golpe de escudo
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)

- **Retaliação** (`riposte`) — sinergia · implementado · nível 6 · até 3 pontos
  Bloquear fortalece em 10% por ponto o próximo golpe de escudo, por 4 s. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Guarda treinada

- **Ricochete** (`ricochet`) — sinergia · implementado · nível 12 · até 5 pontos
  O Arremesso salta para o inimigo mais próximo em até 6 u: um salto por ponto, com 20% menos dano a cada salto. Mais saltos deixam você mais tempo sem escudo. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Arremesso de escudo
  - Notas: Cinco saltos no máximo; perda de 20% de dano por salto. Mantém dano na volta e ausência de bloqueio em voo.

- **Armadura de Espinhos** (`armaduraDeEspinhos`) — passiva · implementado · nível 12 · até 5 pontos
  Devolve ao atacante 8% por ponto da vida realmente perdida ao receber dano, até 40%. Golpes bloqueados ou absorvidos não refletem. Não cria ciclos de reflexão. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Passiva · dano: 8% a 40% do dano recebido na vida
  - Requer: Retaliação
  - Por ponto: +8% de dano refletido

### Passivas — O corpo como fortaleza

- **Maestria da espada** (`strength`) — passiva · implementado · nível 1 · até 5 pontos
  +8% de dano por ponto

- **Disciplina defensiva** (`armor`) — passiva · implementado · nível 1 · até 5 pontos
  +4 de armadura por ponto

- **Domínio dos equipamentos** (`equipmentMastery`) — passiva · implementado · nível 1 · até 5 pontos
  +8% ao dano da espada e à armadura dos itens por ponto

- **Vitalidade** (`vitality`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de vida máxima por ponto

- **Fôlego de batalha** (`regeneration`) — passiva · implementado · nível 1 · até 5 pontos
  +0,4 de vida por segundo por ponto

### Veterano — A experiência do campo

- **Postura de Batalha** (`stance`) — ativa · implementado · nível 10 · até 1 ponto
  F: alterna entre Ofensiva e Defensiva, com só uma ativa e recarga de 6 s. Ofensiva: +20% de dano causado, +15% de dano recebido, -10 de bloqueio, cortes devolvem 2 de vigor. Defensiva: -15% de dano causado, -15% de dano recebido, +10 de bloqueio, vigor ×1,6, bloquear cura 2% da vida.
  - Uso: tecla: F · alvo: próprio · recarga: 6 s

- **Brado de Guerra** (`warCry`) — ativa · implementado · nível 14 · até 5 pontos
  Reduz em 30% a velocidade dos inimigos em raio de 6 por 4 s e dobra a recuperação de vigor por 6 s. Recarga de 18 s. Equipe em um slot da barra. +0,5 s de lentidão e de recuperação dobrada por ponto depois do primeiro.
  - Uso: tecla: Slot da barra · alvo: área ao redor · custo: 0 vigor · recarga: 18 s · duração: 4 s · raio: 6 u · dano: —
  - Por ponto: +0,5 s de lentidão e de recuperação dobrada por ponto depois do primeiro

## Druida

_A floresta não esquece. Ela espera, e então responde._

Recurso: **mana** · 27 nós · 105 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Tempestade — O céu responde

- **Faísca** (`spark`) — ativa · implementado · nível 1 · até 5 pontos
  Raio instantâneo no primeiro inimigo da linha. O ataque básico já está disponível. +6% de dano por ponto. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Clique esquerdo · alvo: primeiro inimigo da linha · elemento: raio · custo: 0 mana · recarga: 0,55 s · alcance: 10 u · dano: 45%

- **Turbilhão** (`turbilhao`) — ativa · implementado · nível 2 · até 5 pontos
  Lança um turbilhão que avança 9 u em linha reta a 10 u/s, atravessando inimigos: 60% do dano em cada um (uma vez) e empurrão de 0,6 u para os lados. Para em paredes. +8% de dano por ponto. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: vento · custo: 12 mana · recarga: 4 s · preparação: 0,2 s · alcance: 9 u · raio: 0,9 u · dano: 60% por inimigo
  - Por ponto: +8% de dano por ponto
  - Leitura no combate: Arcos de vento giram na posição real do turbilhão.
  - Decisão: Afasta quem cerca a Druida e acerta a fila inteira, com menos dano que a Faísca.
  - Notas: Tirado do clique esquerdo, que é da Faísca. Os números iniciais (custo 0, recarga 0,55 s, 45%) vieram da Faísca; ajustar para uma habilidade de slot.

- **Corrente de Raios** (`chain`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Corrente: o raio salta entre inimigos próximos. Cada ponto acrescenta um salto. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · alvo: inimigo na mira + saltos · elemento: raio · custo: 22 mana · recarga: 4 s · alcance: 10 u · dano: 120%, −20% por salto
  - Requer: Faísca

- **Tornado** (`tornado`) — ativa · implementado · nível 6 · até 5 pontos
  Ergue um tornado no ponto mirado, até 10 u. Por 4 s ele anda devagar (1,2 u/s) na direção da mira, puxa para o centro quem estiver a até 1,8 u (chefes não) e causa 25% do dano a cada 0,4 s. Para em paredes. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: vento · custo: 30 mana · recarga: 4 s · preparação: 0,35 s · duração: 4 s · alcance: 10 u · raio: 1,8 u · dano: 25% a cada 0,4 s
  - Requer: Turbilhão
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: Anel no chão e arcos de vento girando na posição real do tornado.
  - Decisão: Agrupa inimigos para a Tempestade e as Raízes.

- **Tempestade** (`storm`) — ativa · implementado · nível 6 · até 5 pontos
  Nuvem fixa no ponto mirado que derruba raios nos inimigos dentro da área por 4 s. Saia da área ou fique nela: os raios só caem ali. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: R / 5) · alvo: ponto mirado · elemento: raio · custo: 35 mana · recarga: 4 s · duração: 4 s · alcance: 10 u · raio: 3,5 u · dano: 60% a cada 0,5 s (até 3 alvos)
  - Requer: Corrente de Raios
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)

- **Furacão** (`furacao`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  O Tornado vira Furacão: raio 2,7 e 6 s de duração. Ao terminar, explode com 120% do dano em raio 2,7 e empurra os inimigos 1,5 u para fora. +10% do dano base do Tornado e da explosão por ponto depois do primeiro; soma com os ranks do Tornado. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Tornado) · elemento: vento · duração: 6 s · raio: 2,7 u · dano: 120% na explosão final
  - Requer: Tornado
  - Por ponto: +10% do dano base do Tornado e da explosão por ponto depois do primeiro; soma com os ranks do Tornado
  - Leitura no combate: O anel do tornado fica maior; a explosão final abre um anel de vento.
  - Decisão: Mais tempo agrupando, com um empurrão no fim que pode tirar inimigos de cima da Druida.

- **Calamidade** (`calamidade`) — ativa · implementado · nível 18 · até 1 ponto
  Cria um grande furacão de raio 4, até 10 u, que avança lentamente por 8 s. Vento causa 30% do dano mágico a cada 0,5 s e puxa inimigos comuns; a cada 1 s, raios causam 65% a até duas presas dentro da área. Chefes recebem dano sem serem puxados. Paredes bloqueiam o efeito. Recebe a sinergia de Tempestade.
  - Uso: tecla: Slot da barra (forma humana) · alvo: ponto mirado · elemento: vento e raio · custo: 55 mana · recarga: 24 s · preparação: 0,55 s · duração: 8 s · alcance: 10 u · raio: 4 u · dano: 30% por pulso + 65% por raio
  - Requer: Tempestade, Furacão
  - Leitura no combate: Funil de vento e nuvem acompanham a área; raios caem nas presas.
  - Decisão: Antecipe o caminho do grupo para aproveitar a duração; recarga longa.

### Natureza — Raízes que prendem

- **Raízes** (`roots`) — ativa · implementado · nível 1 · até 3 pontos
  Libera as Raízes: espinhos brotam no ponto mirado e prendem os inimigos no lugar. Presos ainda atacam quem estiver ao alcance. +10% de dano e +0,3 s de prisão por ponto. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · alvo: ponto mirado · elemento: natureza · custo: 18 mana · recarga: 4 s · duração: 2 s · alcance: 10 u · raio: 2,4 u · dano: 80%

- **Lobo** (`lobo`) — evocação · implementado · nível 1 · até 5 pontos
  Evoca um lobo permanente, sem limite de duração, com 65% da vida máxima e 45% do dano mágico da Druida por mordida, a cada 1 s. +10% de vida e dano por ponto depois do primeiro. Nova conjuração repõe apenas mortos ou vagas novas da Alcateia; não cura lobos vivos. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (forma humana) · alvo: perto da Druida · elemento: físico · custo: 30 mana · recarga: 8 s · preparação: 0,35 s · alcance: 2 u · dano: 45% por mordida
  - Por ponto: +10% de vida e dano depois do primeiro ponto
  - Notas: Vida proporcional e mortos persistem no save e na troca de mapa. Morreu: precisa conjurar novamente. Morte da Druida desfaz a alcateia. Modelo animado cryptHound com tinta natural.

- **Casca de Espinhos** (`thornbind`) — sinergia · implementado · nível 4 · até 3 pontos
  Inimigos presos pelas Raízes recebem +10% de dano por ponto, de qualquer fonte. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Raízes

- **Rejuvenescer** (`rejuvenate`) — ativa · implementado · nível 6 · até 5 pontos
  Brotos curam 30% da vida máxima ao longo de 5 s. Só na forma humana; transformar-se não interrompe a cura. +5 pontos percentuais de cura por ponto depois do primeiro (30% a 50% da vida máxima). Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: T / 6) · alvo: próprio · elemento: natureza · custo: 25 mana · recarga: 4 s · duração: 5 s · dano: cura 30% da vida máxima
  - Requer: Raízes
  - Por ponto: +5 pontos percentuais de cura por ponto depois do primeiro (30% a 50% da vida máxima)

- **Mordida Pesada** (`mordidaPesada`) — passiva · implementado · nível 6 · até 3 pontos
  A cada 6 s, o próximo ataque de cada lobo vira uma Mordida Pesada automática: 180% do dano da mordida, mais 20 pontos percentuais por ponto depois do primeiro, até 220%. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Lobo) · recarga: 6 s · dano: 180% a 220% da mordida
  - Requer: Lobo
  - Por ponto: +20 pontos percentuais depois do primeiro ponto

- **Planta Carnívora** (`plantaCarnivora`) — aperfeiçoamento · implementado · nível 4 · até 5 pontos
  Usar Raízes faz nascer uma planta carnívora no ponto mirado por 8 s. Ela tem 60% da vida máxima da Druida, ataca até 4,5 u a cada 1,4 s com 45% do dano mágico e pode ser destruída. Só uma planta por vez; não ocupa slot adicional. +10% de vida e dano da planta por ponto depois do primeiro. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Raízes) · duração: 8 s · alcance: 4,5 u · dano: 45% por ataque
  - Requer: Casca de Espinhos
  - Por ponto: +10% de vida e dano da planta por ponto depois do primeiro
  - Notas: GLB próprio animado; não anda nem ataca através de paredes.

- **Escudo de Folhas** (`escudoDeFolhas`) — ativa · implementado · nível 6 · até 1 ponto
  Folhas, terra e madeira formam uma proteção por 8 s, absorvendo até 35% da vida máxima em dano depois das defesas. O excedente atinge a vida. Folhas se desprendem conforme a resistência cai, e a barra mostra a absorção restante. Nova conjuração substitui a proteção, sem acumular. Transformar-se mantém o escudo; morte e troca de cena encerram.
  - Uso: tecla: Slot da barra (forma humana) · alvo: própria Druida · elemento: natureza · custo: 25 mana · recarga: 18 s · preparação: 0,3 s · duração: 8 s
  - Requer: Rejuvenescer
  - Leitura no combate: Folhas orbitam o corpo e diminuem conforme a resistência é consumida.
  - Decisão: Proteja a janela de cura do Rejuvenescimento ou prepare-se para um golpe.

- **Alcateia** (`alcateia`) — aperfeiçoamento · implementado · nível 12 · até 3 pontos
  Aumenta em um lobo por ponto o limite da evocação, até quatro lobos. Conjure Lobo para preencher as vagas novas. Todos recebem Mordida Pesada quando aprendida. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Mordida Pesada
  - Por ponto: +1 lobo (até quatro no total)

- **Floresta Tropical** (`florestaTropical`) — ativa · implementado · nível 16 · até 1 ponto
  Evoca cinco plantas carnívoras por 10 s numa área de raio 4,5, até 10 u. Cada uma usa os atributos de Planta Carnívora: 60% da vida máxima, 45% do dano mágico, alcance 4,5 u e ataque a cada 1,4 s, com os pontos e sinergias dela. Podem ser destruídas. Uma nova Floresta substitui as cinco anteriores; a planta das Raízes tem limite separado. Sem espaço para cinco plantas visíveis fora de paredes, não gasta mana nem recarga.
  - Uso: tecla: Slot da barra (forma humana) · alvo: ponto mirado · elemento: natureza · custo: 45 mana · recarga: 20 s · preparação: 0,45 s · duração: 10 s · alcance: 10 u · raio: 4,5 u · dano: 45% por ataque de cada planta, mais pontos e sinergias
  - Requer: Planta Carnívora
  - Leitura no combate: Círculo verde delimita a floresta; cinco modelos de plantas brotam.
  - Decisão: Prepare uma região de defesa e conduza os inimigos para ela.

- **Líder da Matilha** (`liderDaMatilha`) — ativa · implementado · nível 12 · até 1 ponto
  O lobo vivo de menor posição da alcateia torna-se o líder: maior, com anel dourado e +30% de dano. A ação marca por 6 s uma presa visível próxima da mira, até 12 u, e toda a alcateia passa a persegui-la. O primeiro ataque do líder nessa caçada usa garras de 160% do dano dele. Mantém alcance, deslocamento e recargas normais dos lobos; não teleporta nem ressuscita. Sem lobo vivo ou presa válida, não gasta mana nem recarga. Se o líder morrer, outro lobo vivo assume.
  - Uso: tecla: Slot da barra (forma humana) · alvo: presa próxima da mira · elemento: físico · custo: 20 mana · recarga: 12 s · preparação: 0,25 s · duração: 6 s · alcance: 12 u · dano: Líder: +30% de dano; comando: garras de 160%
  - Requer: Alcateia
  - Leitura no combate: Anel dourado sob o líder e sob a presa comandada.
  - Decisão: Concentre a matilha numa ameaça específica; requer lobos vivos.

### Selvagem — A fera sob a pele

- **Forma de Lobo** (`wolf`) — ativa · implementado · nível 1 · até 3 pontos
  F: transforma em lobisomem. Garras corpo a corpo, 20% menos dano recebido e 35% mais movimento, mas sem magias. A forma consome mana e cada golpe de garra devolve 3. +8% de dano das garras por ponto. Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: F · alvo: próprio
  - Notas: Consome mana enquanto ativa (4/s base).

- **Salto Feroz** (`leap`) — ativa · implementado · nível 4 · até 5 pontos
  Na forma de lobo (botão direito / 2): salta até 6 u e atinge a área de pouso. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Botão direito / 2 (lobo) · alvo: ponto mirado · custo: 15 mana · recarga: 4 s · alcance: 6 u · raio: 2,2 u · dano: 150%
  - Requer: Forma de Lobo
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)

- **Coração Selvagem** (`wildHeart`) — aperfeiçoamento · implementado · nível 6 · até 3 pontos
  A forma de lobo consome 1 mana por segundo a menos por ponto (de 4/s para até 1/s). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Forma de Lobo

- **Corte Sangrento** (`corteSangrento`) — ativa · implementado · nível 6 · até 5 pontos
  Na forma de lobo: golpe em semicírculo de 180° até 4,6 u com 90% do dano. Os atingidos sangram: 15% a cada 0,5 s por 4 s. Um novo corte renova, sem somar. +10% do dano do golpe e do sangramento por ponto depois do primeiro. Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: R / 5 (lobo) · alvo: arco à frente · elemento: sangue · custo: 12 mana · recarga: 4 s · preparação: 0,2 s · duração: 4 s · alcance: 4,6 u · dano: 90% + 15% a cada 0,5 s
  - Requer: Salto Feroz
  - Por ponto: +10% do dano do golpe e do sangramento por ponto depois do primeiro
  - Leitura no combate: Anel vermelho sob quem está sangrando.
  - Decisão: Marque vários inimigos e siga lutando: o sangramento trabalha enquanto o lobo troca de alvo.
  - Notas: O campo antigo radius=180 representava a abertura do arco, não um raio de 180 u; alcance 4,6 u preservado.

- **Garra de Gelo** (`garraDeGelo`) — ativa · implementado · nível 8 · até 5 pontos
  Na forma de lobo (T / 6): garra gelada em cone estreito, até 3 u, com 130% do dano. Os atingidos ficam 50% mais lentos por 2,5 s; chefes recebem só o dano. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: T / 6 (lobo) · alvo: cone estreito à frente · elemento: gelo · custo: 15 mana · recarga: 4 s · preparação: 0,2 s · duração: 2,5 s · alcance: 4 u · raio: 180 u · dano: 130%
  - Requer: Salto Feroz
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: Anel azul-claro sob os inimigos gelados.
  - Decisão: Segura quem foge ou quem vem pelas costas enquanto o lobo trabalha.

- **Uivo** (`howl`) — ativa · implementado · nível 8 · até 5 pontos
  Na forma de lobo (3 / Q): inimigos em 6 u ficam 35% mais lentos por 3 s e as garras causam +25% de dano por 6 s. +5 pontos percentuais ao bônus de dano por ponto depois do primeiro (+25% a +45%). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: 3 / Q (lobo) · alvo: área ao redor · custo: 0 mana · recarga: 4 s · duração: 3 s · raio: 6 u
  - Requer: Salto Feroz
  - Por ponto: +5 pontos percentuais ao bônus de dano por ponto depois do primeiro (+25% a +45%)

### Passivas — A paciência da floresta

- **Vigor da floresta** (`vitality`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de vida máxima por ponto.

- **Seiva** (`sap`) — passiva · implementado · nível 1 · até 5 pontos
  +0,4 de vida por segundo por ponto.

- **Sabedoria antiga** (`wisdom`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de mana máxima por ponto.

- **Afinidade** (`attunement`) — passiva · implementado · nível 1 · até 5 pontos
  +8% de dano de magias e garras por ponto.

## Arqueira

_Antes que o inimigo veja, a flecha já escolheu onde cair._

Recurso: **foco** · 24 nós · 100 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Arco — Cada flecha conta

- **Disparo** (`shot`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano do Disparo por ponto. O ataque básico já está disponível. Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Clique esquerdo · elemento: físico · custo: 0 foco · recarga: 0,5 s · preparação: 0,26 s · alcance: 13 u · dano: 85%

- **Tiro Seguidor** (`fan`) — ativa · implementado · nível 4 · até 5 pontos
  Cinco flechas em cone de 50°, com 70% do dano cada. Cada flecha curva em direção ao inimigo mais próximo à frente dela, até 6 u. Bom contra grupos espalhados. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: T / 6) · elemento: físico · custo: 22 foco · recarga: 7 s · preparação: 0,26 s · alcance: 10 u · raio: 0,18 u · dano: 70% × 5
  - Requer: Disparo
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: As flechas curvam no ar em direção aos alvos.
  - Decisão: Cobre vários alvos espalhados; contra um alvo só, a Saraivada Seguidora rende mais.
  - Notas: Renomeado de Leque (id fan preservado nos saves).

- **Flecha Perfurante** (`pierce`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Flecha Perfurante: carrega 0,55 s, andando a metade da velocidade, e atravessa todos os inimigos da linha, com 200% do dano. +10% de dano por ponto. Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · elemento: físico · custo: 20 foco · recarga: 5 s · preparação: 0,55 s · alcance: 16 u · dano: 200%
  - Requer: Disparo

- **Flecha de Fogo** (`fechadefogo`) — ativa · implementado · nível 4 · até 5 pontos
  Dispara uma flecha com 100% do dano, alcance 13 u. O alvo queima por 4 s: 15% do dano a cada 0,5 s. Renovar não acumula queimaduras. +10% do dano do impacto e da queimadura por ponto depois do primeiro. Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: fogo · custo: 15 foco · recarga: 4 s · preparação: 0,26 s · duração: 4 s · alcance: 13 u · dano: 100% + 15% a cada 0,5 s
  - Requer: Disparo
  - Por ponto: +10% do dano do impacto e da queimadura por ponto depois do primeiro
  - Notas: Id fechadefogo preservado.

- **Saraivada Seguidora** (`saraivadaSeguidora`) — ativa · implementado · nível 12 · até 5 pontos
  Trava no inimigo mais perto da mira (até 3,5 u dela e 13 u de você) e dispara cinco flechas em sequência, uma a cada 0,12 s, que perseguem esse alvo, com 45% do dano cada. Se ele cair, as restantes buscam o inimigo mais próximo. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: inimigo perto da mira · elemento: físico · custo: 25 foco · recarga: 9 s · preparação: 0,2 s · alcance: 13 u · dano: 45% × 5
  - Requer: Tiro Seguidor
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: Anel dourado sob o alvo travado durante a rajada.
  - Decisão: Dano concentrado num alvo: ótimo contra elites e chefes, fraco contra grupos.

- **Chuva de Flechas** (`rain`) — ativa · implementado · nível 12 · até 5 pontos
  Marca uma área de raio 3 no ponto mirado, até 12 u. Depois de 0,7 s caem cinco ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo. O raio cresce 0,3 u por ponto depois do primeiro: de 3 a 4,2 u.
  - Uso: tecla: Slot da barra (padrão: R / 5) · elemento: físico · custo: 35 foco · recarga: 12 s · preparação: 0,35 s · alcance: 12 u · raio: 3 u · dano: 45% × 5 ondas
  - Requer: Flecha Perfurante
  - Por ponto: +10% do dano base e +0,3 u de raio por ponto depois do primeiro

- **Flecha Explosiva** (`flechaExplosiva`) — ativa · implementado · nível 12 · até 5 pontos
  Dispara uma flecha que explode ao tocar um inimigo, parede ou fim do alcance: 160% do dano em raio 2,5, até 13 u. Não deixa queimadura. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: fogo · custo: 25 foco · recarga: 7 s · preparação: 0,35 s · alcance: 13 u · raio: 2,5 u · dano: 160%
  - Requer: Flecha de Fogo
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)

- **Saraivada Múltipla** (`saraivadaMultipla`) — variante · implementado · nível 12 · até 1 ponto
  Seleciona até cinco inimigos visíveis perto da mira e dispara cinco ondas, com uma flecha por alvo em cada onda: até 25 flechas de 45% do dano. Um alvo sozinho recebe cinco. Sequências de alvos mortos podem passar para inimigos ainda não selecionados. Compartilha recarga com Saraivada Seguidora e usa seus pontos para dano.
  - Uso: tecla: Slot da barra · custo: 40 foco · recarga: 12 s · preparação: 0,2 s · alcance: 13 u · dano: 45% × 5 por alvo, até 5 alvos
  - Requer: Saraivada Seguidora
  - Leitura no combate: Anéis dourados nos alvos selecionados.
  - Decisão: Escolha esta variante para grupos; custa mais foco que a Seguidora.

- **Chuva de Flechas Explosivas** (`chuvaDeFlechasExplosivas`) — variante · implementado · nível 20 · até 1 ponto
  Cinco ondas explosivas de 55% do dano em raio 3,6, mais 0,3 u por ponto de Chuva depois do primeiro (até 4,8 u). Cada onda renova um único campo de fogo até 2 s depois dela, com 30% do dano de uma onda a cada 0,5 s. Compartilha recarga e escala de dano com Chuva de Flechas.
  - Uso: tecla: Slot da barra · custo: 45 foco · recarga: 16 s · preparação: 0,35 s · alcance: 12 u · raio: 3,6 u · dano: 55% × 5 ondas + chamas
  - Requer: Chuva de Flechas, Flecha Explosiva
  - Leitura no combate: Área marcada, quedas alaranjadas e chão em chamas.

- **Disparo Preciso** (`disparoPreciso`) — ativa · implementado · nível 12 · até 5 pontos
  Prepara por 1,2 s, andando a 20% da velocidade, e lança uma flecha muito rápida de 500% do dano, alcance 24 u. Para no primeiro inimigo ou parede. Esquiva cancela a preparação, mantendo custo e recarga. +10% de dano por ponto depois do primeiro.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: físico · custo: 35 foco · recarga: 20 s · preparação: 1,2 s · alcance: 24 u · dano: 500%
  - Requer: Flecha Perfurante
  - Por ponto: +10% do dano base por ponto depois do primeiro
  - Leitura no combate: Linha clara na direção do disparo durante a preparação.
  - Decisão: Aproveite uma abertura para mirar de longe; fica vulnerável durante a preparação.

### Caça — Nunca onde esperam

- **Recuo** (`leap`) — ativa · implementado · nível 1 · até 3 pontos
  Libera o Recuo: salto de 5 u para trás, de frente para a mira. Inimigos a até 2,5 u do ponto de partida ficam 35% mais lentos por 2 s. −0,5 s de recarga por ponto. Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · elemento: físico · custo: 15 foco · recarga: 6 s · preparação: 0,05 s · duração: 2 s · alcance: 5 u

- **Falcão** (`falcon`) — ativa · implementado · nível 2 · até 3 pontos
  Um falcão acompanha a Arqueira. A cada 2,5 s ele mergulha no inimigo mais próximo dela, até 8 u, com 35% do dano. F: manda o falcão ao inimigo mais perto da mira (até 3,5 u da mira e 14 u de você), com 120% do dano; o alvo fica marcado por 4 s e recebe +15% de dano das flechas. Recarga de 8 s, 10 foco. +10% de dano do falcão por ponto. Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: F (comando) · alvo: inimigo perto da mira · custo: 10 foco · recarga: 8 s · alcance: 14 u · dano: 35% automático, 120% no comando

- **Tiro de Emboscada** (`ambush`) — sinergia · implementado · nível 6 · até 3 pontos
  Depois do Recuo, o próximo Disparo, Flecha Perfurante ou Tiro Seguidor em até 3 s causa +15% de dano por ponto. Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Recuo

- **Impacto Celeste** (`impactoCeleste`) — ativa · implementado · nível 8 · até 5 pontos
  Marca uma área de raio 4,5 no ponto mirado, até 12 u. O falcão mergulha e, após 0,9 s, causa 150% do dano e empurra 1 u. Durante o mergulho, não ataca nem lança penas. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: físico · custo: 25 foco · recarga: 12 s · preparação: 0,3 s · duração: 0,9 s · alcance: 12 u · raio: 4,5 u · dano: 150%
  - Requer: Falcão
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: Anel no chão durante a descida do falcão.
  - Decisão: Dano em área com atraso: mire onde o grupo vai estar.

- **Penas Voadoras** (`penasVoadoras`) — passiva · implementado · nível 4 · até 5 pontos
  Passiva do falcão: a cada 7 s com inimigos visíveis até 8 u da Arqueira, lança seis penas de 40% do dano, uma por alvo. Penas restantes seguem a mira. Sem custo e sem slot; espera o Impacto Celeste terminar. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Automática (Falcão) · alvo: inimigos perto da Arqueira · elemento: físico · custo: 0 foco · recarga: 7 s · alcance: 8 u · dano: 40% × 6
  - Requer: Falcão
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: Penas claras saem do falcão em direção a cada alvo.
  - Decisão: Limpa inimigos fracos que cercam a Arqueira sem precisar mirar.
  - Notas: Barras antigas com Penas Voadoras recebem outra ação no lugar; o id do nó permanece.

- **Marca do Caçador** (`marcaDoCacador`) — aperfeiçoamento · implementado · nível 6 · até 1 ponto
  Evolui o comando F: marca imediatamente uma presa visível por 8 s. Ela recebe +20% de todo dano e vira prioridade dos mergulhos automáticos do falcão enquanto estiver visível e até 8 u da Arqueira. Só uma marca; trocar de presa remove a anterior. O comando mantém seu mergulho e passa a ter 12 s de recarga. Não acumula com a marca antiga.
  - Uso: tecla: F (comando) · alvo: direção da mira · elemento: físico · custo: 10 foco · recarga: 12 s · preparação: 0 s · duração: 8 s · alcance: 14 u
  - Requer: Falcão
  - Leitura no combate: Anel dourado acompanha a presa marcada.
  - Decisão: Escolha a ameaça que deve cair primeiro.

- **Emboscada em Dupla** (`emboscadaEmDupla`) — sinergia · implementado · nível 12 · até 5 pontos
  O primeiro acerto do tiro fortalecido por Tiro de Emboscada chama um Impacto Celeste gratuito no ponto atingido, se o falcão estiver livre. Uma ativação por Recuo; o bônus de Emboscada original continua valendo, sem duplicação. +10% do dano desse Impacto por ponto depois do primeiro.
  - Requer: Tiro de Emboscada, Impacto Celeste
  - Por ponto: +10% do dano do Impacto automático por ponto depois do primeiro

- **Impacto Feroz** (`impactoFeroz`) — aperfeiçoamento · implementado · nível 12 · até 5 pontos
  Após o Impacto Celeste, libera três rajadas circulares de seis penas cada, espaçadas por 0,2 s. Cada pena usa o dano de Penas Voadoras, fortalecido em +10% por ponto depois do primeiro neste aperfeiçoamento. Não chama novos Impactos.
  - Requer: Impacto Celeste, Penas Voadoras
  - Por ponto: +10% do dano das penas das rajadas por ponto depois do primeiro

- **Rasante Relâmpago** (`rasanteRelampago`) — ativa · implementado · nível 12 · até 5 pontos
  O falcão executa seis rasantes em 1,5 s numa área de raio 4,5, até 12 u. Cada passagem causa 65% do dano a uma presa; prioriza a Marca do Caçador, depois inimigos ainda não atingidos. Pode repetir alvos. Durante os rasantes não usa comando F, Impacto Celeste, mergulhos automáticos nem Penas Voadoras. +10% de dano por ponto depois do primeiro.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: físico · custo: 30 foco · recarga: 16 s · preparação: 0,25 s · duração: 1,5 s · alcance: 12 u · raio: 4,5 u · dano: 65% × 6 rasantes
  - Requer: Falcão
  - Por ponto: +10% do dano base por ponto depois do primeiro
  - Leitura no combate: Área dourada e rastros rápidos entre os alvos.
  - Decisão: Varra um grupo ou marque uma presa dentro da área para concentrar os rasantes.

### Passivas — Olho firme, passo leve

- **Precisão** (`precision`) — passiva · implementado · nível 1 · até 5 pontos
  +8% de dano por ponto.

- **Concentração** (`focus`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de foco máximo por ponto.

- **Fôlego** (`regeneration`) — passiva · implementado · nível 1 · até 5 pontos
  +0,4 de vida por segundo por ponto.

- **Vitalidade** (`vitality`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de vida máxima por ponto.

- **Passo leve** (`swift`) — passiva · implementado · nível 1 · até 5 pontos
  +3% de movimento por ponto.

## Mercenário

_Todo contrato tem preço. O meu vem em virotes._

Recurso: **vigor** · 14 nós · 59 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Besta — Peso e alcance

- **Virote pesado** (`quarrel`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano do Virote pesado por ponto. O ataque básico já está disponível. Sinergia de Besta: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Clique esquerdo · elemento: físico · custo: 0 vigor · recarga: 0,8 s · preparação: 0,36 s · alcance: 12 u · dano: 150%

- **Rajada** (`volley`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Rajada: três virotes em sequência, a cada 0,15 s, com 70% do dano cada e atravessando um inimigo. +10% de dano por ponto. Sinergia de Besta: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · elemento: físico · custo: 24 vigor · recarga: 7 s · preparação: 0,25 s · alcance: 12 u · raio: 0,2 u · dano: 70% × 3

- **Perfuração** (`breach`) — sinergia · implementado · nível 6 · até 2 pontos
  O Virote pesado atravessa +1 inimigo por ponto, ainda perdendo 25% a cada um. Sinergia de Besta: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Virote pesado

### Pólvora e Armadilhas — Pavio curto, problema longo

- **Bomba de fragmentação** (`bomb`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Bomba: arremesso em arco até 9 u. O ponto de queda fica marcado no chão durante o voo; ao cair, explode em raio 2,6 com 160% do dano e empurra 1 u. +10% de dano por ponto. Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · elemento: físico · custo: 20 vigor · recarga: 6 s · preparação: 0,3 s · alcance: 9 u · raio: 2,6 u · dano: 160%

- **Rede de Caça** (`redeDeCaca`) — ativa · implementado · nível 2 · até 3 pontos
  Arremesso em arco até 9 u. O ponto de queda fica marcado no chão; a rede cobre raio 2,4, causa 30% do dano e deixa os inimigos 50% mais lentos por 3 s (+0,5 s por ponto depois do primeiro). Chefes recebem o dano, mas não ficam lentos. Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: físico · custo: 15 vigor · recarga: 9 s · preparação: 0,3 s · duração: 3 s · alcance: 9 u · raio: 2,4 u · dano: 30%
  - Por ponto: +0,5 s de lentidão por ponto depois do primeiro
  - Leitura no combate: Marca de queda durante o voo; anel bege sob quem está na rede.
  - Decisão: Prepara a Bomba e a Mina: inimigos lentos ficam mais tempo na área.

- **Estilhaços** (`shrapnel`) — sinergia · implementado · nível 6 · até 3 pontos
  +12% de raio da Bomba e da Mina por ponto. Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Bomba de fragmentação

- **Molotov** (`firebomb`) — ativa · implementado · nível 6 · até 5 pontos
  Arremesso em arco até 9 u que incendeia o chão em raio 2,4 por 4 s. A cada 0,5 s, 30% do dano em quem estiver dentro. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: T / 6) · elemento: fogo · custo: 30 vigor · recarga: 12 s · preparação: 0,3 s · duração: 4 s · alcance: 9 u · raio: 4,4 u · dano: 30%
  - Requer: Bomba de fragmentação
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Notas: Renomeado de Garrafa incendiária (id firebomb preservado nos saves).

- **Mina de pólvora** (`mine`) — ativa · implementado · nível 6 · até 5 pontos
  Assenta uma mina aos pés. Arma em 1 s; um inimigo até 1,4 u dispara uma explosão de raio 6 com 220% do dano. Até duas minas, cada uma dura 25 s. Estilhaços também amplia o raio. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: R / 5) · elemento: físico · custo: 25 vigor · recarga: 9 s · preparação: 0,4 s · duração: 25 s · raio: 6 u · dano: 220%
  - Requer: Bomba de fragmentação
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)

- **Armadilha de Urso** (`armadilhaDeUrso`) — ativa · implementado · nível 6 · até 5 pontos
  Assenta uma armadilha aos seus pés. Arma em 0,6 s e fecha quando um inimigo chega a 0,9 u: 120% do dano e o prende por 2 s (chefes ficam 50% mais lentos). Até duas armadilhas; cada uma dura 30 s. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: aos seus pés · elemento: físico · custo: 20 vigor · recarga: 10 s · preparação: 0,4 s · duração: 2 s · raio: 0,9 u · dano: 120%
  - Requer: Rede de Caça
  - Por ponto: +10% do dano base por ponto depois do primeiro (até +40%)
  - Leitura no combate: Anel cinza enquanto arma; claro quando armada; anel sob o inimigo preso.
  - Decisão: Controle de rota: posicione antes de recuar para que o perseguidor pise nela.

### Passivas — Contrato cumprido, couro inteiro

- **Calibre** (`caliber`) — passiva · implementado · nível 1 · até 5 pontos
  +8% de dano por ponto.

- **Gibão reforçado** (`armor`) — passiva · implementado · nível 1 · até 5 pontos
  +4 de armadura por ponto.

- **Fôlego** (`regeneration`) — passiva · implementado · nível 1 · até 5 pontos
  +0,4 de vida por segundo por ponto.

- **Couro curtido** (`vitality`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de vida máxima por ponto.

- **Resistência** (`stamina`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de vigor máximo por ponto.

## Mago

_Todo feitiço é uma pergunta. O fogo responde rápido; o gelo, devagar._

Recurso: **mana** · 27 nós · 121 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Fogo — Rápido e sem perdão

- **Bola de Fogo** (`fireball`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Bola de Fogo: explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance, em raio 2,2, com 140% do dano. +10% de dano por ponto. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · elemento: fogo · custo: 18 mana · recarga: 4 s · preparação: 0,3 s · alcance: 12 u · raio: 2,2 u · dano: 140%

- **Combustão** (`combustion`) — sinergia · implementado · nível 4 · até 5 pontos
  A explosão da Bola de Fogo deixa o chão em chamas (raio 2), com 25% do dano a cada 0,5 s. Dura 1 s com 1 ponto e +0,5 s por ponto seguinte, até 3 s. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Bola de Fogo
  - Por ponto: +0,5 s de chão em chamas (1 s no primeiro ponto)
  - Notas: Rebalanceado em 09/11/2026 para 5 pontos: o máximo continua 3 s (antes 1 s por ponto até 3 pontos).

- **Muralha de Fogo** (`firewall`) — ativa · implementado · nível 6 · até 5 pontos
  Ergue uma muralha de chamas de 6 u, atravessada na direção da mira, no ponto mirado (até 10 u), por 5 s. Quem a atravessa ou fica nela recebe 30% do dano a cada 0,5 s e sai queimando: 10% do dano a cada 0,5 s por 2 s. Não bloqueia a passagem. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: fogo · custo: 30 mana · recarga: 12 s · preparação: 0,4 s · duração: 5 s · alcance: 10 u · dano: 30% a cada 0,5 s; queimadura de 10% a cada 0,5 s por 2 s
  - Requer: Bola de Fogo
  - Por ponto: +10% de dano e +0,5 s de duração (a partir do segundo ponto)
  - Leitura no combate: Linha alaranjada no chão por 0,3 s antes de as chamas subirem; quem está queimando solta brasas.
  - Decisão: Corta a rota da horda: posicione entre você e o grupo e use a Rajada para segurá-los dentro.
  - Notas: Queimadura: dano contínuo no inimigo (não no chão), renovada sem acumular. Anel laranja sob quem está queimando.

- **Imbuir Fogo** (`imbuirFogo`) — ativa · implementado · nível 8 · até 5 pontos
  Por 12 s, a Seta Arcana vira fogo: soma 20% do dano como fogo e deixa o alvo queimando (10% do dano a cada 0,5 s por 2 s, sem acumular). Usar Imbuir Gelo encerra este efeito. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: o próprio Mago · elemento: fogo · custo: 25 mana · recarga: 20 s · preparação: 0,3 s · duração: 12 s · dano: +20% por Seta; queimadura de 10% a cada 0,5 s por 2 s
  - Requer: Combustão
  - Por ponto: +5% de dano de fogo na Seta e +1 s de duração (a partir do segundo ponto)
  - Leitura no combate: As Setas ficam alaranjadas e um anel da cor do elemento fica sob o Mago enquanto dura.
  - Decisão: Fogo para quem você vai castigar com área; gelo para segurar quem chega perto. Só um imbuir por vez.

- **Meteoro** (`meteor`) — ativa · implementado · nível 12 · até 5 pontos
  Marca uma área de raio 2,8 no ponto mirado, até 12 u. Uma bola de fogo cai do céu e, depois de 1 s, causa 320% do dano em quem estiver dentro. O chão fica em chamas por 3 s (raio 2,4): 20% do dano a cada 0,5 s. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: T / 6) · elemento: fogo · custo: 40 mana · recarga: 4 s · preparação: 0,45 s · duração: 3 s · alcance: 12 u · raio: 2,8 u · dano: 320% no impacto + 20% a cada 0,5 s por 3 s
  - Requer: Muralha de Fogo
  - Por ponto: +10% de dano no impacto e no chão em chamas (a partir do segundo ponto)
  - Leitura no combate: Marca no chão e a bola de fogo descendo em diagonal, com a sombra crescendo até o impacto; depois, o chão queimando.
  - Notas: Nível 12 e pré-requisito Muralha de Fogo desde 09/11/2026 (era nível 6 com Bola de Fogo).

- **Familiar de Fogo** (`familiarDeFogo`) — evocação · implementado · nível 16 · até 5 pontos
  Invoca um espírito de fogo que acompanha o Mago por 20 s. A cada 1,2 s ele lança uma pequena bola de fogo no inimigo mais próximo do Mago, até 9 u, com 40% do dano e explosão de raio 1,2 (com a Combustão, o chão também queima). Lançar de novo renova o espírito. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: inimigo mais próximo · elemento: fogo · custo: 35 mana · recarga: 25 s · preparação: 0,35 s · duração: 20 s · alcance: 9 u · raio: 1,2 u · dano: 40% por bola de fogo
  - Requer: Imbuir Fogo
  - Por ponto: +10% de dano das bolas de fogo (a partir do segundo ponto)
  - Leitura no combate: Brilho laranja orbitando o Mago; cada bola de fogo é um projétil visível.
  - Decisão: Dano contínuo enquanto o Mago se move e desvia.
  - Notas: Nível 16 e pré-requisito Imbuir Fogo desde 09/11/2026 (era nível 8 com Combustão).

- **Chuva de Fogo** (`chuvaDeFogo`) — variante · implementado · nível 20 · até 1 ponto
  Variante do Meteoro: em vez de uma queda de 320%, a área marcada cresce para raio 4,5 e recebe 5 meteoros menores, um a cada 0,3 s, em pontos aleatórios. Cada um causa 130% do dano em raio 1,8 e deixa o chão em chamas por 1,5 s. Custa 55 mana, recarrega em 8 s e divide a recarga com o Meteoro.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: fogo · custo: 55 mana · recarga: 8 s · preparação: 0,45 s · duração: 1,5 s · alcance: 12 u · raio: 4,5 u · dano: 130% × 5 (raio 1,8) + chão em chamas
  - Requer: Meteoro
  - Por ponto: Desbloqueio de variante; dano escala pelos pontos de Meteoro (+10% por ponto depois do primeiro)
  - Leitura no combate: Círculo grande marcado e uma sombra crescendo para cada meteoro antes da queda.
  - Decisão: Mais área e mais dano total contra grupos; contra um chefe parado nem todos acertam, e o Meteoro simples concentra mais.
  - Notas: Usa os pontos do Meteoro para o dano (+10% por ponto depois do primeiro). Sinergia de escola usa os pontos da habilidade de origem; este desbloqueio não é contado como doação adicional.

### Gelo — Devagar, para sempre

- **Rajada de Gelo** (`frost`) — ativa · implementado · nível 1 · até 5 pontos
  Libera a Rajada de Gelo: cone de 70° e 6 u à frente, com 110% do dano, que deixa os inimigos 40% mais lentos por 3 s. +10% de dano por ponto. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · elemento: gelo · custo: 20 mana · recarga: 7 s · preparação: 0,22 s · duração: 3 s · alcance: 6 u · dano: 110%
  - Por ponto: +10% de dano

- **Esfera de Gelo** (`esferaDeGelo`) — ativa · implementado · nível 6 · até 5 pontos
  Lança um pequeno planeta de gelo com anéis, que atravessa o campo bem devagar (2 u/s) por até 10 u e para em paredes. Fere uma vez quem toca (50%) e, girando, solta dois cristais opostos a cada 0,15 s em espiral; os cristais curvam para inimigos a até 3 u, com 20% do dano e 20% de lentidão por 1 s (conta para o Estilhaçar). Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: gelo · custo: 30 mana · recarga: 4 s · preparação: 0,25 s · duração: 5 s · alcance: 10 u · raio: 1,1 u · dano: 50% no contato; cristais de 20%
  - Requer: Rajada de Gelo
  - Por ponto: +10% de dano no contato e nos cristais (a partir do segundo ponto)
  - Leitura no combate: Planeta azul com dois anéis inclinados e sombra no chão; os cristais saem girando da borda.
  - Decisão: Lento e longo: atire pelo meio do grupo ou na rota por onde os inimigos vêm.

- **Nova de Gelo** (`icenova`) — variante · implementado · nível 6 · até 1 ponto
  Variante da Rajada de Gelo: em vez do cone de 70° e 6 u, uma onda em volta do Mago, em raio 4,5, com 90% do dano e a mesma lentidão de 40% por 3 s. Custa 25 mana, recarrega em 8 s e divide a recarga com a Rajada.
  - Uso: tecla: Slot da barra · alvo: em volta do Mago · elemento: gelo · custo: 25 mana · recarga: 8 s · preparação: 0,22 s · duração: 3 s · raio: 4,5 u · dano: 90%
  - Requer: Rajada de Gelo
  - Por ponto: Desbloqueio de variante; dano escala pelos pontos de Rajada de Gelo (+10% por ponto)
  - Leitura no combate: Anel de gelo expandindo a partir do Mago; anel azul sob os lentos.
  - Decisão: Cercado, a Nova pega todos; para segurar uma fila que vem de frente, o cone alcança mais longe.
  - Notas: Usa os pontos da Rajada de Gelo para o dano (+10% por ponto). Sinergia de escola usa os pontos da habilidade de origem; este desbloqueio não é contado como doação adicional.

- **Golem de Gelo** (`golemDeGelo`) — evocação · implementado · nível 10 · até 5 pontos
  Invoca um golem de gelo ao lado do Mago por 25 s. Ele tem 120% da vida máxima do Mago, avança no inimigo mais próximo e golpeia a cada 1,4 s com 70% do dano mágico, deixando o alvo 30% mais lento por 1,5 s. Inimigos perto dele passam a atacá-lo. Só um golem por vez. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ao lado do Mago · elemento: gelo · custo: 40 mana · recarga: 30 s · preparação: 0,35 s · duração: 25 s · alcance: 1,8 u · dano: 70% por golpe
  - Requer: Esfera de Gelo
  - Por ponto: +10% de vida e de dano do golem (a partir do segundo ponto)
  - Leitura no combate: Golem azul-gelo; anel azul sob quem ele desacelerou.
  - Decisão: Um escudo que anda: invoque antes de o grupo chegar para ganhar distância.

- **Imbuir Gelo** (`imbuirGelo`) — ativa · implementado · nível 8 · até 5 pontos
  Por 12 s, a Seta Arcana vira gelo: soma 15% do dano como gelo e deixa o alvo 25% mais lento por 1,5 s (conta para o Estilhaçar; chefes não ficam lentos). Usar Imbuir Fogo encerra este efeito. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: o próprio Mago · elemento: gelo · custo: 25 mana · recarga: 20 s · preparação: 0,3 s · duração: 12 s · dano: +15% por Seta
  - Requer: Nova de Gelo
  - Por ponto: +5% de dano de gelo na Seta e +1 s de duração (a partir do segundo ponto)
  - Leitura no combate: As Setas ficam azuis e um anel da cor do elemento fica sob o Mago; anel azul sob os lentos.
  - Decisão: Mantém o Estilhaçar ativo só com a Seta, sem gastar a Rajada.
  - Notas: Antes exigia a Nova de Gelo; passou a exigir a Rajada porque a Nova é variante (1 ponto) e quem prefere o cone não deveria precisar dela.

- **Estilhaçar** (`shatter`) — sinergia · implementado · nível 12 · até 5 pontos
  Inimigos lentos pelo gelo do Mago (Rajada, Nova, cristais da Esfera, Imbuir Gelo e Avalanche) recebem +6% por ponto do dano de fogo e arcano. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Imbuir Gelo
  - Por ponto: +6% de dano de fogo e arcano em inimigos lentos pelo gelo
  - Notas: Rebalanceado em 09/11/2026 para 5 pontos: o máximo fica em 30%, como antes (+10% por ponto até 3). Pré-requisito Imbuir Gelo e nível 12 desde 09/11/2026. A lentidão do Golem não conta.

- **Avalanche** (`avalanche`) — ativa · implementado · nível 20 · até 5 pontos
  Marca uma área de raio 5 no ponto mirado (até 12 u). Durante 3 s caem 10 bolas de neve em pontos aleatórios dentro dela; cada uma causa 80% do dano em raio 1,4 e deixa 30% mais lento por 2 s (conta para o Estilhaçar; chefes não ficam lentos). Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: gelo · custo: 60 mana · recarga: 24 s · preparação: 0,6 s · duração: 3 s · alcance: 12 u · raio: 5 u · dano: 80% × 10 (raio 1,4)
  - Requer: Golem de Gelo
  - Por ponto: +1 bola de neve (a partir do segundo ponto, até 14)
  - Leitura no combate: Círculo azul grande no chão; cada bola tem sombra crescendo antes de cair.
  - Decisão: Controle de área longo: jogue onde a horda vai passar, não onde ela está.

### Arcano — O caminho mais curto

- **Seta Arcana** (`bolt`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano da Seta Arcana por ponto. O ataque básico já está disponível. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Clique esquerdo · elemento: arcano · custo: 0 mana · recarga: 0,45 s · preparação: 0,2 s · alcance: 12 u · dano: 60%

- **Teleporte** (`blink`) — ativa · implementado · nível 1 · até 3 pontos
  Libera o Teleporte: salta até 7 u na direção da mira, sem atravessar paredes, e deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. −1 s de recarga por ponto. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (padrão: R / 5) · elemento: arcano · custo: 15 mana · recarga: 8 s · preparação: 0,15 s · alcance: 7 u · raio: 2,2 u · dano: 50%

- **Setas Perseguidoras** (`setasPerseguidoras`) — ativa · implementado · nível 4 · até 5 pontos
  Cinco setas arcanas em leque de 70°, com 40% do dano cada. Cada seta vira até 6 rad/s em direção ao inimigo mais próximo à frente dela, até 7 u. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: leque à frente · elemento: arcano · custo: 20 mana · recarga: 6 s · preparação: 0,2 s · alcance: 12 u · dano: 40% × 5
  - Requer: Seta Arcana
  - Por ponto: +10% de dano por seta (a partir do segundo ponto)
  - Leitura no combate: As setas curvam no ar.
  - Decisão: Dano espalhado sem mira precisa; contra um alvo só, a Seta Arcana rende mais.

- **Eco Arcano** (`echo`) — sinergia · implementado · nível 4 · até 3 pontos
  +25% de dano do eco do Teleporte por ponto. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Requer: Teleporte
  - Notas:  O próprio Teleporte já recebe os +25% por ponto do Eco; não soma mais 2% por esse mesmo investimento.

- **Raio Arcano** (`lazerArcano`) — ativa · implementado · nível 16 · até 5 pontos
  Canalizado: enquanto a tecla fica pressionada, o cajado dispara um raio de 12 u e 0,6 u de largura que atravessa inimigos e para em paredes, com 30% do dano a cada 0,2 s. Custa 10 mana ao começar e 12 mana por segundo, dura até 4 s e recarrega 8 s depois de soltar. O Mago anda a 30%. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra (segurar) · alvo: direção da mira · elemento: arcano · custo: 10 mana · recarga: 8 s · preparação: 0,25 s · duração: 4 s · alcance: 12 u · raio: 0,3 u · dano: 30% a cada 0,2 s (150% por segundo)
  - Requer: Setas Perseguidoras
  - Por ponto: +10% de dano (a partir do segundo ponto)
  - Leitura no combate: Linha fina roxa por 0,25 s antes do raio abrir.
  - Decisão: Muito dano numa fila, mas quase parado: use quando a horda vier em linha ou atrás da Muralha.
  - Notas: Soltar a tecla, ficar sem mana, esquivar ou chegar a 4 s encerra o raio; a recarga começa nessa hora.

- **Escudo Arcano** (`escudoArcano`) — ativa · implementado · nível 10 · até 5 pontos
  Por 12 s, desvia para a mana 10% por ponto do dano recebido após as defesas, até 50% com cinco pontos. Cada ponto de dano desviado custa 1 MP. A parte não paga por falta de mana atinge a vida normalmente. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: próprio Mago · custo: 0 mana · recarga: 20 s · preparação: 0,3 s · duração: 12 s
  - Requer: Eco Arcano
  - Por ponto: +10 pontos percentuais de dano desviado para mana (máximo 50%)
  - Notas: Sem imunidade ao esgotar mana. Morte e troca de cena encerram; não acumula escudos.

- **Big Bang** (`bigBang`) — ativa · implementado · nível 22 · até 5 pontos
  Lança uma esfera arcana lenta (7 u/s), até 14 u. Ao tocar inimigo, parede ou fim do alcance, explode em raio 4 com 360% do dano mágico. +10% de dano por ponto depois do primeiro. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: arcano · custo: 50 mana · recarga: 12 s · preparação: 0,5 s · alcance: 14 u · raio: 4 u · dano: 360%
  - Requer: Raio Arcano
  - Por ponto: +10% de dano depois do primeiro ponto

- **Clone Arcano** (`clone`) — evocação · implementado · nível 16 · até 5 pontos
  Cria um clone no ponto mirado (até 7 u) por 12 s. Ele fica parado e repete, da própria posição e mirando o mesmo ponto, a Seta Arcana e cada feitiço que o Mago lança, com 50% do dano e sem custo. Tem 50% da vida máxima do Mago; inimigos a menos de 5 u passam a atacá-lo. Só um clone por vez. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: arcano · custo: 50 mana · recarga: 40 s · preparação: 0,35 s · duração: 12 s · alcance: 7 u · dano: 50% dos feitiços do Mago
  - Requer: Escudo Arcano
  - Por ponto: +10 pontos percentuais do dano copiado depois do primeiro (50% a 90% antes das sinergias)
  - Leitura no combate: Silhueta roxa translúcida do Mago; cada feitiço copiado sai com um eco roxo.
  - Decisão: Dobra o dano onde você posicionar: deixe o clone num flanco e lute do outro lado para cruzar os feitiços.
  - Notas: Não repete Teleporte, Imbuir, Raio Arcano nem evocações. Usa o modelo do Mago com tinta roxa. A sinergia de Arcano soma bônus sobre a cópia base de 50%; o valor final pode superar 90%. Não repete evocações nem cria outros clones.

### Passivas — Estudo e paciência

- **Intelecto** (`intellect`) — passiva · implementado · nível 1 · até 5 pontos
  +8% de dano mágico por ponto.

- **Vitalidade** (`vitality`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de vida máxima por ponto.

- **Sabedoria** (`wisdom`) — passiva · implementado · nível 1 · até 5 pontos
  +10% de mana máxima por ponto.

- **Meditação** (`meditation`) — passiva · implementado · nível 1 · até 5 pontos
  +15% de regeneração de mana por ponto.

- **Fôlego** (`regeneration`) — passiva · implementado · nível 1 · até 5 pontos
  +0,4 de vida por segundo por ponto.

