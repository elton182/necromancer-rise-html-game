# V2 — Editor de mapas

Editor dentro do jogo para criar mapas, jogar neles, usá-los como base de outros e **editar os mapas da campanha**: estilo,
tamanho, relevo, água, rios, peças, inimigos e spawn. As edições são salvas sozinhas. Vila de Eldrin, fases antigas do Ato I e
modos de ondas não passam pelo editor.

## Cliente do editor

O editor tem página própria, só para criar o jogo. Na raiz do projeto:

```bash
node v2/tools/map-editor-server.cjs
```

Depois, abra o endereço indicado (`http://localhost:4177/`). A porta pode ser trocada: `node v2/tools/map-editor-server.cjs 4178`.

- **Sem build para editar:** a página `v2/map-editor.html` usa as fontes de `v2/scripts/` diretamente e carrega só os modelos de cenário e o personagem de referência. Basta recarregar para ver mudanças de código.
- **Mapas em arquivos:** cada edição da campanha fica em `v2/assets/maps/campaign-<mapa>.json`, e cada mapa pessoal em `v2/assets/maps/custom/<id>.json`, com uma peça por linha para o Git mostrar o que mudou. O limite de tamanho do navegador não se aplica.
- **Falha de gravação:** a barra superior avisa, a edição continua na fila e a gravação é tentada de novo a cada 3 s.
- **Testar:** abre o jogo real em outra aba, com os mapas atuais do disco, sem rebuild, e entra direto no mapa como campo de treino. O editor continua aberto. Se as fontes forem mais novas que `v2/necromancer-3d.html`, a barra avisa que mudanças de código exigem publicar; os mapas valem mesmo assim. O endereço `/play` abre o jogo normal, pela tela inicial, para jogar a campanha com as edições.
- **Publicar:** o botão **Publicar no jogo**, na barra do editor e na lista de mapas, salva o que está aberto, espera chegar ao disco e roda `node v2/tools/build.cjs` em outro processo; o comando continua valendo. O build embute `v2/assets/maps/campaign-*.json` em `v2/necromancer-3d.html` e leva junto o código atual de `v2/scripts/`. O botão compara o disco com o que está embutido no jogo e mostra quantos mapas faltam (inclusive os restaurados), `código novo` ou `em dia`; o título lista os nomes. Depois de publicar, recarregue a aba do jogo. Mapas pessoais não entram na distribuição. Um arquivo de campanha inválido impede a publicação antes de o build começar, e uma falha aparece na barra sem perder a edição. Se aquele navegador tiver uma edição feita na aba Mapas do jogo, vale a mais recente das duas (veja [Salvar](#salvar)).
- **Medidor:** a barra mostra os quadros por segundo da vista 3D, quanto levou a última alteração e a última pintura do chão, e os triângulos por quadro.
- **Segurança:** o servidor escuta só em `127.0.0.1`, recusa outros nomes de host e origens e entrega apenas as fontes de que o editor precisa. Ele não faz parte da distribuição.

**Migrar edições do navegador:** na aba Mapas do jogo, use **Exportar edições da campanha** e **Exportar** em cada mapa pessoal; depois, **Importar…** no cliente grava os arquivos no projeto. A chave `necromancer_v2_maps` não é apagada.

A aba **Mapas** continua no jogo até o cliente fazer tudo o que ela faz; depois, ela sai da distribuição. O `file://` do jogo e o endereço do servidor têm armazenamentos separados, então uma edição feita na aba não aparece no cliente até ser importada.

**Medição** (Intel Iris Xe, navegador do aplicativo): o cliente fica pronto em cerca de 2,8 s e baixa 7,3 MB de modelos, contra os 87 MB da distribuição. A primeira pintura do chão leva cerca de 730 ms, e as seguintes cerca de 240 ms no mundo de 360 u. Os FPS não foram medidos, porque o painel estava oculto e o navegador limitava os quadros.

## Construir no 3D

O cliente abre direto na vista 3D, que usa o mesmo cenário do jogo. As ferramentas da paleta funcionam nela como na vista de cima.

| Comando | Efeito |
| --- | --- |
| Esquerdo | Usa a ferramenta. Com Selecionar, clicar pega a peça e arrastar a move; arrastar em área vazia gira a câmera |
| Direito / Meio | Gira a câmera / move a vista |
| Roda | Zoom no ponto sob o ponteiro |
| WASD | Move a câmera (ou o personagem, com **Câmera livre** desligada); setas também, mas empurram a peça quando há uma selecionada |
| T ou **Vista de cima** | Enquadra o mapa inteiro de cima, sem névoa; girar a câmera sai desse modo |
| C | Liga e desliga a câmera livre |

**Alças da peça selecionada**, desenhadas por cima de tudo:

- **Amarelas:** nas peças retangulares, cada uma move um lado e mantém o oposto parado, para encostar em outra peça; nas redondas, mudam raio ou escala.
- **Azul:** altura. Arraste para cima ou para baixo.
- **Laranja:** giro livre, em qualquer peça menos trilhas e poças; com Shift, passos de 15°. A tecla **R** gira a selecionada 15° (Shift+R volta), e o campo *Giro (graus)* aceita o valor exato. Nas peças retangulares, inclusive pontes, a colisão e as alças giram junto; nas redondas, a colisão é a mesma em qualquer ângulo.

A grade continua valendo para posição e medidas: numa peça girada, o encaixe das alças de lado é na medida do lado, não nas linhas do mapa.

**Peça herdada:** clicar seleciona, sem mudar nada. Ao arrastar ou usar uma alça, a peça da planta fica oculta e uma cópia entra no mapa, tudo em um só passo de desfazer. Em mapas da campanha, todas as peças começam herdadas.

**Limite atual:** os pincéis de relevo e a superfície funcionam no 3D, mas o resultado só aparece ao soltar o botão.

### Atualização da cena

A vista fica em camadas (`map-preview.mjs`): o chão, uma por tipo de peça e uma só para a peça selecionada. Cada alteração refaz apenas a camada que mudou. Mover uma peça não repinta o chão: a sombra de contato no chão é atualizada cerca de 1,5 s depois de a edição parar. Ao arrastar uma trilha, ela acompanha pelo contorno, e o chão é repintado ao soltar. Relevo, trilhas, água, tamanho, bioma e estilo repintam na hora. Peças de caravana e caverna ficam em uma camada conjunta; em caverna sem relevo, entram na camada do chão, porque o piso depende delas.

Peças giradas do catálogo são instâncias normais. As demais (`rotatedParts` em `toArena`) são desenhadas uma a uma, então muitas delas custam mais chamadas de desenho.

Para isso, cada peça na vista tem tom próprio, derivado do id. O jogo sorteia em sequência, então o tom de uma peça pode diferir um pouco entre a vista e o jogo. Forma, posição e colisão são as mesmas.

A seleção não usa a malha desenhada: `map-handles.mjs` testa o raio do ponteiro contra caixas calculadas a partir de cada peça, com tronco e copa separados nas árvores. Peças muito irregulares podem ter um pouco de folga em volta.

## Tamanho e desempenho

**Limites por mapa:** de 12 a 360 u por lado, 2.000 peças e 40 pontos de inimigos, com até 30 inimigos cada. A área em si quase não pesa: o custo vem da quantidade de peças.

Duas otimizações valem para todo o jogo, sem mudar regras:

- **Colisão por setores** (`nearbySolids` em `terrain.mjs`): cada movimento testa só os colisores próximos, em células de 8 u. Arenas com menos de 48 colisores seguem na varredura direta. Um teste compara milhares de movimentos com e sem o índice.
- **Cenário por setores** (`scene-sectors.mjs`): famílias com 128 instâncias ou mais são divididas em regiões de 48 u, e a câmera descarta o que está fora da tela. Posição, cor e material não mudam. Camadas planas sem teste de profundidade ficam inteiras, porque nelas a ordem das instâncias faz parte do desenho.

Medições, com a mesma cena antes e depois. Triângulos e chamadas não dependem da GPU; a colisão foi medida em Node, por movimento de um ator:

| Medida | Antes | Depois |
| --- | --- | --- |
| Mundo de Jacarandá, triângulos por quadro | 3,37 milhões | 650 mil |
| Mundo de Jacarandá, chamadas de desenho | cerca de 71 | cerca de 89 |
| Mapa vazio de 60 u, triângulos por quadro | 813 mil | 246 mil |
| Colisão no mundo (766 colisores) | 92 µs | 4,6 µs |
| Colisão com 2.000 colisores | 182 µs | 2,8 µs |

Ainda sem medição de FPS em GPU real. A **vista de cima** enquadra o mapa inteiro, então a câmera descarta pouco e o custo volta a ser próximo ao de antes. A textura do chão segue limitada a 2048 px por mapa: em 360 u, trilhas e sombras têm 5,3 px por unidade, contra 32 em mapas pequenos, enquanto a grama continua nítida.

## Mapas da campanha

A aba **Mapas** e o cliente listam os cinco mapas da campanha nova:

| Mapa | Cenas | Observações |
| --- | --- | --- |
| Mundo de Jacarandá | Mundo contínuo | Grupos de missão protegidos; a vila fixa, depois da defesa, aplaina o relevo sob ela |
| Estrada de Itavera | Viagem da caravana | Cinemática: só cenário e estilo, sem relevo nem inimigos |
| Desembarque da caravana | Emboscada, despedida e queda | A queda é mostrada sem relevo; o bloqueio da estrada só existe na emboscada |
| Caverna dos bandidos | Esconderijo | Com relevo ou chão escolhido, o chão pintado substitui o piso da caverna |
| Caminho de Jacarandá | Encontro com o mensageiro | — |

**Editar** abre o editor; **Testar** entra no mapa como campo de treino, sem diálogos nem missões; **Restaurar** pede confirmação
e apaga a edição. Cada edição é uma variação viva da planta embutida: guarda só as diferenças (`base` + `hidden` + objetos e
campos próprios), com id fixo `campaign-<mapa>` e campo `campaign`.

Fonte: `v2/scripts/campaign-maps.mjs`. A campanha lê `editedCampaignMap` ao abrir cada cena (`launchWorld`, `prologueArena`), então
uma alteração vale na próxima vez que a cena abrir. Sem edição, o caminho original é usado.

A história não muda com a edição:

- **Lugares da história** aparecem como losangos dourados, no 2D e na prévia 3D. A **Verificação** dá erro se um deles sai do mapa e
  aviso se não há caminho a pé do início até ele. Em Jacarandá, NPCs e pilhas continuam nas mesmas coordenadas.
- **Grupos de missão** (guardas do posto, bando da mina, guardas das pilhas) podem ser movidos e configurados, mas não removidos
  nem configurados para voltar. Se faltarem, por exemplo em um arquivo importado, voltam da planta ao abrir a cena. O que é missão vem de
  `WORLD_ENCOUNTERS`, não do mapa.
- **Caverna:** as ordens só exigem derrotar os grupos a até 20 u delas, com todas as ondas. Grupos em outras salas são opcionais: não coloque ali nada de que a história dependa.
- O início só vale na cripta (primeira entrada no mundo) e nas cenas de emboscada, caverna e mensageiro.

### Salvar

- **Salvamento automático:** cerca de 0,7 s depois da última alteração, a edição é gravada: em arquivo no cliente, na chave `necromancer_v2_maps` na aba Mapas do jogo. **Salvar** e
  **Testar** gravam na hora; **Fechar** grava o que estiver pendente e só pergunta se a gravação falhar. Ctrl+Z continua valendo na sessão.
- **Na aba do jogo:** entre a edição salva naquele navegador e a publicada (embutida no build), vale a de `updated` mais recente; no empate, a do navegador. Quando o conteúdo das duas difere, a linha do mapa avisa qual está valendo. A cópia local que perde não é apagada e pode ser removida com **Apagar cópia local**; quando é a local que vale, **Restaurar** volta à publicada. **Exportar edições da campanha** leva também uma cópia local ignorada: ao importá-la, ela recebe a data da importação e passa a ser a mais recente.
- **Importar…** aceita o arquivo de **Exportar edições da campanha** e substitui a edição dos mapas que ele traz.

## Relevo e água

Cada mapa pode ter um terreno próprio, em `terrain` no documento: grade de alturas (célula de 1 u, ou 2 u em mapas de 360 u), grade de
superfícies e rios como linhas. Abaixo da cota 0 é água. Mapas sem `terrain` seguem planos e sem nenhum efeito novo. As regras ficam em
`v2/scripts/map-terrain.mjs` e o desenho em `terrain-scene.mjs` e `painted-ground.mjs`.

| Ferramenta | Uso |
| --- | --- |
| Elevar, Rebaixar, Aplainar, Suavizar | Pincéis de relevo: usam *Raio*, *Força* e, em Aplainar, *Altura* |
| Platô (penhasco) | Põe o trecho na *Altura*, com borda dura: a borda fica intransitável, então deixe uma rampa com Suavizar |
| Rio | Arraste para desenhar. *Largura* e *Fundura* ficam no inspetor; a seta mostra a correnteza, e **Inverter correnteza** a troca |
| Lago, Secar | Abrem água com a profundidade de *Altura* e devolvem o trecho à cota 0 |
| Trilha de cantos retos (grupo Chão) | Desenhe arrastando. É um retângulo exato, que estica por qualquer lado, gira livremente e não colide; combina com a Trilha redonda para caminhos mistos |
| Superfície | Pinta Terra, Areia, Pedra, Neve ou Lama sobre o chão |
| Ponte de madeira, Ponte de pedra, Píer | Desenhe arrastando sobre a água: abrem passagem na largura da peça, em arco ou plana |

### Como isso muda o jogo

Valores em `TERRAIN_RULES` e `SURFACES`; provisórios, sem passagem pelo `balance-simulator/`.

| Terreno | Efeito | Como o jogador lê |
| --- | --- | --- |
| Água rasa (até 0,7 u) | −40% de velocidade | Personagem com as pernas na água; aviso no alto da tela |
| Correnteza de rio | Sobre os −40%: até +25% a favor e −25% contra | Filetes correndo no sentido da água |
| Água funda (mais de 0,7 u) | Barra quem anda; tiros e linha de visão passam | Água mais escura, com linha clara no limite |
| Penhasco (inclinação acima de 1,15) | Barra quem anda; tiros e linha de visão passam | Encosta em tom de rocha |
| Ladeira | Subir custa até −35%; descer rende até +12% | Inclinação visível do chão |
| Terreno alto (1,2 u acima do alvo) | +20% de dano, para os dois lados, em ataques com origem | Aviso «Terreno alto» quando o jogador está a 1,2 u ou mais acima da cota 0 |
| Lama, Neve, Areia | −30%, −15%, −10% de velocidade (fora da água) | Cor do chão e aviso |

Valem para jogador, horda e inimigos. O Humanoide Grifo ignora o atraso de água e ladeira, mas não atravessa água funda nem penhasco, porque
a colisão é a mesma de quem anda. O Dash não sofre atraso e para na água funda. Água funda e penhascos viram colisores comuns (`terrainBlock`) em
`toArena`, então colisão, busca de caminho, itens e a Verificação do editor usam o mesmo caminho. `terrain.mjs` só os ignora para raios de até 0,1 u
(tiros e linha de visão).

**Aparência da água** (`terrain-scene.mjs`): um ladrilho gerado uma vez dá as ondas, com cor por profundidade, reflexo do céu, brilhos do sol, reflexos no fundo raso e espuma quebrada na margem. No rio, o desenho desliza no sentido da correnteza. A margem desenhada é suavizada, numa grade mais fina que a do terreno, então o limite real da colisão pode variar até cerca de 1 u em relação a ela. O estilo do mapa regula o brilho da água, para ela não parecer acesa à noite.

Na cena, `liftScenery` assenta o cenário e o renderizador sobe atores e efeitos até o chão apenas durante o desenho; as regras seguem em x/y.
A água que chega à borda continua além dela, junto com o chão.

## Estilo

A seção **Estilo** guarda, por mapa: céu e névoa, luz e cor do sol, luz ambiente, névoa, tom do chão, tipo de chão (Grama, Terra batida, Areia, Neve, Pedra,
Cinzas, Musgo), cor da água e densidade de grama e flores. **Clima e hora** aplica predefinições (Amanhecer, Meio-dia, Entardecer, Noite, Névoa,
Inverno, Seca, Charco, Terra arrasada). Só apresentação: nada muda colisão nem dano. Com **Chão claro**, o céu do estilo não se aplica, para manter a
conferência em fundo claro. Fonte: `STYLE_PRESETS` e `normalizeStyle` em `map-model.mjs`; `applyMapStyle` em `scene-look.mjs`.

## Inimigos e spawn

Na aba do mapa, **Vida dos inimigos (×)** e **Experiência dos inimigos (×)** ajustam todos os grupos do mapa, em todas as ondas, de 0,1 a 10; o padrão é 1. A experiência reduz personagem e maestria; ouro, dano e chance de item não mudam. Os outros modos não são afetados. A Caverna dos bandidos está com vida ×1,5 e experiência ×0,25: com todos os grupos derrotados, o personagem termina a caverna no nível 4 em vez do 7. São valores iniciais, sem medição de dificuldade em partida real.

Selecione um ponto de inimigos para configurar o grupo:

| Campo | Efeito |
| --- | --- |
| Composição | Linhas de tipo e quantidade, até 30 integrantes |
| Líder | O primeiro integrante vira Mágico ou Raro |
| Nível | Escala de atributos e itens do grupo; 0 usa o nível do mapa |
| Dispersão | Raio do anel de nascimento; 0 usa a espiral compacta |
| Quando | Ao entrar no mapa, quando o jogador se aproxima (*Raio de ativação*, desenhado no 2D) ou depois de um tempo (*Atraso*) |
| Ondas, Entre ondas | Quantas vezes o grupo nasce e a espera depois de derrotado |
| Volta após | Segundos até rearmar, depois de derrotado e com o jogador fora do raio; 0 não volta. Grupos de missão não voltam |
| Espera parado | O grupo fica no lugar até detectar o jogador, sofrer dano ou ser alertado (regra das Expedições) |

Fonte: `v2/scripts/map-spawns.mjs`. Em mapas salvos antes desta mudança, todos os grupos nascem ao entrar, como antes. No prólogo, a cena só avança quando não há
grupo vivo nem por nascer; um grupo com gatilho em lugar inalcançável segura a cena, e a Verificação avisa de pontos isolados.

## Catálogo de peças

A paleta tem busca e grupos: Colisores, Enfeites, Chão, Água, Relevo, Acampamento, Ruínas, Natureza, Povoado, Cripta, Caverna e Caravana.
O kit novo (`mapKit`, 29 peças, gerado por `blender/scripts/v2_map_kit.py`) soma pontes, píer, juncos, nenúfares, rochedos, tendas, fogueira,
paliçada, torre de vigia, muro de pedra, arco, estátua, obelisco, árvore morta, barraca de feira e outras. Poços, postes, carroça aberta, flores e lápides musgosas
reaproveitam os kits existentes. Uma peça nova é só uma entrada em `PROPS` com `kit:{model,part}`.

- **Aumentar e reduzir:** botões do inspetor ou `[` e `]` para a peça selecionada; **− 20 u** e **+ 20 u** para o mapa, a partir do centro, preservando o relevo no lugar.
- **Girar:** alça laranja no 3D, tecla **R**, **Girar 90°** ou o campo *Giro (graus)*. O giro é salvo em `rot`, em graus inteiros.
- **Apagar:** arrastar remove o que o ponteiro tocar, e o traço inteiro é um passo de desfazer.

## Como abrir

Na tela inicial, o botão **Editor de mapas** (entre Modo Livre e Opções) abre o Relicário já na aba **Mapas**; fechar o
Relicário volta à tela inicial. Também: Relicário (Esc) → aba **Mapas**. A aba aparece no menu inicial, no treino livre, na Vila de Eldrin e dentro de um mapa
personalizado; não abre durante missão, Arena, Expedição, Conquista ou Cerco. Dali:

- **Novo mapa** parte de um modelo (Campo aberto, Arena de pilares, Corredor com obstáculos) e abre o editor.
- **Jogar** entra no mapa. **Editar**, **Variação**, **Duplicar**, **Exportar** e **Excluir** atuam sobre o mapa da lista.
- **Importar…** lê um arquivo `.json` exportado antes.
- **Mapas do jogo** (Campo de treino e Floresta de Eldrin) podem ser jogados e servir de base; não podem ser editados.

Ao jogar um mapa da biblioteca (inclusive com **Testar ▶** no editor), a barra do topo mostra **✎ Voltar à edição**: ele sai do
mapa e reabre o editor nesse mapa, e **Testar ▶** entra de novo. Mapas do jogo, que não são editáveis, não mostram o botão.

Dentro de um mapa, a aba mostra **Reiniciar inimigos**, **Editar este mapa** e **Sair do mapa**. Sair volta à vila ou, sem
campanha, ao menu.

## O editor

Vista de cima com grade. Esquerdo usa a ferramenta; direito, botão do meio ou Espaço + arrastar movem a vista; a roda dá zoom.

| Ferramenta | Uso |
| --- | --- |
| Selecionar (V) | Clique para selecionar, arraste para mover, inspetor à direita para valores exatos |
| Apagar (E) | Clique remove; em objeto herdado, oculta |
| Início do jogador / Inimigos | Marcadores. Cada ponto de inimigos tem tipo e quantidade (surgem em espiral ao redor) |
| Colisores | Muro e Tronco caído (arraste para desenhar um retângulo), Pilar, Carvalho, Pinheiro, Pedra, Toco, Cacto, Coluna, Gelo, Ruína, Casa |
| Enfeites e Chão | Arbusto, Lápide, Caveiras, Barril, Caixa, Brasa, Água, Trilha. Não têm colisão |

**Criar vários de uma vez.** Com uma peça redonda escolhida (todas, exceto Muro e Tronco caído), segure o botão e arraste. O
seletor **Ao arrastar** do painel de ferramentas define o que acontece:

- **Fileira ao longo do traço** (padrão): uma peça a cada *Espaço* unidades ao longo do caminho do ponteiro, mesmo com o mouse
  rápido. Com *Espaço* em 0 a distância vem do tamanho da peça (colisores encostam um no outro, enfeites se sobrepõem um pouco).
- **Espalhar com pincel**: jatos de peças em posições aleatórias dentro do círculo de *Raio* (tracejado sob o cursor), sem
  encostar nas do mesmo traço. Serve para florestas, campos de pedras e manchas de água.
- **Um por clique**: sem pintura.

Um clique simples ainda cria uma peça (ou um jato, no modo Espalhar). O traço inteiro é uma só entrada do histórico: Ctrl+Z
desfaz tudo, e o limite de 600 objetos por mapa vale durante o traço.

Atalhos: Del apaga, Ctrl+Z / Ctrl+Y desfazem e refazem (100 passos), Ctrl+D duplica, setas ajustam (Shift: 2 u), Ctrl+S salva,
Esc volta para Selecionar. **Grade** liga o encaixe em 0,5 u. **Testar** salva e entra no mapa.

O painel lateral guarda o **bioma** (muda cores do chão e do fundo e a cobertura de vegetação), o **tamanho** (12 a 120 u,
centrado na origem) e o **nível dos inimigos** (1 a 60, a mesma escala das ondas de treino). A **Verificação** avisa de início
fora do mapa, jogador preso, objetos fora dos limites e pontos de inimigos que os obstáculos isolam do início
(varredura em grade com o raio do personagem; é um aviso, não uma garantia de que a IA consiga navegar).

### Pré-visualização 3D

Os botões **2D**, **2D + 3D** e **3D** (barra superior) escolhem o que o editor mostra. Em telas com 1100 px ou mais o padrão é
2D + 3D, lado a lado; em telas estreitas, só 2D (o modo dividido empilha as vistas). A escolha vale até recarregar a página.

A vista 3D usa o mesmo cenário do jogo (as peças das Expedições) e a mesma câmera ortográfica, com o personagem do jogador
parado no início. Ela acompanha o editor em tempo real: qualquer mudança (inclusive arrastar um objeto, desfazer e refazer) é
reconstruída no quadro seguinte.

- **WASD ou setas** andam, com a colisão real do mapa (mesmo raio e velocidade do jogador); a frente é para onde a câmera olha.
- **Arrastar** gira e inclina a câmera; a **roda** dá zoom.
- **Duplo clique** leva o personagem até o ponto.
- **Câmera livre** (ou a tecla C) solta a câmera do personagem: as teclas passam a mover a câmera, que atravessa tudo.
- **Marcadores** mostra ou esconde início, pontos de inimigos e o limite do mapa; **Chão claro** clareia o fundo para
  conferir obstáculos escuros; **Ir ao início** e **Redefinir câmera** voltam ao estado inicial.

A prévia usa um renderizador WebGL 2 próprio, criado ao abrir a vista e liberado ao voltar para 2D ou fechar o editor. Sem
WebGL 2 o editor continua funcionando só em 2D e a vista 3D avisa. Os inimigos não aparecem como modelos: só os marcadores.

## Mapa base

Qualquer mapa (da biblioteca ou do jogo) pode ser a base de outro. A herança é viva: o mapa derivado guarda só as diferenças e
muda junto quando a base é editada.

- Herda objetos, bioma, tamanho, início e inimigos. Cada campo tem a opção **Herdar … da base**; desmarcada, o mapa passa a ter
  o seu próprio valor.
- Objetos herdados aparecem esmaecidos. Clique em um para **Ocultar neste mapa** (e **Restaurar**) ou **Copiar para editar**.
- **Variação** (na lista ou no editor) cria um mapa que herda de outro. Escolher **Sem base** no seletor copia tudo da base para
  o mapa e desfaz o vínculo.
- Cadeias de até 5 mapas; ciclos são recusados ao salvar. Um mapa usado como base não pode ser excluído enquanto houver
  dependentes. Se a base sumir (por exemplo, após importar só o filho), o mapa passa a valer sozinho e a aba avisa.

## Dados e arquivos

- A biblioteca fica no armazenamento do navegador, na chave `necromancer_v2_maps`, **separada do save do jogo**
  (`necromancer_rise_3d_save`), que não é lida nem alterada. Limite de 60 mapas, 600 objetos e 24 pontos de inimigos por mapa.
  Uma biblioteca corrompida não é sobrescrita; o painel avisa.
- **Exportar** grava um `.json` (`necromancer-rise-maps`) com o mapa **e as bases personalizadas de que depende**; **Importar**
  aceita esse pacote ou um mapa solto, dá novos ids aos que já existem e reescreve as referências de base. Mapas de versões mais
  novas ou com tipos de objeto desconhecidos são importados descartando o que não se conhece.
- O documento (`version: 1`) tem `id`, `name`, `biome`, `size`, `start`, `spawns`, `objects`, `level`, `base` e `hidden`. Em mapas
  com base, `biome`, `size`, `start` e `spawns` valem `null` quando herdados.

## Como o mapa vira jogo

`map-model.mjs` converte o mapa resolvido em uma arena da v2: objetos sólidos viram colisores (`solids`) e os demais viram
`decor`; a cena usa o tema `expedition` com a paleta do bioma, as mesmas peças das Expedições. A cobertura do chão (grama,
flores, manchas) é sorteada de forma determinística pelo id do mapa e evita colisores. `map-play.mjs` põe o jogador no início e
cria os inimigos com `spawnEnemy`; Bruto e Acólito de Guerra, desativados na v2, não aparecem como opção.

Um mapa jogado pela aba é um campo de treino com cenário próprio: sem chefe, sem fim de encontro e com as recompensas (XP, ouro e
equipamentos) do treino, nivelados pelo **nível dos inimigos**. O terreno muda deslocamento, colisão e dano como descrito em [Relevo e água](#relevo-e-água).

## Limites

- Quando o jogador está num bolsão fechado por obstáculos (ou só alcançável por passagens mais estreitas que a grade de busca
  de .8 u), os inimigos de fora não acham caminho: ficam parados junto à barreira e tentam de novo a cada 1,5 a 2,5 s. A
  busca de caminho (`terrain.mjs`) descarta esses casos antes de rodar e tem limite de 400 nós; foi o que travava mapas com
  o início cercado. A **Verificação** do editor avisa "parecem isolados do início".
- Os colisores são círculos e caixas, que podem girar no plano do chão (`angle` em `terrain.mjs`); a altura é visual. Só os mapas do editor giram peças.
- O cenário segue o das Expedições, com o estilo do mapa por cima; não há fontes de luz novas (a fogueira e as runas só brilham no material).
- O jogo usa a biblioteca do navegador onde foi aberto: `file://` e servidores locais têm bibliotecas separadas. Use Exportar e
  Importar para levar mapas entre eles.
- Mapas personalizados não entram em missões, Arena ou Conquista. Vila de Eldrin, a defesa de Jacarandá e as fases antigas do Ato I não usam o formato do editor e não podem ser editados.
- A grade de terreno tem célula de até 2 u: em mapas de 360 u, os limites reais de água funda e penhasco variam até cerca de 1 u em relação ao desenho, que é mais fino.
- A água fica sempre na cota 0: não há lago em altitude.
- Tiros não sobem nem descem com o relevo: a altura só muda o dano. Não há recuo em penhasco nem nado.
- Testar um mapa da campanha não roda diálogos nem missões; para isso, jogue a campanha.

## Verificação

Fontes: `v2/map-editor.html`, `v2/tools/map-editor-server.cjs`, `v2/scripts/map-editor-app.mjs`, `map-disk-store.mjs`, `map-handles.mjs`, `scene-sectors.mjs`, `map-model.mjs` (modelo, herança, validação e biblioteca), `map-terrain.mjs`, `map-spawns.mjs`, `campaign-maps.mjs`, `terrain-scene.mjs`, `map-editor.mjs`, `map-preview.mjs` (vista 3D), `map-panel.mjs`,
`map-play.mjs` e `maps.css`. Testes das regras: `node --test v2/tests/map-model.test.mjs v2/tests/map-terrain.test.mjs v2/tests/map-editor-server.test.mjs v2/tests/scene-sectors.test.mjs v2/tests/terrain.test.mjs`.

`node v2/tests/map-editor-3d-browser-check.cjs` constrói pelo mouse na vista 3D: coloca, seleciona, move, usa as alças de raio, altura, giro e lado, desfaz, copia peça herdada e apaga, e confere que mexer em uma peça do mundo de 360 u não repinta o chão. Evidências em `review/v2/map-editor-3d/`. Regras de seleção e alças: `node --test v2/tests/map-handles.test.mjs`.

`node v2/tests/map-editor-client-browser-check.cjs` percorre o cliente em uma pasta temporária de mapas: edita, confere o arquivo, abre o jogo pelo Testar, recarrega, simula uma falha de gravação e restaura. Evidências em `review/v2/map-editor-client/`.

`node v2/tests/map-editor-browser-check.cjs` (Playwright e Edge, armazenamento isolado) edita o Caminho de Jacarandá pelos controles reais: rio, relevo, lama, ponte, composição e gatilho de spawn, estilo e tamanho. Confere o salvamento automático, a recarga, a entrada no mapa, a colisão e o aviso de terreno, sem erros de página; evidências em `review/v2/map-editor/`, incluindo catálogo, mundo de 360 u em fundo escuro e claro, e borda do mapa com zoom máximo em qualidade baixa. O teste roda com WebGL por software, então o tempo de quadro medido não representa uma GPU real; o custo em máquina real e a dificuldade com relevo não foram medidos. O kit novo foi conferido no jogo, não no Blender aberto, porque o MCP estava desconectado.

## Protótipo da campanha integrada

Em **Novo mapa**, escolha **Campanha integrada · Cripta–Floresta–Vila**. Cria uma cópia editável de 120 × 120 unidades: cripta no sudoeste, floresta central e vila no nordeste, com trilha contínua e três encontros de teste. Fonte: `v2/scripts/campaign-world-map.mjs`. Use **2D + 3D** para revisar e **Testar** para percorrer. Salve para guardar suas alterações na biblioteca; o modelo não sobrescreve mapas existentes.

É uma planta inicial dentro dos limites atuais do editor, ainda com um único bioma global e casas genéricas. Não substitui a campanha atual, não contém NPCs, quests, reconstrução nem respawn. Essas integrações e a diferenciação visual das regiões são próximas etapas. Testes do modelo de mapas e build executados; inspeção visual no editor ainda pendente.

Atalho direto: **Revisar campanha integrada** na aba Mapas abre uma cópia editável da planta. Ela também aparece em **Mapas do jogo**, com Jogar e Criar variação. Não é necessário importar JSON.

O modelo da campanha integrada foi ampliado para **240 × 240** (dobro por eixo, quatro vezes a área), mantendo construções em escala humana. Tem caminho secundário, clareiras com colunas, acampamentos e depósitos junto à vila. O limite dimensional do editor agora é 240; o limite de 600 objetos permanece. Mapas já salvos são preservados: use **Revisar campanha integrada** para abrir a nova planta. A trilha procedural passa a usar cor uniforme entre segmentos, inclusive nos demais cenários que usam `buildForest`. Inspeção visual e desempenho do mapa ampliado ainda pendentes.

A planta integrada usa agora **Muro de cripta com vitral**, peça editável com largura, profundidade e altura, padrão 8 m. O kit `cryptArchitecture` é gerado por `blender/scripts/v2_crypt_architecture.py`; a cena o usa no jogo e na prévia com fallback de caixa sem modelos. Paredes translúcidas permitem conduzir o personagem no interior; o salão permanece aberto por cima como corte de apresentação. A abertura leste leva à floresta. A câmera existente acompanha o personagem no jogo; na prévia, desative Câmera livre. Build e testes de mapas executados; aparência e transição ainda sem validação visual.

Interior da planta integrada: piso de lajes, salas laterais com vãos para o corredor, bancos funerários, altares com velas, estantes e sarcófago aberto no início. As cinco peças estão no grupo **Cripta** do editor, como decoração sem colisão. O jogador nasce no sarcófago e sai andando pelo lado aberto; não há animação de despertar. Build, testes do modelo e verificação do início/corredor executados; visual ainda sem conferência no navegador.

A planta integrada agora é o mundo da campanha nova e tem **360 × 360** unidades, com mina, serraria, cemitério e mata nas bordas (veja o [guia da campanha](v2-campanha.md)). Os limites do editor passaram a 360 de lado, 2000 objetos e 40 pontos de inimigos. Grama, manchas e flores mantêm os tetos anteriores até 240 × 240; acima disso, crescem com a área para preservar a densidade. Mapas salvos não mudam.

**Atualizar modelos** na aba Mapas (também em Opções do menu inicial) recarrega o HTML atual, incluindo modelos e módulos embutidos pelo último build. Salve o mapa antes: não preserva alterações em memória nem sessões de combate. A biblioteca salva continua no armazenamento do navegador. Não regenera GLBs nem executa o build.

Correção do piso da cripta: lajes ficam a 0,025 u acima do chão, com deslocamento de profundidade no material e sem projetar sombras. Antes, topo das lajes e terreno estavam na mesma altura, causando disputa de profundidade durante movimento da câmera. Os avisos de combate a 0,04 u continuam acima do piso. Build e sintaxe verificados; conferência visual em movimento pendente.

Revisão da composição da cripta: removidos pontos de trilha dentro do salão e lápides/colunas antigas que cruzavam divisórias; novas lápides distribuídas nas salas laterais. Mapas personalizados de floresta passam a usar chão pintado com faixas de terra contínuas entre pontos próximos, substituindo os discos individuais. Isso também atualiza o chão de outros mapas personalizados de floresta; objetos e colisões salvos permanecem iguais. Para receber a composição nova, abra o modelo novamente. Sintaxe, testes de mapas e build verificados; conferência visual pendente.

Revisão de pilares e trilha: seis colunas de 6 m no salão, com base/capitel e fuste segmentado do GLB `crypt_column`; marcos externos passam a 4,5–5,7 m. Colunas em outras Expedições também usam o kit quando disponível, preservando suas medidas. A pintura de trilha usa máscara única com grão de terra e variação de tom (pântano e mapas personalizados de floresta), em vez de camadas de preenchimento uniforme. Build, sintaxe e testes do modelo executados; avaliação visual ainda pendente.

A grama dos mapas personalizados de floresta usa manchas suaves de verde, separadas da paleta escura do pântano. Sombras pintadas de muros seguem a base em faixa estreita, em vez de um círculo calculado pela diagonal. Teste de gradientes e build executados; aparência pendente de conferência.

Casas de mapas personalizados usam uma variante degradada do kit original (`ruinedVillageKit`), com telhas ausentes, paleta envelhecida, janelas apagadas e tábuas cruzadas. A largura/profundidade é inscrita no colisor circular existente. Não altera a Vila de Eldrin da campanha atual. Tochas do cenário de Expedições e mapas personalizados usam agora `cryptArchitecture/torch` quando disponível, com fallback anterior. São modelos estáticos, sem animação da chama. Blender, build, sintaxe e testes de mapas executados; visual e circulação ainda pendentes de conferência no jogo.

Fatia de acabamento na saída da cripta: vegetação antes sorteada foi recomposta em agrupamentos laterais, com arbustos, pedras baixas e vestígios de posto de vigia. A ligação até a primeira clareira foi conferida com `lineClear` em três segmentos, raio 0,55. Planta com 562 objetos, abaixo do limite de 600. Mapas personalizados de floresta passam a usar o kit de vegetação; barris/caixotes personalizados usam o kit da vila, com fallback anterior. Referência de direção: Pixel Crawler de Anokolisa (composição de margens e conjuntos de adereços; nenhum sprite foi importado). Build e testes de mapas/chão executados; inspeção visual ainda pendente.

## Paridade de acabamento com a Vila de Eldrin (31/10/2026)

Nos mapas personalizados de floresta, jogo e prévia 3D agora compartilham a receita de luz da vila em
`scene-look.mjs`: ACES, exposição, reflexo difuso do céu, sol e hemisfério. A prévia também respeita o chão
pintado que substitui o plano liso e aplica as alterações de fundo claro aos materiais do cenário.
As outras paletas conservam a configuração anterior. O ambiente da prévia é liberado ao fechá-la.

Paredes da cripta passam a ser opacas, com recorte pontilhado apenas quando encobrem o personagem;
isto substitui a transparência permanente de 48% descrita nas revisões anteriores. A vegetação usa o vento
do kit da vila. Casas abandonadas mantêm danos, com reboco e telhas de cores mais legíveis. Tochas ganham
poças de luz aditivas no chão, mais fracas no fundo claro. As regras e posições do mapa são preservadas.

Cada família de peças do kit tem seu próprio material, evitando que a cor, o shader ou o descarte de uma
cena afetem outra ou a prévia. Verificações executadas: `scene-look.test.mjs`, `map-model.test.mjs`,
`swamp-ground.test.mjs`, `village.test.mjs`, sintaxe dos módulos e build. Ainda pendentes: inspeção visual
no navegador, comparação em movimento, fundo claro/escuro e custo em qualidade baixa. Os testes não
comprovam equivalência estética com a vila.


## Mapas da abertura do ARANDU (01/11/2026)

Disponíveis tanto no seletor de **Novo mapa** quanto em **Mapas do jogo**:

- **ARANDU · Desembarque da caravana**: área de 40 × 60 com as duas carroças, estrada, vegetação, bloqueio, início do jogador e três bandidos.
- **ARANDU · Caverna dos bandidos**: galeria de 40 × 60 com paredes rochosas, tochas, caixotes, lista de captura, marco da saída, destroços da queda e dois bandidos.

Escolha o modelo e clique em **Novo mapa** para editar uma cópia independente. Em **Mapas do jogo**, **Criar variação** mantém herança da base. Salvar grava na biblioteca; **Testar ▶** entra na cópia com inimigos. Essas cópias não substituem automaticamente a campanha nem executam seus diálogos, missão da lista ou transições.

A paleta tem os grupos **Caravana** e **Caverna**: carroça, bloqueio, parede rochosa, lista, saída e destroços. As carroças permitem largura, profundidade e altura; paredes permitem os mesmos ajustes. O bioma **Caverna** usa o chão e o acabamento rochoso da campanha. A prévia 3D desenha as mesmas peças GLB usadas no jogo; mover paredes e marcadores atualiza sua apresentação. Lista e saída são peças de cenário no teste de mapas, sem gatilhos narrativos.

Fonte comum: `v2/scripts/prologue-map-data.mjs`, consumida por `prologue-map.mjs` e `map-model.mjs`. Pontos de inimigos da emboscada e da caverna também vêm dessa fonte. Registro dos módulos em `v2/tools/build.cjs`. A prévia usa `prologue-scene.mjs`, e `toArena` traduz os objetos para colisores e adereços.

Verificados: testes do modelo de mapas/prólogo e suíte da v2; `node v2/tests/prologue-maps-browser-check.cjs` no Edge com armazenamento isolado. O check abre as duas cópias em **2D + 3D**, salva, recarrega e testa a caverna. Evidências em `review/v2/arandu-editor/`. Alterações pessoais da biblioteca não foram lidas nem substituídas.


A caverna da abertura inclui mesa de ordens (`hideout_table`), carga roubada (`hideout_cargo`), leitos (`hideout_bedroll`), escoramentos (`cave_support`) e formações (`cave_spire`). Mesa, carga e formações têm colisão; as outras peças são decorativas. A prévia usa o mesmo kit GLB e piso da campanha. Objetos anteriores mantêm IDs e os novos são acrescentados ao final; editar uma cópia não substitui automaticamente o mapa da campanha.

- Toda fase da v2 deve ter borda infinita: continuidade visual do piso e do bioma além dos limites jogáveis, inclusive cavernas, sem alterar colisões. Conferir com zoom máximo, chão claro/escuro e qualidade baixa; não deixar o mapa parecer uma placa recortada.

## Várzea de Itaúna: regiões encadeadas (04/11/2026)

Protótipo de área além do mundo de Jacarandá, com forte e gruta em mapas próprios e passagens por anel no chão. Regras, passagens e limites em [v2-itauna.md](v2-itauna.md). O catálogo ganhou o grupo **Forte** (muralha, torre, portaria, torre de menagem, armeiro e boneco de treino) e, em **Caverna**, boca de caverna, teia, ninho de ovos e restos de presa. O limite de 360 u e 2000 peças por mapa não mudou.
