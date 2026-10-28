# Laboratório 3D

Experimento separado da campanha. Abra `../necromancer-3d-lab.html` diretamente
no Edge ou Chrome. O HTML inclui biblioteca e três modelos; não usa servidor,
CDN, armazenamento local ou saves. Requer WebGL 2 e suporte a import maps.

WASD/setas movem em relação à tela; mouse mira; clique/espaço lança magia.
A roda aproxima a câmera ortográfica. O painel permite 6–64 aliados,
chão claro/escuro, qualidade alta/baixa e reinício.

## Implementação e limites

- Three.js 0.180.0, licença MIT em `vendor/LICENSE`. GLTFLoader importa modelos
  e AnimationMixer reproduz os clipes exportados. Referência:
  https://threejs.org/docs/pages/GLTFLoader.html
- Modelos atuais: player de `blender/models/rigged_player.blend` (mago roxo
  com cajado), `blender/reference/skeleton.glb` (espada e escudo),
  `blender/exports/lowpoly_zombie.glb` e boss de
  `blender/models/boss_fallenKing_v4.blend`.
- `blender/scripts/export_3d_lab.py` exporta cópias animadas das cenas do
  player e boss para `blender/exports/lab_player_current.glb` e
  `lab_fallen_king_v4.glb`. Não salva as cenas originais. Executar com
  Blender em modo background antes de reempacotar quando essas cenas mudarem.
  Exclui a esfera auxiliar da cena do player e mantém corpo e cajado.
- Altura normalizada: player, esqueletos e zumbis 2,25 u; boss 3,2 u.
  Materiais exportados são a versão GLB, não uma reprodução exata do toon
  usado nos sprites. Player usa durações dos clipes correspondentes ao atlas.
- Chão e lápides são geometria provisória; não há colisão com objetos,
  separação entre criaturas, navegação por obstáculos ou oclusão de paredes.
- Regras independentes, para testar apresentação: magia sem mana, raio 2,4,
  alcance 10, preparação 0,25 s, dano 35, recarga 0,65 s; inimigos avisam
  uma área de raio 1,7 por 0,85 s antes de causar 12 de dano. Sair evita
  o golpe; morte do atacante cancela um impacto ainda não executado.
- Rei Caído: 1000 de vida, golpe com preparação de 0,85 s, raio 3 e dano 25.
  Reproduz caminhada, preparação, ataque, recuperação e morte da cena v4;
  cast e slam estão exportados, mas não são acionados pela IA desta arena.
  São regras de teste, independentes da integração do boss na campanha.
- Não integra progressão, equipamentos, loot nem regras da campanha.
- FPS no painel é uma observação da execução, não benchmark comparativo.
  A horda usa clones com esqueletos independentes; otimização fica pendente.

## Reproduzir

Na raiz: `node tools/3d-lab/build.cjs` recompõe o HTML a partir de
`template.html`, `runtime.js`, biblioteca local e GLBs.

`node tools/3d-lab/browser-check.cjs` requer Playwright disponível no ambiente
e Edge instalado. Usa perfil isolado, verifica abertura por file:// sem
requisições HTTP, movimento, magia com dano, 64 aliados, qualidade baixa,
reinício, dano do boss, esquiva da área e erros de página. Capturas em
`review/3d-lab-*.png`.

Validação inicial: teste de navegador executado e capturas inspecionadas em
1440×900, com fundos escuro/claro e horda na qualidade baixa. `game_check.js`
também executado com sucesso. Ainda falta avaliação manual das transições
de todos os clipes e desempenho em outras máquinas.
