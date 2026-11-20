# Balanceamento global do combate — 13/11/2026

A mudança foi aplicada à v2 inteira. A caverna inicial é o cenário principal de comparação; não há mais um multiplicador exclusivo dela.

## Resultado na caverna inicial

Ataques necessários contra os quatro arquétipos comuns da caverna, nível 1, equipamento inicial e sem investir no ataque básico. O lobo tem um ponto em Forma de Lobo.

| Classe / forma | Antes | Depois |
| --- | --- | --- |
| Necromante | 2 | 5–6 |
| Guerreiro | 2–3 | 5–6 |
| Druida humana | 2–3 | 6–7 |
| Arqueira | 2 | 5–6 |
| Mercenário | 1 | 5–6 |
| Mago | 2 | 5–6 |
| Druida lobo | 1–2 | 6–7 |

Habilidades medidas contra um lobo comum: Muralha de Corpos (Necromante), Estocada (Guerreiro), Corrente de Raios (Druida), Flecha Perfurante (Arqueira), Bomba (Mercenário), Bola de Fogo (Mago) e Salto Feroz (lobo). O alvo caiu em 1–2 usos, sem conceder pontos inválidos ou remover mana/recargas. O Salto foi medido no nível 4; os demais no nível 1. Isso não significa que esperar somente pela recarga da habilidade seja sempre mais rápido que intercalar básicos.

## O que mudou

- Vida-base dos arquétipos da v2: `max(96, vida anterior × 3)`, antes de wave, raridade e modificadores do modo. Dano e XP dos arquétipos permanecem iguais.
- Básicos globais: Arqueira 0,85 → 0,65; Mercenário 1,50 → 0,65; Mago 0,60 → 0,50; Garras 0,75 → 0,45. Faísca, Tiro de Osso e combo do Guerreiro mantêm dano.
- Habilidades conservam seus números de dano, mana, tempo, área e controle. Passam a ser proporcionalmente mais importantes.
- Treino e bonecos do tutorial: piso 96. Cerco: resistência aplicada à curva própria do plano, uma vez, antes do fator 9 do chefe; torres conservam seus valores.
- Valdoria: multiplicador regional de vida com piso fixo 3,5, inclusive no chefe. Dificuldades que já ultrapassam esse valor conservam a curva original. Não há escala automática pelo jogador.
- Elites, chefes baseados nos arquétipos e reforços conservam seus fatores existentes. O Rei Caído mantém sua curva própria, exceto o piso regional de Valdoria quando aplicável.

## Simulações executadas

`before.json` e `after.json` contêm 56 medições de básicos (sete classes/formas, níveis 1 e 3, quatro tipos), sete medições de habilidades, 84 encontros de entrada e 42 encontros posteriores. Nos encontros, o motor executa IA, dano, mana, XP, cura, colisões e reforços reais. Foram comparados bots parados ou tentando manter distância e esquivar, com/sem habilidades, em três sementes na entrada. As salas posteriores incluem elite, reforços e o capitão.

Na entrada, parado e usando só básicos, o bot completava 21/21 casos antes e passou a completar 6/21. Com habilidades, passou a completar 15/21. Tentando manter distância e esquivar, o bot com habilidades completou 19/21 depois do ajuste. Esses resultados mostram pressão e utilidade das habilidades; não estimam a taxa de vitória de jogadores humanos. O bot tem movimentação simples e pode se prender no cenário.

`global.json` contém **105 medições no motor real**: sete classes/formas em 15 cenários. Inclui prólogo, mundo, Itaúna, gruta, forte, Cedro, primeira fase da campanha anterior, Arena e Expedições nas waves 1/5/15, Valdoria e Cerco. Os níveis escolhidos vão de 1 a 20, com equipamento inicial. Cada amostra usa um inimigo realmente criado pelo respectivo modo e conserva sua vida já calculada; mede o alvo individual com IA desativada. Todos morreram e nenhum caiu em um ou dois básicos. Os resultados variam de 3 a 16 ações conforme classe, nível e arquétipo; o soldado do forte resiste mais que um lobo do prólogo.

Não existe mínimo artificial de acertos: itens, níveis, passivas e sinergias ainda podem permitir abates rápidos contra conteúdo inferior.

## Verificação e evidências

- Build autocontido executado; HTML com aproximadamente 90,7 MiB.
- Check em Chrome headless, arquivo local, contexto isolado: seis classes e lobo, 5–6 comandos contra o lobo inicial, zero erros de página. Capturas em fundo claro/escuro e qualidade baixa, com zoom máximo e grupo em cena. O Necromante também foi capturado com a horda.
- Testes focados de integração, regras e regressão em `final-tests.log`.
- Suíte ampla: **771 testes passaram**, registrados em `verified-suite.log`, excluindo o arquivo de testes HTTP do servidor do editor. Na tentativa ampla anterior (`global-tests.log`), seis verificações desse servidor falharam com `fetch failed` para localhost; duas expectativas de vida antiga foram atualizadas e passaram na repetição focada. Não houve alteração no servidor do editor.

## Limites

Os encontros são independentes e começam com vida/mana cheias; não representam uma travessia contínua da caverna ou uma campanha inteira. A medição global isola um alvo, sem reproduzir toda a IA e composição da sala. Não foram validadas todas as distribuições de talentos, equipamentos avançados, dificuldades máximas, economia de torres ou waves de endgame até 100. A curva exponencial das waves continua existente e merece uma passagem específica com builds completas. O aumento de resistência também torna os chefes derivados dos arquétipos mais longos.

O simulador matemático legado não representa essa mudança: `balance-simulator/run.js` continua modelando a v1. O adaptador `balance-simulator/v2-source.mjs` lê as regras atuais e acompanha o relatório global.
