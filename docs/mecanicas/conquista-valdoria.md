# Conquista de Valdoria

Primeira versão jogável: **Pântano da Febre Negra**. Fontes:
`scripts/endgame-model.js`, `scripts/endgame.js` e `scripts/endgame.css`.
O mapa territorial é desenhado em Canvas 2D por `scripts/endgame-map.js`.
Números iniciais, sujeitos a balanceamento com partidas completas.

## Acesso e ciclo

Na Vila de Eldrin, abra **Esc → VALDORIA**, ou interaja com a Pedra do Infinito
e escolha **Conquistar Valdoria · Pântano**. O acesso não exige terminar a campanha;
a primeira dificuldade recomenda nível 8 ou uma build equivalente.

Valdoria abre uma **tela dedicada**, com o HUD e o Relicário ocultos. O mapa fica
à esquerda, a preparação da rota à direita e o botão de entrada fixo no rodapé.
No celular, o mapa fica acima da preparação. O mapa completo se ajusta ao espaço
disponível; **Ampliar mapa** permite explorar os detalhes com rolagem opcional.
Somente a preparação pode precisar de rolagem vertical em janelas pequenas.
**Voltar à vila** ou **Esc** fecha a tela e restaura o HUD.

Escolha a dificuldade, até três maldições entre quatro ofertas e um encontro.
O mapa em pergaminho mostra fronteiras e **17 áreas**: entrada, cinco etapas de
três rotas e uma torre final. Cada área concluída abre as três alternativas da
etapa seguinte; a última etapa converge na torre. Não é preciso concluir as três
alternativas: basta uma por etapa. Rotas anteriores permanecem revisitáveis.

Cada trio contém três biomas distintos, sorteados de forma determinística entre
pântano, rio, montanha, deserto, floresta e neve. O cenário de combate usa o
bioma da rota escolhida; o rio também desenha um curso de água no mapa de combate.
As áreas concluídas pertencem à dificuldade atual. Morrer ou abandonar mantém
as áreas e rotas abertas; trocar a dificuldade reinicia esse progresso.

Uma área violeta representa a influência salva, que também aparece em percentual.

Clique em um marco ou use seus botões para ver o estado, requisitos e a prévia
de recompensas. **Entrar na rota** inicia a área selecionada com a dificuldade e
as maldições atuais. Escolher um ponto no mapa não inicia combate.
O seletor **Local do mapa** oferece os mesmos pontos por teclado e toque.
Selecionar um ponto atualiza a preparação e a recompensa no rodapé.

As expedições usam mapas amplos, com oito grupos e um líder no final da trilha.
Vencer o líder conclui a tentativa; os portais devolvem à vila e, após uma
vitória, reabrem o mapa para escolher a próxima rota. É possível
explorar o restante do mapa antes de sair.

O sistema usa o mesmo personagem e mochila, mas **não altera o recorde, as
waves desbloqueadas ou a seleção da Arena**.

## Influência e conquista

| Marco | Desbloqueio |
|---|---|
| 0% | Expedição do Brejo |
| 30% | Boticário Apodrecido |
| 60% | Guardiã dos Afogados |
| 100% e os dois tenentes derrotados | Abade da Decomposição, na fortaleza |

Além dos requisitos de influência, é necessário alcançar a área pelo caminho
do mapa. A entrada e as etapas 1, 3 e 5 são expedições; a etapa 2 contém os
caminhos até o Boticário, e a etapa 4 contém os caminhos até a Guardiã. A torre
abriga o Abade. Uma passagem sem maldições chega a 100% antes da torre.

Uma expedição concluída concede **20 + 2 × intensidade** de influência, até 100%.
A primeira vitória sobre cada tenente concede 10%; repetições não concedem
influência. A influência é entregue pela conclusão, não por inimigos abatidos.

A preparação mostra os requisitos da rota selecionada. Com 100% e tenentes
pendentes, lista exatamente quais ainda precisam ser derrotados. Após vencer
ambos e percorrer o caminho, a torre fica disponível.

Morrer ou abandonar não remove influência nem vitórias anteriores. A primeira
vitória na fortaleza registra a conquista e concede uma única
vez o **Fragmento da Pestilência**.

Não há teto de dificuldade em Valdoria. Digite um inteiro a partir de 1 e use
**Aplicar** (ou Enter); é possível pular níveis conforme a força da build.
Trocar o nível zera influência, tenentes, conquista atual e rotas, iniciando
um novo percurso até a torre. Isso vale também ao voltar para um nível anterior.
Aplicar o mesmo nível preserva o progresso atual.

Personagem, equipamentos, ouro, maestrias, Fragmento da Pestilência e recorde
da maior dificuldade vencida são preservados. Vencer a torre em D libera D+1.
A maior dificuldade liberada inclui níveis superiores escolhidos manualmente.
Ao abrir a tela, essa maior dificuldade já fica selecionada. Se ela for diferente
da dificuldade do mapa atual, o novo mapa começa do zero. A seleção e os recordes
persistem após fechar ou recarregar o jogo.

