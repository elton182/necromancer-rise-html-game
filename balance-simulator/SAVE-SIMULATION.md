# Simular um save real

1. No jogo, abra **Esc → Sistema → Exportar save**.
2. Execute usando Node.js, Playwright e Microsoft Edge instalados:

```powershell
node scripts/simulate-save.js --save "C:/caminho/necromancer-save.json"
```

O comando abre um Edge headless com armazenamento novo por tentativa, importa o JSON pelo carregador real do jogo e executa a wave selecionada três vezes por perfil. Não se conecta ao navegador aberto, não modifica o arquivo importado e não salva alterações no seu progresso original.

```powershell
node scripts/simulate-save.js --save "C:/caminho/necromancer-save.json" --waves 20,24,27 --runs 3 --seed 182 --seconds 180 --out balance-simulator/reports/save-current
```

Se Playwright estiver em outro diretório, defina `NODE_PATH` para o `node_modules` correspondente. Não é necessário instalar dependências dentro do jogo.

O resultado contém `README.md` com o resumo e `report.json` com estado inicial, mortes por tipo/instante, dano efetivo jogador/horda, tempo vivo/morto/retornando/ao alcance de ataque por tipo e evolução da luta a cada cinco segundos. Fontes e save são identificados por SHA-256. Mesmas fontes, save, perfil e semente reproduzem o confronto. O save integral não é copiado ao relatório.

O motor usado é o próprio HTML, com passo fixo de 1/60 s e sem desenho ou áudio. IA, colisões, habilidades automáticas, esquivas, projéteis, drops e XP seguem as regras do jogo. Cada tentativa para na primeira morte, conclusão da wave ou limite de tempo. Vida e mana são as carregadas pelo jogo; os aliados começam junto ao jogador na entrada da arena.

O cenário fixa a **arena clássica**, mesmo quando o jogo oferece expedições como padrão. Ele valida que existe uma fila de inimigos, congela uma cópia do HTML durante o lote e a salva como `game-source.html` no relatório. Edições simultâneas no jogo não alteram os confrontos do lote. Mudanças nos scripts do simulador interrompem a execução. Isso não altera a preferência do navegador do jogador. Use `--game caminho/game-source.html` para reutilizar a mesma versão congelada em comparações posteriores.

`hold` fica parado e atira no alvo mais próximo. `kite` escolhe uma de oito direções a cada 0,2 s, evitando inimigos e a borda, atira e usa Dash equipado quando ameaçado. Os perfis não usam Escudo de Carne, poções, reanimação manual ou comandos ativos de grupo. São cenários de diagnóstico, não uma reprodução do jogador nem uma medida absoluta da dificuldade. O alcance da horda é o padrão de 16 unidades; essa preferência do navegador não está no save.

Para investigar balanceamento, exporte novamente depois de mudar a build ou rode a mesma cópia antes/depois de uma mudança no jogo, conservando waves, sementes e perfis. Compare mortes da horda, dano, acúmulo de inimigos e tempo de sobrevivência. O simulador matemático existente continua separado desse teste do motor real.

O diagnóstico também registra ataques básicos e habilidades por tipo, tempo em perseguição, esquiva, espera diante de perigo e contato com obstáculos. Esses tempos podem se sobrepor. Registra reanimações e duração das vidas encerradas após renascer, composição inicial da wave, pico de áreas de fogo e dano efetivo recebido de projéteis mágicos, impacto do mago e fogo persistente.

`--frontline-damage-taken 1` desativa a redução de dano apenas na instância simulada; `0.8` testa a redução de 20%. A configuração usada aparece no estado inicial e nas opções do relatório. `hordeDps` e `minionDeathsPerMinute` no resumo permitem comparar tentativas de durações diferentes. Vidas que ainda não terminaram após renascer não entram na lista de mortes posteriores ao renascimento.
