# Orientações para trabalhar em Necromancer's Rise

## Escopo e comunicação

- Este arquivo orienta o repositório inteiro. Leia também o `AGENTS.md` da pasta em que vai trabalhar; suas regras específicas complementam estas.
- Comunique decisões e resultados em português. Textos do jogo usam português; preserve os identificadores de código existentes.
- Execute a solicitação atual. Roadmaps dão contexto e não autorizam implementar outras entregas. Se o usuário interromper uma implementação para preparar documentação, mantenha a implementação suspensa.
- Antes de editar, confira o estado do Git. Preserve mudanças locais, assets e evidências existentes; não reverta nem reorganize trabalho alheio para limpar o diff.

## Identidade e arquitetura

- **A v2 (`v2/`) é o jogo principal.** É a versão 3D em Three.js, com modelos GLB animados do Blender, horda, Grimório, equipamentos, campanha do Ato I, Vila de Eldrin, Arena, Expedições e Conquista de Valdoria. Novidades, mecânicas e correções vão para a v2, salvo pedido explícito em contrário. Novas mecânicas devem criar decisões legíveis durante o combate.
- A v2 é distribuída como `v2/necromancer-3d.html`, autocontido (módulos, modelos GLB e música embutidos): deve funcionar ao abrir o arquivo, sem servidor, CDN ou requisições para buscar módulos e modelos. `v2/index.html` redireciona para ele. É um arquivo **gerado**: edite as fontes em `v2/scripts/`, `v2/assets/` e `v2/tools/` e rode `node v2/tools/build.cjs` na raiz. Veja o mapa de fontes em `v2/README.md`.
- `necromancer-canvas.html` (Canvas 2D) é a **versão legada**. Ela continua no repositório porque o build da v2 lê regras dela e de `scripts/*-model.js`, `scripts/skill-trees.js`, `scripts/equipment-model.js`, `build-simulator/model.js` e outros (veja `v2/tools/*-source.cjs` e as entradas em `v2/assets/build-manifest.json`) e as copia para `v2/scripts/shared-*.mjs`, `*-rules.mjs` e `enemy-types.mjs`. Alterar essas fontes canônicas altera a v2 e a versão legada; confira os dois lados e regenere a v2. Não implemente novidades só na versão legada nem edite os arquivos `shared-*` / `*-rules.mjs` gerados.
- `index.html` da raiz ainda redireciona para `necromancer-canvas.html` (entrada atual do GitHub Pages). `necromancer-game.html` e `necromancer-demo.html` são versões antigas. Backups e `_to_delete/` não são fontes atuais.
- Na versão legada, parte do motor vive diretamente no HTML e os sistemas extraídos em `scripts/` são embutidos por sincronizadores (`scripts/sync-*.js`). Só mexa nisso ao corrigir a versão legada ou uma fonte compartilhada.
- Não adicione frameworks, dependências de runtime ou uma etapa de build além do `v2/tools/build.cjs` para uma mudança local sem necessidade concreta. A v2 usa a cópia local do Three.js (`tools/3d-lab/vendor`), sem CDN.

## Onde procurar e editar

| Área | Fonte / referência | Integração |
| --- | --- | --- |
| Simulação, combate, horda, magias, progressão, campanha e modos (v2) | `v2/scripts/*.mjs` (mapa em `v2/README.md`) | `node v2/tools/build.cjs` |
| Renderização, câmera, animações e efeitos visuais (v2) | `v2/scripts/renderer.mjs`, `v2/scripts/vfx.mjs`, `v2/scripts/vfx-events.mjs` | `node v2/tools/build.cjs` |
| Interface (v2) | `v2/scripts/*.css`, `v2/tools/template.html`, `v2/tools/ui-layout.html` | `node v2/tools/build.cjs` |
| Modelos 3D e animações (v2) | `blender/scripts/`, `blender/models/`, `blender/exports/*.glb`; registro em `v2/assets/models.json` | Pipeline em `blender/AGENTS.md`; depois `node v2/tools/build.cjs` |
| Regras compartilhadas com a versão legada (Grimório, equipamentos, horda, inimigos, campanha, endgame) | `build-simulator/model.js`, `scripts/skill-trees.js`, `scripts/*-model.js`, `necromancer-canvas.html` | Adaptadores em `v2/tools/*-source.cjs`; `node v2/tools/build.cjs` regenera `v2/scripts/shared-*.mjs` e `*-rules.mjs`. Para a versão legada: `node scripts/sync-equipment.js` |
| Regras atuais da v2 | `docs/v2-*.md` | Atualizar o guia da área afetada |
| Regras da versão legada e conceitos comuns | `docs/mecanicas/` | Podem diferir da v2; confira o guia `docs/v2-*.md` correspondente |
| Planos e direção visual | `v2/plano-migracao.md`, `docs/roadmap-combate-visual.md`, `docs/guia-visual-combate.md` | Distinguir proposta de funcionalidade entregue |
| Versão legada (Canvas 2D) | `necromancer-canvas.html`, `scripts/skill-vfx.js` | `node scripts/sync-skill-trees.js`, `sync-equipment.js`, `sync-skill-vfx.js` |
| Verificação visual da versão legada | `tools/combat-lab.html`, `tools/combat-lab.js` | `node tools/combat-lab-server.js` |

