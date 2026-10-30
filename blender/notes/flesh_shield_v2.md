# Escudo de Carne — v2

Fonte: `../scripts/flesh_shield.py`. Cena: `../models/v2_flesh_shield.blend`.
Export: `../exports/v2_flesh_shield.glb`, registrado como `fleshShield` em
`../../v2/assets/models.json`. Não altera o modelo do personagem.

Geração, na raiz: Blender em background com `--python blender/scripts/flesh_shield.py`.
Usa os utilitários de malha/material de `common.py`; cria seis placas nomeadas
`flesh_plate_0` a `flesh_plate_5`, três costelas por placa e ações `pulse_0` a
`pulse_5`. O runtime sincroniza pulsação, impacto e placas visíveis com a
absorção real. A cor usa toon sem o aumento de saturação da Forma da Morte.

Validação no jogo em tamanho real, fundos claro/escuro, horda e qualidade baixa:
`../../review/v2/combat-rework/`. O cenário pode ser regenerado sem abrir ou
modificar a cena do Blender que o usuário estiver editando.
