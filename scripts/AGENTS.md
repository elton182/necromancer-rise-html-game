# Mecânicas, módulos e integração

Estas regras complementam o `AGENTS.md` da raiz para arquivos em `scripts/`.

## Fontes e distribuição

- Leia o módulo e seus consumidores antes de criar um novo ponto de extensão. Os módulos de runtime compartilham o escopo do motor no HTML; não suponha que são ES modules independentes.
- Modelos existentes usam uma API acessível no navegador e exportação CommonJS para testes Node. Siga o padrão do módulo vizinho em vez de introduzir outro carregador.
- Mantenha modelos de regras sem DOM, Canvas, áudio ou acesso a saves. Passe dados e callbacks necessários ao comportamento; deixe efeitos e integração no runtime.
- Vários módulos envolvem funções existentes, guardando a referência anterior. Preserve a assinatura, o retorno e o caminho dos tipos não afetados. A ordem de incorporação importa.
- Registre novos módulos no sincronizador apropriado, com marcadores únicos `*_BEGIN` / `*_END` e ordem que respeite dependências. Rode o sincronizador e confira que a fonte foi embutida uma única vez.
- Não faça substituições globais em trechos genéricos do HTML. Use marcadores ou âncoras específicas e falhe claramente quando a estrutura esperada não existir.

## Definir e implementar regras

- Declare unidades: posições e alcances em unidades de mundo, tempos em segundos, atualização por `dt`. Converta para pixels somente no desenho, pelos helpers do motor.
- Expresse preparação, ação e recuperação como estados explícitos quando necessário. Evite temporizadores reais para resolver combate; use o ciclo de atualização do jogo.
- Trate passagem de fase e quadros longos sem executar o impacto duas vezes, saltar a preparação ou deixar estados presos. Confira com mais de um tamanho de passo quando houver deslocamento ou impacto temporal.
- Reutilize os caminhos de dano do motor, como `dealDamageToPlayer`, `dealDamageToMinion` e os caminhos correspondentes para inimigos. Preserve dash, defesa, barreira, morte, crédito de abate e loot aplicáveis.
- Respeite sólidos, muralhas, limites da cena e alvos mortos. Para ataques rápidos, confira colisão ao longo da trajetória, não só no ponto final.
- Bônus temporários precisam ter fonte, duração e regra de empilhamento claras. Evite multiplicar permanentemente atributos a cada atualização. Defina limpeza ao morrer, perder o alvo, reiniciar ou sair da cena.
- Mantenha a lógica de efeitos hostis compatível com a percepção de perigo da horda quando ela deva conseguir esquivar. O aviso desenhado deve corresponder à geometria e ao instante de dano reais.
- Não grave estado transitório de combate no save por conveniência. Campos persistidos precisam de normalização e valores padrão; mantenha a compatibilidade de importação/exportação.

## Adicionar um inimigo

1. Defina função tática, silhueta, ataque básico, especial, preparação, recuperação, interrupção e morte. Mais vida ou outra cor não bastam para um arquétipo novo.
2. Use um ID estável. Preserve os índices existentes de `ENEMY_TYPES`; procure consumidores na campanha, arena, expedições, conquista, ferramentas e simuladores antes de alterar a lista.
3. Separe comportamento em modelo/runtime quando compatível com a complexidade. Use `crypt-hound-model.js` / `crypt-hound.js` e `soul-warden-model.js` / `soul-warden.js` como exemplos, não como blocos para copiar sem revisão.
4. Reutilize escala de wave, raridade/elite e recompensas existentes. Aplique cada multiplicador uma vez; confira atributos finais no modo em que o inimigo aparece.
5. Integre sprite e animações pelos registros usados no jogo (`SPR.load`, `ESPR`, `ESPR_K`, conforme necessário). A ação animada precisa acompanhar o estado real; siga `../blender/AGENTS.md` para produção.
6. Introduza a composição gradualmente: apresentação simples, combinação com um tipo conhecido e depois grupos. Não inclua automaticamente em todos os modos.
7. Confira morte durante preparação/ação, reset, troca de cena, obstáculos, jogador e minions como alvos. Verifique se projéteis, áreas ou bônus devem acabar com a fonte.
8. Atualize o guia de inimigos e os simuladores afetados, declarando qualquer comportamento ainda não modelado.

## Habilidades e progressão

- Diferencie pontos investidos de bônus temporários de equipamento. Não permita que bônus liberem pré-requisitos ou especializações quando a regra exigir investimento direto.
- Confira disponibilidade, slots, custo, recarga, comando da horda e texto da interface juntos. Mudanças na árvore também podem afetar `../build-simulator/model.js`.
- Parâmetros compartilhados, como `COMBAT_TUNING`, devem continuar com uma fonte coerente. Não compense um problema local alterando a escala global sem medir o impacto.
- Mantenha efeitos visuais em `skill-vfx.js` quando pertencerem a esse sistema. Não confunda animação com aplicação de dano.

## Verificação

- Use `node --test scripts/<sistema>.test.js` para regras afetadas e `node game_check.js` para integração ao motor/HTML.
- Teste invariantes e riscos: execução única, cancelamento, duração, limites, migração, não empilhamento indevido e diferenças entre modos. Evite testes que apenas repitam constantes da implementação.
- Para comportamento integrado, adapte um `*-browser-check.js` existente. Abra uma página/contexto isolado, capture erros e feche o navegador ao terminar. Não use o save pessoal do navegador aberto.
- Testes de navegador existentes usam Playwright com Chrome ou Edge, conforme o arquivo; verifique disponibilidade antes de executar. Não adicione dependências ao produto para atender uma ferramenta de teste.
- Para simular um save autorizado, consulte `../balance-simulator/SAVE-SIMULATION.md`. O simulador matemático e a simulação no motor têm coberturas diferentes.
- Rode apenas sincronizadores necessários à mudança; inclua o HTML atualizado na entrega quando modificar fontes embutidas.