Na versão legada, o sincronizador de equipamentos também executa o de árvores; novos módulos precisam ser registrados explicitamente. Na v2, módulos novos precisam ser registrados na tabela `modules` de `v2/tools/build.cjs`, e GLBs em `v2/assets/models.json`.

## Onde salvar arquivos

Cada arquivo novo vai para a pasta do seu tipo. Não salve assets, testes, capturas ou rascunhos na raiz do projeto nem na raiz de `blender/`.

| Tipo de arquivo | Destino |
| --- | --- |
| Módulos de runtime, regras, testes e verificações de navegador da v2 | `v2/scripts/` e `v2/tests/` (`*.test.mjs`, `*-browser-check.cjs`) |
| Ferramentas de empacotamento e adaptadores da v2 | `v2/tools/` |
| Modelos de regra compartilhados, sincronizadores e testes da versão legada | `scripts/` |
| Páginas de teste, atalhos `?playerModel=` e ferramentas de inspeção | `tools/` |
| Assets carregados pelo jogo fora do HTML (retratos, vila, catálogos de personagens) | `assets/<área>/` |
| Scripts Blender, cenas, exports, atlas, quadros, prévias e notas de asset | Subpastas de `blender/`, conforme `blender/AGENTS.md` |
| Evidências de validação: capturas, logs de teste e JSON de resultado | `review/`; a v2 grava em `review/v2/<etapa>/`; use subpasta quando a entrega tiver muitos arquivos |
| Documentação | `docs/` (guias da v2 em `docs/v2-*.md`, regras da versão legada em `docs/mecanicas/`, conceitos em `docs/concepts/`); plano da v2 em `v2/plano-migracao.md` |
| Backups do HTML e arquivos à espera de remoção | `blender/backups/` (ignorado, usado pelos empacotadores) ou `_to_delete/` |
| Saídas temporárias e rascunhos | Diretório temporário fora do repositório |

- A raiz do projeto contém apenas `necromancer-canvas.html`, `index.html`, as versões antigas já existentes, `game_check.js`, `README.md`, `AGENTS.md`, a pasta `v2/` e configuração. Não acrescente páginas, backups ou imagens nela; arquivos da v2 ficam dentro de `v2/`.
- Siga a convenção de nomes da pasta: `kebab-case` em `scripts/`, `tools/`, `docs/`, `review/`, `assets/` e `v2/` (os módulos `.mjs` da v2 também são `kebab-case`); `snake_case` em `blender/`.
- Prefira o Git a cópias como `*-backup`, `*-old` ou `*.before-*` ao lado da fonte atual. Quando um empacotador precisar de backup local, grave em pasta ignorada.
- Pastas ignoradas como `Claude outputs/` não são fonte nem destino de entrega.
- Ao mover um arquivo, use `git mv` se ele for versionado. Procure o caminho antigo em `v2/`, `scripts/`, `blender/`, `tools/`, `docs/`, `assets/` e nos README (inclusive `v2/assets/models.json` e `v2/tools/build.cjs`); atualize os scripts que resolvem o caminho e os comandos documentados. Não reescreva relatórios antigos em `review/` nem retratos históricos em `docs/` só para refletir a mudança.

