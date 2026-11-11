# Necromancer’s Rise — ARANDU

A **v2 em 3D é a versão oficial**. Abra [index.html](index.html) ou [v2/necromancer-3d.html](v2/necromancer-3d.html) no Edge ou Chrome com WebGL 2. O HTML da v2 é autocontido e pode ser aberto sem servidor ou internet.

[Jogar pelo GitHub Pages](https://elton182.github.io/necromancer-rise-html-game/) · [Documentação atual](docs/README.md) · [Fontes da v2](v2/README.md) · [v1 legada](v1/README.md)

## Jogo atual

Novo Jogo oferece personagens nomeados de seis classes: Necromante, Guerreiro, Druida, Arqueira, Mercenário e Mago, com progresso separado. A abertura ARANDU passa pela caravana, emboscada, caverna e defesa de Jacarandá. A base anterior do Ato I e da Vila de Eldrin continua disponível para os fluxos compatíveis.

Há combate, árvores de habilidades, equipamentos, horda do Necromante, Arena, Expedições, Conquista de Valdoria e Cerco ao Ritual. Na praça de Jacarandá, os serviços são acessados com **G** perto do Guardião das Ondas, da Cartógrafa de Valdoria e do Mestre do Cerco. Cada guia em [docs/](docs/README.md) descreve as regras implementadas e seus limites; protótipos não representam campanha concluída nem balanceamento final.

O progresso da v2 usa `necromancer_rise_3d_save`. A importação do save legado preserva a chave `necromancer_v2`; veja [saves](docs/v2-saves.md). Exportar um save é a forma de guardar uma cópia do progresso.

## Desenvolvimento

Execute na raiz, com Node.js 20 ou superior. `npm install` instala o Playwright para verificações de navegador; o jogo não exige dependências de runtime.

| Comando | Resultado |
| --- | --- |
| `npm run build` | Regenera o HTML oficial a partir das fontes e assets |
| `npm start` | Editor de mapas em `http://localhost:4177/`; jogo de desenvolvimento em `/play` |
| `npm run skills` | Editor das árvores de habilidades |
| `npm test` | Testes da v2, módulos compartilhados e simuladores |
| `npm run test:v2` | Testes de regras da v2 |
| `npm run check:browser` | Verificações principais da v2 no Edge, com armazenamento isolado |
| `npm run test:legacy` / `npm run check:legacy` | Regressão das regras compartilhadas e da v1 |
| `npm run sync:legacy` | Atualiza os módulos embutidos no HTML da v1 |
| `npm run check` | Build, testes e verificações principais |
| `npm run balance` | Simulador matemático; não substitui partidas reais |

Não edite `v2/necromancer-3d.html` nem os módulos gerados. Edite as fontes e rode o build. Evidências ficam em `review/v2/`.

## Organização

| Pasta | Conteúdo |
| --- | --- |
| `v2/` | Jogo oficial: fontes, assets registrados, ferramentas, testes e distribuição |
| `v1/` | HTMLs antigos e documentação exclusiva da versão Canvas |
| `docs/` | Guias atuais da v2, catálogo de habilidades e referência criativa |
| `scripts/`, `build-simulator/` | Fontes canônicas compartilhadas com a v1, ainda consumidas pelo build da v2 |
| `balance-simulator/` | Simulação matemática e ferramentas de diagnóstico legado |
| `blender/` | Fontes dos modelos, animações, exports e pipeline de assets |
| `assets/`, `tools/` | Assets e ferramentas compartilhados; Three.js local em `tools/3d-lab/vendor/` |
| `review/` | Evidências e registros históricos; não é especificação do jogo atual |

As fontes compartilhadas permanecem fora de `v1/` porque também fazem parte do jogo oficial. Os adaptadores em `v2/tools/*-source.cjs` e o manifesto de build registram essas dependências. Instruções de manutenção em [AGENTS.md](AGENTS.md).
