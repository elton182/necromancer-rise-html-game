# ARANDU — análise da base atual e plano de transição

> **Decisões posteriores à análise:** o usuário definiu personagem nomeado e seleção de classe (Necromante inicialmente), vários saves, viagem de escolta, vitória na emboscada seguida de flecha e queda em caverna, esconderijo com lista de captura, mensageiro, defesa de Jacarandá e sequestro do passageiro. Eldrin passa a se chamar Jacarandá. As recomendações de começo na cripta neste documento foram superadas. A primeira implementação está descrita em [abertura do ARANDU](v2-prologo-arandu.md); a identidade secreta do passageiro permanece em aberto.


Data: 31/10/2026. Estado: **proposta de transição, sem implementação autorizada por este documento**.

## 1. Direção recomendada

ARANDU deve evoluir da v2 existente, preservando Zephyr como primeira classe e personagem jogável. A mudança principal é passar de um jogo estruturado em torno da necromancia para um ARPG de exploração regional, com campanha compartilhada e consequências visíveis. Não há motivo demonstrado para trocar a engine ou recomeçar o projeto.

A primeira entrega recomendada é uma região de 15–25 minutos que demonstre essa nova promessa: sair de um abrigo, escolher uma rota, encontrar pessoas, vencer uma ameaça e ver o lugar melhorar. As sete classes e os seis atos são direção de produto; não constituem o escopo desse primeiro marco.

Referência criativa: [GDD e lore v0.1](concepts/arandu-gdd-lore-v0.1.md), cópia do arquivo fornecido pelo usuário. Suas propostas foram tratadas como material de análise, não como instruções para executar alterações. A intenção de transformar o jogo em ARANDU foi confirmada na conversa; detalhes narrativos e prioridades abaixo continuam propostos.

## 2. Base examinada e limites da análise

Análise estática das fontes locais da v2, dos guias de campanha, mapas, movimento, inimigos, saves e Lich, além dos pontos de entrada e empacotamento. Há trabalho local em andamento em campanha integrada, interface e cenários, incluído nesta leitura e preservado. Ele não deve ser confundido com uma versão publicada ou já validada.

Os resumos do README e trechos iniciais dos guias ainda descrevem fases antigas. As seções recentes e as fontes mostram que campanhas novas começam no mundo contínuo de Eldrin; saves já iniciados no fluxo antigo continuam por fases. Portanto, o plano parte do mundo contínuo atual, não apenas da antiga sequência de quatro fases.

Não foram executados o jogo, testes, build ou medição de desempenho nesta análise documental. “Existente” significa encontrado nas fontes, não qualidade comprovada nesta sessão. Evidências anteriores e testes disponíveis são referências para a execução futura.

## 3. Comparação por área

