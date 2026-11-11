# Interface e HUD da v2

HUD e menu "Relicário" da v2, com base compartilhada com a v1 legada (`v1/necromancer-canvas.html`) para a
v2. Não altera dano, custo, alcance, recarga ou progressão: a interface lê o estado
existente e usa as mesmas ações de sessão.

## Fontes

| Arquivo (em `v2/`) | Papel |
| --- | --- |
| `tools/ui-source.cjs` | Extrai o CSS do Relicário de `v1/necromancer-canvas.html` |
| `scripts/shared-hud.css` | **Gerado** pelo build a partir da fonte acima; não editar |
| `scripts/ui.css` | Adaptações próprias da v2 (posições, abas, seletor de habilidade, ajuda) |
| `scripts/hud-ornate.css` | Camada visual do HUD ornamentado (bronze, molduras SVG, orbes em garras, minimapa circular); última folha do build |
| `tools/ui-layout.html` | Marcação do HUD, do Relicário e dos diálogos; entra no HTML pelo build |
| `scripts/game-ui.mjs` | Liga HUD e menu ao estado: recursos, slots, minimapa, chefe, abas |
| `scripts/quest-model.mjs`, `scripts/quest-journal.mjs` | Ofertas, histórico derivado da campanha e diário de missões abertas/concluídas |
| `scripts/title.mjs` | Tela inicial: botões sobre a arte, cartão do save, opções, créditos, sair |
| `scripts/grimoire-panel.mjs` | Aba Habilidades: árvores Minions/Profana e Maestrias |
| `scripts/shared-skills.css` | **Gerado** pelo build a partir de `scripts/skill-trees.css` e `skill-mastery.css`; não editar |
| `scripts/gear-panel.mjs` | Aba Equipamentos (mochila, ficha da peça, personagem com slots, atributos, mercador) |
| `scripts/inventory-preview.mjs`, `scripts/inventory.css` | Modelo 3D real da classe (um contexto WebGL, compartilhado entre Equipamentos e Personagem) e o visual do inventário |
| `scripts/character-panel.mjs`, `scripts/character.css` | Aba Personagem: modelo 3D, origem dos atributos, resumo, XP e detalhes |
| `scripts/talents-panel.mjs`, `scripts/talents.css` | Árvore de talentos do Guerreiro na aba Habilidades |
| `scripts/character-stats.mjs` | Ícones, rótulos e descrições dos atributos por classe e o índice Poder de Combate (comum às duas abas) |
| `scripts/shared-title.css`, `shared-equipment.css`, `shared-menu.css`, `shared-portrait.mjs` | **Gerados** pelo build a partir do jogo anterior (`v1/necromancer-canvas.html`, `scripts/equipment.css`, `scripts/menu.css`); não editar |
| `tests/ui-browser-check.cjs`, `tests/title-browser-check.cjs` | Verificações Edge/Playwright; evidências em `review/v2/ui/` |

Se o bloco do Relicário mudar no HTML canônico, o build falha com mensagem explícita
para revisar o adaptador.

## O que existe

- **HUD:** frascos de vida e mana, nível/ouro/pontos de Grimório, XP, seis slots de
  habilidade com tecla, recarga, mana insuficiente e vivos/total do grupo, estado da
  horda, local/objetivo, barra do chefe (fases I/II) e minimapa.
- **Relicário (Esc):** sem barra de título; o topo é o resumo de Zephyr com o botão ✕.
  Abre em Equipamentos, a primeira aba, seguida de Missões, Personagem, Habilidades (Grimório),
  Horda e Sistema (Laboratório, Mapas, Waves e Valdoria aparecem conforme a cena).
  Abrir qualquer aba pausa a simulação; fechar retoma, exceto onde a cena exige pausa
  (menu, morte).
- **Atalhos:** `I` abre Equipamentos, Grimório pelo botão do HUD, `H` abre/fecha a ajuda.
  Clique em um slot abre o seletor de habilidade (pausa enquanto aberto).

## Missões em Jacarandá

NPCs com **!** dourado acima da cabeça oferecem uma missão; **?** verde indica uma etapa pronta para concluir por conversa. Aproximar-se e pressionar **G** abre o diálogo. A missão só entra no HUD depois de aceitar o pedido; fechar a conversa mantém a oferta. O HUD mostra a etapa atual como **Etapa N de M**, acompanhando o avanço salvo. Antes de aceitar, orienta procurar os NPCs com !.