## Como desenvolver uma mecânica

1. Leia a implementação e o guia atual da área. Identifique a regra vigente antes de usar números de propostas antigas.
2. Defina o comportamento observável: gatilho, custo, alvo, alcance, duração, recarga, efeitos e condição de encerramento. Para ameaças, defina como o jogador percebe e evita o efeito.
3. Separe regras calculáveis de vínculos com o motor quando isso permitir reutilização e testes. Siga os pares `*-model.js` / runtime existentes, sem refatorar sistemas vizinhos desnecessariamente.
4. Integre com dano, colisões, progressão, loot, saves e modos afetados. Evite implementar um segundo caminho de dano ou progressão que ignore proteções existentes.
5. Cubra os riscos reais da mudança, atualize a distribuição e confira o comportamento no jogo. Registre limitações concretas da validação.

## Compatibilidade e leitura do combate

- Preserve IDs de habilidades, itens, tipos e campos persistidos. Tipos de inimigos ainda são acessados por índice: não reordene `ENEMY_TYPES` sem migrar todos os consumidores.
- Preserve os saves. A v2 grava em `necromancer_rise_3d_save` (contrato em `docs/v2-saves.md` e `v2/scripts/save-model.mjs`) e só lê a chave `necromancer_v2` da versão legada na importação; nunca a sobrescreva. Novos campos precisam de valores padrão para saves antigos; faça migração quando houver mudança de formato. Testes devem usar armazenamento isolado.
- Campanha, vila, Arena, Expedições, Conquista e treino podem compartilhar funções. Verifique os consumidores da função alterada e preserve as diferenças intencionais entre modos.
- Preparação, execução, recuperação e morte precisam concordar com animação e efeito real. Limpe rituais, áreas, projéteis e bônus quando sua regra exigir interrupção, morte ou troca de cena.
- Na v2, personagens e objetos com volume são modelos GLB do Blender animados em Three.js; avisos no chão, rastros e partículas ficam em `vfx.mjs`/`renderer.mjs`, ligados à posição real. Na versão legada, sprites do Blender e Canvas. Siga `docs/guia-visual-combate.md`.
- Redesenho visual não deve alterar silenciosamente dano, custo, alcance, colisão ou recarga. Quando a solicitação envolver balanceamento, documente a mudança de regra.

## Validação proporcional à mudança

- Só documentação: confira caminhos, comandos, links e coerência com as fontes; não é necessário rodar testes do jogo.
- Regras isoladas da v2: `node --test v2/tests/<sistema>.test.mjs` (ou `node --test v2/tests/*.test.mjs`), incluindo os dos modelos compartilhados quando afetados (`build-simulator/model.test.js`, `scripts/*.test.js`).
- Motor ou integração da v2: rode `node v2/tools/build.cjs`, os testes dos sistemas afetados e o `v2/tests/*-browser-check.cjs` pertinente. Alterações em fontes compartilhadas também exigem `node game_check.js` e os `node --test` da versão legada.
- Interface, combate ou modelos da v2: use o `v2/tests/*-browser-check.cjs` pertinente (Playwright com Edge/Chrome e WebGL 2, em armazenamento isolado; leia o teste para saber a dependência) ou uma conferência equivalente no navegador; confira erros de página e comportamento observável. Evidências em `review/v2/`.
- Versão legada: `node game_check.js` e os `scripts/*-browser-check.js` pertinentes.
- Visual: confira no tamanho real do jogo, fundo claro e escuro, com grupo/horda e qualidade baixa. Registre evidências pertinentes em `review/` ou no destino já usado pelo teste.
- Balanceamento: confira `balance-simulator/` e seus limites. Atualize o adaptador se a regra modelada mudou; não apresente uma estimativa matemática como validação completa da IA.
- Ao entregar, diga o que mudou, como foi verificado e o que ficou pendente. Não declare render, teste ou integração concluídos sem executá-los.

## Guias específicos

- [Mecânicas e integração (v2 e módulos compartilhados)](scripts/AGENTS.md)
- [Assets, Blender e modelos](blender/AGENTS.md)
- [Documentação e evidências](docs/AGENTS.md)
