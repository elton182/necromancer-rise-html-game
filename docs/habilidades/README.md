# Árvores de habilidades — fonte da verdade

[`arvores.json`](arvores.json) guarda o design das árvores de habilidades de todas as classes: nós, ligações, números e notas de produção. É editado visualmente pelo [editor de árvores](../../tools/skill-tree-editor.html). [`arvores.md`](arvores.md) é o guia legível **gerado** a cada gravação pelo servidor do editor; não o edite à mão.

> **Estado atual (08/11/2026):** o jogo lê este arquivo para o Guerreiro, a Druida, a Arqueira, o Mercenário e o Mago. No Necromante, os nós do modelo compartilhado continuam em `build-simulator/model.js` (usado também pela versão legada) e `v2/scripts/death-tree.mjs`; um teste avisa se divergirem do arquivo. Os nós jogáveis que só existem no arquivo (Cão Zumbi, Cérbero, Magos, Raio e Ruptura Necrótica) e os efeitos que o arquivo acrescenta a nós existentes entram pelo Grimório estendido da v2 (`full-build.mjs`).

## Como o jogo usa o arquivo

`node v2/tools/build.cjs` lê o arquivo por `v2/tools/skill-tree-source.cjs` e gera `v2/scripts/skill-tree-data.mjs` (não edite o gerado). Depois de salvar no editor, rode o build e os testes.

- **Entram no jogo só os nós com status `implementado` ou `revisar`.** `ideia`, `planejado`, `em desenvolvimento` e `removido` ficam fora, então dá para desenhar à vontade sem mexer no jogo. Um nó jogável que requer um nó fora do jogo interrompe o build com a mensagem do problema.
- **Vêm do arquivo:** nome, descrição (texto do painel), tipo (rótulo Habilidade, Sinergia, Variante…), pontos máximos, nível mínimo, pré-requisitos, exclusões, ramo, nome, lema e cor dos ramos, e a posição no painel de talentos (derivada da posição no editor: linhas pela altura e, dentro da linha, a ordem horizontal; no máximo três selos por linha, o excedente desce).
- **Continuam no código:** a mecânica de cada nó (o que cada ponto faz), custos, recargas, alcances e dano. Os campos de uso do arquivo (custo, recarga, alcance etc.) documentam o desenho; ao mudar um número, leve a mudança para o arquivo indicado em **Código** no nó.
- **Ids** são os do código e dos saves. Trocar o id de um nó jogável no editor faz o jogo perder os pontos salvos nele.
- Para tornar jogável uma ideia, implemente a mecânica (e a ação, se for ativa) e só então mude o status para `implementado`.

Testes ligados ao arquivo: `node --test v2/tests/skill-tree-data.test.mjs` confere que o gerado está em dia, que só nós jogáveis entram, que toda ação tem seu nó e que o Necromante bate com o código (nome, pontos, nível e pré-requisito).

## Abrir o editor

Na raiz do projeto, sem dependências:

```bash
node tools/skill-tree-editor-server.cjs
```

Acesse `http://localhost:4178/`. **Salvar** (Ctrl+S) grava `arvores.json` e regenera `arvores.md`. Se o arquivo mudou no disco depois de aberto (por exemplo, um `git pull`), o editor pergunta antes de sobrescrever.

Sem o servidor, abra `tools/skill-tree-editor.html` direto no navegador e escolha `docs/habilidades/arvores.json` (ou arraste o arquivo para a janela). No Chrome e no Edge, Salvar grava no próprio arquivo; nos outros navegadores, baixa uma cópia. Nesse modo o `arvores.md` só é atualizado pelo botão **Exportar MD**. Alterações não salvas ficam num rascunho do navegador e são oferecidas ao reabrir.

## Usar

