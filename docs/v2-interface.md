# Interface e HUD da v2

Portagem do HUD e do menu "Relicário" do jogo atual (`necromancer-canvas.html`) para a
v2. Não altera dano, custo, alcance, recarga ou progressão: a interface lê o estado
existente e usa as mesmas ações de sessão.

## Fontes

| Arquivo (em `v2/`) | Papel |
| --- | --- |
| `tools/ui-source.cjs` | Extrai o CSS do Relicário de `necromancer-canvas.html` |
| `scripts/shared-hud.css` | **Gerado** pelo build a partir da fonte acima; não editar |
| `scripts/ui.css` | Adaptações próprias da v2 (posições, abas, seletor de habilidade, ajuda) |
| `tools/ui-layout.html` | Marcação do HUD, do Relicário e dos diálogos; entra no HTML pelo build |
| `scripts/game-ui.mjs` | Liga HUD e menu ao estado: recursos, slots, minimapa, chefe, abas |
| `scripts/title.mjs` | Tela inicial: botões sobre a arte, cartão do save, opções, créditos, sair |
| `scripts/grimoire-panel.mjs` | Aba Habilidades: árvores Minions/Profana e Maestrias |
| `scripts/shared-skills.css` | **Gerado** pelo build a partir de `scripts/skill-trees.css` e `skill-mastery.css`; não editar |
| `scripts/gear-panel.mjs` | Aba Equipamentos (boneco, mochila, comparação, status, mercador) |
| `scripts/shared-title.css`, `shared-equipment.css`, `shared-menu.css`, `shared-portrait.mjs` | **Gerados** pelo build a partir do jogo anterior (`necromancer-canvas.html`, `scripts/equipment.css`, `scripts/menu.css`); não editar |
| `tests/ui-browser-check.cjs`, `tests/title-browser-check.cjs` | Verificações Edge/Playwright; evidências em `review/v2/ui/` |

Se o bloco do Relicário mudar no HTML canônico, o build falha com mensagem explícita
para revisar o adaptador.

## O que existe

- **HUD:** frascos de vida e mana, nível/ouro/pontos de Grimório, XP, seis slots de
  habilidade com tecla, recarga, mana insuficiente e vivos/total do grupo, estado da
  horda, local/objetivo, barra do chefe (fases I/II) e minimapa.
- **Relicário (Esc):** sem barra de título; o topo é o resumo de Zephyr com o botão ✕.
  Abre em Equipamentos, a primeira aba, seguida de Personagem, Habilidades (Grimório),
  Horda e Sistema (Laboratório, Mapas, Waves e Valdoria aparecem conforme a cena).
  Abrir qualquer aba pausa a simulação; fechar retoma, exceto onde a cena exige pausa
  (menu, morte).
- **Atalhos:** `I` abre Equipamentos, Grimório pelo botão do HUD, `H` abre/fecha a ajuda.
  Clique em um slot abre o seletor de habilidade (pausa enquanto aberto).
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

Mesma estrutura do inventário anterior: cabeçalho, mochila 6×5 com bolsas I/II e arrastar
peça para o slot iluminado, comparação com cartões Equipado/Selecionado, boneco com sete
slots (ícones, nível e cor da raridade), tabela de status com colunas Atual/Prévia/Dif.,
análise de DPS por habilidade, filtro de loot, bônus equipados, gerenciar mochila e mercador
(menu e vila). Retrato e resumo do personagem aparecem no topo do Relicário; o rodapé tem
Continuar (Esc), Ajuda (H), Recomeçar e Menu principal.

## Habilidades e maestrias

Mesma estrutura do Grimório anterior (`live-grimoire`): cabeçalho com pontos disponíveis, abas
Minions / Profana / Maestrias, três escolas por árvore com nós em grade (ícone, pontos, linhas de
pré-requisito, nós finais exclusivos) e painel de detalhe com efeitos por ponto, Investir/Devolver
ponto (com custo e dependentes), equipar nos slots e bônus acumulados. **Redistribuir** devolve todos
os pontos por 20 ouro cada (`resetRanks` em `grimoire.mjs`).

Maestrias: seis cartões de especialização ligados aos slots da barra (nível, pontos e XP), ramos
com nós avançados, regras de evolução, redistribuição grátis e troca da habilidade do slot pelo
seletor. As regras continuam nos modelos compartilhados; o painel só apresenta e aciona.

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
- O título extrai a arte e o estilo de `necromancer-canvas.html`; a distribuição cresce ~0,3 MB.
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


### Continuação: abertura ARANDU

A partir da entrega da [abertura da campanha](v2-prologo-arandu.md), **Iniciar jornada** passa a entrar na conversa da caravana. A limitação de abertura mencionada na seção anterior é histórica. HUD e minimapa reconhecem os trechos do prólogo; os diálogos ficam acima da barra de ações e podem ser avançados com G. Eldrin é apresentada como Jacarandá no mundo contínuo.


### Viagem com balões

No começo do ARANDU, a câmera acompanha a carroça em movimento. Marta, Nilo e o cocheiro conversam por balões ligados à posição de cada um. **Continuar · G** avança uma fala; **Ver o bloqueio** desembarca para a emboscada. O cocheiro usa o nome do personagem. O HUD e o minimapa retornam após o desembarque. A viagem continua durante a leitura, mas Esc e perda de foco a congelam. Confira [abertura](v2-prologo-arandu.md) e `review/v2/arandu-travel/`.


### Treinamento do Guerreiro

A árvore marcial do Relicário usa os selos e molduras do Grimório, com três ramos, cores próprias, conexões de pré-requisito e detalhes da habilidade selecionada. O investimento ocorre no painel de detalhes. Em telas estreitas, Espada, Escudo e Passivas são alternados por seletores, para preservar o tamanho dos nós. As regras e IDs permanecem em [Guerreiro](v2-guerreiro.md). Evidências: `review/v2/warrior/skill-tree.png`, `skill-tree-mobile.png` e `skill-detail-mobile.png`.


### Comparação de equipamento e serviços da praça

Ao selecionar ou arrastar uma peça, os status mostram Atual, Prévia e Diferença. Ganhos ficam verdes com sinal positivo e seta para cima; perdas ficam vermelhas com sinal negativo e seta para baixo. A comparação do Guerreiro também permite escolher qual anel substituir e mostra a mudança prevista no dano dos golpes. A prévia não equipa nem altera os atributos reais.

Três NPCs na praça de Jacarandá (e na vila dos saves anteriores) abrem Ondas/Expedições, Conquista de Valdoria e Cerco ao Ritual. Nome e função aparecem sobre o modelo; G abre o painel ao se aproximar. Os modos ficam disponíveis ao chegar à vila, sem fabricar conclusão do Ato I ou alterar as quests. Evidências em `review/v2/village-services/`.

Perder o foco da janela no menu inicial mantém a tela de título, sem abrir o inventário ou o menu de pausa.
