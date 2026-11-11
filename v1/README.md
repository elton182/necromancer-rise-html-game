# v1 — versão legada

A versão oficial está em [v2/](../v2/README.md). Esta pasta preserva o jogo Canvas 2D, seus guias e os protótipos anteriores.

Abra [index.html](index.html) ou [necromancer-canvas.html](necromancer-canvas.html). [necromancer-game.html](necromancer-game.html) e [necromancer-demo.html](necromancer-demo.html) são protótipos históricos, sem manutenção como jogo oficial.

A v1 usa scripts e assets compartilhados da raiz. Seus HTMLs têm base relativa para a raiz, preservando o carregamento desses recursos após a mudança de pasta. Não distribua esta pasta sozinha. O save legado continua na chave `necromancer_v2`.

- [Regras da v1](docs/mecanicas/README.md)
- [Integração das árvores antigas](docs/arvores-habilidades-implementacao.md)
- Fontes compartilhadas: `../scripts/` e `../build-simulator/model.js`.

Comandos na raiz: `npm run sync:legacy`, `npm run check:legacy` e `npm run test:legacy`. O laboratório legado continua em `npm run lab`. Os empacotadores do Blender atualizam `v1/necromancer-canvas.html`.

Novas mecânicas e correções do jogo oficial pertencem à v2. Alterações em fontes compartilhadas exigem regressão das duas versões e novo build da v2.
