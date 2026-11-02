# V2 — Editor de mapas

Editor dentro do jogo para criar mapas, jogar neles e usá-los como base de outros. É uma ferramenta de criação: não faz
parte da campanha, da vila nem dos modos de ondas, e não altera nenhum mapa existente.

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

Regras do jogo não mudam. Um mapa é um campo de treino com cenário próprio: sem chefe, sem fim de encontro e com as
recompensas (XP, ouro e equipamentos) do treino, nivelados pelo **nível dos inimigos**.

## Limites

- Quando o jogador está num bolsão fechado por obstáculos (ou só alcançável por passagens mais estreitas que a grade de busca
  de .8 u), os inimigos de fora não acham caminho: ficam parados junto à barreira e tentam de novo a cada 1,5 a 2,5 s. A
  busca de caminho (`terrain.mjs`) descarta esses casos antes de rodar e tem limite de 400 nós; foi o que travava mapas com
  o início cercado. A **Verificação** do editor avisa "parecem isolados do início".
- Os colisores são círculos e caixas alinhadas aos eixos (sem rotação); a altura é visual.
- O cenário é provisório como o das Expedições: não há iluminação própria nem peças novas.
- O jogo usa a biblioteca do navegador onde foi aberto: `file://` e servidores locais têm bibliotecas separadas. Use Exportar e
  Importar para levar mapas entre eles.
- Não há tela de mapa na campanha nem uso de mapas personalizados em missões, Arena ou Conquista.

## Verificação

Fontes: `v2/scripts/map-model.mjs` (modelo, herança, validação e biblioteca), `map-editor.mjs`, `map-preview.mjs` (vista 3D), `map-panel.mjs`,
`map-play.mjs` e `maps.css`. Teste das regras: `node --test v2/tests/map-model.test.mjs`. A interface foi conferida manualmente no navegador
(criar, mover, desenhar muro, desfazer, herdar, ocultar, copiar, salvar, testar no jogo, persistir após recarregar, excluir base
com dependentes e largura de celular), incluindo a vista 3D (modos 2D, 2D + 3D e 3D, andar, girar, zoom, atualização ao editar e
liberação ao fechar); não há `*-browser-check.cjs` automatizado para o editor.

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
