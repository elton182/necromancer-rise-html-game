# Ritmo dos encontros e visibilidade de Bruno — 11/11/2026

## Mudanças

A caverna publicada tinha 118 inimigos contando todas as ondas. Agora tem 35: 31 na primeira leva e dois reforços de dois integrantes. Só dois pontos recebem uma segunda leva; nenhum grupo renasce pelo relógio. As configurações antigas no navegador também recebem esse limite no runtime.

O Caminho de Jacarandá passa de oito para 16 inimigos em pequenos contatos distribuídos. O percurso de navegador caminha usando o motor real (movimento, colisões, ataques e percepção), em vez de teleportar entre as clareiras. O primeiro contato ocorreu após 7,6 u de caminhada.

Jacarandá, várzea e gruta recebem patrulhas nas rotas. Os níveis efetivos são 4–6, 7–9, 9–11 e 11–13 no forte. Não há multiplicador global de integrantes e ondas. Grupos comuns têm até três integrantes, grupos com líder até quatro, e o grupo do capitão até três. Poucos pontos têm um único reforço após 9 s. Um grupo vencido permanece vencido na mesma exploração; voltar à vila rearma os pontos comuns para a próxima saída.

Bruno voltou para (52, 71), na frente da ferraria, mais perto da praça. O nome e a identificação Ferraria ficam visíveis a até 18 u. A interação por G, a missão da mina e a abertura do painel de equipamentos foram preservadas.

Textos de Tomás, Marta, João e Helena foram revistos, com parágrafos separados nas conversas longas. O ferreiro usa uma fala válida para todas as classes.

## Validação

- `affected-tests.tap`: 96 testes dos sistemas afetados passaram: ritmo, campanha, prólogo, missão de João, áreas, mapas, terreno e saves.
- `balance-model-tests.tap`: os 20 testes do simulador matemático passaram. Seu adaptador modela a campanha legada por fases; ele não representa estas rotas e não foi tratado como validação da campanha contínua.
- `campaign-pacing-browser-check.cjs`: Edge, WebGL e perfil isolado, sem erros de página/console ou requisições HTTP. Verifica Bruno antes/depois da forja, identificação visível, fundos claro/escuro e qualidade baixa, inclusive com horda; caminhada real até Tomás; uma única segunda leva na caverna; ausência de retorno após tempo longo; conversa em 390 px.
- `before.json` e `after.json`: população, ondas, retornos e níveis por região.
- `map-preservation.json`: comparação dos documentos publicados com a base anterior; geometria, objetos, relevo, IDs anteriores e limites preservados. Alterações intencionais nesses documentos ficam nos grupos de inimigos.
- `engine-samples.json`: amostras isoladas no motor real, sem injetar dano ou HP, com Necromante, Guerreiro e Mago. O Guerreiro sem preparação morreu no capitão; o perfil com equipamento, talentos e prioridade nos inimigos de distância venceu. A amostra mantém a importância de preparação e escolha de alvos, sem certificar o equilíbrio de todas as builds.

## Limites

O percurso visual usa vida elevada para não interromper a caminhada; o teste de ondas zera HP e avança o tempo de forma controlada. As amostras de combate usam ataque básico, movimento simples e uma semente; o perfil preparado do Guerreiro também usa investida e golpe de escudo. Não cobrem uma partida completa, as seis classes, todos os talentos, cooperação ou desempenho em outras máquinas.

A progressão e os itens já salvos não são rebaixados. Os prêmios exclusivos das missões e as condições da história foram preservados; a quantidade de XP e loot dos abates muda por haver menos inimigos e níveis menores. Arena, Expedições e configurações de mapas pessoais não receberam esses limites da campanha. A suíte geral tinha quatro falhas de classes registradas na entrega anterior; esta revisão executou os testes proporcionais aos sistemas alterados.

A regressão `node v2/tests/act-one-letter-browser-check.cjs` também passou após a revisão: reparos, resgate, bolsa, provas, Helena e convite final, com recargas e armazenamento isolado. A distribuição final foi reconstruída após o encerramento dos navegadores e conferida novamente pelo check de ritmo.
