# V2 — campanha, vila e missões (E9)

> **Atualização ARANDU (31/10/2026):** campanhas novas começam na caravana, passam pela caverna e chegam à defesa de Jacarandá. Veja [abertura e contrato atual](v2-prologo-arandu.md). Saves já iniciados sem `campaign.prologue` preservam o fluxo anterior descrito abaixo. No mundo contínuo, Eldrin passa a ser apresentada como Jacarandá. Os trechos por fases abaixo são referência de compatibilidade, não a abertura padrão.


A V2 oferece **Campanha · Ato I** na tela inicial. Um save novo começa no mapa,
com quatro fases sequenciais. **Continuar** restaura o progresso e abre o mapa ou
a Vila de Eldrin em uma cena limpa; nenhuma luta ou entidade é restaurada.
O botão da campanha usa o personagem atual, preservando itens, nível e pontos.
O treino continua acessível separadamente pelo menu.

## Fontes e distribuição

- `v2/tools/campaign-source.cjs` lê `CAMP_STAGES`, salas, corredores, portas,
  emboscadas, Capitão, missões, falas, histórias e instruções de `v1/necromancer-canvas.html`.
- `v2/scripts/campaign-rules.mjs` é gerado pelo build; contém também os cálculos
  vigentes de `stageMul` e quantidade de inimigos por onda. Não editar diretamente.
- `campaign-model.mjs` normaliza o progresso e determina desbloqueio/prêmios únicos.
- `campaign.mjs` administra encontros, filas de spawn, portas, vila e retornos,
  usando dano, inimigos, horda, equipamentos, XP e saves já existentes.
- `campaign-panel.mjs` apresenta mapa, histórias, tutoriais e diálogos.
- `campaign-atlas.mjs` desenha o **Mapa da Campanha** (aberto pelo quadro da vila) como atlas em pergaminho, no estilo da carta de Valdoria: terra e mar, quatro marcos ligados por estradas, castelo de Valdoria, Vila de Eldrin (após o Ato I) e anel dourado na próxima fase. Clique no marco ou use os botões de fase para ver a prévia; **Entrar/Revisitar** inicia a fase. Só visual: regras de liberação e recompensa continuam em `campaign-model.mjs`.

Execute `node v2/tools/build.cjs` na raiz para atualizar o HTML autocontido e os
hashes de proveniência. Os modelos de NPC já existentes foram incorporados;
esta entrega não altera as cenas Blender nem os assets de outros trabalhos.

## Ato I

| Fase | Fluxo | Liberação ao entrar | Primeiro prêmio de conclusão |
| --- | --- | --- | --- |
| 1 — A Cripta Esquecida | Três alvos de treino, quatro salas, corredores e portas seladas; limpar as ondas abre as portas | Tiro de Osso | 30 ouro, 140 XP |
| 2 — Floresta de Eldrin | Seis ondas; não há chefe nessa fase | Invocação de Mortos; grupo de Zumbis no slot 3 | 60 ouro, 220 XP |
| 3 — Trilha dos Vigias | Quatro emboscadas; bloqueios impedem atravessar o encontro; alcançar o final conclui | Muralha de Corpos no slot 2 | 90 ouro, 320 XP |
| 4 — Posto do Capitão | Rei Caído, com os atributos vigentes do Capitão e seus golpes reais | Escudo de Carne no slot 4 | 150 ouro, 520 XP |

As liberações acontecem na entrada, como na fonte, e não gastam pontos da árvore.
Os investimentos existentes são preservados; slots ainda bloqueados pela campanha
ficam vazios. A horda e o jogador começam cada nova fase recuperados. A conclusão
libera a próxima fase; concluir a quarta libera a vila e o indicador `act1` da árvore.
Revisitar mantém XP/loot dos abates, mas não repete o ouro e XP exclusivos da fase.
Os campos antigos `rew.souls` e `rew.sp` não são concedidos: a rotina vigente de
conclusão só entrega ouro e XP, e os pontos vêm da progressão compartilhada.