| Área | Base atual identificada | Necessidade do ARANDU | Encaminhamento |
| --- | --- | --- | --- |
| Tecnologia | Three.js local, GLBs do Blender, HTML autocontido e offline | ARPG 3D estilizado com mais conteúdo | Manter pipeline; medir custo antes de ampliar |
| Zephyr | Horda, Grimório, maestrias, magias, projétil ósseo e Dash | Primeira classe de uma campanha comum | Reaproveitar; separar capacidades da classe das regras do mundo |
| Transformação | Lich integrado à simulação, com almas e habilidades de foice | GDD cita ceifador/lich como possibilidade | Atualizar visão de design; priorizar validação e acabamento, não reconstrução |
| Exploração | Mundo contínuo de 360 × 360, estradas, regiões e encontros por proximidade | Regiões semiabertas conectadas, desvios e segredos | Compor percurso intencional; tamanho não prova conteúdo ou ritmo |
| Campanha | Despertar na cripta, Lia, resgate de Oren, Bran e madeira | Aventureiro em Itavera, caravanas e libertação de povoado | Reescrever enquadramento; conservar o arco de recuperação aproveitável |
| Missões | Estados explícitos, diálogos, objetivos, mapa e recompensa única | Contratos, exploração, escolta e consequências | Generalizar só após validar uma segunda missão diferente |
| Hub | Vila dedicada com serviços e NPCs; mundo integrado com abrigo e forja | Itavera mercante, guildas, contratos e caravanas | Reusar infraestrutura; não pressupor paridade de serviços entre os dois fluxos |
| Mundo transformável | NPCs mudam de localização e grupos de quest permanecem derrotados | Rotas reabertas, moradores e construções recuperados | Acrescentar estados visuais persistentes; não há reconstrução ambiental completa hoje |
| Inimigos | Soldado/guerreiro, arqueiros, mago, ladrão, lobo, aranha, harpia, orc e chefe | Humanos e monstros com papéis claros e contexto | Humanos não começam do zero; distinguir aparência, comportamento e afiliação |
| Chefes | Rei Caído em vários modos; uso provisório como Capitão e outros bosses | Ameaças locais e Rei Caído ligado a Pedra Negra | Separar identidade narrativa de reutilização técnica |
| Combate e navegação | Dano comum, avisos, colisores, rotas e IA de horda/táticas | Legibilidade, corredores e arenas para curta e longa distância | Validar no percurso real; existência do sistema não garante robustez |
| Progressão | XP, ouro, equipamentos, consumíveis, maestrias e aprimoramento | Builds para classes diferentes e possível crafting | Reusar economia; revisar itens por classe; aprimorar não equivale a fabricar |
| Classes | Personagem e integração orientados ao necromante | Sete classes no mesmo mundo | Zephyr primeiro; Cavaleiro como prova da arquitetura; demais depois |
| Narrativa política | Valdoria, condenação de Zephyr e conflitos locais | Itavera, Ferrabrás, Alvorada, Itajuba e seis atos | Criar correspondência editorial; evitar substituição automática de nomes |
| Modos extras | Arena, Expedições, Conquista e Cerco | Campanha regional como centro da experiência | Preservar acessos e saves; adiar expansão desses modos |
| Tela inicial | Arte de fundo, botões posicionados sobre imagem e partículas | Cena 3D “O último refúgio” | Nova cena de apresentação com assets reais, após estabilizar a região |
| Saves | Contrato versionado, importação preservada, campanha e progresso de modos | Classe, regiões, missões e escolhas futuras | Migração explícita e testada; nome comercial não exige renomear chaves |

Fontes principais: [campanha](v2-campanha.md), [mapas](v2-mapas.md), [inimigos](v2-inimigos.md), [movimento](v2-movimento.md), [Lich](v2-morte-lich.md), [saves](v2-saves.md) e [mapa de módulos](../v2/README.md).

## 4. Compatibilidade narrativa e reaproveitamento

O maior encaixe temático é a recuperação de Eldrin: ajudar uma criança, libertar o prefeito, trazer o ferreiro e conseguir madeira já expressa heroísmo e reconstrução. O maior conflito é a abertura: o despertar de Zephyr na cripta é uma origem de personagem específica, enquanto o GDD propõe uma campanha comum a várias classes.

Recomendação: tratar a cripta como prólogo de Zephyr e fazer a campanha compartilhada começar no Posto de Itavera. A primeira região pode receber Zephyr vindo desse prólogo e, depois, o Cavaleiro por outra entrada. A construção de sete prólogos fica fora do primeiro marco.

