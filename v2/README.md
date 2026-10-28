# Necromancer’s Rise — v2

Estado: **E3 concluída — movimento, câmera, colisões e animações**.
Próxima etapa: E4, dano e combate básico com regras reais.
O [plano de migração](plano-migracao.md) registra critérios e ponto de retomada.

## Abrir

Abra [index.html](index.html) no Edge ou Chrome com WebGL 2 habilitado.
A distribuição [necromancer-3d.html](necromancer-3d.html) também pode ser aberta
diretamente ou copiada sozinha para outra pasta. Não precisa de servidor,
instalação, internet ou biblioteca externa durante a execução.

WASD/setas movem, o mouse mira, clique/espaço lança a magia experimental,
a roda ajusta o zoom e Esc pausa/retoma. Perda de foco pausa a simulação.
O painel permite reiniciar, alternar o chão, sombras e quantidade de aliados.

Esta é uma arena de fundação: regras experimentais do laboratório, sem campanha,
Grimório ou progressão. O save próprio guarda opções e
dados arquivados do personagem; a luta recomeça ao continuar.
As etapas seguintes migrarão as regras reais; números desta arena não são
referência de balanceamento. O Fallen King ainda usa o ataque simplificado.

Em **Personagem e saves**, salve/exporte a v2 ou importe o JSON do jogo anterior
com prévia e confirmação. O arquivo antigo é preservado inteiro; os atributos
importados ainda não afetam o treino. A chave antiga não é sobrescrita. Consulte
o [contrato de saves e cenas](../docs/v2-saves.md) para formato e limitações.

A arena agora tem paredes e pilares com colisão, navegação de atores e
visualização opcional dos colisores. A mira acompanha o mouse mesmo quando
a câmera se move. Controle padrão: stick esquerdo move, direito mira, A/RT
lança magia e Start pausa. Veja [movimento da v2](../docs/v2-movimento.md).

## Fontes e responsabilidades

| Fonte | Responsabilidade |
| --- | --- |
| `scripts/training-model.mjs` | Simulação pura, entidades e efeitos experimentais; sem DOM, Three.js ou saves |
| `scripts/renderer.mjs` | Modelos, câmera, animações, efeitos visuais, qualidade e descarte de recursos |
| `scripts/input.mjs` | Eventos traduzidos em ações e limpeza de entradas |
| `scripts/terrain.mjs` | Dados da cena, varredura de colisões, limites e navegação no chão |
| `scripts/gamepad.mjs` | Amostragem pura de sticks, deadzone e botões do controle padrão |
| `scripts/app.mjs` | Inicialização, ligação entre módulos, painel e relógio |
| `scripts/session.mjs` | Menu, treino, morte, transições e separação do estado persistido |
| `scripts/save-model.mjs` | Contrato versionado, importação preservada e armazenamento injetável |
| `scripts/game.css` | Apresentação da interface |
| `scripts/save.css` | Menu, prévia de importação e ferramentas de save |
| `assets/models.json` | Fontes dos quatro modelos, altura visual, clipes exigidos e durações |
| `assets/build-manifest.json` | Caminhos e hashes das entradas utilizadas no último empacotamento |
| `tools/template.html` | Documento fonte da distribuição |
| `tools/build.cjs` | Empacota módulos e modelos, verifica recursos e gera o HTML |
| `tests/` | Regras isoladas e verificação do navegador |

Edite as fontes, depois empacote; não edite somente `necromancer-3d.html`.
O empacotamento usa apenas Node nativo. Os ES modules são incorporados como
dados e resolvidos por um import map interno. A simulação usa x/y no chão;
o renderizador converte para x/z do Three.js. Altura visual fica separada.

Fontes canônicas compartilhadas nesta etapa:

- Three.js 0.180.0 e utilitários em `../tools/3d-lab/vendor/`, com licença MIT
  também distribuída em [assets/three-license.txt](assets/three-license.txt).
- Cenas e GLBs em `../blender/`, conforme o manifesto. O player e boss usam
  cópias animadas exportadas por `../blender/scripts/export_3d_lab.py`.
