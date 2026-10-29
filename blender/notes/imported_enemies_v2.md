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

Todos têm descanso, caminhada, ataque, reação e morte. Cavaleiro tem preparação pesada, ataque pesado e recuperação; mago tem conjuração e Erupção; lobo tem preparação, investida e recuperação; ladrão, grifo e aranha têm preparação e contato próprios. O runtime aciona os estados especiais, e a reação visual só substitui descanso/caminhada, sem conceder interrupção de ataque.

Esta é a primeira passagem de animação sobre pesos importados, preservando texturas/PBR dos arquivos fornecidos. Foram inspecionadas poses e caminhadas na sessão MCP e capturas no navegador. Isso não equivale a acabamento manual de todos os dedos, tecido, contatos e apoios. Os rigs não têm IK de apoio contínuo; a locomoção usa ciclos no lugar sincronizados pela distância percorrida. O rig da aranha tem nomes de cadeias inconsistentes; o script usa sua hierarquia, sem assumir que os nomes correspondem à anatomia.

Evidências e resultados: `../../review/v2/imported-enemies/`. O teste de navegador verifica os clipes, matrizes finitas, carregamento offline, ausência de esferas auxiliares e erros de página, fundos claro/escuro, qualidade baixa e uma cena com horda. Não é benchmark em hardware de referência nem aprovação artística final.

## Revisão de equipamentos e voo

A revisão foi feita na sessão Blender aberta via MCP. Espada, escudo, adaga e cajado foram reduzidos para 0,52 / 0,34 / 0,22 / 0,84 unidades da fonte, respectivamente, e reposicionados na pegada de descanso. O escudo cobre o antebraço e o cajado fica vertical nessa pose. O arquivo `../scripts/imported_humanoid_refinements.py` é compartilhado entre o gerador e a revisão ao vivo. `../scripts/export_refined_enemies.py` exporta somente a cena temporária ativa, usando trilhas NLA com nomes canônicos, sem sobrescrever o arquivo aberto.

A harpia mantém o ID `griffinHumanoid` / modelo `enemyGriffin`. Penas foram separadas em duas malhas, com ossos `WingLeft`, `WingRight` e pontas independentes, ligados ao tronco. Os braços continuam livres para o ataque. As asas foram elevadas até a linha dos ombros; volumes fechados cobrem o encaixe nas costas, e fragmentos remanescentes da ligação aos braços foram removidos. O clipe `fly` executa o batimento; os clipes de ataque também mantêm as asas ativas. A fonte editável inclui corpo, asas, encaixes e ações.

No jogo, os três humanos usam a altura corporal do player em descanso, excluindo equipamentos da medição. A v2 preserva a escala original do player. A harpia voa baixo, a 0,85 u com oscilação de 0,09 u, sombra no chão mesmo em qualidade baixa e descida ao morrer em 0,8 s. Sua projeção no chão mantém colisões, seleção, alcance, dano e vulnerabilidade comuns. O voo visual não concede imunidade nem passagem por paredes.