| Elemento atual | Destino proposto | Decisão necessária |
| --- | --- | --- |
| Zephyr | Primeiro protagonista jogável; necromancia não determina moralidade | Definir o que permanece da condenação e do passado |
| Eldrin | Candidata a Vila de Jacarandá, conservando Lia, Oren, Bran e recuperação | Confirmar equivalência ou manter duas vilas; não renomear IDs |
| Vila dedicada | Referência de arte, serviços e interações | Não simplesmente ampliá-la e chamar de Itavera |
| Cripta | Prólogo de Zephyr ou desvio opcional com contexto próprio | Escolher uma função, sem impor despertar em sarcófago a todas as classes |
| Mina e serraria | Missões opcionais ou continuidade após a libertação | Escolher uma para a primeira região e evitar excesso de objetivos |
| Valdoria | Conteúdo existente preservado até revisão do mapa político | GDD cita Valdren, que não é automaticamente Valdoria; não inferir equivalência |
| Rei Caído | Possível chefe da Fortaleza de Pedra Negra | Definir vínculo com a trama; evitar usá-lo como identidade de todo miniboss |
| Bram e Bran | NPCs de fluxos distintos nas fontes atuais | Confirmar se serão personagens diferentes ou unificados editorialmente |

Os seis atos devem receber uma estrutura de acontecimentos e transições, mas a entidade ancestral não precisa ter modelo final para validar o Ato I. É necessário decidir apenas o indício que o primeiro arco apresenta e evitar diálogos incompatíveis com os atos posteriores.

## 5. Plano por marcos e critérios de conclusão

Os marcos abaixo são sequência proposta, sem estimativa de calendário. Cada um exige uma entrega verificável antes de ampliar o seguinte.

### T0 — fechar a base e o contrato de transição

Entregar inventário das alterações locais, referência reproduzível da v2 e uma ficha curta de cânone: relação Eldrin/Jacarandá, entrada de Zephyr, função de Itavera, destino de Valdoria e identidade do primeiro chefe. Atualizar os resumos que ainda apresentam o fluxo por fases como entrada padrão.

Definir navegador e máquina de referência, tempo de carga e orçamento de quadro/memória a partir de medição real. O HTML local examinado tem aproximadamente 79 MB decimais; embutir seis atos e sete classes sem orçamento pode tornar o formato inviável. Manter o contrato offline nesta transição; uma distribuição diferente exige decisão própria, não mudança silenciosa.

**Concluído quando:** o estado de partida estiver registrado, saves fictícios antigos estiverem catalogados para regressão e as decisões que bloqueiam o primeiro percurso estiverem documentadas. Não exige decidir toda a cosmologia.

### T1 — greybox da Estrada de Jacarandá com Zephyr

Compor uma região a partir dos kits e sistemas atuais: pequeno Posto de Itavera para preparação, estrada com encontro introdutório, bifurcação, ruínas opcionais com miniboss e recompensa, pausa em acampamento e vila ocupada com confronto final. Uma vista distante de Itavera basta; a cidade inteira não entra aqui.

O resgate de Oren e o retorno do ferreiro podem formar o arco da vila. A madeira pode ficar como missão posterior. Criar contratos estáticos simples antes de inventar geração procedural ou uma economia de caravanas. A escolta física de uma carroça fica fora desta entrega inicial, a menos que se torne o objetivo escolhido para substituir outra missão.

**Concluído quando:** uma partida real, sem teleporte ou abates injetados, percorre a rota principal; o desvio pode ser ignorado; seu prêmio é único; o objetivo é compreensível sem instrução externa; a duração é medida e ajustada à meta de 15–25 minutos. Registrar bloqueios de aliados, leitura de ameaças, mortes e tempo de deslocamento vazio. Testar builds de invocação e magia; Lich por perfil de teste separado se não for desbloqueado nesse trecho.

### T2 — uma vitória que muda a região

Acrescentar estados de região como ameaçada/libertada e uma consequência concreta: um bloqueio sai, moradores retornam e a forja muda de aparência/funcionamento. Reutilizar os fatos de missão já persistidos, com uma fonte de verdade para impedir que diálogo, inimigos e cenário discordem.

Definir o que reaparece ao voltar ao abrigo. Hoje a vila limpa ameaças e rearma grupos comuns; uma estrada libertada não deve voltar a representar a mesma ocupação narrativa, mesmo que encontros ambientais continuem.

