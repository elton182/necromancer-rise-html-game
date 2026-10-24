# Diagnóstico — interfaces e comportamento dos zumbis

Revisão de 24/10/2026. Diagnóstico inicial preservado abaixo; as correções implementadas estão registradas nesta seção.

## Correções implementadas

Atualização do modelo de invocação: os slots do HUD agora configuram grupos, substituindo as antigas vagas individuais e o limite de vínculo. São 3 slots iniciais e mais 1 pela conclusão do Ato I e em cada nível 12, 15 e 20, até 7. Cada slot de Zumbi começa com 3 unidades; Arqueiro Ósseo, com 2. A árvore pode ampliar esses grupos. A migração preserva criaturas, deixa grupos excedentes em reserva e reembolsa melhorias de capacidade removidas. Saves guardam composição, HP e recuperação. Essa regra substitui as descrições anteriores de vagas/vínculo neste diagnóstico histórico.

Validação atual: 39 cenários aprovados por `node game_check.js`, incluindo desbloqueios independentes, configuração e troca de grupos, custos, expansão pela árvore, reserva e migração de saves. Inspeção visual do seletor ainda pendente.

- Horda com alvos limitados a 8 unidades de Zephyr, retorno persistente até 3 unidades, formação próxima e recuperação excepcional quando separada por mais de 24 unidades.
- Comandos limitados à região do personagem; seleção manual não apaga mais a ordem recém-criada.
- Pausa organizada em Personagem, Habilidades, Horda e Sistema, reutilizando os painéis existentes na mesma tela. Loja e missões permanecem como serviços do mundo/mapa.
- Invocação pela gestão durante combate respeita o custo de mana do menu rápido; não permite contornar o custo usando a pausa.
- Painéis externos recebem título e explicação da seção; apagar progresso fica em Sistema, com confirmação.
- HUD Relicário de Zephyr: vida e mana em reservatórios de vidro necrótico e metal, habilidades centrais com lançamento direto, experiência e nível na base. Mouse 1 lança Raio; mouse 2 lança Mãos; Shift + mouse 2 comanda a horda. Q invoca; Espaço ativa o Escudo; 1–4 são atalhos de lançamento.
- Separação de avisos e barra de magias, remoção do volume do topo de combate (permanece em Opções), contraste e tipografia de gestão ajustados e regras para janelas menores.
- Textos de morte, sacrifício e retorno compartilhados entre telas da horda. Segmentos de capacidade usam o custo efetivo com melhorias.

Comentários visuais incorporados: comandos da horda agrupados de forma compacta no topo; faixa de instruções removida do combate e centralizada na Ajuda (H); explicações e custos distinguem vagas, vínculo reservado e mana/almas pagos na invocação. O HUD usa composição própria em HTML/CSS, sem reutilizar as ilustrações da referência.

Validação: `node game_check.js` cobre 28 cenários, incluindo comandos diretos do mouse, bloqueio de ações durante a pausa, seleção local de alvos, retorno com personagem em movimento e navegação repetida da pausa com preservação dos painéis. Os testes de menus usam um DOM simulado; não confirmam a aparência renderizada. A conferência visual e de navegação real por controle ainda está pendente.

Base: HTML, CSS, geração de menus e fluxos em `necromancer-canvas.html`. Não houve inspeção visual em execução: a abertura de arquivos `file://` pela automação do navegador foi bloqueada na etapa anterior. Os conflitos de posição abaixo são identificados pelas regras de layout; o impacto final precisa ser conferido em jogo.

## Conclusão

O jogo reúne três interfaces diferentes: HUD de combate, menu de pausa e painel de gestão chamado Altar dos Ossos. Elas repetem informações e usam nomes distintos para os mesmos recursos. A evolução das habilidades também deixou descrições genéricas e estados de minions que não representam mais as regras atuais.

A prioridade deve ser organizar informação e comportamento; depois consolidar a aparência. Uma troca de cores isolada não resolve os problemas de navegação e significado.

## Problemas prioritários