A escala distingue salas/trilhas, arena e missões. Salas/trilhas usam `stageMul`,
ondas da floresta usam a vida de spawn por wave, e missões laterais preservam a
escala por nível e dificuldade. O nível do equipamento é o da fase ou da dificuldade
da missão, conforme `gearCurrentWave`, separado do seletor do laboratório.
O Rei usa a vida atual do Capitão, sem substituí-la por um valor de treino. Seus
Guerreiros invocados seguem a escala de spawn do encontro e se desfazem sem prêmio
adicional quando o Rei morre.

## Posto do Capitão (mapa da fase 4)

`v2/scripts/outpost-map.mjs` define a arena 40 × 40 u do chefe e `outpost-scene.mjs` a desenha
(procedural, paleta de outono em `arena.autumn`). Peças de acampamento (tendas, fogueiras,
estandartes, paliçada, torres) vêm de `camp-parts.mjs`, extraído da Trilha dos Vigias.

- **Obstáculos (23):** quatro tendas, duas fogueiras, quatro braseiros, caixotes, estantes de armas,
  uma carroça, feno e barris. Todos ficam a ≥ 9 u do ponto de nascimento do Rei Caído `(0,-12)` e
  a ≥ 6 u da chegada `(0,10)`; o centro fica livre para corte, salto e investida. Há rota a pé até
  o chefe e os quatro cantos (testes).
- **Cenário:** plataforma circular de pedra com anel de runas sob o chefe, terra pisada com palha,
  paliçada ao redor (alta ao norte/oeste, baixa ao sul/leste para não esconder a arena), portão
  fechado ao norte, cinco torres de vigia e mata de fundo só ao norte e a oeste.

O chefe, seus golpes, reforços, atributos, recompensas (Escudo de Carne) e a conclusão não mudaram.
Os obstáculos dão cobertura nas bordas e **a dificuldade da luta não foi medida**.

## Trilha dos Vigias (mapa da fase 3)

`v2/scripts/trail-map.mjs` define a faixa de 150 × 6,4 u (limites e emboscadas da fonte atual,
inalterados) e `trail-scene.mjs` a desenha com geometria procedural, em paleta de outono
(`arena.autumn` em `forest-scene.mjs`). Só a fase 3 usa o mapa; as trilhas das missões da vila
mantêm a arena simples.

- **Obstáculos (20):** rochas e tocos nas bordas das quatro clareiras, sempre fora da faixa
  central (|y| ≥ 2,3) e dos pontos onde as ondas nascem. Os testes verificam isso e a rota a pé.
- **Barricadas:** as duas travas de cada emboscada têm a mesma colisão (largura 1, vão de 6,4 u),
  agora marcadas com `lock`/`look:'barricade'` e desenhadas como toras com estacas. Corrigido
  um efeito colateral: ao ativar ou concluir uma emboscada, o código antigo substituía **todos**
  os sólidos; agora só as travas entram e saem.
- **Cenário:** trilha de terra, mata alta ao norte (longe da câmera), cerca baixa e mudas ao sul
  (árvores altas ao sul ficam bem afastadas para não esconder a trilha), lanternas, cinco torres de
  vigia e o acampamento do Capitão no fim, com tendas, fogueira, estandartes e paliçada com portão.
  Torres, mata, tendas e paliçada ficam fora do limite caminhável e não colidem.

Dano, vida, ondas, recompensas, liberação da Muralha de Corpos e o encerramento no fim da trilha
não mudaram. Os obstáculos de borda dão pouca cobertura, mas **a dificuldade não foi medida**.

## Cripta Esquecida (mapa da fase 1)

`v2/scripts/crypt-map.mjs` parte de `roomArena()` (salas, corredores e paredes da fonte atual,
inalterados) e `crypt-scene.mjs` desenha o ambiente com geometria procedural.

- **Paredes:** os mesmos blocos de colisão. As voltadas para a câmera (sul e leste) ficam baixas
  para não esconder a sala; norte e oeste ficam altas.
