# ☠ Necromancer's Rise

Jogo de ação top-down feito em HTML5 Canvas 2D, em um único arquivo, sem dependências. Você é um necromante: lança feitiços, ergue mortos-vivos para lutar ao seu lado e sobrevive a ondas de inimigos.

### ▶ [Jogar agora](https://elton182.github.io/necromancer-rise-html-game/)

[![Tela inicial do jogo](docs/tela-inicial.jpg)](https://elton182.github.io/necromancer-rise-html-game/)

## Como jogar

| Tecla | Ação |
|---|---|
| `W A S D` | Mover o necromante |
| Clique esquerdo / `1` | Ativar habilidade do slot 1 |
| Clique direito / `2` | Ativar habilidade do slot 2 |
| `Q` / `3` | Ativar habilidade do slot 3 |
| `E` / `4` | Ativar habilidade do slot 4 |
| `R` / `5` | Ativar habilidade do slot 5 |
| `T` / `6` | Ativar habilidade do slot 6 |
| Clique no botão do HUD | Escolher a habilidade daquele slot |
| `C` | Dash, quando equipado em um slot |
| `Shift` + clique direito | Reunir a horda (no chão) ou mandar atacar (no inimigo) |
| `V` | Reanimar aliado caído, exceto sacrificado ou detonado |
| `G` | Portal / interagir |
| `F1`–`F5` | Usar itens do inventário |
| `ESC` | Pausa: Personagem, Habilidades, Horda e Sistema |
| `H` | Ajuda com controles e explicação dos recursos |

Também dá para jogar com controle (gamepad).

O **Filtro de loot**, em **Opções** e no **Inventário (I)**, permite mostrar todos os equipamentos, mágico ou superior, raro ou superior ou apenas épico. Peças abaixo do filtro ficam ocultas no chão e não são coletadas, inclusive ao sair da fase. Reduzir o filtro volta a exibir as peças enquanto você estiver na mesma área. A preferência fica salva no navegador; ouro e orbes não são afetados.

### Dash e ataques especiais

Zephyr começa com **Dash** (`C`, ou L3 no controle, quando equipado): percorre até 4,5 unidades em 0,18 s, com recarga de 3 s e sem custo de mana. Usa a direção do movimento; parado, usa a mira. Durante o deslocamento, evita dano. Obstáculos e limites da fase interrompem o dash.

Os inimigos básicos preparam seus ataques especiais com avisos visuais:

| Inimigo | Habilidade | Comportamento inicial |
|---|---|---|
| Guerreiro | Golpe pesado | Avisa por 0,5 s; dano de 1,6× em raio 2,1; recarga de 5 s |
| Arqueiro | Tiro forte | Avisa a linha de tiro por 0,65 s; flecha de 1,9× de dano com direção fixa; recarga de 5 s |
| Mago Vivo | Erupção de fogo | Marca o chão por 0,75 s; impacto de 1,2× e três pulsos de 0,3× em raio 2,2; recarga de 6,5 s |
| Bruto | Salto devastador | Avisa o destino por 0,65 s; salta e causa 2× de dano em raio 2,6 ao cair; recarga de 6 s |

Sair da região marcada evita o impacto. Inimigos mortos durante a preparação não completam a habilidade. Chefes mantêm suas habilidades próprias, e alvos de treino não usam esses ataques. Os valores são iniciais e ainda precisam de balanceamento em uma partida.

Monstros comuns se movem 15% mais rápido. Ataques básicos corpo a corpo ocorrem a cada 1,1 s, e tiros comuns a cada 1,3 s. A primeira habilidade especial fica pronta após 0,75–1,25 s de atividade. O Tiro de Osso causa 50% da base mágica, incluindo os bônus da própria skill: sem equipamento no nível 1, são 20 de dano, dois tiros no guerreiro de 40 HP e cinco no bruto de 100 HP. Chuva e Explosão Necrótica mantêm seu dano.

Chefes têm dano base aumentado em 30%, incluindo Capitão da Guarda, Guardião dos Ossos, Lich Guerreiro e Hidra Pútrida. Os ataques especiais que escalam com o dano do chefe também recebem esse aumento.

O personagem começa com **Tiro de Osso** e **Dash**, distribuídos entre os seis slots compartilhados de habilidades, sem minions ativos. **Zumbis exige o primeiro ponto no nó Zumbis**; depois equipe a evocação em um slot para trazer o grupo. As demais magias e evocações são desbloqueadas nas árvores **Minions** e **Profana**, sem bloqueios ou liberações de skills pela campanha. Clique em qualquer slot para trocar sua habilidade. No controle, LB/RB escolhem o slot e A/RT ativam.

**Muralha de Corpos** custa 35 MP e ergue um muro por 5 segundos, com dano de contato. O muro impede a passagem de inimigos e intercepta seus projéteis. **Tiro de Osso** custa 20 MP. Escudo de Carne pode ser equipado entre as opções adicionais: sacrifica um zumbi e reserva seu lugar até a recuperação.

Saves anteriores são migrados automaticamente: os pontos são recalculados como **3 × (nível − 1)** para redistribuição. Melhorias antigas e souls deixam de participar da progressão. Ouro, inventário e campanha são preservados; skills dependem dos investimentos nas árvores. Uma cópia do save anterior é mantida no navegador quando há espaço disponível.

Para verificar sintaxe e regras das habilidades: `node game_check.js`.

A distância da horda pode ser configurada em **Pausa → Horda** ou **Opções**: Próximo (8 unidades), Amplo (16, padrão) e Distante (24). Cada aliado reavalia o inimigo mais próximo dele a cada 0,3 segundo, dentro da região de Zephyr. Comandos de ataque priorizam a região indicada; ataque, reunião e esquiva respeitam o alcance escolhido. Ao ultrapassar o limite, os aliados retornam até chegar a 3 unidades do personagem. Separações extremas, como em transições, recuperam o aliado perto do personagem. A aura de dano próximo mantém seu raio de 8 unidades.

Em **Opções**, desmarque **Pausar ao perder foco** para continuar jogando ao alternar de janela. A preferência e o alcance da horda ficam salvos no navegador. Abas ocultas ainda podem ter a execução reduzida pelo navegador.

No campo de waves, os inimigos calculam uma rota ao redor das árvores e construções quando o caminho direto está bloqueado. A rota é recalculada quando o alvo se afasta ou a multidão desloca o inimigo para fora do caminho.

Os minions têm 50% mais vida base e ganham 6 HP por nível do personagem antes dos bônus da árvore e dos itens. Regeneram 1% da vida máxima por segundo. **Vida da horda** nos equipamentos melhora a vida e a regeneração de aliados já invocados; esse atributo pode sair em todos os tipos de peça e tem faixas maiores nos novos drops. **Vida máxima de Zephyr** beneficia apenas o personagem.

Zumbis, esqueletos guerreiros e arqueiros tentam sair de áreas anunciadas, fogo persistente e trajetórias de projéteis hostis. A reação tem atraso e intervalo, respeita obstáculos e o alcance configurado da horda, e não concede invulnerabilidade.

**V**, o aviso clicável do HUD ou **Pausa → Horda** reanimam um caído comum por 30 MP, com 60% da vida. O retorno automático traz 50%. Sacrificados e detonados continuam aguardando a recuperação própria; seus tempos agora também avançam na vila, enquanto o jogo estiver sem pausa.

Na pausa, Personagem reúne os atributos; Habilidades abre as árvores; Horda reúne integrantes e configuração das invocações; Sistema reúne controles, opções e saves. As melhorias avulsas foram removidas. Loja e missões continuam disponíveis pelos serviços do mundo e mapa. Clique no contador de pontos do HUD para abrir diretamente o Grimório.

O HUD de combate usa o Relicário de Zephyr: vida integrada ao painel esquerdo e mana ao direito, com um espaço livre entre os painéis. As seis habilidades ficam divididas entre os dois lados. A Ajuda (`H`) reúne as instruções.

### Evocações nos slots de habilidades

Equipar uma evocação traz seu grupo automaticamente: **3 zumbis**, **2 esqueletos arqueiros** ou **1 abominação**. O grupo ocupa um único slot de habilidade. Ativar esse slot comanda a habilidade especial, liberada na árvore:

| Evocação | Comando | Recarga |
|---|---|---:|
| Zumbis | Explode apenas um zumbi vivo por ativação, próximo da mira | 1,2 s |
| Esqueletos arqueiros | Cada arqueiro vivo dispara um tiro forte | 7 s |
| Abominação | Salta e causa dano em área ao aterrissar | 8 s |

A explosão comandada do zumbi usa multiplicador de dano 3,5× e raio de 3,5 unidades. Detona apenas um aliado por comando e mantém a recuperação normal do grupo.

O zumbi detonado permanece vinculado ao slot e aguarda o renascimento normal (12 segundos, modificado pelas melhorias). Se todos forem detonados, o comando aguarda até algum voltar. Reanimação manual, dispensa e troca de evocação não antecipam essa recuperação. Os tempos de recuperação também são salvos.

### Grimório de habilidades

O botão **Devolver ponto** informa custo, dependentes e motivo de bloqueio. A devolução continua custando 20 ouro por ponto e pode ser feita na vila, no mapa ou pausado entre waves, sem inimigos. Aliados detonados/sacrificados precisam terminar a recuperação; feche a pausa para o tempo avançar.

Na pausa, **Habilidades** abre o Grimório dos Mortos. **Minions** contém Carne, Ossos e Espíritos; **Profana** contém Ossos, Sangue e Sombras. São 42 habilidades e 12 talentos finais. Cada escola começa em uma raiz e se bifurca em duas especializações; os caminhos intermediários podem ser combinados, mas os dois talentos finais da mesma escola são exclusivos.

Cada subida de nível concede **3 pontos** compartilhados entre as duas árvores, até o nível 60. Ao chegar ao nível 2, um tutorial rápido explica como abrir o Grimório e investir os três primeiros pontos. Skills comuns aceitam 5 pontos; talentos finais, 1. As etapas abrem nos níveis 1, 6, 12 e 24 e cada ligação exige 2 pontos no nó anterior. Selecione um símbolo para consultar os efeitos e investir. Redistribuição custa **20 de ouro por ponto devolvido**, na vila ou no mapa, após a recuperação dos aliados sacrificados ou detonados. Remover um pré-requisito também devolve e cobra os pontos dos descendentes; o custo aparece antes da ação.

Inimigos deixam **ouro no chão**, coletado por proximidade; chefes deixam quantias maiores. Alvos de treino não geram ouro. O menu de habilidades usa a largura da tela, nós compactos, detalhes laterais e barras de rolagem com estilo próprio quando necessárias.

Ao aprender uma habilidade equipável ainda não alocada, um tutorial pausa o jogo e apresenta os **seis slots com seus atalhos**, destacando os vazios. Escolher um slot equipa a habilidade usando as regras normais de mana e recuperação. É possível alocar depois; o botão **Alocar em um slot** nos detalhes da habilidade reabre a orientação. Aprimoramentos e passivas não repetem o tutorial.

As sinergias usam pontos diretos e bônus aditivos: Zumbis e Carne Reanimada fortalecem a Abominação; Tiro e Chuva de Ossos fortalecem um ao outro; Carne Instável e Ritual Instável melhoram a explosão dos zumbis e Explosão Necrótica. Aura das Sombras afeta aliados próximos de Zephyr. A escola de Espíritos oferece drenagem e reposicionamento; Maldição da Fraqueza é uma magia equipável em Profana.

**Souls não são coletadas nem cobradas.** Explosão Necrótica custa apenas mana. Abominação é uma evolução dentro do ramo dos Zumbis e ocupa seu próprio slot de evocação. Horda Explosiva, Guarda Sepulcral, Salva Sepulcral e Cortejo dos Mortos ampliam os respectivos grupos.

O modelo é compartilhado com o simulador. Para atualizar o HTML independente após editar as árvores: `node scripts/sync-skill-trees.js`. Validação: `node game_check.js` e `node --test scripts/skill-trees.test.js build-simulator/model.test.js`. Consulte [a implementação e a migração](docs/arvores-habilidades-implementacao.md).

### Vila, campanha e missões

No Modo Livre, **ESC → Voltar à história** retoma a campanha com o mesmo personagem, equipamentos e fases concluídas, mesmo antes de liberar a vila. Durante uma tentativa, o jogo pede confirmação para encerrá-la. A opção **Sistema → Mapa da Campanha** também está disponível no hub inicial.

O quadro **Mapa da Campanha** na vila permite voltar ao mapa e rejogar fases sem perder o progresso. Interaja com `G`. As missões da vila podem oferecer arenas ou trilhas de rolagem lateral, com três emboscadas e chefe no trecho final. A recompensa é concedida uma vez e, ao chegar ao final da trilha, o retorno à vila é automático. Fases laterais da campanha rejogadas após liberar a vila também retornam automaticamente, após a sequência de conclusão. Na primeira passagem do Ato I, a história mantém o retorno ao mapa até a vila ser liberada.

## Rodando localmente

### Equipamentos e waves

Use **I** ou **ESC → Equipamentos** para abrir a mochila: cajado, grimório, vestimenta, capuz, botas e dois anéis. Peças comuns têm apenas o atributo base; mágicas têm 2 atributos aleatórios, raras 3 e épicas 4. Bônus de pontos fortalecem habilidades ou escolas já aprendidas sem alterar os pontos investidos, liberar pré-requisitos ou mudar a aparência de Zephyr.

Todos os itens têm uma base em valores brutos, separada dos afixos. Cajados de nível 1 rolam +10, +11 ou +12 de dano mágico base; grimórios rolam +3 a +5 de dano base para cada aliado. A base cresce com o nível do item, independentemente da raridade. Vida, mana, regeneração e movimento também usam bases brutas. Afixos podem continuar concedendo percentuais: `dano mágico = arredondar((40 + 4 × (nível do personagem − 1) + dano base do cajado) × (1 + bônus percentual / 100))`; o multiplicador da habilidade é aplicado depois. O grimório entra antes dos bônus de dano da horda e dos comandos. Exemplo: dano do personagem 84, cajado +25 e afixo +10% resultam em 120 de dano mágico. Itens antigos são convertidos para o formato 2 ao carregar, preservando identidade, raridade e afixos. Mantém-se a quantidade de afixos por raridade: comum 0, mágico 2, raro 3 e épico 4.

O inventário usa uma grade à esquerda, com duas bolsas de 30 espaços, e uma silhueta à direita com os equipamentos em suas posições. Ícones e bordas indicam o tipo e a raridade; selecionar uma peça abre atributos, comparação e ações abaixo. Em telas pequenas, os painéis ficam empilhados. **Descartar tudo da mochila** remove as peças das duas bolsas após confirmação, preservando equipamentos vestidos e consumíveis. O retrato de Zephyr aparece no resumo de todas as abas do menu.

Os seis slots de habilidades preservam seus botões durante atualizações de mana e recarga, evitando cliques perdidos. Na escola Carne, cada ponto em Zumbi concede +4% de dano e +3% de vida a Zumbis e Abominações. Cada ponto investido em Abominação concede também +4% de dano e +6% de vida aos zumbis; cada ponto investido em Explosão Cadavérica dá +4% ao Salto Devastador. As sinergias diretas de Abominação e Explosão Cadavérica contam apenas pontos investidos, sem multiplicação por bônus temporários de equipamento. As prévias de equipamentos e os simuladores usam essas mesmas regras.

Todas as abas da pausa usam a mesma janela, cabeçalho, resumo do personagem, navegação e área de rolagem. No inventário, **Status do personagem** compara os valores atuais com a prévia de equipar ou desequipar a peça; anéis permitem escolher o lado da comparação. A tabela de habilidades mostra dano por uso, recarga, DPS potencial e DPS contínuo limitado pela regeneração de mana. As estimativas avaliam cada habilidade separadamente, com acertos ideais em um alvo; horda viva e próxima, Chuva com todos os fragmentos acertando e explosão de zumbi limitada pelo renascimento são hipóteses indicadas na tela.

Monstros comuns têm 16% de chance de deixar equipamento; chefes garantem uma peça mágica ou melhor. Orbes de mana têm 12% de chance e orbes de vida 4%, sem sorteios extras na campanha. Equipamento e orbe são sorteados independentemente. A coleta é por proximidade, e peças permanecem no chão enquanto a tentativa durar. A mochila comporta 60 peças. Trocas preservam a proporção de vida/mana e não reiniciam recargas ou recuperações da horda.

Na vila, o menu de equipamentos vende peças e oferece relíquias aleatórias por tipo, com nível/preço definidos pela maior wave desbloqueada. **ESC → Waves** ou a **Pedra do Infinito** permite selecionar uma wave já liberada. Concluir a maior disponível libera a seguinte. Repetir anteriores preserva o recorde e reduz a dificuldade e o nível do loot. Na campanha, o nível das peças acompanha a fase.

A arena usa +12% de vida e +8% de dano compostos por wave, XP dos monstros +4% e até 60 inimigos por wave. São valores iniciais sujeitos a balanceamento. Saves anteriores recebem mochila vazia e preservam o recorde existente.

Fontes: `scripts/equipment-model.js`, `scripts/equipment.js`, `scripts/minion-care.js`, `scripts/equipment.css` e `scripts/menu.css`. Após editar, execute `node scripts/sync-equipment.js` para atualizar o HTML distribuído. Verificações: `node --test scripts/equipment.test.js scripts/minion-care.test.js scripts/skill-trees.test.js build-simulator/model.test.js balance-simulator/model.test.js` e `node game_check.js`. O simulador compartilha geração de itens, bônus e curvas de waves com o jogo; `legacy` mantém a comparação com as curvas anteriores.

### Simulador de builds

Abra [o Grimório de builds](build-simulator/index.html) para planejar as árvores de **Minions** e **Profana** com o mesmo modelo de pré-requisitos e sinergias do jogo. Inclui cinco builds de exemplo, devolução de pontos e importação/exportação dos planos. O planejamento não modifica o save do jogo; os valores ainda precisam de balanceamento em partidas. Consulte [as regras do simulador](build-simulator/README.md).

Não precisa de build nem servidor: basta abrir `necromancer-canvas.html` no navegador.

## Estrutura

O [roadmap de animações e inimigos](docs/roadmap-combate-visual.md) organiza a
esteira de produção, o backlog de skills e os três lotes propostos de novos inimigos.
O primeiro pacote inclui o [guia visual do combate](docs/guia-visual-combate.md)
e o Tiro de Osso redesenhado. Para abrir a arena de comparação, execute
`node tools/combat-lab-server.js` e acesse `http://127.0.0.1:4173/tools/combat-lab.html`.
Após editar `scripts/skill-vfx.js`, execute `node scripts/sync-skill-vfx.js`
para atualizar o HTML independente.

| Arquivo | Descrição |
|---|---|
| `necromancer-canvas.html` | **Versão atual** do jogo (Canvas 2D, sprites embutidos) |
| `index.html` | Entrada do GitHub Pages, redireciona para a versão atual |
| `necromancer-game.html` | Versão anterior (Three.js) |
| `necromancer-demo.html` | Demo visual inicial |
| `blender/` | Modelos, rigs e scripts Python que geram os spritesheets |

### Pipeline de sprites (Blender)

Os personagens (necromante, zumbi e esqueleto) são modelados e animados por script no Blender e renderizados como spritesheets de 8 direções com shader toon:

![Personagens renderizados no Blender](blender/preview_mobs.png)

- `necromante.py`, `mob.py` — constroem modelo, rig e animações (`.blend` / `.glb`)
- `sprites.py` — renderiza o spritesheet (`*_sheet.webp`) e os metadados (`*_sheet.json`)
- `render.py` — renders de preview
- `toon.py`, `common.py` — utilitários compartilhados

Exemplo:

```bash
blender -b -P blender/sprites.py -- blender/necromante.blend blender necromante
```
