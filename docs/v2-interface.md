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
- **Relicário (Esc):** cinco abas — Personagem, Habilidades (Grimório), Horda,
  Equipamentos e Sistema. Abrir qualquer aba pausa a simulação; fechar retoma, exceto
  onde a cena exige pausa (menu, morte).
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