O cálculo de inimigos e o nível do loot regional continuam crescendo além do
teto de waves da Arena; equipamentos regionais acima do nível 1000 são mantidos
ao salvar e importar.
O fragmento é um marco de progresso; outros territórios, o chefe dos fragmentos
e o serviço de alquimia ainda não estão implementados.

## Maldições

| Maldição | Debuffs | Intensidade |
|---|---|---:|
| Fonte Seca | −40% de regeneração de mana | 1 |
| Carne Debilitada | −20% de vida máxima e −50% de regeneração de vida | 2 |
| Poder Profanado | −20% do dano de Zephyr e da horda | 3 |
| Lodo nos Pés | −15% de movimento de Zephyr | 2 |
| Horda Corroída | −25% de vida máxima das invocações | 2 |
| Vitalidade Extinta | Sem regeneração de vida de Zephyr e −20% de regeneração de mana | 2 |

O mapa atual mantém sua oferta sorteada e seleção. Vencer qualquer
encontro renova a oferta e limpa a seleção. Trocar a dificuldade inicia novas
ofertas, sem restaurar seleções anteriores. Morte, abandono,
recarga e troca de menu preservam a oferta. Não existe rerrolagem paga.

Os efeitos de mesmo atributo se multiplicam. Fonte Seca e Vitalidade Extinta
juntas deixam a regeneração de mana em 48% do normal. Trocar equipamento,
habilidades ou subir de nível não remove os debuffs nem os acumula novamente.
Sair da tentativa restaura os atributos normais preservando a proporção de vida.
As maldições também se aplicam a tenentes e à fortaleza.

## Recompensas

`D` = dificuldade regional; `I` = soma da intensidade das maldições escolhidas.

| Intensidade | Patamar | Bônus de nível do loot | Chance de épico do chefe | Chance de Osso Carcomido |
|---|---:|---:|---:|---:|
| 0–1 | 0 | 0 | 15% | 0% |
| 2–3 | 1 | +1 | 25% | 0% |
| 4–5 | 2 | +2 | 40% | 12% |
| 6 ou mais | 3 | +3 | 60% | 25% |

- Nível de todos os equipamentos regionais: `4 + 6 × (D − 1) + bônus do patamar`.
- Chefe garante uma peça rara ou épica; o cajado especial é uma chance separada.
- Conclusão concede `60 × D + 15 × I` ouro e `180 × D + 30 × I` XP,
  além das recompensas dos inimigos.
- O loot usa a mochila, a comparação, os slots e o filtro de raridade existentes.
  Com filtro em apenas épicos, uma peça especial rara fica oculta até ajustar o filtro.

Nenhuma maldição é necessária para conquistar a região ou obter seu fragmento.

## Combate regional

- Poças de decomposição anunciam sua área antes de causar dano periódico.
- Alguns inimigos infectados deixam uma poça após morrer, com 1,5 s de aviso.
- **Boticário:** três caldeirões destrutíveis ampliam a quantidade de poças
  geradas por seu ataque. Destruí-los reduz a pressão no campo.
- **Guardiã:** anuncia uma erupção no local de Zephyr, deixando contaminação
  e convocando dois afogados. Sair da marca evita o impacto.
- **Abade:** cria três restos destrutíveis e prepara uma canalização de 4 s.
  Cada resto sobrevivente restaura 6% da vida máxima do chefe. Esses restos
  são objetos do encontro, separados dos aliados reanimáveis.

Líderes usam os sprites existentes do Carcereiro como visual inicial, com regras
de combate regionais próprias. Caldeirões e restos são desenhados no Canvas.

## Osso Carcomido e Podridão

Cajado raro ou épico disponível a partir de intensidade 4. Equipado, faz os
acertos reais do **Tiro de Osso** aplicarem Podridão em qualquer modo do jogo.

- Até cinco cargas por inimigo, duração de 5 s renovada por novos acertos.
- Um pulso por segundo: 12% do dano bruto do projétil por carga.
- Enquanto o efeito está ativo, a potência usa o maior projétil que o aplicou.
- O dano periódico respeita a penalidade de Poder Profanado.
- As cargas aparecem sobre o inimigo. O efeito não se espalha automaticamente.
- A propriedade especial é preservada ao salvar, importar e migrar equipamentos.

Este é o primeiro efeito especial de peste; variantes de zumbi e Explosão
Necrótica continuam como propostas no plano de endgame.

## Save e verificação

`player.conquest.routes.completed` registra os pontos concluídos. Saves anteriores
recebem um caminho compatível com sua influência e vitórias sobre os tenentes;
o histórico das conquistas é preservado. Ao abrir a maior dificuldade liberada,
um novo mapa é iniciado caso ela seja diferente do nível salvo.

`player.conquest` salva influência, tenentes, conquista, fragmento, maior
dificuldade vencida e ciclos/seleções de ofertas. Saves anteriores começam sem
progresso regional. Recarregar encerra a tentativa, preservando o progresso
concluído; não restaura o mapa em combate.

```powershell
node scripts/sync-equipment.js
node --test scripts/endgame.test.js scripts/equipment.test.js scripts/expedition.test.js
node scripts/endgame-browser-check.js
```

A verificação em navegador exige Playwright e Chrome. Usa contexto isolado e não
modifica o save do jogador. Capturas ficam em `review/endgame-*.png`.
