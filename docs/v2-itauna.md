# V2 — Várzea de Itaúna (protótipo de área ligada)

Primeira área além do mundo de Jacarandá, feita para testar mapas longos como **regiões encadeadas**: cada região continua dentro dos limites do editor, e interiores são mapas próprios. Fontes: [`itauna-model.mjs`](../v2/scripts/itauna-model.mjs) (regras e pontos), [`itauna-map.mjs`](../v2/scripts/itauna-map.mjs) (plantas), [`campaign-world.mjs`](../v2/scripts/campaign-world.mjs) (viagem, grupos e grade) e [`area-scene.mjs`](../v2/scripts/area-scene.mjs) (anéis e grade em 3D). Modelos: [`blender/scripts/v2_fort_kit.py`](../blender/scripts/v2_fort_kit.py).

## Elenco visual

João usa um GLB low poly próprio, com capa escura articulada, capuz aberto,
barba, bolsa e fecho dourado. O mesmo modelo acompanha a caravana, o resgate,
o retorno a Jacarandá e a recepção em Itavera. Marta, Helena, o guarda da
caravana, Tomás e Joaquim também têm modelos próprios, sem reutilizar a criança
para Helena nem o ferreiro para João. A mudança é visual: IDs históricos,
falas, missões, colisões, recompensas e saves são preservados.

O acabamento low poly usa rostos em planos, mangas volumosas, mãos com polegar,
botas arredondadas e roupas em camadas; a capa tem pregas largas e o capuz tem
borda dobrada. Os acessórios diferenciam lenço e tranças de Marta, livro e
medalhão de Helena, elmo e escudo do guarda, boina de Tomás e insígnia de Joaquim.