| Prioridade | Problema verificado no código | Consequência | Direção proposta |
|---|---|---|---|
| Alta | `#spellbar` tem `pointer-events:none`, embora os slots tenham `onclick`, cursor de botão e nomes ao passar o mouse | A barra promete interação por mouse, mas não a recebe | Tornar slots interativos e tratar seleção, lançamento instantâneo e bloqueio de forma distinta |
| Alta | Aviso de reanimação está no centro inferior a 80 px; magias estão na mesma região, a 75 px | Aviso ocupa a faixa dos slots | Reservar uma linha exclusiva de avisos acima da barra de ações |
| Alta | Volume e barra do chefe usam o topo central a 16 px | Controles concorrem com a leitura do chefe | Mover áudio para Opções; reservar topo central para chefe e objetivo |
| Alta | Pausa oferece várias abas que abrem outro painel de tela inteira com título fixo “Altar dos Ossos” | Perda de contexto ao abrir Loja, Habilidades ou Invocar | Uma estrutura de gestão, com título correspondente à seção e retorno consistente |
| Alta | “Invocação” é uma barra de capacidade usada, apresentada junto de vida e mana | Parece um recurso consumível ou regenerável; não explica por que há espaço indisponível | Chamar de “Capacidade da horda”, mostrar ocupação e explicar que caídos/sacrificados ocupam espaço |
| Alta | Status e menu rápido de invocação mostram todo morto como “caído”, inclusive sacrificado | O jogador pode esperar que `R` funcione quando existe bloqueio de 20 s | Unificar estados: vivo, caído/reanimável e sacrificado/em recuperação, sempre com tempo e regra |
| Média | “Invocar” contém a lista da horda; “Minions” contém melhorias | É difícil prever onde gerenciar os zumbis | Uma seção “Horda” com integrantes, invocação e melhorias claramente separados |
| Média | Habilidades ficam numa árvore com compras; melhorias das magias aparecem abaixo; melhorias gerais ficam em outra aba | O jogador precisa descobrir três lugares para evoluir o personagem | Agrupar por personagem, habilidades e horda, com moeda e efeito explícitos |
| Média | “Raio das magias” aparece como atributo geral | Não descreve o raio fixo de Mãos nem o alcance do Raio Necrótico | Detalhes por habilidade: dano, alcance, área, custo, duração e recarga |
| Média | Habilidades futuras permanecem na barra com opacidade baixa | Espaço ocupado sem explicar quando ficam disponíveis | No Ato I, mostrar habilidades atuais e próximas do ato; apresentar conteúdo posterior no menu, com motivo de bloqueio |
| Média | Textos de combate usam 9–10 px, cinzas escuros e cores próximas do fundo | Leitura fraca sobre cenários e dificuldade em distinguir estados | Texto de corpo mais legível, fundo estável para dados essenciais e contraste consistente |
| Média | Menu de gestão oferece “RESET” junto de Salvar, Sair e História | Ação destrutiva ocupa o mesmo nível de ações frequentes | Colocar apagar progresso em Sistema, com identificação clara do save afetado |
| Média | HUD usa larguras fixas; menu inicial dimensiona botões principalmente pela altura | Risco de corte em janelas estreitas e colisões em resoluções menores | Validar 1280×720, 1920×1080 e janela estreita; definir reorganização por largura |
| Média | Termos alternam entre HP, SP, slots, roster, minions, gold, wave e português | Carga de aprendizado sem necessidade | Vida, mana, capacidade, vagas, horda, ouro e onda; abreviações apenas onde necessárias |

## Comportamento dos zumbis

### Causa encontrada

`LEASH_DIST` está em 14. Ao ultrapassar essa distância, o minion se aproxima do personagem, limpa o alvo e, no próximo ciclo em que volta para dentro do limite, fica novamente apto a atacar.

`nearestEnemy` não limita a seleção pela distância a Zephyr. O modo automático pode buscar inimigos em qualquer parte do mapa. O comando de ataque também encontra um inimigo próximo do ponto indicado ou recorre a outro alvo sem limite local. Isso produz perseguição longa e alternância entre retorno e ataque na borda.

Há ainda um erro separado: depois de um comando manual, `applyRightClick` chama `setCommand('auto')`, que limpa o comando recém-criado. O botão de ataque/movimento e a detecção automática precisam ser revisados juntos.

### Regra recomendada para o protótipo