- **Colisores novos (18):** quatro pilares em cada sala de combate (B, C e D) e dois sarcófagos
  junto à parede norte. A sala A, do treino, continua livre. Os pilares ficam fora do campo
  central onde as ondas nascem e os testes verificam que cada sala segue atravessável.
  Isso dá cobertura e rotas indiretas: **muda a dificuldade percebida e não foi balanceado**.
- **Portas:** as três grades agora são desenhadas como portões de ferro (`look:'gate'`), com a mesma
  colisão e a mesma abertura ao limpar a sala; dá para ver o encontro através das barras.
- **Decoração sem colisão:** lajes, tapete cerimonial, tochas (sem luz dinâmica), estandartes e ossos.
- **Luz:** tema com luz fria e escura nos dois fundos. A sombra do sol agora acompanha o jogador
  (em passos de um texel) em todas as cenas; antes ela cobria só ±23 u da origem e sumia na cripta.

## Floresta de Eldrin (mapa da fase 2)

A fase 2 deixou de usar a arena vazia. `v2/scripts/forest-map.mjs` gera um terreno
de 40×40 u, determinístico, com dados de colisão e de decoração separados;
`forest-scene.mjs` desenha tudo com geometria procedural do Three.js (sem GLB novo).

- **Colisores (`arena.solids`):** cerca de 38 troncos de pinheiro/carvalho, rochas, tocos
  e três troncos caídos. Colisão usa o raio do tronco, não o da copa, então a copa pode
  cobrir o personagem sem bloquear o movimento. Projéteis e rotas usam as regras gerais
  de sólidos de `terrain.mjs`; Dash é bloqueado, como nas outras arenas.
- **Áreas livres:** chegada do jogador `(0, 10)`, campo da fila de ondas em torno de
  `(0, -5)` e a alameda entre eles. Entre obstáculos sorteados há pelo menos 1,1 u de folga
  (a Abominação passa). Os testes verificam rota até o campo das ondas e os quatro cantos.
- **Decoração sem colisão (`arena.decor`):** mata fechada além do limite, sebe baixa na
  borda, arbustos, grama, flores, cogumelos, musgo e trilha de terra. O limite caminhável
  continua sendo o retângulo −20…+20.
- **Tema:** o chão e o fundo seguem uma paleta de floresta nos modos escuro e claro
  (`ground()`); a grade de treino fica oculta.
- **Camadas planas:** musgo, trilha, ruas e praça são discos/planos sobrepostos no chão. Eles são
  desenhados sem teste de profundidade, em ordem fixa (`renderOrder` do chão −3, camadas −2/−1),
  porque discos coplanares disputavam a profundidade (z-fighting) e a cor tremia ao mover a câmera.

Não há mudança de dano, vida, ondas, recompensas ou liberações. Os obstáculos acrescentam
cobertura contra projéteis e rotas indiretas para inimigos e aliados; isso pode alterar a
dificuldade percebida da fase 2 e **não foi balanceado nem medido**.

## Vila de Eldrin (mapa)

A vila deixou de ser uma arena vazia. `v2/scripts/village-map.mjs` define o layout
(determinístico, 40×40 u) e `village-scene.mjs` o desenha com o kit modular do Blender
(`villageKit`, veja **Aparência**); árvores, rochas, grama e flores reutilizam `forest-scene.mjs`. As peças do
modelo medieval antigo (`medievalVillage`) saíram da periferia da vila; continuam só no campo de treino.

- **Colisores (46):** onze construções (fileira de casas ao norte, ferraria de Bruno a oeste,
  casa de Lucia a leste, casas laterais ao sul e a estalagem fechando a rua principal),
  duas barracas do mercador, quadro do mapa, pilares do portal, poço no centro da praça,
  postes, barris, caixas, cercas, árvores e pedras. Pisos e ruas são só desenho.
- **Pontos de interação:** portal `(0,-9)`, mapa `(-6,-8)`, mercador `(8,-6)`, Bruno `(-11,1)`,
  Lucia `(11,1)`, Julia `(-6,8)` e Vesper `x 0, y 5,9` ficam livres, ligados por rua e praça,
  dentro do alcance de 3,2 u da tecla G. Os testes conferem rota a pé, a partir da chegada
  `(0,9)`, e que nenhum ator nasce dentro de um sólido.
