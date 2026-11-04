# Tornado — ciclo editável para ajuste manual

Ação `tornado` em `blender/models/warrior.blend`, criada via MCP por `blender/scripts/warrior_tornado.py`.

- Frames 1–25 a 30 fps: 0,8 s por volta. O frame 25 fecha na mesma pose do frame 1.
- Giro completo nos ossos; objetos WarriorOrigin e WarriorRig não se deslocam nem giram.
- Palma da mão direita para baixo e braço à frente do peito, conforme orientação do usuário. Pronação repartida entre antebraço e punho.
- Apoio alternado dos pés: direito em 1/13, esquerdo em 7/19; os contatos ficam fixos enquanto o outro pé avança.
- Quadros-chave em todos os frames para preservar o contato dos pés; marcadores de quarto de volta em 1/7/13/19/25.
- Ação ativa no Pose Mode, frame 1, mão direita selecionada. Editar os ossos e inserir as chaves habituais.
- As oito ações autorais anteriores foram preservadas, verificadas por comparação das curvas antes/depois.

Verificação do ciclo: `blender/previews/warrior_tornado_draft.json`. Poses conferidas de frente, lado e três quartos pelo MCP. A palma permaneceu voltada para baixo nos 25 frames; fechamento de ciclo abaixo de 0,000001, apoio abaixo de 0,000002 e malha acima do chão nos frames amostrados.

O GLB e o jogo ainda não usam este clipe. Este ciclo é um rascunho para ajuste manual, sem integração no runtime nesta entrega. Os exportadores preservam `tornado` na cena para não apagar esse trabalho em uma exportação posterior, sem publicá-lo no GLB. O gerador recusa sobrescrever uma ação `tornado` existente.

## Pose manual do frame 1 aplicada ao restante do ciclo

A pose editada pelo usuário foi preservada em `blender/reference/warrior/tornado_user_frame_1.json`. `warrior_tornado_refine.py` aplica o ombro, braço, antebraço, punho e dedos direitos aos frames 2–25, em relação ao tronco. A inclinação manual de Spine também foi incorporada aos próximos frames, preservando a oscilação existente. Giro e apoios das pernas continuam nas curvas anteriores.

Validação em `blender/previews/warrior_tornado_user_pose.json`: erro zero na pose do frame 1, fechamento do ciclo abaixo de 0,000001 e ações anteriores preservadas. Conferência visual em 1/7/13/19/25 via MCP; sem exportação ou alteração do jogo.
