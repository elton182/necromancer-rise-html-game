# V2 — campanha, vila e missões (E9)

A V2 oferece **Campanha · Ato I** na tela inicial. Um save novo começa no mapa,
com quatro fases sequenciais. **Continuar** restaura o progresso e abre o mapa ou
a Vila de Eldrin em uma cena limpa; nenhuma luta ou entidade é restaurada.
O botão da campanha usa o personagem atual, preservando itens, nível e pontos.
O treino continua acessível separadamente pelo menu.

## Fontes e distribuição

- `v2/tools/campaign-source.cjs` lê `CAMP_STAGES`, salas, corredores, portas,
  emboscadas, Capitão, missões, falas, histórias e instruções de `necromancer-canvas.html`.
- `v2/scripts/campaign-rules.mjs` é gerado pelo build; contém também os cálculos
  vigentes de `stageMul` e quantidade de inimigos por onda. Não editar diretamente.
- `campaign-model.mjs` normaliza o progresso e determina desbloqueio/prêmios únicos.
- `campaign.mjs` administra encontros, filas de spawn, portas, vila e retornos,
  usando dano, inimigos, horda, equipamentos, XP e saves já existentes.
- `campaign-panel.mjs` apresenta mapa, histórias, tutoriais e diálogos.

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
(determinístico, 40×40 u) e `village-scene.mjs` o desenha com geometria procedural;
árvores, rochas, grama e flores reutilizam `forest-scene.mjs`. Os blocos do modelo
medieval da periferia continuam como pano de fundo, fora do limite caminhável.

- **Colisores (46):** onze construções (fileira de casas ao norte, ferraria de Bram a oeste,
  casa de Lysa a leste, casas laterais ao sul e a estalagem fechando a rua principal),
  duas barracas do mercador, quadro do mapa, pilares do portal, poço no centro da praça,
  postes, barris, caixas, cercas, árvores e pedras. Pisos e ruas são só desenho.
- **Pontos de interação:** portal `(0,-9)`, mapa `(-6,-8)`, mercador `(8,-6)`, Bram `(-11,1)`,
  Lysa `(11,1)`, Tilda `(-6,8)` e Vesper `x 0, y 5,9` ficam livres, ligados por rua e praça,
  dentro do alcance de 3,2 u da tecla G. Os testes conferem rota a pé, a partir da chegada
  `(0,9)`, e que nenhum ator nasce dentro de um sólido.
- **Aparência:** ruas de pedra e terra, praça circular com anel de pedras, janelas acesas e
  postes sem luzes dinâmicas (material sem iluminação); paleta própria nos fundos escuro e claro.

Nenhuma regra de missão, oferta, mercador ou progressão mudou. Limites: casas e barracas
podem ocultar um personagem atrás delas para a câmera isométrica (oclusão fica para o
acabamento da E11); o Dash e as rotas dos aliados agora contornam as construções.

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

Bram, Lysa, Tilda e Vesper usam as falas e categorias de missão atuais. Aproxime-se
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
