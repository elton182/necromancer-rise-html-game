# Inimigos importados da v2 — primeira passagem

Fontes originais preservadas em `../reference/imported_enemies/`, com hashes no manifesto dessa pasta. Os seis personagens já vieram com skin; acessórios são malhas rígidas. Nenhum original tinha clipes. Esferas auxiliares sem modificador Armature foram excluídas dos exports novos.

## Arquivos e reprodução

- `../scripts/audit_imported_enemies.py`: auditoria dos dez arquivos, relatório em `../../review/v2/imported-enemies/audit.json`.
- `../scripts/imported_enemy_humanoids.py`: gerar com `-- --character=knight`, `mage`, `thief` ou `griffin`.
- `../scripts/imported_enemy_beasts.py`: gerar com `-- --character=wolf` ou `spider`.
- As saídas são `../models/v2_enemy_<personagem>.blend` e `../exports/v2_enemy_<personagem>.glb`.
- `../scripts/stage_imported_enemies.py`: executar na sessão Blender via MCP para criar cena separada e preservar a anterior. Carrega fontes editáveis e ações, sem executar reset de cena. A propriedade `review_clips` de cada armature mapeia nomes lógicos às ações carregadas, evitando colisão com ações já abertas.
- `../models/v2_imported_enemies_review.blend`: cena de revisão salva pela sessão MCP, separada do arquivo do Rei.
- `../scripts/preview_imported_knight.py`: prévias Cycles, também aceita `-- --character=<personagem>`. Prévias são evidências de iteração; após editar uma fonte, gerar novamente antes de considerá-las atuais.

Exemplo na raiz, com Blender instalado:

```powershell
blender --background --threads 4 --python blender/scripts/imported_enemy_humanoids.py -- --character=knight
node v2/tools/build.cjs
node --test v2/tests/imported-enemies.test.mjs v2/tests/enemies.test.mjs
node v2/tests/imported-enemies-browser-check.cjs
```

O cavaleiro leva espada e escudo; ladrão leva adaga; mago leva cajado de fogo. Os acessórios são presos ao osso da mão e exportados no mesmo GLB. O posicionamento da espada/adaga considera o eixo principal da geometria e um ponto de empunhadura, não apenas o centro da caixa delimitadora.

## Animação e limites

### Revisão do cavaleiro

O gerador de humanoides aplica `../scripts/knight_animation.py` ao cavaleiro depois dos refinamentos compartilhados. Esse módulo também permite atualizar as ações existentes na sessão MCP com `animate_knight(arm, actions)`, passando o mapa de clipes do rig. A preparação pesada mantém a guarda e corta no final; `heavy_attack` continua o golpe e `recover` retorna à guarda, com poses de fronteira correspondentes. O ataque comum começa no contato e retorna à guarda, acompanhando o dano imediato já existente no motor. Dano, alcance, recarga e tempos do runtime permanecem iguais.

A caminhada inclui quadril, tornozelos e oscilação dos braços; reação e morte têm maior participação do tronco e relaxamento dos membros. Continua sendo um ciclo no lugar, sem IK de apoio contínuo. As sequências de ataque, preparação pesada, continuação, recuperação, caminhada e morte foram inspecionadas no Blender via MCP. A cena editável e o GLB foram salvos, e a distribuição deve ser regenerada pelo build habitual.

Todos têm descanso, caminhada, ataque, reação e morte. Cavaleiro tem preparação pesada, ataque pesado e recuperação; mago tem conjuração e Erupção; lobo tem preparação, investida e recuperação; ladrão, grifo e aranha têm preparação e contato próprios. O runtime aciona os estados especiais, e a reação visual só substitui descanso/caminhada, sem conceder interrupção de ataque.

Esta é a primeira passagem de animação sobre pesos importados, preservando texturas/PBR dos arquivos fornecidos. Foram inspecionadas poses e caminhadas na sessão MCP e capturas no navegador. Isso não equivale a acabamento manual de todos os dedos, tecido, contatos e apoios. Os rigs não têm IK de apoio contínuo; a locomoção usa ciclos no lugar sincronizados pela distância percorrida. O rig da aranha tem nomes de cadeias inconsistentes; o script usa sua hierarquia, sem assumir que os nomes correspondem à anatomia.

Evidências e resultados: `../../review/v2/imported-enemies/`. O teste de navegador verifica os clipes, matrizes finitas, carregamento offline, ausência de esferas auxiliares e erros de página, fundos claro/escuro, qualidade baixa e uma cena com horda. Não é benchmark em hardware de referência nem aprovação artística final.

## Revisão de equipamentos e voo