- Modelos de regras do jogo em `../scripts/` e `../build-simulator/` continuam
  canônicos, mas **ainda não estão integrados à simulação experimental**.

O laboratório e o HTML antigo continuam com suas próprias fontes. A v2 não
executa seus sincronizadores nem altera a entrada principal do projeto.

## Empacotar e verificar

Comandos a partir da raiz do repositório:

```powershell
node v2/tools/build.cjs
node --test v2/tests/training-model.test.mjs v2/tests/save-session.test.mjs v2/tests/terrain.test.mjs
node v2/tests/movement-browser-check.cjs
node v2/tests/browser-check.cjs
node game_check.js
```

O teste de navegador requer Playwright no ambiente de desenvolvimento e Edge
instalado. Se o pacote não estiver no caminho de resolução do Node, configure
`NODE_PATH` para a instalação local; ele não é dependência do produto.
O check antigo valida a versão anterior, não substitui os testes da v2.

O empacotamento falha se um modelo não tiver os clipes exigidos ou depender de
imagens/buffers externos. O navegador mostra mensagens para indisponibilidade
de WebGL e erro de carregamento. Recursos visuais são compartilhados entre
clones e liberados quando a arena é encerrada; reinícios removem os clones e
efeitos antigos sem descartar as geometrias compartilhadas.

## Validação da E1

Executados em 28/10/2026: sete testes da simulação, teste no Edge headless e
`game_check.js` com 76 cenários aprovados. Capturas inspecionadas em 1440×900,
fundo claro/escuro, grupo e 64 aliados na qualidade baixa.

Evidências em [review/v2/e1](../review/v2/e1/):

- [Resultado do navegador](../review/v2/e1/browser-result.json)
- [Testes da simulação](../review/v2/e1/model-tests.log)
- [Regressão do jogo atual](../review/v2/e1/game-check.log)
- [Fundo escuro](../review/v2/e1/dark.png)
- [Horda e qualidade baixa](../review/v2/e1/light-horde-low.png)
- [Diagnóstico de WebGL](../review/v2/e1/webgl-failure.png)

## Validação da E2

Executados em 28/10/2026: 18 testes da simulação/sessão/saves, teste no Edge
headless e regressão do jogo atual com 76 cenários aprovados. A verificação dessa
etapa foi registrada em [review/v2/e2](../review/v2/e2/), preservando a E1.
Inclui prévia/cancelamento, importação/exportação integral de um save fictício,
backup, reload, chave antiga intacta, JSON inválido, quota e acesso bloqueado.
Também verifica menu, morte, reinício e descarte de efeitos pendentes.

- [Resultado do navegador](../review/v2/e2/browser-result.json)
- [Testes de regras e saves](../review/v2/e2/model-tests.log)
- [Regressão do jogo atual](../review/v2/e2/game-check.log)
- [Menu](../review/v2/e2/menu.png)
- [Prévia da importação](../review/v2/e2/import-preview.png)

## Validação da E3

Executados em 28/10/2026: 27 testes de regras/colisão/saves, checks de movimento
e regressão no Edge headless e `game_check.js` com 76 cenários aprovados.
Capturas inspecionadas em zoom próximo e nos fundos claro/escuro com grupo/horda.
O check geral agora grava na E3; evidências anteriores permanecem disponíveis.

- [Movimento e controle](../review/v2/e3/movement-result.json)
- [Regressão de saves e cenas](../review/v2/e3/browser-result.json)
- [Testes de regras](../review/v2/e3/model-tests.log)
- [Regressão do jogo atual](../review/v2/e3/game-check.log)
- [Zoom próximo e colisores](../review/v2/e3/movement-close.png)
- [Horda com obstáculos na qualidade baixa](../review/v2/e3/terrain-horde-low.png)

O controle foi simulado via Gamepad API; falta conferência com hardware físico.
Separação entre integrantes da horda e geometria de cada mapa continuam em E5/E9.

Limites: validação automatizada em um navegador/ambiente; não é benchmark em
hardware de referência. Sem comparação de balanceamento, teste de todos os
clipes ou paridade funcional com os modos antigos. Campanha e aplicação real
dos atributos importados permanecem pendentes conforme o plano.
