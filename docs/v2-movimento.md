# V2 — movimento, câmera e animações (E3)

Implementado em `v2/scripts/terrain.mjs`, `training-model.mjs`, `renderer.mjs`,
`input.mjs`, `gamepad.mjs` e `app.mjs`, relativos à raiz do projeto.
O [plano de migração](../v2/plano-migracao.md) registra a sequência das etapas.

Atualização E4: Tiro de Osso substituiu a magia de área, Dash está disponível e
movimento normal usa 4 u/s básicos. Veja [combate da E4](v2-combate.md) para as
regras atuais; os registros de validação abaixo documentam a entrega E3.

## Contrato do mundo

A simulação usa x/y no chão; o renderizador converte para x/z de Three.js.
Altura visual e escala do modelo não definem automaticamente o colisor.
Os dados de `TRAINING_ARENA` alimentam tanto os sólidos lógicos quanto os
volumes provisórios desenhados: duas paredes baixas e dois pilares.
O perímetro desenhado corresponde ao retângulo de −15 a +15 unidades.

Personagens são círculos: player 0,45 u, aliados 0,35 u, zumbis inimigos
0,30 u e Fallen King 0,48 u. São os raios selecionados para a cena de migração,
com referência nas chamadas de `collide`/limites do motor anterior. O corpo
visual não aumenta o alcance de um golpe. O centro de cada ator fica dentro
do perímetro descontando seu raio.

A E3 migra a infraestrutura de sólidos, limites e navegação. Os mapas,
colisores e exceções de cada fase/modo anterior serão trazidos com esses modos;
a arena de teste não representa a geometria completa da campanha ou da vila.

## Colisões e navegação

O motor anterior usa círculos no chão, resolução de sobreposição,
`terrainLineClear`, caminhos locais e `moveEnemyTo`. A v2 segue essa separação,
com suporte adicional a caixas alinhadas aos eixos para as paredes de teste:

- A varredura considera o segmento inteiro do movimento, o raio do ator e o
  primeiro contato com limites, lados ou cantos do sólido. Não depende apenas
  de verificar o ponto final; deslocamentos rápidos não atravessam parede fina.
- Após contato, a parte restante do movimento desliza na tangente. Posições
  inicialmente sobrepostas são resolvidas, inclusive no centro exato do sólido.
- Player, aliados e inimigos usam o mesmo caminho de movimento físico.
- Quando a linha direta está bloqueada, a IA calcula rota numa grade de 0,8 u,
  verificando cada segmento e diagonal com o raio do ator. A busca é limitada
  e a rota é reutilizada até precisar de atualização.
- Um alvo perto de um sólido é convertido para chão alcançável pelo raio do
  perseguidor. Não há teleporte para atravessar obstáculos.
- Um atacante comum não inicia um golpe corpo a corpo pela parede. Na E3, a
  magia de área experimental mantinha a regra anterior sem cobertura por parede.
  Na E4 ela foi substituída pelo tiro, que também atravessa sólidos conforme a fonte atual.

Separação entre integrantes, formação e esquiva de ameaças foram integradas
na [E5](v2-horda.md). Não há colisão vertical, física de corpos rígidos ou
arte definitiva para os blocos; são volumes provisórios de validação.

## Câmera e mira

A câmera é ortográfica, inclinada e fixa em orientação. Ela acompanha o player.
O cursor na tela é convertido por um raio até o plano do chão. A transformação
é atualizada quando o player anda, mesmo com o mouse parado, e após zoom/resize.
O anel pequeno no chão mostra a mira enquanto o treino está ativo.

WASD/setas continuam relativos à tela, com diagonal normalizada. Pressionar
contra uma parede não mantém a animação de caminhada quando não há deslocamento.
A roda mantém o intervalo de zoom já usado na arena, sem alterar alcances. O zoom inicial é 11 (antes 15), mais próximo do personagem; a roda continua variando de 8 a 24.

## Animações

A simulação expõe estado, tempo, distância caminhada e pose normalizada. O
renderizador amostra os clipes exportados a partir desses dados; não usa um
segundo relógio independente para decidir a fase do golpe.

- Caminhada acompanha distância efetivamente percorrida; para quando bloqueada.
  `stride` em `v2/assets/models.json` calibra o ciclo visual por modelo.
- Descanso acompanha o relógio da simulação; pausa congela a pose.
- Conjuração acompanha sua janela experimental, preservando o instante do dano.
- Preparação, contato e recuperação do ataque experimental do boss são
  amostrados explicitamente. O quadro de contato usa a fração 4/13 da ação
  `attack`, referência também usada pelo modelo atual do Fallen King.
- Morte tem prioridade sobre a pose anterior. Ao mudar de cena, poses e rotas
  pendentes são limpas. Na tela de morte, o clipe pode terminar sem reativar a luta.

Isto não integra a IA completa do `FallenKingModel`, nem as regras de todas as
habilidades. E4/E8 devem ligar os novos golpes às suas fases reais. Materiais
GLB, pequenas diferenças de contato dos pés e o ajuste artístico de cada
animação continuam sujeitos à revisão de assets; não há promessa de equivalência
pixel a pixel com os sprites.

## Controle

Suporte básico ao mapeamento padrão da Gamepad API:

| Entrada | Ação nesta arena |
| --- | --- |
| Stick esquerdo / direcional | Movimento relativo à tela |
| Stick direito | Mira no chão; mantém a direção ao soltar |
| A | Entrar/tentar novamente no menu ou lançar magia no treino |
| RT | Lançar magia, respeitando a recarga experimental |
| Start | Pausar/retomar uma vez por pressão |
| L3 (desde E4) | Dash |

Os sticks têm deadzone radial de 0,18. Mouse volta a assumir a mira quando é
movido. Perda de foco/transição limpa entradas; botões mantidos devem voltar
ao neutro antes de serem aceitos novamente. Desconectar o controle mantém o
teclado funcional. Slots completos, comandos da horda, calibração e
navegação completa de menus permanecem nas etapas de habilidades/interface.

Controle validado com Gamepad API simulada, não com hardware físico.

## Verificação

Na raiz:

```powershell
node v2/tools/build.cjs
node --test v2/tests/training-model.test.mjs v2/tests/save-session.test.mjs v2/tests/terrain.test.mjs
node v2/tests/movement-browser-check.cjs
node v2/tests/browser-check.cjs
node game_check.js
```

Os checks de navegador requerem Playwright no ambiente e Edge instalado.
Evidências em [review/v2/e3](../review/v2/e3/): colisão, deslizamento, navegação,
mira com mouse parado, zoom, resize, mundo/tela/chão, controle simulado, pausa
de pose e amostragem exata de clipe. Os testes anteriores de saves/cenas também
permanecem no check geral. Capturas foram inspecionadas em zoom próximo e em
grupo/horda nos fundos claro/escuro e qualidade baixa.

O contador pode cair durante a criação/compilação dos clones. Uma conferência
isolada após carregar 64 aliados registrou 60 FPS no Edge headless deste ambiente;
isso é apenas observação pontual, não o benchmark nem a meta de hardware da E11.
