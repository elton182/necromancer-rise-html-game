# Orientações para trabalhar em Necromancer's Rise

## Escopo e comunicação

- Este arquivo orienta o repositório inteiro. Leia também o `AGENTS.md` da pasta em que vai trabalhar; suas regras específicas complementam estas.
- Comunique decisões e resultados em português. Textos do jogo usam português; preserve os identificadores de código existentes.
- Execute a solicitação atual. Roadmaps dão contexto e não autorizam implementar outras entregas. Se o usuário interromper uma implementação para preparar documentação, mantenha a implementação suspensa.
- Antes de editar, confira o estado do Git. Preserve mudanças locais, assets e evidências existentes; não reverta nem reorganize trabalho alheio para limpar o diff.

## Identidade e arquitetura

- Jogo de ação top-down em Canvas 2D, com necromancia, horda de aliados e combate de fantasia sombria. Novas mecânicas devem criar decisões legíveis durante o combate.
- A versão distribuída é `necromancer-canvas.html`, autocontida: deve funcionar ao abrir o arquivo, sem build, servidor, CDN ou requisições para buscar módulos e sprites. `index.html` redireciona para ela.
- `necromancer-game.html` e `necromancer-demo.html` são versões antigas. Não implemente novidades nelas por engano. Backups e `_to_delete/` não são fontes atuais.
- Parte do motor ainda vive diretamente no HTML. Sistemas extraídos têm fontes em `scripts/` e são embutidos por sincronizadores. Edite a fonte desses sistemas, nunca somente a cópia gerada no HTML.
- Não adicione frameworks, dependências de runtime ou uma etapa de build para uma mudança local sem necessidade concreta.

## Onde procurar e editar

| Área | Fonte / referência | Integração |
| --- | --- | --- |
| Motor, cena, entrada e combate base | `necromancer-canvas.html` | Edição localizada fora dos blocos gerados |
| Grimório e parâmetros compartilhados | `build-simulator/model.js`, `scripts/skill-trees.js`, `scripts/skill-trees.css` | `node scripts/sync-skill-trees.js` |
| Equipamentos, horda, expedições, inimigos modulares, maestrias e endgame | Módulos correspondentes em `scripts/` | `node scripts/sync-equipment.js` |
| Efeitos de habilidades | `scripts/skill-vfx.js` | `node scripts/sync-skill-vfx.js` |
| Modelos, animações e sprites | `blender/scripts/`, `blender/models/` | Pipeline descrito em `blender/AGENTS.md` |
| Regras atuais para consulta | `docs/mecanicas/` | Atualizar o guia da área afetada |
| Planos e direção visual | `docs/roadmap-combate-visual.md`, `docs/guia-visual-combate.md` | Distinguir proposta de funcionalidade entregue |
| Verificação visual isolada | `tools/combat-lab.html`, `tools/combat-lab.js` | `node tools/combat-lab-server.js` |

O sincronizador de equipamentos também executa o de árvores. Consulte sua lista de módulos para confirmar a cobertura; novos módulos precisam ser registrados explicitamente. Empacotadores de sprites têm seu próprio passo de incorporação ao HTML.

## Como desenvolver uma mecânica

1. Leia a implementação e o guia atual da área. Identifique a regra vigente antes de usar números de propostas antigas.
2. Defina o comportamento observável: gatilho, custo, alvo, alcance, duração, recarga, efeitos e condição de encerramento. Para ameaças, defina como o jogador percebe e evita o efeito.
3. Separe regras calculáveis de vínculos com o motor quando isso permitir reutilização e testes. Siga os pares `*-model.js` / runtime existentes, sem refatorar sistemas vizinhos desnecessariamente.
4. Integre com dano, colisões, progressão, loot, saves e modos afetados. Evite implementar um segundo caminho de dano ou progressão que ignore proteções existentes.
5. Cubra os riscos reais da mudança, atualize a distribuição e confira o comportamento no jogo. Registre limitações concretas da validação.

## Compatibilidade e leitura do combate

- Preserve IDs de habilidades, itens, tipos e campos persistidos. Tipos de inimigos ainda são acessados por índice: não reordene `ENEMY_TYPES` sem migrar todos os consumidores.
- Preserve saves da chave `necromancer_v2`. Novos campos precisam de valores padrão para saves antigos; faça migração quando houver mudança de formato. Testes devem usar armazenamento isolado.
- Campanha, vila, Arena, Expedições e Conquista podem compartilhar funções. Verifique os consumidores da função alterada e preserve as diferenças intencionais entre modos.
- Preparação, execução, recuperação e morte precisam concordar com animação e efeito real. Limpe rituais, áreas, projéteis e bônus quando sua regra exigir interrupção, morte ou troca de cena.
- Use Blender para personagens e objetos com volume; Canvas para avisos no chão, rastros e partículas ligados à posição real. Siga `docs/guia-visual-combate.md`.
- Redesenho visual não deve alterar silenciosamente dano, custo, alcance, colisão ou recarga. Quando a solicitação envolver balanceamento, documente a mudança de regra.

## Validação proporcional à mudança

- Só documentação: confira caminhos, comandos, links e coerência com as fontes; não é necessário rodar testes do jogo.
- Motor ou integração ao HTML: execute `node game_check.js` e os testes dos sistemas afetados.
- Regras isoladas: execute os testes pertinentes com `node --test`, incluindo os dos modelos compartilhados quando afetados.
- Interface, combate ou sprites: use o `scripts/*-browser-check.js` pertinente ou uma conferência equivalente no navegador, em armazenamento isolado; confira erros de página e comportamento observável. Leia o teste para saber se usa Chrome ou Edge e quais dependências exige.
- Visual: confira no tamanho real do jogo, fundo claro e escuro, com grupo/horda e qualidade baixa. Registre evidências pertinentes em `review/` ou no destino já usado pelo teste.
- Balanceamento: confira `balance-simulator/` e seus limites. Atualize o adaptador se a regra modelada mudou; não apresente uma estimativa matemática como validação completa da IA.
- Ao entregar, diga o que mudou, como foi verificado e o que ficou pendente. Não declare render, teste ou integração concluídos sem executá-los.

## Guias específicos

- [Mecânicas e integração](scripts/AGENTS.md)
- [Assets, Blender e sprites](blender/AGENTS.md)
- [Documentação e evidências](docs/AGENTS.md)
