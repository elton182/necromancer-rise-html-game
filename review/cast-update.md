# Bram original, inimigos da referência e novas animações

Bram foi extraído de `blender/examples/image.png`. O interior da silhueta conserva
os RGB originais; a máscara retira fundo, chão e legenda. O PNG de 320 px e WebP
sem perdas têm uma única pose. Não existem na imagem oito vistas ou quadros de
saudação/martelada; o renderizador conserva a pose original durante a conversa.
Os antigos modelos de Bram permanecem disponíveis, mas não geram seu sprite ativo.

As classes existentes recebem automaticamente os visuais, carregados na primeira
aparição: Guerreiro → saqueador; Bruto → guerreiro corrompido; Mago Vivo → esqueleto
mago; Cão de Cripta → lobo sombrio. O Espectro aliado também usa o esqueleto mago.
O guerreiro e arqueiro esqueletos continuam como minions. Esses modelos são
interpretações Blender da referência; somente Bram é um recorte da imagem original.
Não foram criados novos inimigos com atributos, IA ou encontros independentes.

Zephyr conserva materiais foscos, escala e projeção. Suas ações agora são idle,
walk, cast, summon, hurt, death, nova, channel e dash (456 quadros, oito direções).
O disparo tem preparação e recuperação; nova abre os braços; canalização levanta
o cajado; dash inclina corpo e tecido. A seleção observa o gesto de conjuração
existente: explosão/escudo usam nova; chuva/mãos usam channel; tiro usa cast.
O dash acompanha a duração real da esquiva, sem mudar deslocamento ou recarga.
A invocação tem um gesto próprio. Não foram alterados dano, mana, vida ou colisões.

Guerreiro, arqueiro e mago esqueletos têm ataques de oito quadros (264 quadros por
personagem). O guerreiro gira o tronco e protege com o escudo; o arqueiro puxa e
solta o arco; o mago combina cajado e mão livre. Os joelhos e braços participam da
caminhada. Os atlas foram gerados e incorporados pelo empacotador atual.

Fontes: `blender/combat_animation_clips.py`, `blender/reference_characters.py`,
`blender/bram_sprite_reference.py` e `blender/pack_reference_characters.py`.
Integração: `scripts/character-visuals.js`, catálogo e recursos em
`assets/characters/reference/`, dados embutidos em `necromancer-canvas.html`.

Capturas: `cast-updated-in-game.png`, `zephyr-nova-in-game.png` e
`combat-animation-preview.gif`. As capturas na vila são uma cena pausada de
inspeção de atores existentes; não acrescentam encontros hostis à vila.

Validação: 76 cenários de gameplay; 2104 quadros verificados no navegador;
seleção real de cast/nova/channel/dash e pose única de Bram; 770 extremos de
animação na integração anterior; reimportação e validação dos oito GLB.
O teste de desenho de 100 minions mediu mediana de 0,2 ms e p95 de 0,8 ms nesta
máquina (não representa o custo total do jogo). Os atlas maiores aumentam a
memória; os inimigos são carregados sob demanda e o cache de tiras foi preservado.

Limites: Bram é estático; os outros modelos não são recortes exatos. Não foram
avaliados todos os dispositivos móveis/biomas nem o desempenho em hardware fraco.
As animações novas concentram-se nos esqueletos da referência; zumbis e abominações
mantêm seus sprites existentes.