- **Aparência (fatia vertical do acabamento visual):**
  - **Casas:** montadas por `village-kit.mjs` a partir de cada colisor, com o kit
    `blender/exports/v2_village_kit.glb`. São módulos de enxaimel de 1 u (liso, mão-francesa, janela com
    venezianas e porta), cantos, empenas, telhado de telhas desencontradas com beiral e chaminé. Porta e janelas
    ficam nas faces sul e leste, as que a câmera vê. Reboco e telhado recebem a cor de cada casa.
  - **Outras peças do kit:** postes com lanterna, poço com telhadinho, cerca, barris e caixotes. Barracas,
    quadro e pilares continuam em primitivas.
  - **Chão:** `village-ground.mjs` pinta grama, terra batida com sulcos, ruas de pedra em
    fiadas, praça em anéis concêntricos, terra no pé das construções e sombra de contato numa textura gerada
    ao carregar (2048 px, cerca de 32 px/u), sem bytes extras no HTML. A textura substitui os planos de rua e
    as pedras soltas.
  - **Luz:** postes e janelas projetam poças de luz aditivas no chão, sem luzes dinâmicas.
    Só na vila, o renderizador usa tone mapping ACES (exposição 1,2), um céu em gradiente
    pré-filtrado como reflexo difuso e sol mais quente (`SCENE_LOOK` em `renderer.mjs`). Os demais
    mapas mantêm a luz anterior.
  - **Vegetação:** `nature-kit.mjs` desenha carvalhos, pinheiros, arbustos, tufos de grama, flores e pedras
    com o kit `blender/exports/v2_nature_kit.glb` (`natureKit`), lendo os mesmos dados de `forest-scene.mjs`. A
    folhagem é tingida por instância e balança com o vento (`scenery-fx.mjs`, só desenho; a sombra fica parada).
  - **Oclusão:** o cenário entre a câmera e o jogador abre um círculo pontilhado de 2,6 u ao redor dele. Base de
    muros, cercas e caixotes (abaixo de 0,9 u) continua sólida, e o que está atrás do jogador não é afetado.
    Vale só para o jogador; NPCs, aliados e inimigos atrás de casas continuam ocultos.
  - **Fundo claro:** o chão clareia e as poças enfraquecem.
  - **Sem o GLB:** a cena volta ao visual de primitivas.

Nenhuma regra de missão, oferta, mercador ou progressão mudou. Limites: casas e barracas
ainda podem ocultar outros personagens (só o jogador ganha a transparência pontilhada); o Dash e as rotas dos aliados
agora contornam as construções.

## Histórias, instruções e retorno

A introdução e as histórias antes/depois de cada fase usam os textos da fonte atual,
incluindo o encerramento do Ato I. A interface mostra uma passagem por vez; **Continuar**
marca a história como vista. **Rever crônicas**, no mapa, reabre as passagens já liberadas. Os textos são preservados, inclusive as referências
narrativas ao Capitão; o combate usa o Rei Caído, como no jogo atual.

As instruções foram adaptadas aos seis slots da V2. **Entendi** avança e registra o
tutorial visto, em vez de depender dos temporizadores e eventos de interface antigos.
As trilhas conservam a progressão lateral no chão com a câmera isométrica da V2.

Pausa congela combate e filas. **Abandonar** retorna ao mapa, ou à vila já liberada.
A morte limpa o campo e permite retornar sem marcar conclusão. O progresso salvo
nunca contém inimigos, fogo, projéteis, portas em combate ou filas pendentes.
Reentrar começa a fase de novo. Depois da vila liberada, revisitar a trilha também
retorna à vila; não há temporizador antigo tentando abrir outra cena depois disso.

O círculo roxo marca o portal. **G** interage quando próximo; no campo ainda é preciso
concluir o encontro ou usar Abandonar. O **Pergaminho**, disponível no mercador por
20 ouro, teleporta ao portal de entrada da cena, sem concluir o encontro. Sem portal,
o consumível não é gasto.

## Vila de Eldrin