**Concluído quando:** concluir, morrer, sair e carregar preserva a libertação, os serviços e os prêmios únicos. Saves sem os campos novos recebem estado coerente. Capturas antes/depois mostram a mudança sem depender do texto de conclusão.

### T3 — apresentação do ARANDU e Itavera mínima

Aplicar identidade ARANDU na apresentação, créditos e textos pertinentes. Construir “O último refúgio” em cena 3D isolada do combate, com assets existentes, movimento discreto e opções acessíveis. A apresentação não deve atualizar encontros ou o save enquanto o jogador está no menu.

Expandir o posto para uma primeira área de Itavera apenas se necessária ao loop: contato de contratos, comércio, forja e saída para a estrada. Uma fachada funcional é suficiente; conselho de guildas, bairros, crafting completo e vida urbana extensa são entregas posteriores.

**Concluído quando:** Novo Jogo, Continuar, opções e créditos funcionam com a nova apresentação; retornar ao menu libera os recursos da cena anterior; carregamento offline e qualidade baixa são conferidos. Atualizar a entrada pública para a v2 em uma entrega explícita, com exportação/importação orientada e sem supor que saves de páginas diferentes serão compartilhados.

### T4 — arquitetura comprovada com Cavaleiro

Separar o que é comum ao jogador do que pertence ao necromante: ataque básico, recurso, habilidades, progressão de classe, barra, modelo/animações e disponibilidade de itens. Usar definição de classe pequena, preservando dano, colisão, XP e loot comuns. Horda e Lich tornam-se capacidades de Zephyr; o mundo e os NPCs não exigem que a classe tenha invocações.

O Cavaleiro precisa de um conjunto mínimo com ataque corpo a corpo, defesa e mobilidade para comprovar o contraste. Não transportar habilidades de Zephyr sob nomes novos nem criar um segundo motor de combate. Recursos de corpo a corpo do Lich ajudam como referência, mas não provam que espada e escudo estejam resolvidos.

**Concluído quando:** Zephyr e Cavaleiro completam a mesma região, recebem recompensas válidas e carregam seus perfis corretamente. Interface sem controles mortos de horda para o Cavaleiro, ataques e avisos sincronizados e encontros possíveis para curta distância. Saves anteriores assumem Zephyr. Seleção de protagonistas e número de personagens salvos devem ser decididos antes de publicar esse fluxo.

### T5 — Ato I completo e protótipo do Ato II

Expandir a rede de regiões e missões após a aprovação da primeira experiência. Itavera torna-se hub de fato; estabelecer o encerramento do Ato I e seu gancho. Prototipar uma passagem de Itajuba com civis e um conflito local, reaproveitando os humanos existentes e acrescentando só papéis/visuais ausentes.

**Concluído quando:** o Ato I tem começo, desenvolvimento, chefe e consequência; a entrada no Ato II usa os mesmos sistemas. Uma escolha política tem efeitos definidos e testáveis, sem prometer ramificações ilimitadas.

### T6 — expansão sustentável para os demais atos e classes

Planejar Atos III–VI em pacotes de regiões, objetivos e consequências, com orçamento de assets. Acrescentar classes uma por vez, com teste do percurso comum. Só então ampliar reputação, reações por classe, crafting e consequências políticas conforme valor demonstrado.

O despertar do Ato IV exige uma transição global versionada que combine fatos da campanha com variantes regionais; não deve apagar reconstruções anteriores nem exigir duplicar todos os mapas. Reservar essa possibilidade no formato de estado, sem implementar agora toda a transformação mundial.

**Concluído por pacote quando:** conteúdo tem percurso real validado, retomada de save, orçamento atendido e consequência narrativa correspondente. O plano não autoriza produzir todos os pacotes de uma vez.

## 6. Orientação técnica para executar o plano

