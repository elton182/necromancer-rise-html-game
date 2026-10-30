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