Bruno, Lucia, Julia e Vesper usam as falas e categorias de missão atuais. Na versão legada eles se chamam Bram, Lysa e Tilda; a v2 troca só o nome exibido (`VILLAGE_NAMES` em `campaign.mjs`), sem mudar ids nem falas da fonte compartilhada. Aproxime-se
e pressione **G**, ou use o botão de interação. A oferta fica estável até sair da vila.
Ao aceitar, o personagem entra numa arena de ondas ou numa trilha de três emboscadas,
com Rei Caído no final. O prêmio de missão segue a fonte: XP da oferta e
`piso(rewardSouls × 0,6 + sorteio × 30)` de ouro, uma vez por conclusão. Essas missões
são repetíveis; os prêmios exclusivos do Ato I continuam protegidos separadamente.

O mercador atende na vila e oferece equipamentos, venda e cinco consumíveis. O
Grimório pode ser preparado no mapa e na vila. Abrir os painéis pausa a vila;
fechá-los libera o movimento. O mapa e o portal permitem revisitar a campanha.
A Pedra do Infinito (G, ao sul da praça) abre a aba Waves e a [Arena Infinita](v2-arena.md).
As [Expedições](v2-expedicoes.md) abrem pela mesma aba; a Conquista segue pendente (E10c).

## Saves e compatibilidade

A chave exclusiva e a versão 1 foram mantidas. `campaign` tem padrões para saves
anteriores e guarda início, fases concluídas, desbloqueios, histórias, tutoriais,
liberações e destino de retorno. As liberações também acompanham o perfil da horda.
Conclusão e morte gravam automaticamente; falhas de armazenamento continuam visíveis.

A importação antiga continua preservando `legacy.data` inteiro. Aplica personagem,
equipamentos e consumíveis, mas **não converte automaticamente a campanha antiga**,
árvore ou maestrias. É possível iniciar o Ato I com esse personagem sem apagar o arquivo
arquivado. O progresso de campanha criado na V2 é restaurado normalmente.

## Cenário e verificação

O cenário usa geometria modular simples: pisos das salas, paredes baixas e portas
com colisão correspondente. A altura baixa mantém personagem e avisos legíveis com a
câmera atual. A vila usa NPCs Blender existentes, marcadores no chão e portal; casas,
decoração completa e apresentação das histórias em quadrinhos não foram recriadas.
Esses acabamentos visuais permanecem para E11, sem declarar a vila como arte final.

Na raiz, com Node; checks de navegador exigem Playwright e Microsoft Edge:

```powershell
node v2/tools/build.cjs
$tests = (Get-ChildItem v2/tests/*.test.mjs).FullName
node --test $tests
node v2/tests/campaign-browser-check.cjs
node v2/tests/browser-check.cjs
node game_check.js
```

Evidências em `review/v2/e9/`: mapa, cripta, vila nos dois fundos/qualidade baixa,
resultados e logs. O percurso controlado usa abates injetados para verificar as
quatro fases, missões, prêmios e retornos. Também verifica um disparo real na cripta,
carregamento offline e recarga na vila. Isso não comprova a dificuldade de uma partida
completa nem desempenho em outras máquinas; não houve comparação de balanceamento
por partidas completas. O simulador existente não foi alterado, pois as fórmulas
canônicas continuam compartilhadas; ele não substitui a IA da V2.

Acesso na vila: aproxime-se do **Guardião das Waves** (Arena e Expedições) ou da **Emissária de Valdoria** e pressione **G**. Cada NPC abre seu próprio painel; esses acessos não aparecem mais como abas do Relicário. Os NPCs reutilizam modelos animados existentes.

## Disponibilidade e narrativa

As habilidades basicas da campanha ficam disponiveis desde o inicio, sem concessoes por fase. Os investimentos normais do Grimorio continuam valendo. As cronicas possuem um palco 3D separado do combate e legendas em estilo HQ. A encenacao especifica de cada trecho da v1 ainda precisa ser concluida e validada visualmente.

## Campanha integrada · Eldrin (mundo contínuo)