O inventário oferece o botão **Missões · em aberto e concluídas**, acima dos equipamentos. Ele abre a mesma aba **Missões** do Relicário. O diário separa **Em aberto** e **Concluídas**, mostra o NPC responsável e lista as etapas com a atual destacada. Entradas concluídas começam recolhidas e podem ser abertas. Listas vazias têm uma mensagem própria. Aceitação, etapas e conclusões sobrevivem ao recarregamento pelo estado existente da campanha.

O fluxo começa com Joaquim oferecendo Bruno; depois da forja, ele oferece a madeira. Marta oferece o resgate de João, e João oferece a missão da carta ao retornar à vila. A viagem a Itavera e o convite final também dependem de ações nas conversas. Veja [regras da campanha](v2-campanha.md#quests) e [evidências em desktop e 390 px](../review/v2/quest-journal/validation-notes.md).
- **Controle:** navegação por foco nos diálogos e confirmação pelo botão principal;
  Start fecha o diálogo ativo.
- **Controles de configuração e teste** (fundo, qualidade, horda, modo da horda,
  builds de teste, save/importação) ficam na aba Sistema/Horda, não mais soltos na tela.

## Tela inicial

Portada de `tMain` do jogo anterior: arte 1536×1024 (extraída no build) com seis botões
sobrepostos nos mesmos retângulos, partículas de almas e cartão do save.

| Botão | Na v2 |
| --- | --- |
| Continuar | Habilitado quando há save da v2; retoma mapa/vila/treino como o `Continuar` anterior |
| Nova campanha | Inicia o Ato I; com campanha existente pede confirmação, reinicia personagem e campanha e guarda o save anterior como cópia (`_backup`) |
| Modo livre | Entra no treino; com campanha pede confirmação (o progresso permanece) |
| Opções | Gráficos (alta/baixa), ambiente claro/escuro, tela cheia, importar/exportar save |
| Créditos / Sair | Como no jogo anterior; Sair confirma e mostra “Até a próxima” |

O painel antigo (`#scene-panel`) continua apenas para a tela “Você caiu”. HUD e painel
de teste ficam ocultos enquanto a tela inicial está ativa.

## Equipamentos

Quatro colunas, nesta ordem (abaixo de 1200 px viram duas linhas; abaixo de 760 px, uma coluna):

- **Inventário:** contagem de peças, categorias (Todos, Armas, Armaduras, Anéis, Grimórios ou
  Escudos, Consumíveis), grade 5×6 por bolsa (I/II), nível e aprimoramento em cada célula, ouro.
  Arrastar uma peça até um slot iluminado equipa, como antes. Em Consumíveis a grade mostra os
  itens de F1–F5 com a quantidade.
- **Ficha da peça:** ícone e nome na cor da raridade, raridade • tipo, nível, atributo base em
  destaque com a diferença para a peça do slot, afixos, efeito especial (Osso Carcomido) e texto
  de ambientação. Botões **Equipar**, **Comparar** (alterna a tabela Equipado/Selecionado) e
  **Vender** (menu e vila) ou **Descartar**; uma peça equipada mostra **Desequipar**. Anéis
  escolhem o slot esquerdo/direito; na vila a forja do Bruno aparece na ficha.
- **Personagem:** o GLB real da classe (Necromante, Guerreiro ou Druida) em pose de espera, girável com
  o mouse (duplo clique recentraliza), com quatro slots à esquerda (cabeça, corpo, arma, botas) e
  três à direita (grimório/escudo e anéis). O escudo do Guerreiro só aparece com escudo equipado,
  pela mesma máscara do renderizador. Abaixo, **Poder de Combate**.
- **Atributos:** nome, classe e nível; Atributos Principais e Secundários com a diferença da
  troca prevista (verde/vermelho). **Detalhes avançados** abre a análise de dano/DPS por
  habilidade (ou golpes físicos do Guerreiro) e os bônus equipados.

Filtro de loot, Gerenciar mochila e o mercador ficam abaixo das colunas.

**Poder de Combate** é só um índice de exibição para comparar trocas; não entra em nenhuma regra.
Fórmula (`combatPower` em `character-stats.mjs`): ataque (dano do Guerreiro ou dano mágico) × 4 + vida
efetiva (vida ÷ (1 − mitigação, até 70%)) × 0,6 + (recuperação de vida + de mana/vigor) × 6 +
movimento × 10 + redução de recarga × 6 + defesa de escudo × 6 + DPS básico da horda × 2 +
vida da horda × 0,05.

A prévia 3D cria um único `WebGLRenderer` na primeira abertura e o reaproveita; o laço de desenho
para quando o Relicário fecha ou a aba muda e volta ao reabrir. Retrato e resumo do personagem
aparecem no topo do Relicário; o rodapé tem Continuar (Esc), Ajuda (H), Recomeçar e Menu principal.

## Personagem

Três painéis (abaixo de 1200 px o resumo desce; abaixo de 760 px, uma coluna):

- **Retrato:** o mesmo modelo 3D do inventário (o elemento é movido entre as abas; só um contexto
  WebGL), nome, classe e nível, e as seções **Atributos** e **Detalhes**.
- **Atributos:** Vida, Mana ou Vigor, Dano mágico ou Dano, Defesa e Movimento, cada um com o
  total e a divisão entre base (nível e passivas) e equipamentos. Clicar num atributo mostra o que
  ele faz no jogo. **Pontos disponíveis** são os do Grimório (Necromante) ou do Treinamento
  (Guerreiro); os botões levam a Equipamentos e a Habilidades. Não há pontos de atributo próprios.
- **Resumo do Personagem:** Poder de Combate; Recursos, Combate, Derivados e Horda (Necromante)
  ou Equipamento (Guerreiro); nível e barra de XP até o próximo nível.
- **Detalhes:** dano por uso, recarga (e DPS potencial do Necromante) de cada habilidade e as peças
  equipadas por slot.

Os elementos de texto antigos do resumo (`#level`, `#exp`, `#gold`, `#points`, `#health`, `#mana`)
continuam no DOM da aba, ocultos, porque o HUD e os testes os atualizam e leem.

## Habilidades e maestrias

O Grimório do Necromante (`scripts/grimoire-panel.mjs`) usa o mesmo quadro dos talentos do Guerreiro (`scripts/talents.css`, bloco `wt-necro`): lateral com estandarte, pontos disponíveis e as árvores **Senhor dos Mortos**, **Carne e Ossos**, **Morte** e **Maestrias** (selos aprendidos / total; nas Maestrias, especializações em uso / 6), **Redistribuir** (20 ouro por ponto) e o ouro. Cada árvore mostra suas escolas em colunas coloridas, com brasão, selos com contador, ligações de pré-requisito (2 pontos no anterior) e finais exclusivas em selos redondos. O detalhe traz descrição, efeito por ponto, pré-requisitos com ✓/✕, **+ Investir ponto**, **− Devolver ponto** (com custo), os slots para equipar e os bônus acumulados; ele rola por dentro quando passa da altura. Os ícones são os glifos de texto das regras, forçados à apresentação monocromática. Maestrias mantém seus cartões e regras, na mesma paleta. No celular as escolas ficam empilhadas. Regras inalteradas em `grimoire.mjs`. Evidências: `review/v2/inventory/grimoire-*.png`.

## Decisões e diferenças em relação aos diálogos anteriores

- `#gear-dialog` e `#grimoire-dialog` deixaram de abrir sozinhos: Equipamentos e
  Grimório são abas do Relicário (`#pause-dialog[data-tab]`). O mercador da vila abre
  a aba Equipamentos.
- Fechar o Relicário no treino/vila sempre retoma a simulação; o botão **Menu** dentro
  dele fecha o diálogo antes de voltar à tela inicial.
- Os botões de Tiro/Dash do painel antigo ficam ocultos; a ação é pelos slots.

## Verificação

```bash
node v2/tools/build.cjs
node --test v2/tests/*.test.mjs
node v2/tests/ui-browser-check.cjs
node v2/tests/inventory-browser-check.cjs   # inventário e aba Personagem
```

O check de UI exercita: seis slots, HUD sem painel lateral, pausa congelando o
relógio, cinco abas, troca de habilidade, inventário/Grimório/Horda, ajuda H/Esc,
fundo claro/escuro com qualidade baixa, janelas 1440/1280/600 px de largura e
ausência de requisições de rede.

Os demais checks de navegador usam `tests/legacy-controls.cjs` para acionar os
controles que agora vivem dentro do diálogo fechado, sem abrir o menu nem pausar o
jogo; a visibilidade real desses controles é conferida só no check de UI.

## Limites

- As abas **Waves** e **Valdoria** do menu anterior pertencem à E10 (Arena e Conquista) e ainda não existem.
- Opções não inclui volume, música nem calibração de controle (sem áudio na v2 até a E11); “Apagar save” não foi portado.
- O título extrai a arte e o estilo de `v1/necromancer-canvas.html`; a distribuição cresce ~0,3 MB.
- Não foram portados os tutoriais de primeiros pontos/equipar do Grimório anterior.
- “Voltar à história” do menu anterior equivale ao botão Voltar ao mapa/vila, já existente.
- Navegação por controle foi testada com eventos simulados; hardware físico não foi
  conferido (fica para E11).
- A barra do chefe pode cobrir rótulos de inimigos próximos no campo de treino.
- Em janela estreita (600 px) o HUD cabe sem rolagem, mas minimapa e painéis ficam
  apertados; revisão fina de layout e ajuda completa ficam para E11.
- Não houve revisão de áudio, tutoriais nem das telas de Arena/Expedições/Conquista (E10).


## ARANDU — tela inicial e seleção (31/10/2026)

A apresentação da v2 passa a usar ARANDU, com paisagem de pôr do sol, cidade murada e menu interativo: **Novo Jogo, Carregar, Configurações, Créditos e Sair**. Modo livre e editor continuam disponíveis em atalhos discretos. Estilos locais em `v2/scripts/arandu-title.css`, após os estilos compartilhados; não editar `shared-title.css`.

**Novo Jogo** abre a seleção com apenas **Necromante**, modelo GLB do jogador animado em uma cena exclusiva (`title-preview.mjs`), descrição e campo de nome obrigatório (até 32 caracteres). **Iniciar jornada** cria um personagem independente e entra na campanha atual. A abertura da caravana, a caverna e a renomeação de Eldrin para Jacarandá ainda não foram implementadas nesta entrega.

**Carregar** lista os personagens por nome, nível e última gravação. Saves antigos sem nome aparecem como Zephyr. Não há exclusão de personagens nesta versão. Criação e troca recusam avançar quando não conseguem preservar o save atual. Nomes são apresentados como texto, sem interpretar HTML. Veja o [contrato de saves](v2-saves.md).

A imagem `assets/title/arandu-refuge.png` é uma edição da referência enviada pelo usuário, usando a ferramenta integrada de geração de imagens. Prompt: remover todas as letras, textos do menu e bordas de botão, reconstruindo a árvore escura; preservar composição, pixel art, pôr do sol, cidade, espada, lanterna e folhas vermelhas; fundo panorâmico sem interface. O build incorpora a imagem ao HTML, sem requisições externas. A paisagem é uma ilustração de apresentação; o personagem da seleção é o modelo real do jogo.

Verificações executadas: build, testes de personagens/saves/sessão/campanha e campanha integrada; check `node v2/tests/title-browser-check.cjs` no Edge com armazenamento isolado. Evidências em `review/v2/arandu-title/`: tela inicial, seleção em 1440 e 390 px, lista de saves e resultado. Não houve teste com controle físico. Esta entrega não valida a futura abertura narrativa.


### Suas jornadas e nova tela de carregamento (05/11/2026)

**Carregar** abre **Suas jornadas**, sobre a mesma paisagem do refúgio (`assets/title/arandu-refuge.png`), sem personagem pintado no fundo:

- **Lista (esquerda):** uma carta por personagem com retrato renderizado do modelo GLB real (`renderPortrait` em `title-preview.mjs`), selo da classe, nome, classe e nível, local onde a jornada retoma e tempo de jogo (ou a data da última gravação, se ainda não há tempo registrado). A última carta, **Novo Personagem**, abre a seleção de classe.
- **Palco (centro):** o modelo animado do personagem selecionado. O Necromante aparece com até três integrantes da horda, na ordem do loadout. Sem evocações no loadout, aparecem esqueleto e zumbi, só como ilustração. O palco nunca altera a simulação.
- **Painel (direita):** frase da classe, Vida, Mana/Vigor, Dano mágico/Dano e Defesa (os máximos calculados pelo mesmo modelo do Relicário), barra de XP do nível atual e localização com detalhe (etapa do prólogo, área de Itaúna, objetivo em Jacarandá, Ato I ou modo livre).
- **Ações:** Voltar, Excluir (com a confirmação já existente), **Continuar** e Configurações (o Voltar das opções retorna às jornadas).

Clicar ou focar uma carta a seleciona; **Continuar** ou duplo clique carrega. O resumo sai de `v2/scripts/journey-model.mjs` (regras puras, com teste em `v2/tests/journey-model.test.mjs`). Abaixo de 760 px de largura (ou 540 px de altura), a tela vira uma coluna rolável com o palco no topo e as cartas em faixa horizontal.

**Novo Jogo** (e a carta **Novo Personagem**) usa o mesmo esqueleto: as três classes como cartas à esquerda, com retrato do modelo real; no centro, o modelo animado da classe (o Necromante com esqueleto e zumbi, a horda inicial ilustrativa); à direita, a frase, a descrição, os **atributos no nível 1** (calculados de um save novo da classe por `classPreview` em `journey-model.mjs`, com espada e escudo iniciais do Guerreiro) e o campo de nome. **Voltar** e **Iniciar jornada** ficam embaixo. O nome digitado é mantido ao trocar de classe. Todos os heróis aparecem com a mesma altura no palco e nos retratos: `title-preview.mjs` escala cada modelo de classe para que os ombros (ossos `LeftArm`/`RightArm`, na pose `idle`) fiquem na mesma altura, com os pés na origem. Cajado, chapéu e armas não entram na medida; o topo da cabeça do rig não serve de referência porque varia entre os modelos (no Mercenário fica no topo do chapéu). Integrantes da horda continuam com as alturas próprias. Evidência: `review/v2/new-character-height/`. As regras da seleção antiga (`character-layout`, `character-preview`, `class-traits` etc.) saíram de `arandu-title.css`.

A **tela de carregamento** usa `assets/title/arandu-loading.webp`, derivada da arte enviada pelo usuário: foram removidos os textos, a porcentagem e o preenchimento da barra, mantendo brasão, título e moldura. Barra, porcentagem, rótulo e dica são desenhados por cima, em coordenadas da imagem.

Verificações: `node v2/tests/journeys-browser-check.cjs` (três personagens semeados, retratos, palco, painel, troca de seleção, Continuar, Novo Personagem com troca de classe e nome vazio, e layout em 1672, 1440, 1024 e 390 px; evidências em `review/v2/journeys/`) e `node v2/tests/loading-browser-check.cjs` (progresso real e alinhamento em cinco formatos; evidências em `review/v2/loading/`). Não houve teste com controle físico.

### Continuação: abertura ARANDU

A partir da entrega da [abertura da campanha](v2-prologo-arandu.md), **Iniciar jornada** passa a entrar na conversa da caravana. A limitação de abertura mencionada na seção anterior é histórica. HUD e minimapa reconhecem os trechos do prólogo; os diálogos ficam acima da barra de ações e podem ser avançados com G. Eldrin é apresentada como Jacarandá no mundo contínuo.


### Viagem com balões

No começo do ARANDU, a câmera acompanha a carroça em movimento. Marta, João e o cocheiro conversam por balões ligados à posição de cada um. **Continuar · G** avança uma fala; **Ver o bloqueio** desembarca para a emboscada. O cocheiro usa o nome do personagem. O HUD e o minimapa retornam após o desembarque. A viagem continua durante a leitura, mas Esc e perda de foco a congelam. Confira [abertura](v2-prologo-arandu.md) e `review/v2/arandu-travel/`.


### Treinamento do Guerreiro

A árvore marcial fica em `scripts/talents-panel.mjs` (visual em `scripts/talents.css`); `game-ui.mjs` só a chama na aba Habilidades. Regras, IDs, orçamento (3 pontos por nível) e pré-requisitos continuam em `warrior-model.mjs` e em [Guerreiro](v2-guerreiro.md).

- **Lateral:** estandarte, título, pontos disponíveis e os quatro ramos com selos aprendidos / total (Espada, Escudo, Passivas, Veterano).
- **Ramos:** colunas coloridas (vermelho, azul, verde, roxo) com brasão, selos quadrados com contador `pontos/máximo` e ligações de pré-requisito (douradas quando aprendidas, na cor do ramo quando liberadas). Selos bloqueados ficam acinzentados com cadeado; os que podem receber ponto pulsam. Nas Passivas, o traço pontilhado só agrupa selos independentes.
- **Detalhe:** ícone com contador, ramo • tipo (Aperfeiçoamento, Habilidade, Sinergia, Variante), efeito (o texto da regra, dividido em itens), pré-requisitos com ✓ ou cadeado e o botão **+ Investir ponto** (ou **Nível máximo alcançado**). Os nós do Tornado escolhem a variante ativa.
- **Rodapé:** nível, barra de XP e legenda.

Abaixo de 1300 px a lateral vira uma faixa no topo; abaixo de 760 px aparece um ramo por vez, escolhido na faixa. Não há redistribuição de talentos do Guerreiro: a referência visual tinha o botão, mas a regra não existe. Com a Postura aprendida, o campo da classe no HUD vira um botão com a postura ativa e a recarga, e o seletor de slot lista as oito ações. Evidências: `review/v2/warrior/skill-tree.png`, `skill-tree-mobile.png`, `skill-detail-mobile.png`, `stance.png` e `slot-picker.png`.


### Comparação de equipamento e serviços da praça

Ao selecionar ou arrastar uma peça, os status mostram Atual, Prévia e Diferença. Ganhos ficam verdes com sinal positivo e seta para cima; perdas ficam vermelhas com sinal negativo e seta para baixo. A comparação do Guerreiro também permite escolher qual anel substituir e mostra a mudança prevista no dano dos golpes. A prévia não equipa nem altera os atributos reais.

Três NPCs na praça de Jacarandá (e na vila dos saves anteriores) abrem Ondas/Expedições, Conquista de Valdoria e Cerco ao Ritual. Nome e função aparecem sobre o modelo; G abre o painel ao se aproximar. Os modos ficam disponíveis ao chegar à vila, sem fabricar conclusão do Ato I ou alterar as quests. Evidências em `review/v2/village-services/`.

Perder o foco da janela no menu inicial mantém a tela de título, sem abrir o inventário ou o menu de pausa.

### HUD ornamentado (05/11/2026)

Restyle só visual do HUD e dos painéis do mapa, em `v2/scripts/hud-ornate.css` (carregada por último no build, depois de `ui.css` e das folhas de campanha). Não muda custo, recarga, atalho nem regra. `shared-hud.css` continua gerado da versão legada e intocado.

- **Linguagem:** ouro velho e bronze sobre couro escuro, serifa clássica (`Palatino Linotype`/`Book Antiqua`, com Georgia de reserva; nenhuma fonte embutida). A moldura dos painéis é um SVG de nove fatias com cantoneiras em arabesco (`--orn-frame`, usada com `border-image`); os ícones do topo, a torre do título, o pergaminho da missão e as garras dos orbes também são SVG embutidos na folha.
- **Topo:** botões Relicário, Inventário, Grimório e Ajuda com ícone dourado (o `☰` e o `?` saíram do texto). Título da área num cartucho com torre e filete com losango; abaixo de 1380 px de largura ele desce para não encostar nos botões.
- **Missão (painel à esquerda):** faixa escura que se dissolve para a direita, filete dourado à esquerda, título com selo de pergaminho, objetivos secundários com losango e distância com marcador. No mundo contínuo o painel **não rola**: o nome da região sai (já está no título central), o texto do objetivo principal fica em até 3 linhas e o dos secundários em 2 (em telas estreitas, só o título do secundário); o texto completo continua no mapa da região (M). “Teleporte à vila” e “Mapa da região” ficam lado a lado, compactos. A aba ‹ na borda esquerda recolhe o painel ao título, à distância e ao botão de conversa (G); a escolha vale para a sessão de jogo (`campaign-world-panel.mjs`). Vale também para o treino e a vila, sem a aba. O painel vazio do treino deixou de aparecer como uma tira.
- **Minimapa:** circular (canvas 160×160), com aro de garras, bússola “N” e o nome da região num cartucho. O desenho do mapa e as cores dos pontos não mudaram; o norte continua para cima.
- **Doca inferior:** a pílula que envolvia os orbes saiu; a barra é um painel retangular com moldura de cantoneiras, só entre os orbes. A faixa de ouro, pontos e horda (ou postura do Guerreiro) fica sobre a borda superior como uma fita, e o selo de classe (“Pacto dos Mortos”/“Espada e Escudo”) deixou de aparecer. Os slots têm quadro de ouro, a tecla numa aba acima e o ícone maior. A régua de XP ganhou ponteiras de losango e a etiqueta **Nível N** à esquerda; o nível saiu da faixa de cima.
- **Orbes:** esferas maiores que a barra (`--orb-size` 146 px, vidro de 1,1× esse valor), um pouco para fora, em **molduras de bronze renderizadas no Blender** a partir do relevo do Tripo (`assets/hud/orb-frame-left.webp` e `-right.webp`, embutidas pelo build; pipeline em [blender/README.md](../blender/README.md#moldura-dos-orbes-do-hud-v2)). Cada lado tem a sua imagem, com a luz coerente. O vidro fica sob o aro. A parte vazia é um vidro fumê tingido pela cor do líquido. O líquido é carmim ou violeta profundo, com núcleo mais claro; a superfície tem duas cristas de onda (a da frente clara, a de trás escura, em sentidos opostos) que deslizam por `transform`, e por dentro um mármore de ruído fractal do tamanho da esfera gira devagar em volta do centro (`.vessel-swirl`, elemento novo em `tools/ui-layout.html`). Animações desligadas com movimento reduzido. Animar a posição de máscara foi descartado: deixava uma linha reta na borda da camada. Por cima: janela de luz no alto, reflexo nítido à direita, luz refratada embaixo e borda escurecida. Os dois orbes ficam simétricos, a 10 px do primeiro e do último slot. Valor (“812 / 812”) e nome ficam no centro do vidro. O nível do líquido continua acompanhando vida, mana, vigor e almas.
- **Diálogos do mundo, mapa da região, barra do chefe, consumíveis, grupos da horda e ganhos** usam a mesma moldura e paleta. Barras de vida dos inimigos ganharam aro escuro.

Verificação executada: build e capturas em Edge headless (WebGL) no mundo de Jacarandá (exploração, combate com grupo real, mapa da região), no treino do Necromante e do Guerreiro, fundo claro com qualidade baixa e janelas de 1440, 1280 e 600 px, sem erros de página. Evidências em [review/v2/hud-ornate](../review/v2/hud-ornate/). `tests/ui-browser-check.cjs` está desatualizado (espera o botão de treino livre na tela inicial, removido antes desta entrega) e não chega ao HUD.

Pendências: a moldura do orbe vem de um modelo gerado por IA, sem retoque à mão (a cabeça de dragão da referência virou volutas); os ícones das habilidades ainda são glifos/emoji (a referência pede arte pintada, que exige um atlas novo); não há pontos de nível embaixo dos slots, poções ao lado dos orbes nem contadores de buff; o Relicário (Esc) e os diálogos internos mantêm o estilo anterior; a doca cobre o diálogo do mapa da região na parte de baixo (comportamento anterior de camadas).

Os diálogos de viagem usam texto marfim e título e botão dourados claros sobre o painel ornamentado escuro, inclusive ao passar o mouse ou navegar pelo teclado.

## Ferramentas de teste

O botão **Testes** na navegação do jogo abre uma aba do Relicário e pausa o combate. Permite adicionar ou remover um nível, adicionar ou remover 1.000 ouro (sem saldo negativo) e restaurar vida e recurso. O nível fica entre 1 e o máximo vigente. Ganhar nível usa o caminho normal de XP, atributos e horda; remover zera o XP e é recusado se invalidar os pontos ou pré-requisitos da árvore. Redistribua os pontos pela aba Habilidades nesse caso. Personagens mortos e cenas de história não aceitam ajustes.

As ações alteram o personagem atual em memória e entram no próximo salvamento, inclusive automático da campanha. O painel informa esse comportamento antes dos botões.
