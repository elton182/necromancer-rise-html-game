# Integração dos NPCs Tripo

Modelos integrados: Marta, Helena, Joaquim, Tomás, Bruno e Lili.
João e os GLBs originais foram preservados. Registro em
`v2/assets/models.json`; novos IDs para Bruno e Lili; demais IDs mantidos.
O ferreiro usa o novo modelo também no fluxo da Vila de Eldrin.

## Verificações executadas

- Blender 5.2 em background: importação, redução para aproximadamente 18 mil
  triângulos, texturas de até 512 px, rig com proporções específicas, quatro
  clipes e cenas editáveis. Metadados em
  `blender/previews/campaign_npcs_tripo/`.
- `node v2/tools/build.cjs`: 90,4 MiB, GLBs embutidos.
- `node --test v2/tests/campaign-world.test.mjs v2/tests/prologue.test.mjs v2/tests/nilo-quest.test.mjs`.
- `node --test v2/tests/village.test.mjs v2/tests/village-services.test.mjs v2/tests/lab.test.mjs`.
- `node --test v2/tests/distribution.test.mjs`: preservação dos GLBs no HTML
  e limite de tamanho. Os três comandos de testes passaram (49 casos).
- `v2/tests/campaign-npcs-tripo-browser-check.cjs` no Chrome instalado, com
  `BROWSER_EXECUTABLE_PATH` apontando para seu executável. O Edge não iniciou
  no ambiente de terminal; a execução do Chrome pelo runtime Node concluiu.
  HTML aberto por `file:`, armazenamento isolado, sem erros de página/console
  nem requisições HTTP. Resultado em `result.json`.
- Conferência visual das imagens de frente, costas, saudação, passada a 25%
  do ciclo, morte e vila em fundo claro/escuro, qualidade baixa e com horda.
  Teste também confirmou elenco no prólogo e em Itavera e orientação dos
  moradores para a câmera.

## Limites

Animações locais simples com pesos espaciais; sem física de roupas e sem rig
individual dos dedos. As capturas verificam poses representativas, sem uma
partida completa da campanha ou medição de desempenho em outras máquinas.
Não foram alteradas regras de missão, dano, recompensas ou formato do save.

## Revisão do rig e do idle

Rig dos seis NPCs refinado para 23 ossos, incluindo coluna, pescoço, ombros e
abas da capa. Pesos limitados a quatro influências e normalizados antes da
exportação. O idle dura 4 s e usa respiração, movimento de cabeça, braços e
capa, sem deslocar a raiz/pernas. Demais ações foram preservadas.

Executados novamente: build (90,7 MiB), teste de distribuição e check de
navegador no Chrome. O check agora exige os novos ossos, mede mudança de pose
nos seis clipes idle e compara o relógio de animação e as rotações dos ossos
de Marta, Joaquim, Bruno e Lili durante 1,1 s dentro da vila. Todas as
verificações passaram; nenhum erro de página/console ou pedido HTTP.

Prévia de um ciclo completo: `blender/previews/campaign_npcs_tripo/idle.gif`,
produzida por `python blender/scripts/pack_campaign_npcs_idle.py` a partir de
24 frames do check (6 FPS). Imagens de frente, passada e vila em qualidade
baixa inspecionadas. Permanece sem física de roupas ou dedos articulados;
esta revisão não inclui uma partida completa da campanha.

## Orientação global dos NPCs

`renderer.mjs` passa a orientar os NPCs pela direção horizontal da câmera a
cada quadro. Regra cobre os atores `worldNpc`, modelos `npc*` e moradores
neutros identificados pelo rótulo de interação, inclusive serviços antigos
com modelo de espectro. O jogador, cavalos e unidades normais de combate
mantêm sua orientação. O guarda com modelo de NPC também fica de frente
para a tela quando aliado. O palco narrativo orienta seus modelos `npc*`.

Executados build e check de navegador no Chrome: orientação renderizada
confere com a câmera em oito cenas (Jacarandá, Itavera, travel, ambush,
fall, trail, defense, reunion), preservando os ângulos lógicos dos NPCs.
Sem erros de página/console nem HTTP. Resultado em `facingScenes` no
`result.json`; capturas `facing-travel.png`, `facing-trail.png`,
`facing-defense.png` e `itavera-facing.png`.

## Revisão de naturalidade do idle

Substituído o balanço uniforme por postura relaxada e ciclos de aproximadamente
12 segundos: braços mais baixos, cotovelos dobrados à frente, mãos fora do
quadril, respiração com variação discreta de escala do tórax e olhares/gestos
espaçados por personagem. Cada NPC usa perfil próprio de postura, braço e
momento do gesto. Coluna/capa não oscilam mais como pêndulo contínuo.

O renderizador atribui uma fase determinística por identidade do ator,
separando a respiração de NPCs criados juntos. Pausa e direção para a tela
continuam respeitadas; jogador e atores sem identificação de NPC mantêm sua
fase original. Malhas, pesos, rig e clipes de saudação/caminhada/morte foram
preservados nesta revisão.

Executados: preparação dos seis idles no Blender, build (90,9 MiB), teste de
distribuição e check de navegador no Chrome. Este mede movimento em diferentes
instantes, ausência de deslocamento dos ossos dos pés e igualdade das chaves
inicial/final dos clipes (não apenas o retorno automático do AnimationMixer).
Também confirma fases diferentes na vila, animações em execução e orientação
para a câmera nas oito cenas cobertas. Todos passaram, sem erros de página ou
requisições HTTP. Não foi feita uma partida completa da campanha.

Prévia de ciclo completo gerada por `pack_campaign_npcs_idle.py`, agora com
72 frames a 6 FPS. Inspecionados descanso, momentos intermediários e vila
com horda em qualidade baixa. Arquivos: `result.json`, capturas deste diretório
e `blender/previews/campaign_npcs_tripo/idle.gif`.
