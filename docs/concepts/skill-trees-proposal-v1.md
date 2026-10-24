# Árvores de habilidades — proposta para validação

Conceito visual, sem alterações no jogo. Gerado com a ferramenta integrada image_gen.

Mockup: skill-trees-frame-v1.png. As conexões e ilustrações do mockup são indicativas; não representam o grafo final de pré-requisitos.

## Regras propostas

- Duas árvores: Minions e Spells, com três escolas cada.
- Cada subida de nível concede 3 pontos compartilhados entre as árvores.
- Remover coleta e custos de souls. Mana continua como recurso de combate.
- Levar melhorias avulsas do personagem às árvores; Personagem fica com atributos e equipamentos.
- Proposta inicial: até 5 pontos por nó, primeiro ponto desbloqueia, demais aprimoram. Quantidade de invocações cresce por marcos, não a cada ponto.
- Desbloqueios por nível e pré-requisitos ainda serão definidos. Não conceder simultaneamente a mesma habilidade pela campanha e cobrar seu desbloqueio na árvore.
- Sinergias usam somente pontos investidos diretamente, sem recursão; quantidade de zumbis não aumenta quantidade de abominações.
- Saves antigos: redistribuição de pontos pela nova progressão de nível; não converter souls em pontos adicionais.

## Minions

| Escola | Habilidade | Efeito proposto |
|---|---|---|
| Carne | Zumbis | Evoca o grupo básico; pontos aumentam dano e concedem sinergia de dano à Abominação. |
| Carne | Carne Reanimada | Vida e regeneração para Zumbis e Abominações. |
| Carne | Explosão Cadavérica | Comanda a detonação de um zumbi; mais pontos melhoram dano e área. |
| Carne | Abominação | Evolução desbloqueada no ramo dos Zumbis, equipada como evocação própria; herda melhorias da escola de Carne. |
| Carne | Salto Devastador | Comando de salto da Abominação, com impacto em área. |
| Ossos | Esqueletos Guerreiros | Evoca combatentes de corpo a corpo. |
| Ossos | Ossos Afiados | Melhora dano dos guerreiros e arqueiros. |
| Ossos | Esqueletos Arqueiros | Desbloqueia a variante de ataque à distância. |
| Ossos | Tiro Sepulcral | Comanda um disparo poderoso dos arqueiros. |
| Ossos | Salva Sepulcral | Aumenta arqueiros por grupo em marcos de investimento; melhora a salva. |
| Espíritos | Espectros | Evoca aliados de dano mágico. |
| Espíritos | Essência Etérea | Aumenta dano e resistência dos Espectros. |
| Espíritos | Drenar Vida | Ataques dos Espectros recuperam a própria vida. |
| Espíritos | Passo Espectral | Comando de reposicionamento dos Espectros. |
| Espíritos | Cortejo dos Mortos | Aumenta quantidade por marcos e melhora a recuperação dos Espectros. |

## Spells

| Escola | Habilidade | Efeito proposto |
|---|---|---|
| Ossos | Tiro de Osso | Projétil principal de dano direto. |
| Ossos | Perfuração | Permite atravessar mais alvos em marcos de investimento. |
| Ossos | Chuva de Ossos | Fragmentos em área. |
| Ossos | Estilhaços | Melhora fragmentos da Chuva e dano do Tiro. |
| Ossos | Muralha de Corpos | Bloqueia inimigos e projéteis; pontos melhoram duração e resistência. |
| Sangue | Escudo de Carne | Sacrifica um zumbi para proteger Zephyr. |
| Sangue | Vitalidade Profana | Aumenta vida máxima de Zephyr e eficácia do Escudo. |
| Sangue | Pacto de Sangue | Mortes em combate de aliados recuperam parte da vida de Zephyr; sacrifícios e detonações excluídos. |
| Sangue | Carne Instável | Melhora Explosão Cadavérica e Explosão Necrótica. |
| Sangue | Explosão Necrótica | Magia de dano em área com mana; substitui Explosão de Almas. |
| Sombras | Dash | Deslocamento evasivo. |
| Sombras | Passo Prolongado | Melhora alcance e recarga do Dash. |
| Sombras | Meditação Sombria | Melhora mana máxima e regeneração. |
| Sombras | Maldição da Fraqueza | Reduz o dano causado pelos inimigos marcados. |
| Sombras | Aura das Sombras | Melhora dano da horda próxima de Zephyr. |

## Exemplos de sinergia para balancear

- Cada ponto direto em Zumbis: +4% de dano da Abominação.
- Carne Reanimada: vida e regeneração para ambos, sem multiplicação recursiva.
- Ossos Afiados: dano para guerreiros e arqueiros; não altera invocações de Carne.
- Pontos diretos em Tiro de Osso e Chuva podem dar bônus recíprocos de dano.
- Carne Instável conecta a explosão dos Zumbis à magia de Explosão Necrótica.
- Sinergias complementam especializações; evitar torná-las obrigatórias para o funcionamento básico de cada build.

## Prompt exato do mockup

Use case: ui-mockup. Create an original high-fidelity dark fantasy necromancer action RPG skill-tree interface concept, landscape 3:2 image, polished 2D game UI art viewed perfectly straight-on, entire interface visible. This is a concept for Necromancer's Rise. Inspiration: the user's reference has tall black stone skill panels, square illustrated skill icons with aged metal borders, subtle branching connecting lines and ranks. Capture that austere old-school gothic readability with original ornamentation, not a copy.
Layout: large single ornate rectangular outer frame of weathered black iron, thin antique brass trims, restrained carved bone/skull details at top center and outer corners. Interior two equally wide framed stone panels side by side. Main title centered 'GRIMÓRIO DOS MORTOS'. Top small text 'Pontos disponíveis: 3'. Left panel title 'MINIONS', right panel title 'SPELLS'. Each panel has three evenly spaced vertical branches with five square illustrated skill nodes per branch, 30 nodes total. Generous spacing; each node about 60 pixels wide, clear thin connectors, tiny rank badges like 3/5 and 0/5. Left column labels 'CARNE', 'OSSOS', 'ESPÍRITOS'; right column labels 'OSSOS', 'SANGUE', 'SOMBRAS'. No need to name every skill. Illustrate recognizable zombie -> muscular abomination evolution in the flesh branch, skeleton -> skeleton archer in bone branch, pale ghost in spirit branch. In spells show bone bolt, bone rain and wall; flesh shield and blood magic; dash, curse and dark aura. Top available nodes colored, lower locked nodes visibly muted but still readable. Use sickly green accents for minions and desaturated violet for spells; thin dotted amber cross connections for synergy, with only two such lines so layout is clear. Solid lines communicate prerequisites.
Bottom within frame: one wide readable selected skill tooltip card: title 'CARNE REANIMADA', body 'Fortalece Zumbis e Abominações.', second line 'Sinergia da escola de Carne'. Small brass button 'Investir ponto'. Bottom corner subtle caption '+3 pontos por nível'. Background charcoal slate with extremely subtle cracks, ample dark negative space, readable ivory typography. Ornament stays on outer edges, playable UI clarity is paramount. No scenery, no characters standing outside icons, no glossy mobile UI, no excessive glow, no soul currency or soul counter, no watermark. This is a frame/art mockup for validation, not a production asset.