Uma **campanha nova** começa no mundo contínuo de Eldrin em vez do atlas de fases. Saves que já tinham o Ato I iniciado continuam no fluxo de fases acima (`startCampaign` com `legacy`). O progresso fica em `campaign.world` (veja [saves](v2-saves.md)).

Fontes: `campaign-world-model.mjs` (pontos, rotas, encontros, quests, objetivos e regiões), `campaign-world.mjs` (entrada, encontros, abrigo, conversas e prêmios), `campaign-world-panel.mjs` (objetivos, conversa e mapa da região, tecla **M**) e `campaign-world-map.mjs` (planta, também disponível no editor de mapas).

### Mapa e regiões

O mundo tem **360 × 360** unidades. Regiões: Cripta Esquecida (início, no sarcófago), Bosque dos Vigias (centro), Vila de Eldrin (abrigo), Posto em ruínas, Mina de Valfundo (pátio entre paredões de rocha, ao norte), Serraria do Vale (clareira de tocos, barracões, pilhas de toras e riacho, a sudoeste) e Cemitério antigo (capela sem telhado e lápides, a leste). Estradas saem da praça para o norte (posto e mina), oeste (serraria) e leste (cemitério); colunas com brasas marcam as bifurcações. As bordas novas têm mata densa fora das estradas. O nome da região aparece no painel e define a música (cripta e mina usam o tema da cripta).

### Encontros

Os grupos fixos e as patrulhas das rotas combinam tipos misturados (Guerreiro, Arqueiro, Mago Vivo, Cão de Cripta, Ladrão, Humanoide Grifo, Aranha, Ladino Arqueiro e Orc). Cada grupo nasce parado quando o jogador se aproxima (até 16 u) e reage pela percepção comum dos inimigos. Os níveis efetivos de Jacarandá ficam entre 4 e 6, incluindo o bônus limitado dos grupos; o loot acompanha esse nível. Alguns grupos têm um líder Mágico (mina e serra) ou Raro (cemitério). Ao voltar à vila, as ameaças somem e os grupos comuns voltam na próxima saída. Grupos de quest (guardas do posto, bando da mina e guardas das três pilhas) não voltam depois de derrotados.

### Quests