- **Classes** e **árvores** ficam nas abas do topo (o Necromante tem Minions, Profana e Morte). `+ Classe` e `+ Árvore` criam novas.
- **Nó novo:** `+ Nó`, tecla `N` ou duplo clique no fundo (o nó entra no ramo mais próximo). Enquanto o id não for editado à mão, ele acompanha o nome.
- **Pré-requisito:** arraste o círculo na base de um nó até outro. Com `Shift`, cria uma **exclusão** (só um dos dois pode ser aprendido). As ligações também podem ser editadas no painel; clique numa ligação e use `Delete` para removê-la.
- **Mover:** arraste o nó (grade de 10; com `Alt`, livre) ou o título de um ramo para levar o ramo inteiro. **Organizar** redistribui a árvore em colunas por ramo e linhas por profundidade de pré-requisito.
- **Sem seleção**, o painel lateral mostra o resumo da classe e edita classe, árvores e ramos (nome, lema, cor, ordem).
- **Validar** lista erros e avisos: ids repetidos ou inválidos, ligações para nós inexistentes, ciclos, nível menor que o do pré-requisito, exclusões de mão única, ramo inexistente e habilidades ativas sem recarga ou tecla. Clique num item para ir ao nó.
- `Ctrl+Z` / `Ctrl+Y` desfazem e refazem; `Ctrl+D` duplica; `F` enquadra; a busca esmaece os nós que não combinam.

## Campos de um nó

| Campo | Significado |
|---|---|
| `id` | Identificador usado no código e nos saves (camelCase). Trocar no editor atualiza as ligações do arquivo, **não** o código nem saves existentes. |
| `name`, `icon` | Nome exibido e ícone (emoji ou símbolo; vazio usa o símbolo do tipo). |
| `type` | `ativa`, `evocação`, `passiva`, `aperfeiçoamento`, `sinergia`, `variante` ou `especialização`. |
| `status` | `ideia`, `planejado`, `em desenvolvimento`, `implementado`, `revisar` ou `removido`. Ideias e planejados aparecem com borda tracejada. |
| `tree`, `branch` | Árvore e ramo dentro da classe. |
| `description`, `perRank` | Texto do jogo e ganho por ponto em texto livre. |
| `maxRank`, `levelReq` | Pontos máximos e nível mínimo do personagem. |
| `requires`, `excludes` | Ids dos pré-requisitos (precisa de ao menos 1 ponto em cada) e dos nós exclusivos. |
| `binding`, `target`, `element` | Tecla ou slot, tipo de alvo e elemento do dano. |
| `cost`, `cooldown`, `castTime`, `duration`, `range`, `radius` | Custo no recurso da classe, recarga, preparação e duração em segundos; alcance e raio em unidades do mundo (`u`). Vazio = não se aplica ou indefinido. |
| `damage` | Dano ou cura em texto (ex.: `180%`, `45% × 5 ondas`), relativo ao dano base da classe. |
| `effects` | Lista `{label, value}` de bônus somáveis por ponto, como no modelo do Grimório. |
| `telegraph`, `decision` | Como o efeito é percebido no combate e qual decisão ou risco ele cria para o jogador. |
| `animation`, `vfx`, `sfx`, `codeRef`, `tags`, `notes` | Produção: clipe GLB, efeito visual, som, arquivo de código, etiquetas e notas de design. |
| `x`, `y` | Posição no quadro do editor; também define a ordem e a linha do selo no painel de talentos do jogo. |

Cada classe tem `id`, `name`, `resource` (mana, vigor, foco), `color`, `description`, `notes` e `trees` (cada árvore com seus `branches`: `id`, `name`, `motto`, `color`).

## De onde vieram os dados semeados

| Classe | Nós e ligações | Números de uso |
|---|---|---|
| Necromante (Minions, Profana) | `build-simulator/model.js` | `v2/scripts/combat-rules.mjs`, `spell-rules.mjs`, `horde-rules.mjs` |
| Necromante (Morte) | `v2/scripts/death-tree.mjs` | `LICH` em `v2/scripts/lich-model.mjs` |
| Guerreiro | `PASSIVES` em `v2/scripts/warrior-model.mjs` | ações em `v2/scripts/warrior.mjs` |
| Druida | `DRUID_NODES` em `v2/scripts/druid-model.mjs` | ações em `v2/scripts/druid.mjs` |
| Arqueira, Mercenário, Mago | `MARKSMAN_NODES` em `v2/scripts/marksman-model.mjs` | `MARKSMAN_ACTIONS` no mesmo arquivo |

As posições dos nós vieram do painel de talentos (`v2/scripts/talents-panel.mjs`) e, no Necromante, dos níveis e lados do Grimório. Os campos de leitura no combate, efeito visual e som começaram vazios. Os números de uso foram conferidos nessas fontes em 08/11/2026; comandos da horda, a Forma de Lobo e passivas não têm todos os campos preenchidos.