Fontes e reprodução em [blender/README.md](../blender/README.md#npcs-low-poly-da-campanha).
Os seis estão disponíveis na categoria Moradores do Laboratório.

Na praça de Jacarandá e na vila do fluxo anterior, os moradores ficam virados
para a câmera isométrica (45°), mostrando o rosto na visão do jogador.

## Como chegar

A estrada sai da rota do cemitério, em (90, 74), e segue para leste até o arco em (167, 96), na borda do mundo. Um anel verde-água no chão marca a passagem: pisar nele escurece a tela e leva ao outro mapa. O mapa de Jacarandá (M) mostra a estrada. Não há exigência de etapa da campanha. Nível dos inimigos: várzea 7 a 9, gruta 9 a 11, forte 11 a 13. Os grupos têm uma leva pequena, com um único reforço em poucos pontos, sem reaparecimento contínuo por tempo (ver [campanha](v2-campanha.md)).

## Passagens

| Anel | Em | Leva a | Chegada |
| --- | --- | --- | --- |
| Várzea de Itaúna | Mundo, (174, 96) | Várzea | (-168, 22) |
| Estrada de Jacarandá | Várzea, (-176, 22) | Mundo | (166, 95) |
| Forte da Pedra Negra | Várzea, (105, -77,5) | Forte | (0, 61) |
| Gruta das Tecelãs | Várzea, (147, 91) | Gruta | (60, 66) |
| Saída do forte | Forte, (0, 69) | Várzea | (105, -68) |
| Saída da gruta | Gruta, (66, 75) | Várzea | (152, 96) |

- Chegadas ficam fora dos anéis, e a passagem só volta a valer depois de sair do anel de chegada.
- A horda acompanha o jogador, pelo mesmo caminho das demais trocas de cena (`clean`).
- Com o jogador a até 14 u, o painel avisa: “Caminho à frente”.

## Várzea de Itaúna (360 × 360)

- **Rio Turvo:** nasce nas montanhas do norte e deságua no lago maior; um segundo trecho sai do lago para sudeste e continua além do mapa. O leito é fundo e bloqueia a passagem.
- **Travessias:** a ponte de pedra em (10, -4) não atrasa. O vau em (7, 48) é água rasa, com −40% de velocidade e correnteza; arqueiros guardam a margem leste, então atravessar é uma decisão de risco.
- **Lagos:** o lago maior, ao sul, tem rasos em volta e centro bloqueado; um píer leva à **Ilhota do Obelisco**, com um grupo raro opcional. A Lagoa do Espelho fica a noroeste, com píer e ruínas.
- **Relevo:** montanhas em penhasco ao norte e a leste limitam o mapa. O platô do forte só é acessível pela rampa marcada com pilhas de pedra. O Morro das Tecelãs abriga a gruta na face sudeste. Atalaia velha e Santuário partido são morros suaves com bônus de terreno alto.
- **Lugares:** Acampamento dos saqueadores, Palafitas da margem, foz lamacenta (−30% de velocidade).
- **Dois caminhos até a gruta:** pelo vau, ao sul do morro, ou pela estrada leste, depois do acampamento.

## Forte da Pedra Negra (176 × 156)

Só inimigos humanos: Guerreiro, Arqueiro, Mago Vivo, Ladrão e Ladino Arqueiro. Bruto e Acólito continuam fora, como nos demais modos.

- **Pátio externo:** portão, barracas a oeste e campo de treino a leste. Muretas de pedra servem de cobertura.
- **Grade interna:** colisor real em (0, 6). Sobe quando os grupos `fort-gate`, `fort-west` e `fort-east` caem, e o painel e o aviso dizem isso. Não há outro caminho até o pátio interno.
- **Pátio interno:** terreno mais alto, armaria a leste, capela a oeste, colunata até a torre de menagem. O **Capitão da Pedra Negra** (raro) espera diante da torre.

## Gruta das Tecelãs (190 × 176)

Só lobos e aranhas. O lobo é o tipo 4 (Cão de Cripta): muda só o nome, nesta área; regras, modelo e índice são os mesmos.

- **Galerias:** Covil dos lobos com lama e ossos; salão da bifurcação com as primeiras teias; Berçário cheio de casulos; lago subterrâneo com formações; câmara da **Mãe-Tecelã** (rara) a noroeste.
- As galerias formam laços: há mais de um caminho até a câmara.
- Teias, casulos e ossos são só cenário. As teias que prendem continuam sendo as lançadas pelas aranhas.

## Grupos e save

- Campos de `save.campaign.world`, com padrão ausente nos saves anteriores: `area` (última área) e `entry` (última chegada). Ver [saves](v2-saves.md).
- `cleared` aceita também os grupos permanentes da área: os seis do forte, `cave-queen` e `islet-guard`.
- Os demais grupos ficam derrotados enquanto o jogador explora e troca de mapa; não renascem pelo relógio. Ao voltar à vila, os pontos comuns rearmam para a próxima saída.
- **Portal para a vila:** após concluir a missão do ferreiro, fale com Joaquim na praça para receber o **Selo de Jacarandá**. O botão **Abrir portal para a vila** leva à praça e mantém um vínculo com a posição de origem, inclusive na várzea, gruta, forte e Itavera. Use **G** junto ao portal para voltar ao ponto de origem ou visitar a vila novamente. Inimigos em combate a menos de 16 u impedem abrir/usar a ponta de fora da vila.
- **Morte:** retoma na entrada do mapa em que o jogador estava. **Retomar no abrigo**, no Relicário, volta a Jacarandá e esquece a área.

## Editar

As três plantas aparecem em **Mapas da campanha**. **Testar** usa as mesmas passagens e a mesma grade do jogo, sem gravar no save da campanha: dá para percorrer várzea, forte, gruta e mundo a partir de qualquer um deles. Na viagem, cada mapa abre com a edição guardada mais recente; os grupos renascem a cada troca e não há diálogos nem a vila intacta. Grupos permanentes não podem ser removidos, e a verificação do editor avisa se um ponto da história perder o caminho a pé. As peças novas ficam nos grupos **Forte** e **Caverna**. A portaria não tem colisão própria: duas muralhas curtas escondidas nas torres fecham tudo menos o vão, então copie as duas ao mover uma portaria.

A estrada do mundo fica fora de `WORLD_ROUTES` e é acrescentada depois da numeração das peças: assim as edições já publicadas do mundo continuam apontando para os mesmos objetos.

## Borda infinita

O horizonte do chão pintado passou a ser uma moldura em volta do mapa, na cota da borda, em vez de um plano inteiro abaixo do ponto mais fundo. O fundo dos lagos não rebaixa mais o que fica além do mapa, e o chão dentro do mapa deixa de ser pintado duas vezes. Vale para todos os mapas com chão pintado.

## Verificação

Na raiz:

```powershell
node --test v2/tests/itauna.test.mjs
node v2/tests/itauna-browser-check.cjs
```

Medido no Edge, com WebGL em Intel Iris Xe, a 1440 × 900 e sem combate intenso (evidências e números em [`review/v2/itauna/`](../review/v2/itauna/)):

- Passagens de 1,4 a 3,5 s, do pedido até a tela clarear; a mais lenta é a primeira entrada na várzea.
- Várzea: 93 a 144 chamadas de desenho e 239 mil a 457 mil triângulos, conforme o lugar.
- Forte: 71 a 105 chamadas e 252 mil a 447 mil triângulos. Gruta: 26 a 37 chamadas e 79 mil a 104 mil triângulos.

## O rastro de João e a carta (10/11/2026)

A missão agora liga o sequestro do prólogo à denúncia dos desvios que alimentam a guerra no Vale de Itajuba. João é emissário da coroa, de família nobre, e viaja à paisana. Sua casa e seu reino não são identificados. A carta contém um depoimento assinado destinado a **Helena**, representante do Conselho das Guildas responsável pela segurança das rotas de Itavera. Os bandidos querem o documento intacto e João vivo para descobrir quem mais conhece a denúncia.

Fontes: [etapas e pontos](../v2/scripts/nilo-model.mjs), [diálogos e ações](../v2/scripts/nilo-quest.mjs), [integração](../v2/scripts/campaign-world.mjs) e [praça de Itavera](../v2/scripts/itavera-map.mjs).

| Etapa salva | Percurso e condição | Prêmio exclusivo |
| --- | --- | --- |
| `locked` | Durante a ajuda emergencial à vila, Marta confirma a pista com Tomás e viajantes. A busca abre depois da forja e da madeira | — |
| `road` | Vencer o bando central do acampamento e ler o livro: a carga roubada foi ao forte; João escapou junto ao vau e entrou na gruta | — |
| `cave` | Vencer a Mãe-Tecelã e libertar João. Ele explica que as aranhas o capturaram durante a fuga e revela a carta escondida no forro da bolsa, colocada na carroça antes do sequestro | 150 ouro, 350 XP |
| `rescued` | Resgate concluído. Voltar a Jacarandá e falar com João, marcado com **!**, para aceitar A carta da Pedra Negra. A missão da carta só entra no HUD e no diário após a aceitação | — |
| `fort` | Vencer o capitão, recuperar a bolsa no depósito leste e guardar o contrato e as ordens na mesa diante da torre. As duas interações podem ocorrer em qualquer ordem | Contrato: 200 ouro, 500 XP; bolsa sem prêmio extra |
| `return` | Entregar a bolsa e as provas a João na praça de Jacarandá. Ele confere a carta, admite o risco omitido e assume ajuda à vila | 250 ouro, 700 XP |
| `done` | Retorno local já premiado. João oferece o cerco do Passo do Cedro; após vencê-lo e entregar a missão, permite viajar para Itavera | — |
| `itavera` | Entregar a denúncia e as provas a Helena na praça das guildas | — |
| `invitation` | João reconhece as ações do protagonista e oferece trabalho remunerado no Vale de Itajuba | — |
| `complete` | Convite aceito e Ato I concluído. Ativa o marcador `act1` da horda, como a conclusão do fluxo antigo. Ato II ainda indisponível | Sem novo pagamento |

A bolsa fica em (44, −28), no depósito do forte, e as provas em (0, −34). Marcadores estão no editor; a verificação protege o acesso a ambos. O bando do acampamento precisa ser vencido na saída atual; capitão e Mãe-Tecelã permanecem derrotados. É possível resgatar João sem ler primeiro o livro.

A carta é diferente das ordens de captura e do contrato dos bandidos. A derrota do capitão encerra a operação local e impede a incursão que ele preparava contra Jacarandá; obter um documento não elimina os mandantes da perseguição. O contrato conserva o selo parcial de uma torre, sem identificar o financiador nem atribuir toda a culpa a Eduardo ou Mariana.

### Itavera

A viagem por conversa usa a mesma passagem escura das áreas. A cidade está representada por uma **praça de recepção**, não por uma cidade inteira: casas intactas do kit GLB da vila, muralhas do kit do forte, comércio e cenário urbano além dos limites. Não há encontros de combate. A planta aparece no editor em **Itavera · praça das guildas**; Helena, João, Marta, chegada e retorno são pontos protegidos.

Helena fica em (0, −12), João em (−5, −6) e Marta em (6, 9). Os três reutilizam modelos GLB existentes. A entrega a Helena vem antes do convite. Fechar uma conversa não aceita sua ação; o convite pode ficar pendente. O anel ao sul e o teleporte permitem voltar a Jacarandá; João permite retornar a Itavera, inclusive depois do final. Ninguém é enviado para uma área inexistente do Ato II.

### Saves e verificação

`campaign.world.nilo` preserva os valores antigos e acrescenta `rescued`, `itavera`, `invitation` e `complete`. A etapa `rescued` separa o resgate concluído da aceitação da missão da carta; saves já em `fort` preservam a missão ativa. `niloLetter` e `niloEvidence` guardam a coleta parcial no forte. Saves antigos em `return` ou `done` recebem ambas as coletas como concluídas, sem refazer o forte ou pagar recompensas novamente. Saves em `done` recebem a oferta de [Romper o Cerco](v2-campanha.md#passo-do-cedro--romper-o-cerco-13112026) antes do epílogo. Saves que já chegaram a Itavera mantêm sua progressão. A área `itavera` só é restaurada a partir das etapas do epílogo. Não houve mudança de chave nem versão do save.

Executados: build autocontido, testes de campanha, mapas, jornadas e saves, e percurso no Edge com armazenamento isolado. O percurso cobre reparos, acampamento, resgate, as duas coletas do forte com recarga entre elas, entrega a Helena, nova recarga, convite, retorno e revisita, sem erros de página ou requisições externas. Conferidos 390 px e bordas em zoom máximo, horda, fundos claro/escuro e qualidade baixa. [Evidências e limites](../review/v2/act-one-letter/validation-notes.md). O teste de regras é `node --test v2/tests/nilo-quest.test.mjs`; o percurso de navegador é `node v2/tests/act-one-letter-browser-check.cjs`. Encerramentos de encontros usam dano injetado e não comprovam dificuldade. A revisão de ritmo de 11/11 ajusta níveis, grupos e ondas; os prêmios exclusivos das missões foram preservados.

## Limites do protótipo

- Fora de O rastro de João e seu epílogo em Itavera, a área só tem objetivos de exploração e o saque normal dos inimigos. Forte e gruta não abrem quests de Joaquim.
- A revisão tem amostras de combate no motor real; ainda falta avaliação por partida completa com as seis classes.
- A fachada do forte na várzea é cenário; o pátio de dentro é maior que a muralha vista de fora.
- O mapa da área (M) fica parcialmente sob a barra inferior em 1440 × 900.
- Em 390 px, o painel de objetivos corta o botão do mapa quando os dois objetivos estão ativos; M continua funcionando no teclado.
- Lobos contrastam pouco com o piso da gruta; as barras de vida ajudam na leitura.


## Ritmo dos encontros (11/11/2026)

As patrulhas novas encurtam os intervalos entre combates nas rotas da várzea e nas passagens da gruta. A campanha não dobra mais o tamanho dos grupos nem triplica suas ondas. Só `camp-gate`, `fork-spiders`, `lake-wolves` e `fort-west` têm uma segunda leva, após 9 s. Capitão e Mãe-Tecelã aparecem uma só vez em seus encontros.

O capitão fica com três integrantes no grupo; líderes comuns podem ter até quatro, e os demais pontos até três. Ao explorar, um grupo vencido continua vencido. O retorno a Jacarandá rearma os pontos comuns para a próxima saída, preservando os encontros permanentes e o progresso das missões. Os mesmos limites valem no Testar dos mapas da campanha; mapas pessoais mantêm suas configurações.

Veja [regras da campanha](v2-campanha.md#revisão-de-ritmo-e-bruno-11112026) e [evidências](../review/v2/campaign-pacing/validation-notes.md).

### Combate ampliado na gruta (13/11/2026)

A Gruta das Tecelãs usa levas de quatro integrantes comuns e até seis nos grupos com líder. Há cinco patrulhas adicionais entre entrada, bifurcação, covil, galeria oeste, berçário e flanco da rainha. Galeria, bifurcação, berçário A, lobos do lago e ligação oeste recebem uma segunda leva após 9 s. Os grupos não renascem pelo tempo; continuam usando o dano, XP, loot e memória de limpeza normais. A Mãe-Tecelã segue com conclusão única. Níveis e atributos individuais permanecem iguais. Essa revisão vale também no Testar dos mapas da campanha, sem multiplicar encontros nas demais áreas.

O simulador matemático de balanceamento não representa as rotas, aproximação e posicionamento desses grupos; a densidade precisa de avaliação de dificuldade em uma partida completa.

### Combate ampliado no forte (13/11/2026)

O Forte da Pedra Negra tem 20 grupos e 212 inimigos contando reforços, após a revisão do assalto. São oito integrantes por grupo comum e dez na guarda do capitão. Oito encontros adicionais ocupam o corredor central, ligações dos pátios e a aproximação à torre. Guarda da entrada, barracas do oeste, treino do leste, duas posições internas e capitão recebem uma segunda leva após 4,5 s. Os reforços entram por outra posição, já em combate; o capitão raro aparece apenas na primeira leva. Os grupos são ativados a até 20 u e avançam assim que aparecem.

A grade continua exigindo somente `fort-gate`, `fort-west` e `fort-east`, incluindo seus reforços. Os seis grupos de missão existentes continuam permanentemente vencidos após a conclusão; as patrulhas novas usam a limpeza por saída e rearmam ao voltar à vila. Níveis 11–13, atributos individuais, loot e recompensas de missão são preservados. A regra vale no jogo e no Testar dos mapas de campanha. Falta avaliar a dificuldade em partida completa: o simulador matemático não representa o posicionamento dessas patrulhas.


### Selo de Jacarandá e portal de retorno

Joaquim oferece o selo depois que Bruno reacende a forja (`smith: done`), antes de oferecer a madeira na próxima conversa. Fechar a conversa não recebe o selo. A entrega é única e aparece no diário; saves antigos com a forja concluída podem recebê-lo sem repetir a missão.

Só existe um vínculo por vez: abrir outro portal substitui o anterior. O portal da praça fica em (60, 74), com chegada em (60, 78); a outra ponta fica na posição em que o jogador o abriu. Os grupos totalmente derrotados nesta saída continuam vencidos nas viagens pelo portal. Encontros ainda não concluídos são reconstruídos pelas regras normais de entrada no mapa; não se preservam vida parcial dos inimigos, projéteis ou efeitos de combate. A passagem usa a limpeza e recuperação normal de troca de cena.

O vínculo dura durante a sessão e termina ao retomar após morte, mudar de mapa por uma passagem comum ou entrar em outro modo. Recarregar o jogo fecha o portal, mas conserva o selo e o progresso permanente. O retorno à vila a pé mantém sua regra anterior de repovoar os arredores.

Verificação específica: `node --test v2/tests/town-portal.test.mjs` e `node v2/tests/town-portal-browser-check.cjs` (Playwright com Edge por padrão; use `$env:BROWSER_CHANNEL='chrome'` para Chrome; armazenamento isolado; evidências em `review/v2/town-portal/`).

Validação desta entrega: build autocontido, testes de portal/campanha/diário/saves/distribuição e conferência do portal no Chrome, sem erros de página ou requisições externas. A conferência usa cenários controlados; não substitui uma partida completa da campanha.


### Orientação do assalto à Pedra Negra (13/11/2026)

A bússola aponta para a próxima posição não conquistada, na ordem guarda da entrada → barracas do oeste → campo de treino do leste. O HUD mostra quantas das três posições foram tomadas; a grade abre automaticamente depois de todas as levas desses três grupos. Marcadores de espadas cruzadas nomeiam as posições no cenário e desaparecem quando forem tomadas. G junto às posições ou à grade explica o avanço; não é necessário encontrar uma chave.

Após a grade, o objetivo passa ao capitão e seus reforços. Depois, guia para o contrato na mesa diante da torre e a bolsa no depósito leste. Ambos continuam com ! e coleta por G, em qualquer ordem. O diário lista individualmente as três posições, a guarda do capitão e as duas coletas. A instrução principal do assalto não é truncada no HUD; há contagem dos inimigos em combate e aviso do próximo contra-ataque. A nova distribuição mantém os marcos, colisões, IDs e conclusões existentes.

Verificação: `node --test v2/tests/assault-pacing.test.mjs v2/tests/itauna.test.mjs v2/tests/nilo-quest.test.mjs` e `node v2/tests/assault-pacing-browser-check.cjs` (Chrome/Playwright, armazenamento isolado). Evidências e limites em [assault-pacing](../review/v2/assault-pacing/validation-notes.md).


### Mãe-Tecelã gigante antes do resgate (13/11/2026)

O líder do grupo persistente `cave-queen` é um chefe próprio da v2, usando o GLB animado da aranha em escala 2,6, tinta violeta, raio de colisão de 1,15 u e barra de vida própria. A vida recebe multiplicador 8 sobre a aranha rara do grupo; dano, 1,45; velocidade, 1,35. O preparo é idempotente e não modifica as aranhas comuns. A identificação `isBoss` aplica as resistências de controle já usadas pelos chefes. Não houve mudança de índice de inimigo, modelo GLB, ID do encontro ou formato de save.

| Ataque | Preparação e resposta |
| --- | --- |
| Mordida em setor | Setor frontal de 5 u, preparação de 0,85 s e impacto único de 1,8× o dano básico. Saia do setor ou use Dash. |
| Veneno do ninho | Círculos travados perto do jogador, raio de 2,5 u, preparação de 1,15 s. As poças duram 5 s, causando 0,5× o dano básico por segundo. Saia dos círculos e reposicione o grupo. |
| Leque de teias | Linhas preparadas por 1,15 s e projéteis de alcance 14 u. Usam a teia comum: colisão com obstáculos/Muralha e imobilização de 2 s após atingir; Dash protege do acerto. |
| Eclosão | Abaixo de 66% e 33% de vida, prepara por 1,4 s e chama respectivamente três e cinco filhotes. São as únicas duas eclosões; os filhotes não dão XP nem loot. |

Abaixo de 50% de vida, a rainha fica mais rápida, reduz o intervalo entre ações e aumenta de três para cinco as áreas de veneno e os projéteis do leque. As áreas são travadas no início da preparação, mantendo espaço e tempo para evitar o dano. Áreas e teias da rainha desaparecem quando ela morre; filhotes e a guarda sobreviventes ainda precisam ser derrotados.

O casulo só libera João depois de concluir `cave-queen` — rainha, guarda e filhotes daquele encontro. Saves que já registraram a vitória continuam válidos e não precisam repetir o chefe. Morte do jogador e troca de cena usam a limpeza e retomada normais, sem serializar vida parcial, veneno, teias ou eclosões.

Fontes: `v2/scripts/cave-queen.mjs`, `campaign-world.mjs`, `enemies.mjs` e `game-ui.mjs`. Verificação e limitações: [campaign-bosses](../review/v2/campaign-bosses/validation-notes.md).
