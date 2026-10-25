# Cão de Cripta — validação (25/10/2026)

Implementado no HTML independente com ID `cryptHound` e índice 4. Os quatro índices anteriores e os encontros da campanha foram preservados. Fontes de comportamento: `scripts/crypt-hound-model.js` e `scripts/crypt-hound.js`, incorporadas por `node scripts/sync-equipment.js`.

## Arte e leitura

- Blender 5.2: modelo, rig e GLB com sete ações, oito direções e 272 quadros. Todos os quadros têm conteúdo e margem transparente, verificados durante o empacotamento.
- [Direções e ações](../blender/preview_crypt_hound.png), [cena isolada e miniaturas 32/48/64 px](crypt-hound-isolated.png).
- Grupo com 32 inimigos e seis aliados, a 24 px/u e qualidade baixa: [preparação escura](crypt-hound-dark-windup.png), [investida escura](crypt-hound-dark-charge.png), [recuperação escura](crypt-hound-dark-recovery.png), [preparação clara](crypt-hound-light-windup.png), [investida clara](crypt-hound-light-charge.png), [recuperação clara](crypt-hound-light-recovery.png).
- [Aviso no jogo](crypt-hound-game.png). A arena permite repetir e examinar a investida, comparando alvo parado e esquiva lateral com o modelo de combate real.

## Verificações

- `node game_check.js`: 76 cenários aprovados, incluindo migrações existentes.
- Testes Node dos sistemas de combate, equipamentos, save, navegação, expedições e simuladores, mais os testes novos do Cão e de reconhecimento de perigo pela horda: 127 testes aprovados.
- `node scripts/crypt-hound-browser-check.js`: HP/dano base, multiplicadores de velocidade e raridade aplicados uma vez, mordida no update real, supressão de perseguição durante preparação, direção fixa, esquiva lateral, Dash invulnerável, cenário, Muralha, morte, reset e primeiro aliado atingido. [Resultado](crypt-hound-browser-results.json).
- `node scripts/expedition-browser-check.js`: entrada, grupos dormentes, boss, loot, progresso, horda sobrevivente, movimento, arena clássica e persistência da preferência aprovados.
- `node scripts/crypt-hound-visual-check.js`: fundos claros/escuros, três fases do especial, miniaturas e cena em grupo; nenhum erro de JavaScript nas páginas.
- O novo teste de composição confirma waves 1–3, introduções nas waves 4/5, reserva de 20% posterior, campanha sem Cães, totais e determinismo das expedições. O simulador usa a mesma seleção de tipos da arena.

## Desempenho e limites

Comparação intercalada na mesma máquina, Edge headless, 120 amostras após 30 aquecimentos. Um painel com 32 inimigos, seis aliados e dois personagens principais, 24 px/u, qualidade baixa: P95 de envio das chamadas de desenho de **1,1 ms** com os quatro tipos originais e **1,1 ms** incluindo Cães. Medianas: 0,7 ms em ambos. [Dados](crypt-hound-performance.json).

Esse microbenchmark mede chamadas de desenho no navegador; exclui conclusão na GPU, atualização de IA e tempo do quadro completo. A comparação final não indicou aumento no custo de envio das chamadas; os tempos variam entre execuções. O simulador matemático representa o dano da investida por probabilidade de acerto, sem geometria de colisão ou esquiva lateral; o teste no navegador valida essas regras no motor real.

Para reproduzir os testes de navegador, disponibilize Playwright em `NODE_PATH` e Microsoft Edge. O teste visual serve os arquivos por interceptação local e não exige servidor. Para explorar a arena manualmente: `node tools/combat-lab-server.js`, abrir `http://127.0.0.1:4173/tools/combat-lab.html` e selecionar **Cão de Cripta · Investida · EN-01**.