A revisão foi feita na sessão Blender aberta via MCP. Espada, escudo, adaga e cajado foram reduzidos para 0,52 / 0,34 / 0,42 / 0,84 unidades (a adaga foi ampliada de 0,22 para 0,42 por ficar pequena em jogo) da fonte, respectivamente, e reposicionados na pegada de descanso. O escudo cobre o antebraço e o cajado fica vertical nessa pose. O arquivo `../scripts/imported_humanoid_refinements.py` é compartilhado entre o gerador e a revisão ao vivo. `../scripts/export_refined_enemies.py` exporta somente a cena temporária ativa, usando trilhas NLA com nomes canônicos, sem sobrescrever o arquivo aberto.

A harpia mantém o ID `griffinHumanoid` / modelo `enemyGriffin`. Penas foram separadas em duas malhas, com ossos `WingLeft`, `WingRight` e pontas independentes, ligados ao tronco. Os braços continuam livres para o ataque. As asas foram elevadas até a linha dos ombros; volumes fechados cobrem o encaixe nas costas, e fragmentos remanescentes da ligação aos braços foram removidos. O clipe `fly` executa o batimento; os clipes de ataque também mantêm as asas ativas. A fonte editável inclui corpo, asas, encaixes e ações.

No jogo, os três humanos usam a altura corporal do player em descanso, excluindo equipamentos da medição. A v2 preserva a escala original do player. A harpia voa baixo, a 0,85 u com oscilação de 0,09 u, sombra no chão mesmo em qualidade baixa e descida ao morrer em 0,8 s. Sua projeção no chão mantém colisões, seleção, alcance, dano e vulnerabilidade comuns. O voo visual não concede imunidade nem passagem por paredes.

## Ladino Arqueiro e Orc

Fontes em `../reference/imported_enemies/`: `hooded_rogue.glb`, `stylized_bow.glb`, `orc.glb`, `orc_spiked_wooden_mace.glb` (hashes no manifesto). Ambos usam o rig Mixamo de 65 ossos do ladrão. Gerar com `-- --character=rogue` ou `orc` em `../scripts/imported_enemy_humanoids.py`; saídas `../models/v2_enemy_<personagem>.blend` e `../exports/v2_enemy_<personagem>.glb`.

- **Ladino:** clipes `idle`, `walk`, `attack` (puxa a corda e solta), `recover`, `hit`, `death`. O arco é alinhado pelo eixo principal da malha (vinha inclinada ~22°), com a barriga para a frente, e preso ao punho esquerdo na pose de guarda. A cada quadro a mão gira no próprio eixo para o arco ficar na vertical (0–6,6° medidos).
- **Orc:** 28 peças rígidas juntadas numa malha (28 materiais). Clipes `idle`, `walk`, `attack`, `smash_windup`, `smash`, `recover`, `hit`, `death`. A maça atravessa o punho direito (centro calculado pelos vértices da mão e dedos) e é orientada a cada quadro: ereta, armada atrás do ombro e depois caindo à frente. A morte escala os deslocamentos pela altura do corpo.
- Limites: primeira passagem, sem refino manual de dedos, tecido e apoios; conferidas no Blender via MCP as poses de `attack`, `idle` e `smash_windup`/`smash`; `walk`, `hit`, `death` e `recover` não foram inspecionados quadro a quadro.

## Harpia: arremesso de penas

Dois clipes novos no GLB da harpia, `feather_windup` (14 quadros: asas erguidas, braços abertos para trás, tronco recuado) e `feather` (10 quadros: braços lançados à frente, asas recolhidas, tronco inclinado), gerados por `imported_enemy_humanoids.py -- --character=griffin` e `imported_humanoid_refinements.py`. A pena em voo é um modelo estático à parte, `v2_harpy_feather.glb`, gerado por `blender/scripts/v2_harpy_feather.py` (0,86 u, cálamo marfim, lâmina marrom recortada com ponta escura; ponta no eixo +X). Registrados em `v2/assets/models.json` como `harpyFeather` e nos clipes exigidos de `enemyGriffin`. A pena e as poses foram conferidas no Blender aberto via MCP, numa cena de revisão já removida.

## Lobo: uivo

Clipe novo `howl` (24 quadros, sem loop) no GLB do lobo, gerado por `imported_enemy_beasts.py -- --character=wolf`: a cabeça se ergue em ~25% do clipe, segura o grito com leve tremor no peito e volta ao final. Conferido no Blender aberto via MCP (cena de revisão removida). Registrado em `v2/assets/models.json` nos clipes exigidos de `cryptHound`. Limitação: a cadeia de membros do lobo é um rig importado sem rótulos confiáveis, então só a cabeça e a coluna foram animadas.
