# ARANDU — abertura da campanha

Estado: **primeira versão funcional**, em 31/10/2026. Campanhas novas usam esta abertura; saves já iniciados continuam no fluxo anterior. A direção definida com o usuário substitui a proposta de começar na cripta presente na análise inicial de transição.

## Percurso

Antes da carroça, uma tela de texto em fundo escuro apresenta Arandu, Ferrabrás, Alvorada, Itavera e a motivação do aventureiro: sair de casa em busca de fama, riqueza e poder, começando pelo contrato de escolta. **Começar a jornada** abre a conversa a bordo. Não há avanço automático; o texto pode ser rolado em telas menores. A viagem permanece congelada até a confirmação.

1. **A caminho de Itavera:** o personagem vem de outro reino, contratado para proteger uma caravana. Marta apresenta o trabalho; João é um passageiro aparentemente comum. A viagem acontece a bordo, com câmera próxima, carroça aberta para leitura dos passageiros, rodas girando e cavalo de tração animado. Os balões alternam entre Marta, João e o cocheiro. O botão ou G avança as falas; durante a leitura, a viagem continua e o combate fica bloqueado. Marta provoca o guarda novato, João intervém e o cocheiro interrompe ao ver o bloqueio. A carroça freia; a última fala inclui o nome do jogador e o botão **Ver o bloqueio** inicia a emboscada.
2. **Proteja a caravana:** três bandidos, incluindo um atirador, precisam ser derrotados. Usam dano, projéteis, colisões, XP e loot comuns da v2. Não há uma segunda rotina de dano. As carroças bloqueiam o movimento; os passageiros não têm um objetivo de vida próprio nesta versão.
3. **O último disparo:** após a vitória e a conversa, um arqueiro restante dispara da encosta. Uma cena de aproximadamente 5,2 segundos mostra a flecha, o desequilíbrio, o chão cedendo e a descida pelo poço. A câmera se aproxima da abertura; terreno recortado, borda irregular, paredes abaixo do chão e destroços dão profundidade à queda. Uma passagem escura liga a descida à chegada na caverna, onde há fragmentos no ponto de início. É um acontecimento roteirizado, não um ataque evitável: não reduz HP, não produz game over nem conta como morte. Durante a cena, movimento e combate ficam suspensos; a pausa congela a cena. A caravana acredita que o personagem morreu e segue para Jacarandá.
4. **Saia da caverna:** o personagem desperta sozinho numa galeria usada como esconderijo. Dois bandidos guardam os papéis. Após derrotá-los, G próximo da lista revela a ordem de capturar **João vivo**, sem identificar o contratante. A leitura é necessária antes de usar G na saída ao norte. Tochas e marcadores indicam os pontos de interação.
5. **Um pedido de socorro:** dois perseguidores ameaçam Tomás, mensageiro ferido de Jacarandá. Após vencê-los, conversar com ele leva à vila que está sendo atacada.
6. **Defenda Jacarandá:** quatro bandidos atacam a praça. Marta e outros companheiros reaparecem, e um guarda aliado ajuda no combate. Derrotar os atacantes abre a conversa do reencontro: a vila foi salva, mas João foi levado.
7. **Primeiro abrigo:** Jacarandá passa a usar o mundo contínuo existente, com Joaquim na vila, resgate de Bruno e madeira disponíveis. A defesa substitui o antigo resgate do prefeito nas campanhas novas. O desaparecimento de João permanece registrado como gancho; depois da forja e da madeira, Marta abre [O rastro de João](v2-itauna.md#o-rastro-de-joão), que atravessa a Várzea de Itaúna, a Gruta das Tecelãs e o Forte da Pedra Negra.

Marta, João e Tomás são nomes de trabalho introduzidos nesta entrega; a identidade secreta de João continua em aberto. Todas as classes começam com poderes conhecidos na ficção; a abertura não explica a aquisição da necromancia. Novo Jogo oferece Necromante e Guerreiro; o [Guerreiro](v2-guerreiro.md) tem ações marciais e passivas próprias.

## Recompensas e retomada

O encerramento concede **90 ouro e 120 XP**, uma vez, antes de entrar no abrigo. Abates e drops seguem o caminho comum. Não há bônus especial por cada etapa intermediária. Composições e escala de encontro 1 são provisórias; não houve balanceamento de dificuldade por partida completa nem revisão do simulador.

Morte ou recarga retoma o começo do trecho atual com o campo reconstruído, sem restaurar HP, posições, projéteis ou temporizadores. As ordens abrem quando os guardas da sala delas caem: inimigos com posição de guarda, ou grupos do mapa editado, a até 20 u de `PROLOGUE_POINTS.papers` (`PAPERS_GUARD_RADIUS`), incluindo ondas pendentes. Bandidos de outras salas são opcionais; antes, todos precisavam morrer, e um grupo de aproximação em sala lateral travava ordens e saída. O estado `caveCleared` impede novos guardas da caverna depois da vitória, e `clue` preserva a leitura da lista. Conversas em andamento recomeçam; a cena da flecha é repetida ao retomar durante a queda. Na vila, o progresso segue o contrato do mundo contínuo.

O estado opcional `campaign.prologue` guarda `stage`, `introRead`, `clue`, `caveHeard` e `caveCleared`. `stage` aceita `travel`, `ambush`, `farewell`, `fall`, `cave`, `trail`, `defense`, `reunion` e `done`. Campo ausente equivale a `null`: saves anteriores não recebem a abertura automaticamente. Valores inválidos usam o começo do prólogo. Ao terminar, `campaign.world.passengerMissing` registra o gancho, enquanto `stage: 'complete'` abre as missões de recuperação já existentes. Chaves de armazenamento e formato do save foram preservados.

## Fontes e assets

- `v2/scripts/prologue-model.mjs`: normalização, objetivos e conversas.
- `v2/scripts/prologue-map.mjs`: estrada, esconderijo, caminho do mensageiro e uso da vila.
- `v2/scripts/prologue.mjs`: fluxo, encontros, interações, cena roteirizada e encerramento.
- `v2/scripts/prologue-scene.mjs` e `prologue.css`: apresentação e peças de cenário.
- Integração em `campaign.mjs`, `campaign-model.mjs`, `campaign-panel.mjs`, `session.mjs`, `renderer.mjs`, `game-ui.mjs` e `sound-events.mjs`.
- `blender/scripts/arandu_caravan_kit.py`: fonte reproduzível das carroças, estandarte e flecha. Gera `blender/models/arandu_caravan_kit.blend` e `blender/exports/arandu_caravan_kit.glb`, registrado como `caravanKit`. O kit inclui também `kit_caravan_open`, `kit_caravan_wheel` e `kit_road_block`. As rodas são instâncias GLB separadas, giradas pela distância percorrida. Passageiros reutilizam os modelos animados existentes.
- `blender/scripts/arandu_caravan_horse.py`: gera a fonte `blender/models/arandu_caravan_horse.blend` e o GLB `blender/exports/arandu_caravan_horse.glb`. O cavalo possui rig e clipes `idle`/`walk`, registro `caravanHorse`, ciclo de 1 s e passada de 1,6 u. A caminhada acompanha a distância da viagem e volta a idle ao parar.

Na raiz, gerar o kit com `blender --background --python blender/scripts/arandu_caravan_kit.py`, tendo o Blender no PATH, e executar `node v2/tools/build.cjs`. Não editar a distribuição manualmente. O build incorpora os recursos para uso offline.

## Verificação e limites

Executados: geração do kit no Blender, build e suíte completa `v2/tests/*.test.mjs`, incluindo `prologue.test.mjs`, regressão de saves, campanha por fases e mundo integrado anterior. O teste do mundo anterior agora solicita explicitamente a abertura antiga.

`node v2/tests/prologue-browser-check.cjs` usa Playwright/Edge e armazenamento isolado. Confere criação pelo menu, diálogo, um disparo real, sequência até a vila, leitura da lista e recarga na caverna. O restante dos encontros é encerrado com HP injetado: isso verifica integração e transições, **não comprova dificuldade nem uma partida completa**. Capturas e resultado ficam em `review/v2/arandu-prologue/`.

Limites desta primeira versão: passageiros ainda usam poses de pé, sem animação específica de assento ou fala; corte de caverna sem teto; transições entre mapas por corte; queda com animação própria, ainda sem uma animação exclusiva de aterrissagem; sequestro relatado no reencontro, sem cena própria. Não há dublagem nem identidade secreta revelada. O mundo integrado renomeia a apresentação de Eldrin para Jacarandá; IDs, arquivos e o fluxo histórico por fases permanecem compatíveis.


## Revisão da viagem narrativa

A etapa `travel` é uma cena roteirizada em movimento. A simulação comum não avança combate, mana, recargas ou movimento do jogador; só o relógio da viagem atualiza os passageiros, o cavalo e a carroça. Pausar ou perder foco congela o movimento. Os balões acompanham o interlocutor na projeção da câmera, com posição estabilizada para leitura e clique. O HUD de combate e o minimapa ficam ocultos e retornam ao desembarcar. A câmera normal e os controles são restaurados ao iniciar `ambush`.

O nome é inserido como texto, sem interpretar HTML. A leitura é manual, sem avanço por tempo. Ao chegar às falas do cocheiro, um bloqueio aparece à frente e a velocidade cai até zero. A posição e a distância da viagem são transitórias: recarregar durante `travel` reinicia essa conversa, sem alterar o contrato de saves.

Executados após a revisão: regeneração do kit e do cavalo, build e suíte da v2. `node v2/tests/caravan-travel-browser-check.cjs` conferiu no Edge movimento, passageiros a bordo, balões, tela de 390 px, pausa/retomada por Esc, G com foco no botão, chamada pelo nome e desembarque. Evidências em `review/v2/arandu-travel/`. A exportação final do cavalo foi acionada pelo MCP do Blender, preservando a cena aberta do usuário. Não foram gravados dados pessoais nem alterados saves existentes para os testes.


### Introdução textual e compatibilidade

Campanhas novas iniciam com `campaign.prologue.introRead: false`; confirmar a leitura grava `true`, sem avançar a primeira fala de Marta. O campo ausente recebe `true` para não inserir a introdução em saves já existentes. Recarregar antes da confirmação volta ao texto; depois dela, retoma a etapa atual normalmente. O conteúdo está em `PROLOGUE_INTRO`, em `prologue-model.mjs`.

Verificados: build, testes de prólogo e saves/sessão, além do check de viagem no Edge, que agora cobre a introdução em 1440 e 390 px, rolagem até o botão, viagem congelada e passagem para os balões. Capturas em `review/v2/arandu-intro/`; resultado do percurso em `review/v2/arandu-travel/result.json`.


### Acabamento visual da carroça

As variantes aberta e coberta receberam tábuas com variação de cor, reforços de ferro, rebites, faixa vinho, lanternas, bancos e bagagem amarrada. Rodas vazadas com oito raios substituem os discos sólidos; a cobertura usa arco e costuras. A mudança é visual: rota, diálogos, velocidade, colisões e regras de combate permanecem nas fontes anteriores. O kit GLB e a cena Blender foram regenerados pelo gerador existente, acionado via MCP, e a distribuição foi reconstruída.

Conferência: `caravan-travel-browser-check.cjs` no Edge, carroça aberta durante o movimento e coberta na emboscada, desktop, 390 px e qualidade baixa com grupo nos fundos claro/escuro. Evidências em `review/v2/arandu-travel/`. Não houve alteração de balanceamento nem medição comparativa de desempenho nesta revisão.


## Revisão da queda e editor (01/11/2026)

A flecha segue roteirizada e não muda dano, defesa, morte ou recompensas. Após o impacto, o personagem cambaleia até a abertura em `(0,12)`. A rachadura é seguida pelo recorte do terreno, revelando um poço de 6 u modelado no Blender. Fragmentos caem em tempos ligeiramente diferentes; a câmera aproxima-se do eixo do poço enquanto o personagem desce. O clipe `fall` pertence a uma cópia do modelo atual (`necromancerFalling`); a fonte normal do personagem não é regenerada ou substituída. Chegar à caverna restaura o modelo normal. Pausa congela os tempos da cena; recarga durante ela reinicia o trecho, como antes.

Fontes visuais: `v2/scripts/fall-presentation.mjs`, `blender/scripts/arandu_cave_fall.py` e `blender/scripts/arandu_necromancer_fall.py`. Arquivos produzidos: `arandu_cave_fall.blend/.glb` e `arandu_necromancer_fall.blend/.glb` nas pastas de modelos e exports. O segundo script parte de `blender/models/v2_necromancer.blend`, grava uma cópia e mantém a fonte original. O clipe usa 24 FPS e dura 1,5 s, amostrado pelo tempo da cena. Exportações acionadas pelo MCP em processos separados, preservando a cena aberta.

Os cenários da emboscada e da caverna estão no [editor de mapas](v2-mapas.md). A preparação dos mapas foi extraída para uma fonte comum; entidades, progressão e transições continuam no runtime. Também foi corrigida a inclusão das famílias GLB de adereços na cena de Expedições/mapas: listas de malhas passam a ser adicionadas individualmente, eliminando erros de `Object3D.add` e permitindo exibir tochas e caixotes já existentes.

Verificados: build, suíte completa da v2, check do editor e `prologue-browser-check.cjs` no Edge, incluindo erros de console, modelo/clipe de queda, abertura do chão, descida, lista, recarga, mensageiro e defesa de Jacarandá. O check usa um disparo real, mas encerra os demais encontros com HP injetado; não valida dificuldade. Capturas em `review/v2/arandu-prologue/`, especialmente `collapse-opening.png`, `shaft-descent.png` e `cave-wake.png`. Falta animação exclusiva de aterrissagem; a chegada continua por transição para o diálogo.


A conferência direcionada `node v2/tests/fall-browser-check.cjs` também pausa a sequência em pontos fixos, confere a legenda da descida, fundo claro/qualidade baixa e a restauração do jogador vivo na caverna. Capturas e resultado em `review/v2/arandu-fall/`.


## Descoberta do esconderijo (01/11/2026)

A chegada tem três páginas: recuperação da queda, chamado sem resposta e percepção de tochas e rastros. O personagem não sabe ainda o destino dos companheiros. Ao avançar para a galeria (`y < 13`), uma conversa escrita entre os guardas sugere um passageiro procurado vivo, sem revelar o nome. A carga roubada pode ser examinada opcionalmente. Derrotar os guardas libera as ordens na mesa: três páginas identificam João, a rota e a exigência de entregá-lo vivo; a assinatura está arrancada. A saída exige essa leitura e apresenta uma última fala antes do caminho do mensageiro.

Objetivos e título acompanham a descoberta. `caveHeard` persiste ao concluir a conversa dos guardas; ausente assume verdadeiro quando `clue` ou `caveCleared` já estavam gravados, evitando repetir a descoberta em saves avançados. Não há nova chave nem versão de save.

O cenário recebeu chão úmido, trilhas de passagem e marcas de arrasto, carga, leitos, escoramentos, formações rochosas e mesa com papel, adaga e vela. Peças físicas vêm de `blender/scripts/arandu_cave_hideout.py`; piso e luzes ficam em `v2/scripts/cave-hideout.mjs`. Os guardas foram deslocados para o depósito e começam sem alerta, usando a percepção por proximidade já existente. Isso muda a aproximação do encontro, sem alterar estatísticas, quantidade ou recompensas. Os IDs dos objetos anteriores foram preservados; peças novas foram acrescentadas ao final da lista comum ao editor.

Verificados: exportação GLB pelo MCP em processo separado, build, suíte da v2 e `node v2/tests/cave-hideout-browser-check.cjs` no Edge. O check cobre chegada, conversa, carga, ordens, 390 px, retomada, saída e cenário com horda/fundo claro/qualidade baixa, sem erros de página ou buscas externas. Evidências em `review/v2/arandu-cave-story/`. O encerramento do combate usa HP injetado; dificuldade continua sem validação por partida completa.


## Jacarandá preservada após a defesa

Quando `campaign.prologue.stage` é `done`, `launchWorld` compõe o mundo contínuo com a mesma planta de `villageArena()` usada na defesa, deslocada para `WORLD_POINTS.village`. Casas, praça, ruas, poço, feira e decoração usam o kit da vila intacta. Os colisores do antigo assentamento são substituídos pelos da planta completa; NPCs, acessos, missões e coordenadas dos arredores são preservados. A composição é refeita ao carregar ou retornar, inclusive em saves que já concluíram o prólogo. Não há novo campo persistido nem repetição de recompensa. Campanhas do fluxo anterior sem esse prólogo mantêm seu cenário.

Fontes: `withIntactVillage` em `campaign-world-map.mjs`, seleção em `campaign-world.mjs` e composição visual em `expedition-scene.mjs`. Testes de prólogo cobrem retomada, casas completas, pontos livres e caminhos às missões; testes do mundo anterior preservam sua planta.

Conferência da transição executada com `node v2/tests/prologue-browser-check.cjs` no Edge: defesa, reencontro e entrada na vila intacta, sem erros de página ou requisições externas. Captura em `review/v2/arandu-prologue/jacaranda-hub.png`. Encontros encerrados com HP injetado, sem avaliação de dificuldade.

As conversas do prólogo usam o mesmo balão da carroça nas etapas seguintes. O texto aparece a 35 caracteres por segundo, com som discreto respeitando as opções de áudio. G ou Continuar completa a fala em andamento; a próxima ação avança. Narrações sem personagem presente usam o jogador como referência.

A caverna ampliada tem entrada em (0,165), três salões de lobos/aranhas, vozes na passagem em y < 85, três salões de bandidos e o depósito final com capitão humano (vida triplicada). As ordens e a saída mantêm suas posições; investigar exige vencer todos os inimigos. Saves antigos preservam pistas e limpeza da caverna.

As nove salas têm portas alternadas entre esquerda e direita. As salas 3, 5 e 7 se alargam em nichos opcionais com carga investigável. A caverna tem continuação rochosa além dos limites jogáveis, sobre o horizonte de piso.

A disposição das nove salas agora segue leste, sul e oeste, com uma ligação alternativa entre a terceira galeria de animais e a primeira sala humana. Túneis e salas compartilham um contorno único, sem paredes sobrepostas nas junções. Carga opcional permanece nas salas 3, 5 e 7; ordens e saída mantêm suas posições.
