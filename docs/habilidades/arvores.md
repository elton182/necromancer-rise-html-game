# Árvores de habilidades

> Gerado por `tools/skill-tree-editor.html` a partir de `docs/habilidades/arvores.json` (fonte da verdade). Não edite este arquivo à mão.

Atualizado em 2026-11-08.

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

- **Carne Reanimada** (`vigor`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Aumenta a vida de Zumbis e Abominações.
  - Requer: Zumbis
  - Por ponto: +10 Vida de Zumbis e Abominações

- **Explosão Cadavérica** (`burst`) — aperfeiçoamento · implementado · nível 6 · até 5 pontos
  Desbloqueia a detonação e aumenta seu dano. Cada ponto investido também dá +4% ao Salto Devastador da Abominação.
  - Requer: Zumbis
  - Por ponto: +12 Dano da explosão de Zumbi; +4 Dano do Salto Devastador; +3 Tamanho da área de explosão
  - Notas: Tamanho da área de explosão: +3% por ponto no raio da explosão dos zumbis e da Explosão Necrótica (só na v2).

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

Recurso: **vigor** · 19 nós · 57 pontos para completar.

### Espada — Precisão e impacto

- **Slash · Três cortes** (`slash`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano dos cortes por ponto. O ataque básico já está disponível.
  - Uso: tecla: Clique esquerdo · alvo: cone à frente (144°) · elemento: físico · custo: 0 vigor · recarga: 0,6 s · alcance: 2,6 u · dano: 55% / 65% / 90% (três cortes)

- **Estocada** (`thrust`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a estocada (botão direito / 2): avança até 7 u na direção da mira e perfura até 3,4 u à frente, com 220% do dano. +10% de dano por ponto.
  - Uso: tecla: Botão direito / 2 · alvo: linha à frente · elemento: físico · custo: 20 vigor · recarga: 5 s · alcance: 10,4 u · raio: 0,85 u · dano: 220%
  - Notas: Alcance total 10,4 u = avanço de até 7 u + ponta de 3,4 u (antes: avanço de até 5 u).

- **Ímpeto** (`momentum`) — sinergia · implementado · nível 4 · até 3 pontos
  Completar os três cortes fortalece em 10% por ponto a próxima estocada, por 4 s.
  - Requer: Slash · Três cortes

- **Onda de Aço** (`steelWave`) — aperfeiçoamento · implementado · nível 10 · até 1 ponto
  O terceiro corte do Slash lança uma onda em linha reta de 7 u, com 180% do dano. Atravessa inimigos e para em paredes. Sem custo; recarga própria de 8 s.
  - Uso: tecla: Automática: terceiro corte do Slash · alvo: linha à frente · elemento: físico · custo: 0 vigor · recarga: 8 s · alcance: 7 u · dano: 180%
  - Requer: Slash · Três cortes
  - Leitura no combate: Arcos curtos em sequência mostram a posição real da onda.
  - Decisão: Recompensa completar o combo de três cortes em vez de interromper com outras ações.
  - Notas: Deixou de ocupar slot da barra: barras salvas com a Onda de Aço recebem outra ação no lugar.

- **Corte tornado** (`tornado`) — ativa · implementado · nível 6 · até 1 ponto
  Segure R/5: golpes circulares com gasto contínuo de vigor.
  - Uso: tecla: R / 5 · alvo: área ao redor · elemento: físico · custo: 12 vigor · recarga: 3 s · raio: 2,7 u · dano: 65% por giro (a cada 0,3 s)
  - Requer: Estocada
  - Notas: Custo contínuo: 12 vigor/s enquanto segura.

- **Ciclone** (`tornadoCyclone`) — variante · implementado · nível 12 · até 1 ponto
  Variante do Tornado: raio de 3,7 em vez de 2,7, mas movimento de 40% em vez de 55%. Só uma variante fica ativa.
  - Requer: Corte tornado

- **Turbilhão** (`tornadoWhirl`) — variante · implementado · nível 12 · até 1 ponto
  Variante do Tornado: acerta a cada 0,2 s em vez de 0,3 s, mas gasta 16 vigor/s em vez de 12. Só uma variante fica ativa.
  - Requer: Corte tornado

### Escudo — Guarda e retaliação

- **Golpe de escudo** (`bash`) — ativa · implementado · nível 1 · até 3 pontos
  Libera o golpe de escudo (3 / Q). +10% de dano por ponto.
  - Uso: tecla: 3 / Q · alvo: cone à frente (117°) · elemento: físico · custo: 15 vigor · recarga: 7 s · alcance: 1,8 u · dano: 130%

- **Guarda treinada** (`shieldDefense`) — passiva · implementado · nível 1 · até 5 pontos
  +3 pontos percentuais de bloqueio com escudo por ponto

- **Arremesso de escudo** (`shieldThrow`) — ativa · implementado · nível 6 · até 1 ponto
  T/6: escudo atinge na ida e no retorno. Sem bloqueio enquanto está no ar.
  - Uso: tecla: T / 6 · alvo: direção da mira · elemento: físico · custo: 20 vigor · recarga: 7 s · alcance: 8 u · dano: 120% (ida e volta)
  - Requer: Golpe de escudo

- **Retaliação** (`riposte`) — sinergia · implementado · nível 4 · até 3 pontos
  Bloquear fortalece em 10% por ponto o próximo golpe de escudo, por 4 s.
  - Requer: Guarda treinada

- **Ricochete** (`ricochet`) — sinergia · implementado · nível 8 · até 3 pontos
  O Arremesso salta para o inimigo mais próximo em até 6 u: um salto por ponto, com 20% menos dano a cada salto. Mais saltos deixam você mais tempo sem escudo.
  - Requer: Arremesso de escudo

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

- **Brado de Guerra** (`warCry`) — ativa · implementado · nível 14 · até 1 ponto
  Reduz em 30% a velocidade dos inimigos em raio de 6 por 4 s e dobra a recuperação de vigor por 6 s. Recarga de 18 s. Equipe em um slot da barra.
  - Uso: tecla: Slot da barra · alvo: área ao redor · custo: 0 vigor · recarga: 18 s · duração: 4 s · raio: 6 u · dano: —

## Druida

_A floresta não esquece. Ela espera, e então responde._

Recurso: **mana** · 19 nós · 53 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Tempestade — O céu responde

- **Faísca** (`spark`) — ativa · implementado · nível 1 · até 5 pontos
  Raio instantâneo no primeiro inimigo da linha. O ataque básico já está disponível. +6% de dano por ponto.
  - Uso: tecla: Clique esquerdo · alvo: primeiro inimigo da linha · elemento: raio · custo: 0 mana · recarga: 0,55 s · alcance: 10 u · dano: 45%

- **Turbilhão** (`turbilhao`) — ativa · implementado · nível 2 · até 5 pontos
  Lança um turbilhão que avança 9 u em linha reta a 10 u/s, atravessando inimigos: 60% do dano em cada um (uma vez) e empurrão de 0,6 u para os lados. Para em paredes. +8% de dano por ponto.
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: vento · custo: 12 mana · recarga: 4 s · preparação: 0,2 s · alcance: 9 u · raio: 0,9 u · dano: 60% por inimigo
  - Por ponto: +8% de dano por ponto
  - Leitura no combate: Arcos de vento giram na posição real do turbilhão.
  - Decisão: Afasta quem cerca a Druida e acerta a fila inteira, com menos dano que a Faísca.
  - Notas: Tirado do clique esquerdo, que é da Faísca. Os números iniciais (custo 0, recarga 0,55 s, 45%) vieram da Faísca; ajustar para uma habilidade de slot.

- **Corrente de Raios** (`chain`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Corrente: o raio salta entre inimigos próximos. Cada ponto acrescenta um salto.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · alvo: inimigo na mira + saltos · elemento: raio · custo: 22 mana · recarga: 4 s · alcance: 10 u · dano: 120%, −20% por salto
  - Requer: Faísca

- **Tornado** (`tornado`) — ativa · implementado · nível 6 · até 1 ponto
  Ergue um tornado no ponto mirado, até 10 u. Por 4 s ele anda devagar (1,2 u/s) na direção da mira, puxa para o centro quem estiver a até 1,8 u (chefes não) e causa 25% do dano a cada 0,4 s. Para em paredes.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: vento · custo: 30 mana · recarga: 4 s · preparação: 0,35 s · duração: 4 s · alcance: 10 u · raio: 1,8 u · dano: 25% a cada 0,4 s
  - Requer: Turbilhão
  - Leitura no combate: Anel no chão e arcos de vento girando na posição real do tornado.
  - Decisão: Agrupa inimigos para a Tempestade e as Raízes.

- **Tempestade** (`storm`) — ativa · implementado · nível 6 · até 1 ponto
  Nuvem fixa no ponto mirado que derruba raios nos inimigos dentro da área por 4 s. Saia da área ou fique nela: os raios só caem ali.
  - Uso: tecla: Slot da barra (padrão: R / 5) · alvo: ponto mirado · elemento: raio · custo: 35 mana · recarga: 4 s · duração: 4 s · alcance: 10 u · raio: 3,5 u · dano: 60% a cada 0,5 s (até 3 alvos)
  - Requer: Corrente de Raios

- **Furacão** (`furacao`) — aperfeiçoamento · implementado · nível 12 · até 1 ponto
  O Tornado vira Furacão: raio 2,7 e 6 s de duração. Ao terminar, explode com 120% do dano em raio 2,7 e empurra os inimigos 1,5 u para fora.
  - Uso: tecla: Automática (Tornado) · elemento: vento · duração: 6 s · raio: 2,7 u · dano: 120% na explosão final
  - Requer: Tornado
  - Leitura no combate: O anel do tornado fica maior; a explosão final abre um anel de vento.
  - Decisão: Mais tempo agrupando, com um empurrão no fim que pode tirar inimigos de cima da Druida.

### Natureza — Raízes que prendem

- **Raízes** (`roots`) — ativa · implementado · nível 1 · até 3 pontos
  Libera as Raízes: espinhos brotam no ponto mirado e prendem os inimigos no lugar. Presos ainda atacam quem estiver ao alcance. +10% de dano e +0,3 s de prisão por ponto.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · alvo: ponto mirado · elemento: natureza · custo: 18 mana · recarga: 4 s · duração: 2 s · alcance: 10 u · raio: 2,4 u · dano: 80%

- **Casca de Espinhos** (`thornbind`) — sinergia · implementado · nível 4 · até 3 pontos
  Inimigos presos pelas Raízes recebem +10% de dano por ponto, de qualquer fonte.
  - Requer: Raízes

- **Rejuvenescer** (`rejuvenate`) — ativa · implementado · nível 6 · até 1 ponto
  Brotos curam 30% da vida máxima ao longo de 5 s. Só na forma humana; transformar-se não interrompe a cura.
  - Uso: tecla: Slot da barra (padrão: T / 6) · alvo: próprio · elemento: natureza · custo: 25 mana · recarga: 4 s · duração: 5 s · dano: cura 30% da vida máxima
  - Requer: Raízes

### Selvagem — A fera sob a pele

- **Forma de Lobo** (`wolf`) — ativa · implementado · nível 1 · até 3 pontos
  F: transforma em lobisomem. Garras corpo a corpo, 20% menos dano recebido e 35% mais movimento, mas sem magias. A forma consome mana e cada golpe de garra devolve 3. +8% de dano das garras por ponto.
  - Uso: tecla: F · alvo: próprio
  - Notas: Consome mana enquanto ativa (4/s base).

- **Salto Feroz** (`leap`) — ativa · implementado · nível 4 · até 1 ponto
  Na forma de lobo (botão direito / 2): salta até 6 u e atinge a área de pouso.
  - Uso: tecla: Botão direito / 2 (lobo) · alvo: ponto mirado · custo: 15 mana · recarga: 4 s · alcance: 6 u · raio: 2,2 u · dano: 150%
  - Requer: Forma de Lobo

- **Coração Selvagem** (`wildHeart`) — aperfeiçoamento · implementado · nível 6 · até 3 pontos
  A forma de lobo consome 1 mana por segundo a menos por ponto (de 4/s para até 1/s).
  - Requer: Forma de Lobo

- **Corte Sangrento** (`corteSangrento`) — ativa · implementado · nível 6 · até 1 ponto
  Na forma de lobo (R / 5): garra em arco à frente, até 2,6 u, com 90% do dano. Os atingidos sangram, perdendo 15% do dano a cada 0,5 s por 4 s. Um novo corte renova o sangramento, sem somar.
  - Uso: tecla: R / 5 (lobo) · alvo: arco à frente · elemento: sangue · custo: 12 mana · recarga: 4 s · preparação: 0,2 s · duração: 4 s · alcance: 2,6 u · dano: 90% + 15% a cada 0,5 s
  - Requer: Salto Feroz
  - Leitura no combate: Anel vermelho sob quem está sangrando.
  - Decisão: Marque vários inimigos e siga lutando: o sangramento trabalha enquanto o lobo troca de alvo.

- **Garra de Gelo** (`garraDeGelo`) — ativa · implementado · nível 8 · até 1 ponto
  Na forma de lobo (T / 6): garra gelada em cone estreito, até 3 u, com 130% do dano. Os atingidos ficam 50% mais lentos por 2,5 s; chefes recebem só o dano.
  - Uso: tecla: T / 6 (lobo) · alvo: cone estreito à frente · elemento: gelo · custo: 15 mana · recarga: 4 s · preparação: 0,2 s · duração: 2,5 s · alcance: 3 u · dano: 130%
  - Requer: Salto Feroz
  - Leitura no combate: Anel azul-claro sob os inimigos gelados.
  - Decisão: Segura quem foge ou quem vem pelas costas enquanto o lobo trabalha.

- **Uivo** (`howl`) — ativa · implementado · nível 8 · até 1 ponto
  Na forma de lobo (3 / Q): inimigos em 6 u ficam 35% mais lentos por 3 s e as garras causam +25% de dano por 6 s.
  - Uso: tecla: 3 / Q (lobo) · alvo: área ao redor · custo: 0 mana · recarga: 4 s · duração: 3 s · raio: 6 u
  - Requer: Salto Feroz

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

Recurso: **foco** · 15 nós · 47 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Arco — Cada flecha conta

- **Disparo** (`shot`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano do Disparo por ponto. O ataque básico já está disponível.
  - Uso: tecla: Clique esquerdo · elemento: físico · custo: 0 foco · recarga: 0,5 s · preparação: 0,26 s · alcance: 13 u · dano: 85%

- **Flecha Perfurante** (`pierce`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Flecha Perfurante: carrega 0,55 s, andando a metade da velocidade, e atravessa todos os inimigos da linha, com 200% do dano. +10% de dano por ponto.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · elemento: físico · custo: 20 foco · recarga: 5 s · preparação: 0,55 s · alcance: 16 u · dano: 200%

- **Tiro Seguidor** (`fan`) — ativa · implementado · nível 4 · até 1 ponto
  Cinco flechas em cone de 50°, com 70% do dano cada. Cada flecha curva em direção ao inimigo mais próximo à frente dela, até 6 u. Bom contra grupos espalhados.
  - Uso: tecla: Slot da barra (padrão: T / 6) · elemento: físico · custo: 22 foco · recarga: 7 s · preparação: 0,26 s · alcance: 10 u · raio: 0,18 u · dano: 70% × 5
  - Requer: Disparo
  - Leitura no combate: As flechas curvam no ar em direção aos alvos.
  - Decisão: Cobre vários alvos espalhados; contra um alvo só, a Saraivada Seguidora rende mais.
  - Notas: Renomeado de Leque (id fan preservado nos saves).

- **Chuva de Flechas** (`rain`) — ativa · implementado · nível 6 · até 1 ponto
  Marca uma área de raio 3 no ponto mirado, até 12 u. Depois de 0,7 s caem cinco ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro.
  - Uso: tecla: Slot da barra (padrão: R / 5) · elemento: físico · custo: 35 foco · recarga: 12 s · preparação: 0,35 s · alcance: 12 u · raio: 3 u · dano: 45% × 5 ondas
  - Requer: Flecha Perfurante

- **Saraivada Seguidora** (`saraivadaSeguidora`) — ativa · implementado · nível 8 · até 1 ponto
  Trava no inimigo mais perto da mira (até 3,5 u dela e 13 u de você) e dispara cinco flechas em sequência, uma a cada 0,12 s, que perseguem esse alvo, com 45% do dano cada. Se ele cair, as restantes buscam o inimigo mais próximo.
  - Uso: tecla: Slot da barra · alvo: inimigo perto da mira · elemento: físico · custo: 25 foco · recarga: 9 s · preparação: 0,2 s · alcance: 13 u · dano: 45% × 5
  - Requer: Tiro Seguidor
  - Leitura no combate: Anel dourado sob o alvo travado durante a rajada.
  - Decisão: Dano concentrado num alvo: ótimo contra elites e chefes, fraco contra grupos.

### Caça — Nunca onde esperam

- **Recuo** (`leap`) — ativa · implementado · nível 1 · até 3 pontos
  Libera o Recuo: salto de 5 u para trás, de frente para a mira. Inimigos a até 2,5 u do ponto de partida ficam 35% mais lentos por 2 s. −0,5 s de recarga por ponto.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · elemento: físico · custo: 15 foco · recarga: 6 s · preparação: 0,05 s · duração: 2 s · alcance: 5 u

- **Falcão** (`falcon`) — ativa · implementado · nível 2 · até 3 pontos
  Um falcão acompanha a Arqueira. A cada 2,5 s ele mergulha no inimigo mais próximo dela, até 8 u, com 35% do dano. F: manda o falcão ao inimigo mais perto da mira (até 3,5 u da mira e 14 u de você), com 120% do dano; o alvo fica marcado por 4 s e recebe +15% de dano das flechas. Recarga de 8 s, 10 foco. +10% de dano do falcão por ponto.
  - Uso: tecla: F (comando) · alvo: inimigo perto da mira · custo: 10 foco · recarga: 8 s · alcance: 14 u · dano: 35% automático, 120% no comando

- **Tiro de Emboscada** (`ambush`) — sinergia · implementado · nível 4 · até 3 pontos
  Depois do Recuo, o próximo Disparo, Flecha Perfurante ou Tiro Seguidor em até 3 s causa +15% de dano por ponto.
  - Requer: Recuo

- **Impacto Celeste** (`impactoCeleste`) — ativa · implementado · nível 8 · até 1 ponto
  Marca uma área de raio 2,5 no ponto mirado, até 12 u. O falcão mergulha e, 0,9 s depois, atinge a área com 150% do dano e empurra os inimigos 1 u. Até o impacto, o falcão não ataca sozinho.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: físico · custo: 25 foco · recarga: 12 s · preparação: 0,3 s · duração: 0,9 s · alcance: 12 u · raio: 2,5 u · dano: 150%
  - Requer: Falcão
  - Leitura no combate: Anel no chão durante a descida do falcão.
  - Decisão: Dano em área com atraso: mire onde o grupo vai estar.

- **Penas Voadoras** (`penasVoadoras`) — ativa · implementado · nível 4 · até 1 ponto
  O falcão lança seis penas nos inimigos mais próximos da Arqueira, até 8 u, uma por alvo, com 40% do dano cada. Sem alvos suficientes, as penas restantes seguem a mira.
  - Uso: tecla: Slot da barra · alvo: inimigos perto da Arqueira · elemento: físico · custo: 15 foco · recarga: 7 s · preparação: 0,3 s · alcance: 8 u · dano: 40% × 6
  - Requer: Falcão
  - Leitura no combate: Penas claras saem do falcão em direção a cada alvo.
  - Decisão: Limpa inimigos fracos que cercam a Arqueira sem precisar mirar.

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

Recurso: **vigor** · 14 nós · 47 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Besta — Peso e alcance

- **Virote pesado** (`quarrel`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano do Virote pesado por ponto. O ataque básico já está disponível.
  - Uso: tecla: Clique esquerdo · elemento: físico · custo: 0 vigor · recarga: 0,8 s · preparação: 0,36 s · alcance: 12 u · dano: 150%

- **Rajada** (`volley`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Rajada: três virotes em sequência, a cada 0,15 s, com 70% do dano cada e atravessando um inimigo. +10% de dano por ponto.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · elemento: físico · custo: 24 vigor · recarga: 7 s · preparação: 0,25 s · alcance: 12 u · raio: 0,2 u · dano: 70% × 3

- **Perfuração** (`breach`) — sinergia · implementado · nível 4 · até 2 pontos
  O Virote pesado atravessa +1 inimigo por ponto, ainda perdendo 25% a cada um.
  - Requer: Virote pesado

### Pólvora e Armadilhas — Pavio curto, problema longo

- **Bomba de fragmentação** (`bomb`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Bomba: arremesso em arco até 9 u. O ponto de queda fica marcado no chão durante o voo; ao cair, explode em raio 2,6 com 160% do dano e empurra 1 u. +10% de dano por ponto.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · elemento: físico · custo: 20 vigor · recarga: 6 s · preparação: 0,3 s · alcance: 9 u · raio: 2,6 u · dano: 160%

- **Rede de Caça** (`redeDeCaca`) — ativa · implementado · nível 2 · até 3 pontos
  Arremesso em arco até 9 u. O ponto de queda fica marcado no chão; a rede cobre raio 2,4, causa 30% do dano e deixa os inimigos 50% mais lentos por 3 s (+0,5 s por ponto depois do primeiro). Chefes recebem o dano, mas não ficam lentos.
  - Uso: tecla: Slot da barra · alvo: ponto mirado · elemento: físico · custo: 15 vigor · recarga: 9 s · preparação: 0,3 s · duração: 3 s · alcance: 9 u · raio: 2,4 u · dano: 30%
  - Por ponto: +0,5 s de lentidão por ponto depois do primeiro
  - Leitura no combate: Marca de queda durante o voo; anel bege sob quem está na rede.
  - Decisão: Prepara a Bomba e a Mina: inimigos lentos ficam mais tempo na área.

- **Estilhaços** (`shrapnel`) — sinergia · implementado · nível 4 · até 3 pontos
  +12% de raio da Bomba e da Mina por ponto.
  - Requer: Bomba de fragmentação

- **Molotov** (`firebomb`) — ativa · implementado · nível 6 · até 1 ponto
  Arremesso em arco até 9 u que incendeia o chão em raio 2,4 por 4 s. A cada 0,5 s, 30% do dano em quem estiver dentro.
  - Uso: tecla: Slot da barra (padrão: T / 6) · elemento: fogo · custo: 30 vigor · recarga: 12 s · preparação: 0,3 s · duração: 4 s · alcance: 9 u · raio: 2,4 u · dano: 30%
  - Requer: Bomba de fragmentação
  - Notas: Renomeado de Garrafa incendiária (id firebomb preservado nos saves).

- **Mina de pólvora** (`mine`) — ativa · implementado · nível 6 · até 1 ponto
  Assenta uma mina aos seus pés. Arma em 1 s e explode quando um inimigo chega a 1,4 u: raio 3 e 220% do dano. Até duas minas; cada uma dura 25 s.
  - Uso: tecla: Slot da barra (padrão: R / 5) · elemento: físico · custo: 25 vigor · recarga: 9 s · preparação: 0,4 s · duração: 25 s · raio: 3 u · dano: 220%
  - Requer: Bomba de fragmentação

- **Armadilha de Urso** (`armadilhaDeUrso`) — ativa · implementado · nível 6 · até 1 ponto
  Assenta uma armadilha aos seus pés. Arma em 0,6 s e fecha quando um inimigo chega a 0,9 u: 120% do dano e o prende por 2 s (chefes ficam 50% mais lentos). Até duas armadilhas; cada uma dura 30 s.
  - Uso: tecla: Slot da barra · alvo: aos seus pés · elemento: físico · custo: 20 vigor · recarga: 10 s · preparação: 0,4 s · duração: 2 s · raio: 0,9 u · dano: 120%
  - Requer: Rede de Caça
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

Recurso: **mana** · 17 nós · 53 pontos para completar.

Decisão (08/11/2026): a barra passa a ser montável, como a do Guerreiro (6 slots para mais ações), para comportar as habilidades novas da árvore.

### Fogo — Rápido e sem perdão

- **Bola de Fogo** (`fireball`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Bola de Fogo: explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance, em raio 2,2, com 140% do dano. +10% de dano por ponto.
  - Uso: tecla: Slot da barra (padrão: botão direito / 2) · elemento: fire · custo: 18 mana · recarga: 4 s · preparação: 0,3 s · alcance: 12 u · raio: 2,2 u · dano: 140%

- **Combustão** (`combustion`) — sinergia · implementado · nível 4 · até 3 pontos
  A Bola de Fogo deixa o chão em chamas por 1 s por ponto, com 25% do dano a cada 0,5 s.
  - Requer: Bola de Fogo

- **Meteoro** (`meteor`) — ativa · implementado · nível 6 · até 1 ponto
  Marca uma área de raio 2,8 no ponto mirado, até 12 u. Uma bola de fogo cai do céu e, depois de 1 s, causa 320% do dano em quem estiver dentro. O chão fica em chamas por 3 s (raio 2,4): 20% do dano a cada 0,5 s.
  - Uso: tecla: Slot da barra (padrão: T / 6) · elemento: fire · custo: 40 mana · recarga: 4 s · preparação: 0,45 s · duração: 3 s · alcance: 12 u · raio: 2,8 u · dano: 320% no impacto + 20% a cada 0,5 s por 3 s
  - Requer: Bola de Fogo
  - Leitura no combate: Marca no chão e a bola de fogo descendo em diagonal, com a sombra crescendo até o impacto; depois, o chão queimando.

- **Familiar de Fogo** (`familiarDeFogo`) — evocação · implementado · nível 8 · até 1 ponto
  Invoca um espírito de fogo que acompanha o Mago por 20 s. A cada 1,2 s ele lança uma pequena bola de fogo no inimigo mais próximo do Mago, até 9 u, com 40% do dano e explosão de raio 1,2 (com a Combustão, o chão também queima). Lançar de novo renova o espírito.
  - Uso: tecla: Slot da barra · alvo: inimigo mais próximo · elemento: fogo · custo: 35 mana · recarga: 25 s · preparação: 0,35 s · duração: 20 s · alcance: 9 u · raio: 1,2 u · dano: 40% por bola de fogo
  - Requer: Combustão
  - Leitura no combate: Brilho laranja orbitando o Mago; cada bola de fogo é um projétil visível.
  - Decisão: Dano contínuo enquanto o Mago se move e desvia.

### Gelo — Devagar, para sempre

- **Rajada de Gelo** (`frost`) — ativa · implementado · nível 1 · até 3 pontos
  Libera a Rajada de Gelo: cone de 70° e 6 u à frente, com 110% do dano, que deixa os inimigos 40% mais lentos por 3 s. +10% de dano por ponto.
  - Uso: tecla: Slot da barra (padrão: 3 / Q) · elemento: frost · custo: 20 mana · recarga: 7 s · preparação: 0,22 s · duração: 3 s · alcance: 6 u · dano: 110%

- **Estilhaçar** (`shatter`) — sinergia · implementado · nível 4 · até 3 pontos
  Inimigos lentos pela Rajada de Gelo recebem +10% de dano por ponto do fogo e do arcano.
  - Requer: Rajada de Gelo

- **Esfera de Gelo** (`esferaDeGelo`) — ativa · implementado · nível 6 · até 1 ponto
  Lança um pequeno planeta de gelo com anéis, que atravessa o campo bem devagar (2 u/s) por até 10 u e para em paredes. Fere uma vez quem toca (50%) e, girando, solta dois cristais opostos a cada 0,15 s em espiral; os cristais curvam para inimigos a até 3 u, com 20% do dano e 20% de lentidão por 1 s (conta para o Estilhaçar).
  - Uso: tecla: Slot da barra · alvo: direção da mira · elemento: gelo · custo: 30 mana · recarga: 4 s · preparação: 0,25 s · duração: 5 s · alcance: 10 u · raio: 1,1 u · dano: 50% no contato; cristais de 20%
  - Requer: Rajada de Gelo
  - Leitura no combate: Planeta azul com dois anéis inclinados e sombra no chão; os cristais saem girando da borda.
  - Decisão: Lento e longo: atire pelo meio do grupo ou na rota por onde os inimigos vêm.

- **Golem de Gelo** (`golemDeGelo`) — evocação · implementado · nível 10 · até 1 ponto
  Invoca um golem de gelo ao lado do Mago por 25 s. Ele tem 120% da vida máxima do Mago, avança no inimigo mais próximo e golpeia a cada 1,4 s com 70% do dano mágico, deixando o alvo 30% mais lento por 1,5 s. Inimigos perto dele passam a atacá-lo. Só um golem por vez.
  - Uso: tecla: Slot da barra · alvo: ao lado do Mago · elemento: gelo · custo: 40 mana · recarga: 30 s · preparação: 0,35 s · duração: 25 s · alcance: 1,8 u · dano: 70% por golpe
  - Requer: Esfera de Gelo
  - Leitura no combate: Golem azul-gelo; anel azul sob quem ele desacelerou.
  - Decisão: Um escudo que anda: invoque antes de o grupo chegar para ganhar distância.

### Arcano — O caminho mais curto

- **Seta Arcana** (`bolt`) — ativa · implementado · nível 1 · até 5 pontos
  +6% de dano da Seta Arcana por ponto. O ataque básico já está disponível.
  - Uso: tecla: Clique esquerdo · elemento: arcane · custo: 0 mana · recarga: 0,45 s · preparação: 0,2 s · alcance: 12 u · dano: 60%

- **Teleporte** (`blink`) — ativa · implementado · nível 1 · até 3 pontos
  Libera o Teleporte: salta até 7 u na direção da mira, sem atravessar paredes, e deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. −1 s de recarga por ponto.
  - Uso: tecla: Slot da barra (padrão: R / 5) · elemento: arcane · custo: 15 mana · recarga: 8 s · preparação: 0,15 s · alcance: 7 u · raio: 2,2 u · dano: 50%

- **Eco Arcano** (`echo`) — sinergia · implementado · nível 4 · até 3 pontos
  +25% de dano do eco do Teleporte por ponto.
  - Requer: Teleporte

- **Setas Perseguidoras** (`setasPerseguidoras`) — ativa · implementado · nível 4 · até 1 ponto
  Cinco setas arcanas em leque de 70°, com 40% do dano cada. Cada seta vira até 6 rad/s em direção ao inimigo mais próximo à frente dela, até 7 u.
  - Uso: tecla: Slot da barra · alvo: leque à frente · elemento: arcano · custo: 20 mana · recarga: 6 s · preparação: 0,2 s · alcance: 12 u · dano: 40% × 5
  - Requer: Seta Arcana
  - Leitura no combate: As setas curvam no ar.
  - Decisão: Dano espalhado sem mira precisa; contra um alvo só, a Seta Arcana rende mais.

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