| Quest | Como progride | Prêmio |
| --- | --- | --- |
| Uma voz entre as ruínas → Resgate o prefeito | Falar com Lili na praça; derrotar os três guardas do posto; libertar Joaquim; falar com ele na praça | 90 ouro, 120 XP |
| O ferreiro de Jacarandá | Joaquim oferece depois da defesa da vila (ou do resgate no fluxo antigo). Aceitar a missão; derrotar o bando da Mina de Valfundo; falar com Bruno na entrada; falar com ele na forja da vila | 100 ouro, 150 XP. Depois, Bruno abre a forja (painel de equipamentos) |
| Madeira para Jacarandá | Joaquim oferece depois da conclusão da forja. Aceitar a missão; derrotar os guardas e marcar cada uma das três pilhas com **G**; retornar a Joaquim | 110 ouro, 160 XP |
| O rastro de João | Marta oferece depois da forja e da madeira, nas campanhas com prólogo. Aceitar a busca; investigar o acampamento; vencer a Mãe-Tecelã e libertar João | 150 ouro, 350 XP |
| A carta da Pedra Negra | João oferece ao voltar à praça após o resgate. Aceitar; vencer o capitão; recuperar a bolsa e as provas no forte; retornar a João | Provas: 200 ouro, 500 XP; retorno: 250 ouro, 700 XP |
| A denúncia em Itavera → O convite de João | João oferece a viagem; entregar a denúncia a Helena; falar com João e aceitar o convite que encerra o ato. Detalhes em [Várzea de Itaúna](v2-itauna.md#o-rastro-de-joão-e-a-carta-10112026) | Sem novo pagamento |

O NPC com **!** oferece o próximo pedido; abrir ou fechar a conversa não aceita a missão. O botão de aceitação inicia o acompanhamento no HUD, com **Etapa N de M**, objetivo atual e progresso. **?** indica uma etapa pronta para entregar ou concluir por conversa. A bússola acompanha o primeiro objetivo aceito; antes da aceitação, o painel orienta procurar os NPCs com !. As pilhas da serraria só recebem marcadores de missão após aceitar a madeira.

No inventário, o atalho **Missões · em aberto e concluídas** abre o diário, também acessível pela aba **Missões** do Relicário. Cada entrada mostra o responsável e as etapas; concluídas ficam recolhidas e podem ser expandidas. O histórico deriva do progresso salvo. Aceitar não paga prêmio; cada recompensa continua sendo paga uma vez. Conversar ou abrir o mapa pausa o jogo. Ações exigem estar a até 3,2 unidades do personagem.

Saves antigos preservam missões concluídas e qualquer progresso efetivo. As antigas missões automáticas sem progresso passam a ofertas: primeiro Bruno, depois a madeira. Uma missão já aceita no novo fluxo permanece ativa ao recarregar. Fontes: [regras e histórico](../v2/scripts/quest-model.mjs), [diário](../v2/scripts/quest-journal.mjs) e [contrato de saves](v2-saves.md). [Verificação do fluxo e limites](../review/v2/quest-journal/validation-notes.md).

### Relevo, níveis, densidade e retorno à vila (05/11/2026)

- **Relevo e regiões** ([`world-relief.mjs`](../v2/scripts/world-relief.mjs)):
  - Colinas largas por onde as estradas sobem suaves.
  - Terras altas de pedra ao norte, até a Mina de Valfundo.
  - Cumes nevados a nordeste, com −15% de velocidade.
  - Colinas cinzentas da cripta, com árvores mortas e cruzes.
  - Baixada alagada na serraria, com lama e uma lagoa.
  - Alto do cemitério e penhascos rochosos longe das estradas.
  - Cripta, vila, pátio da mina e capela ficam nivelados. O vale acompanha o rio da edição publicada.
- **Edição publicada:** o relevo foi mesclado com `node v2/tools/world-relief.cjs`. Alturas esculpidas à mão ficam com a maior das duas, e o rio e as superfícies pintadas continuam. A cópia anterior fica em `blender/backups/campaign-world.before-relief.json`. Rodar de novo parte dessa cópia, então substitui alterações de relevo feitas depois no editor.
- **Níveis e densidade** ([`area-tuning.mjs`](../v2/scripts/area-tuning.mjs)):
  - Nível base das áreas: Jacarandá 4, Várzea de Itaúna 7, Gruta das Tecelãs 9, Forte da Pedra Negra 11, com bônus de até 2 por grupo. Plantas antigas com nível 1 sobre a base de Itaúna/gruta/forte usam o nível de referência original (4/5/5), preservando a diferença entre estrada, pátios e chefe.
  - **Nível do loot:** o equipamento que cai de um inimigo usa o nível do grupo dele (o `gearWave` de `spawnEnemy`). Drops sem grupo usam o nível da área. A recuperação de nível de `dropRoll` continua valendo por cima: com o equipamento vestido abaixo desse nível, parte dos drops sobe até +10. Antes os drops do mundo e das áreas caíam sempre no nível 1.
  - Uma leva por grupo, com até três integrantes comuns ou quatro quando há líder. O Capitão da Pedra Negra fica com três. Poucos pontos recebem um único reforço, após 9 s: `mill-road-b`, `camp-gate`, `fork-spiders`, `lake-wolves` e `fort-west`. Não há mais multiplicador global de integrantes e ondas.
  - Grupos vencidos não renascem pelo relógio enquanto o jogador explora. Ao voltar à vila, os grupos comuns rearmam para a próxima saída; grupos de missão concluídos permanecem vencidos.
  - Vale no jogo e no **Testar** de mapas da campanha. O editor continua mostrando a composição salva.
- **Teleporte à vila:** botão no painel de objetivos que leva à praça de Jacarandá, a partir do mundo ou de qualquer área ligada, com a passagem escura.
  - Aparece depois que a vila é alcançada uma vez e some dentro dela.
  - Fica desligado com inimigo em combate a menos de 16 u, para fugir de uma luta continuar exigindo correr.
  - Chegar pelo teleporte conta como chegar ao abrigo: os grupos rearmam e a área é esquecida no save.

### Limitações

- **Diagnóstico histórico, anterior à revisão de 11/11/2026 — personagem recém-saído do prólogo:** sai em torno do nível 4 ou 5. Numa simulação no navegador, parado e só lançando o Tiro de Osso, com horda e equipamento iniciais, ele venceu os grupos da floresta, do acampamento, das ruínas e da estrada da mina. Cada grupo com três ondas levou de 23 a 134 s. O cemitério (nível 13, oito inimigos e líder raro) o matou em 6 a 21 s. Números em [`review/v2/itauna/survival-after-prologue.json`](../review/v2/itauna/survival-after-prologue.json). O teste não se move nem recua, e a experiência ganha com seis vezes mais inimigos não foi revista.
- A conclusão das quests não altera o cenário: as pilhas marcadas continuam visíveis e a vila não é reconstruída.
- Os números de grupos, tipos, `wave` e prêmios são provisórios, sem passagem pelo `balance-simulator/`.
- Testes: `node --test v2/tests/campaign-world.test.mjs` cobre rotas livres de colisores, pontos alcançáveis, grupos mistos e líderes, ordem das quests, prêmio único, retomada após morte e recarga, e migração de saves. `node v2/tests/campaign-world-browser-check.cjs` percorre as regiões no Edge com teleporte e abates injetados, abre o mapa e conclui a forja; capturas em `review/v2/campaign-world/`. Não valida dificuldade. A medição de quadro feita ali no Edge headless não representa a GPU do jogador.
- `v2/tests/campaign-browser-check.cjs` ainda percorre as fases antigas a partir de uma campanha nova e precisa ser adaptado ao fluxo integrado.


## Encerramento do Ato I · a carta de João (10/11/2026)

Campanhas novas seguem agora até a recuperação da bolsa e das provas na Pedra Negra, entrega da denúncia a Helena na praça de Itavera e convite de João ao Vale de Itajuba. O fluxo está detalhado em [O rastro de João e a carta](v2-itauna.md#o-rastro-de-joão-e-a-carta-10112026). O final registra o Ato I concluído; a campanha do Ato II ainda não está disponível. Saves que já concluíram a missão local podem continuar pelo epílogo sem repetir recompensas.


## Revisão de ritmo e Bruno (11/11/2026)

A campanha usa grupos menores e mais pontos de contato, em vez de grandes quantidades de ondas no mesmo lugar. Foram acrescentadas patrulhas nas estradas da mina, serraria e Itaúna, e nos caminhos principal, sul, leste, da lagoa e da atalaia da várzea. A gruta recebe pequenos grupos nas ligações entre salões. Os IDs existentes, colisões, relevo e objetos publicados foram preservados; as patrulhas têm IDs próprios.

A validação de rotas mede intervalos fora do alcance de ativação dos grupos, sem contar a zona segura da vila como vazio de combate. O Caminho de Jacarandá ganhou encontros menores entre as clareiras antigas; veja [prólogo](v2-prologo-arandu.md#revisão-de-encontros-e-textos-11112026). Vila e praça de Itavera continuam sendo locais seguros.

Bruno volta da mina para **(52, 71)**, numa área aberta junto à rua a oeste da praça, com identificação **Bruno, o ferreiro · Ferraria** visível a até 18 u; G aparece no alcance de interação. O ponto é o mesmo antes e depois de reacender a forja, sem mover NPCs de saves pessoais nem criar outro ferreiro. Enquanto não for resgatado, ele permanece na mina.

As falas de Tomás, Marta, João e Helena foram revistas; conversas longas podem ter parágrafos separados. Bruno não faz mais referência exclusiva à horda quando atende outras classes. Objetivos, custos e prêmios exclusivos das missões permanecem os mesmos.

Testes, medições e limites em [review/v2/campaign-pacing](../review/v2/campaign-pacing/validation-notes.md). Amostras no motor real não substituem uma partida completa com as seis classes.