Os números abaixo são propostas, ainda sem teste de jogo:

| Regra | Proposta |
|---|---|
| Formação normal | Zumbis acompanham Zephyr a aproximadamente 2–3 unidades |
| Limite de combate | Alvos elegíveis somente até 8 unidades de Zephyr |
| Retorno obrigatório | Começa quando o zumbi ultrapassa 8 unidades ou quando seu alvo sai da região permitida |
| Conclusão do retorno | Só termina ao chegar a até 3 unidades de Zephyr; não readquire alvo durante o trajeto |
| Velocidade de retorno | Pelo menos ligeiramente superior à velocidade de Zephyr, sem aumentar velocidade de ataque |
| Comando manual | Ataque e deslocamento respeitam o mesmo limite; não permitem abandonar a região do jogador |
| Movimento do personagem | A região permitida acompanha Zephyr; alvo que ficou para trás deixa de ser perseguido |
| Separação extrema | Prever recuperação excepcional perto do personagem se a navegação ficar presa; não usar teleporte como retorno normal |

O limite deve existir em unidades do mundo. A distância em que os zumbis permanecem confortavelmente visíveis precisa ser ajustada no teste com câmera e resoluções diferentes. Colisões e passagens estreitas devem ser verificadas para evitar um retorno que fique preso em obstáculos.

## Estrutura recomendada de interface

### Durante o combate

- Vida e mana como recursos mais visíveis e agrupados.
- Magia selecionada com nome, atalho, custo e disponibilidade; separar visualmente a defesa instantânea de magias selecionáveis.
- Horda com quantidade viva, capacidade ocupada e indicadores de recuperação.
- Ouro, almas e experiência como informação secundária.
- Objetivo da fase ou chefe no topo central; tutorial temporário sem competir com a barra do chefe.
- Avisos contextuais em uma região própria: mana insuficiente, alvo fora de alcance, reanimação disponível e recuperação de sacrifício.
- Controles completos na pausa. No combate, apenas lembretes relevantes ao que já foi desbloqueado.

### Menu de pausa e gestão

| Seção | Conteúdo |
|---|---|
| Personagem | Recursos, atributos efetivos, experiência e melhorias gerais |
| Habilidades | Desbloqueios, detalhes e evoluções de cada habilidade |
| Horda | Integrantes, estados, capacidade, invocação e melhorias de zumbis |
| Sistema | Controles, opções, salvar/exportar e ações de progresso |

Loja e missões continuam como serviços do mundo/mapa. É uma decisão de design ainda pendente se podem ser acessadas durante uma luta; hoje a pausa oferece acesso à loja. Escolher uma regra e comunicá-la com consistência antes de reorganizar os botões.

O mapa da campanha deve privilegiar fase atual, próxima fase e recompensa/desbloqueio. Atalhos de preparação devem reutilizar a mesma interface de gestão, sem criar uma terceira navegação.

## Ordem sugerida de trabalho

1. Corrigir perseguição, seleção de alvo e retorno dos zumbis; testar com Zephyr parado, andando e usando comandos.
2. Corrigir interações da barra e conflitos de posição; unificar estados da horda.
3. Reorganizar pausa e gestão com a estrutura acima, preservando os fluxos de retorno e navegação por controle.
4. Consolidar tipografia, cores, contraste, espaçamento e comportamento em janelas menores.
5. Validar em partida completa e comparar campanha, mapa, chefe e modo livre.

## Critérios de aceitação

- Um zumbi não atravessa o mapa para buscar um inimigo distante.
- Ao se afastar demais, retorna até a formação sem alternar entre ataque e retorno na borda.
- Comandos de ataque e reunião respeitam o limite e não são apagados imediatamente.
- O jogador consegue identificar magia selecionada, mana disponível e causa de bloqueio sem abrir o menu.
- Sacrifício e morte comum são diferenciados em todas as telas da horda.
- Uma ação com aparência de botão recebe clique e foco; um indicador não promete interação.
- Sair de Habilidades, Horda ou Loja retorna à origem de forma consistente no mouse, teclado e controle.
- Nenhuma informação essencial se sobrepõe em 1280×720 e 1920×1080; janelas menores reorganizam o conteúdo.
