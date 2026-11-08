# V2 — Várzea de Itaúna (protótipo de área ligada)

Primeira área além do mundo de Jacarandá, feita para testar mapas longos como **regiões encadeadas**: cada região continua dentro dos limites do editor, e interiores são mapas próprios. Fontes: [`itauna-model.mjs`](../v2/scripts/itauna-model.mjs) (regras e pontos), [`itauna-map.mjs`](../v2/scripts/itauna-map.mjs) (plantas), [`campaign-world.mjs`](../v2/scripts/campaign-world.mjs) (viagem, grupos e grade) e [`area-scene.mjs`](../v2/scripts/area-scene.mjs) (anéis e grade em 3D). Modelos: [`blender/scripts/v2_fort_kit.py`](../blender/scripts/v2_fort_kit.py).

## Como chegar

A estrada sai da rota do cemitério, em (90, 74), e segue para leste até o arco em (167, 96), na borda do mundo. Um anel verde-água no chão marca a passagem: pisar nele escurece a tela e leva ao outro mapa. O mapa de Jacarandá (M) mostra a estrada. Não há exigência de etapa da campanha. Nível dos inimigos: várzea 20 a 22, gruta 30 a 32, forte 40 a 42; cada grupo tem o dobro de integrantes e o triplo de ondas, e os grupos que não são de missão renascem em 90 s (ver [campanha](v2-campanha.md)).

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
- Os demais grupos ficam derrotados enquanto o jogador troca de mapa e renascem 90 s depois de vencidos, com o jogador longe; ao voltar à vila, todos rearmam.
- **Teleporte à vila:** botão no painel; desligado com inimigo em combate a menos de 16 u.
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

## O rastro de João

Missão que liga Jacarandá, a várzea, a gruta e o forte, fechando o gancho do prólogo (João levado durante o ataque a Jacarandá). Fontes: [`nilo-model.mjs`](../v2/scripts/nilo-model.mjs) (etapas, pontos, grupos e prêmios) e [`nilo-quest.mjs`](../v2/scripts/nilo-quest.mjs) (quem aparece em cada lugar, falas e ações); a integração fica em `campaign-world.mjs`, e os objetivos em `campaign-world-model.mjs` e `itauna-model.mjs`.

| Etapa | Onde | O que fazer | Prêmio |
| --- | --- | --- | --- |
| `locked` | Jacarandá, praça (56, 62) | Marta aparece depois do prólogo. Só oferece a busca com a forja acesa e a madeira entregue; antes disso, o objetivo diz o que falta | — |
| `road` | Várzea, acampamento | Vencer o bando do centro (`camp-inner`) e examinar o livro de contas em (78, −30). O livro diz que João tentou fugir no vau e foi levado à gruta | — |
| `cave` | Gruta, câmara da Mãe-Tecelã | Derrotar a Mãe-Tecelã (`cave-queen`) e cortar o casulo em (−44, −66). João volta sozinho para a vila e fala do contrato | 150 ouro, 350 XP |
| `fort` | Forte, diante da torre | Tomar o pátio externo, derrotar o capitão (`fort-captain`) e examinar a mesa em (0, −34). O contrato leva metade de um selo com parte de uma torre; o nome foi raspado | 200 ouro, 500 XP |
| `return` | Jacarandá, praça (52, 64) | Entregar o contrato a João | 250 ouro, 700 XP |

- O bando do acampamento continua renascendo como os demais grupos da várzea: o livro exige vencê-lo **na saída atual**. Mãe-Tecelã e capitão são permanentes; quem já os derrotou antes da missão só precisa interagir.
- Quem chega à gruta antes de ler o livro também pode libertar João; o livro deixa de aparecer depois disso.
- Fora da etapa certa, as falas só orientam. Cada prêmio é pago uma vez, porque a ação só vale a partir da etapa esperada.
- Na área, o objetivo da missão vem antes dos de exploração e guia a bússola; no mundo, ele passa à frente quando a missão está em curso ou pronta para começar. Os pontos aparecem como marcadores dourados e estão nos **Mapas da campanha**; o editor não deixa remover `camp-inner`.
- Marta usa o modelo `npcLysa` e João o `npcBram`, como no prólogo; Joaquim usa o mesmo modelo de João.
- A identidade de João e o dono do selo continuam em aberto: o encerramento só diz que ele reconhece a torre.
- Save: `campaign.world.nilo`, ausente enquanto `locked` (ver [saves](v2-saves.md)).

Teste: `node --test v2/tests/nilo-quest.test.mjs` cobre o save, pontos livres e alcançáveis, a condição da oferta, o percurso completo com prêmios únicos e o atalho pela gruta. Os encontros são encerrados com dano injetado: não comprova dificuldade. A missão leva de Jacarandá (inimigos de nível 10) direto às áreas de nível 20 a 42; essa curva não foi revista para ela.

## Limites do protótipo

- Fora de O rastro de João, a área só tem objetivos de exploração e o saque normal dos inimigos. Forte e gruta não abrem quests de Joaquim.
- O equilíbrio não foi testado em partida real: níveis e composição são valores iniciais.
- A fachada do forte na várzea é cenário; o pátio de dentro é maior que a muralha vista de fora.
- O mapa da área (M) fica parcialmente sob a barra inferior em 1440 × 900.
- Em 390 px, o painel de objetivos corta o botão do mapa quando os dois objetivos estão ativos; M continua funcionando no teclado.
- Lobos contrastam pouco com o piso da gruta; as barras de vida ajudam na leitura.