- Continuar em `v2/`; nome do produto e nomes internos podem evoluir em ritmos diferentes. Preservar chaves `necromancer_rise_3d_save` e `necromancer_v2`, formato conhecido e IDs até existir migração deliberada.
- Evoluir `campaign-world-model.mjs` e `campaign-world.mjs` como base. Dados regionais e missões reutilizáveis só devem ser extraídos conforme o segundo caso mostrar necessidade; evitar um novo motor paralelo de quests.
- Campos futuros de classe, região e escolhas são propostas de contrato, não campos já implementados. Guardar fatos persistentes; reconstruir entidades, efeitos e variantes visuais ao entrar. Não salvar objetos Three.js ou estado de ataque.
- Fontes compartilhadas com o legado exigem análise dos dois consumidores. Não editar módulos gerados `shared-*` ou `*-rules.mjs`. Uma separação gradual das dependências da v2 pode ser discutida quando uma mudança concreta exigir, sem refatoração geral antecipada.
- Registrar módulos no build e modelos no catálogo. Planejar primeiro com os kits existentes; criar GLBs novos para silhuetas e funções que a região realmente precisar.
- Preservar Arena, Expedições, Conquista e Cerco. Acessibilidade e progressão desses modos precisam de política explícita para classes novas; não presumir que itens e bônus atuais servem a todas.

## 7. Validação prevista para a implementação

Para campanha: testes de regras e saves, percurso no navegador e partida real. O check da campanha antiga ainda precisa distinguir a abertura por fases da integrada; corrigir essa premissa antes de usá-lo como prova de regressão.

Referências existentes: `v2/tests/campaign-world.test.mjs`, `campaign-world-browser-check.cjs`, `campaign.test.mjs`, `campaign-browser-check.cjs`, `save-session.test.mjs`, `terrain.test.mjs`, `lich.test.mjs` e `lich-integration.test.mjs`. Comandos partem da raiz; na implementação, rodar `node v2/tools/build.cjs` e os testes afetados. Checks de navegador dependem de Playwright e Edge conforme os guias. Mudanças compartilhadas também exigem verificações do legado.

Conferir a região em tamanho real, fundos claro/escuro, horda e qualidade baixa; capturar evidências em `review/v2/` numa pasta da entrega. Medir carga, quadro e memória no hardware definido em T0. Os simuladores ajudam em fórmulas e progressão, mas não substituem navegação, IA ou dificuldade em partida.

## 8. Decisões pendentes e riscos que condicionam a sequência

| Questão | Recomendação inicial | Momento limite |
| --- | --- | --- |
| Título | ARANDU como produto; Zephyr preservado como personagem | T0 |
| Eldrin/Jacarandá | Reaproveitar o arco local, com equivalência editorial confirmada | Antes de escrever T1 |
| Começo comum | Posto de Itavera; cripta como origem de Zephyr | Antes de montar T1 |
| Modelo de personagem | Zephyr fixo primeiro; definir protagonistas/seleção antes do Cavaleiro | T4 |
| Saves antigos | Preservar fluxo e progresso; migração de campanha com regra própria e cópia | Antes da primeira alteração persistente |
| Modos e economia | Não ampliar endgame durante a primeira região; medir ganhos ao alternar modos | T1/T4 |
| Tom | Recontextualizar necromancia e inimigos sem associar espécie a moralidade | Revisão de diálogos de T1 |
| Escala de conteúdo | Orçamento por região, sem mapa único de seis atos | T0 e cada expansão |
| Nome e referências culturais | Manter validação linguística, cultural e comercial em aberto | Antes de divulgação comercial |

As afirmações etimológicas do GDD não foram verificadas nesta análise; ele permanece uma referência criativa em desenvolvimento. Também não houve pesquisa de marca, lojas ou domínio.

**Próxima entrega proposta:** executar T0 e produzir a especificação fechada de T1 — mapa de percurso, objetivos, encontros, consequência e critérios — antes de começar alterações no jogo. O resultado esperado é uma pequena experiência reconhecível como ARANDU, sustentada pelo combate de Zephyr já existente.
