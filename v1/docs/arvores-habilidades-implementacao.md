# Minions e Profana — integração ao jogo

## Progressão

42 nós, seis escolas, 12 especializações finais, 3 pontos por subida de nível. Nível inicial 1, sem pontos; limite 60. Um orçamento compartilhado entre as duas árvores. Nós comuns têm 5 ranks; finais, 1. Etapas nos níveis 1, 6, 12 e 24, com 2 pontos no pré-requisito direto. Duas rotas intermediárias podem coexistir; finais irmãos são exclusivos.

Tiro de Osso e Dash são habilidades básicas: funcionam sem rank, mas exigem investimento para suas sinergias e descendentes. O personagem começa sem minions. Zumbis exige ao menos 1 ponto no nó, seguido de equipar a evocação em um slot. Saves sem esse investimento perdem os antigos zumbis gratuitos e seus slots/reservas; quem já investiu mantém a evocação. A campanha não concede nem bloqueia skills ou invocações. Muralha e Escudo são aprendidos pela árvore, como as demais habilidades. Os tutoriais antigos que exigiam skills concedidas por fases foram retirados; movimento, comandos e avisos de combate continuam.

## Combate

- Carne: Zumbis e Abominações compartilham dano e vida; a Abominação é uma evocação própria desbloqueada no ramo. Colosso libera o salto. A fusão antiga foi desativada.
- Ossos: guerreiros e arqueiros compartilham bônus de escola. As especializações ampliam guerreiros resistentes ou arqueiros com tiro comandado.
- Espíritos: espectros drenam vida com base no dano efetivo; Vínculo compartilha parte da cura efetivamente recebida com Zephyr. Passo Espectral reposiciona o grupo dentro da região de comando. Cortejo aumenta integrantes e reduz recuperação normal.
- Profana/Ossos: Tiro e Chuva possuem sinergia recíproca, Perfuração aumenta os alvos, Muralha ganha duração e resistência contra projéteis.
- Profana/Sangue: Escudo herda a vida do zumbi sacrificado; Vitalidade melhora a vida de Zephyr. Pacto cura somente mortes comuns, excluindo sacrifício e detonação. Explosão Necrótica usa mana e recebe as sinergias compartilhadas de explosão.
- Profana/Sombras: Dash recebe alcance e recarga; Véu protege brevemente após a evasão. Meditação melhora reserva e regeneração de mana. Maldição custa 25 MP, alcança 9 unidades, afeta raio 4 por 6 segundos e tem recarga de 8 segundos. Aura soma dano da horda dentro de 8 unidades.

Bônus de dano são aditivos, calculados sobre os atributos básicos do tipo e do nível. Sinergias usam apenas ranks diretos, sem realimentação. Mana continua como recurso de combate; ouro compra consumíveis. Não há coleta ou cobrança de souls. Melhorias avulsas de personagem, magias e horda foram desativadas e retiradas da navegação.

## Saves

`skillTreeVersion`, `skillRanks` e `skillGrants` registram a nova progressão. A migração passa depois das migrações anteriores de habilidade e grupos. Saves legados recebem ranks vazios e exatamente `3 * (level - 1)` pontos, sem conversão de souls em pontos adicionais. Bônus antigos são removidos e atributos reconstruídos a partir do nível; vida e mana preservam sua proporção nos atributos de Zephyr.

Ouro, inventário, experiência, campanha e grupos ainda desbloqueados são preservados. Slots de habilidades removidas ficam vazios, disponíveis para reequipar depois de aprender novamente. Recuperações de integrantes retidos são conservadas. As antigas liberações narrativas são retiradas dos grants; os ranks investidos permanecem. A migração é idempotente; ao carregar um save legado, uma cópia é guardada em `<SAVE_KEY>_before_skill_trees`, quando o armazenamento permite.

Redistribuição custa 20 de ouro por ponto devolvido, na vila ou no mapa, com bloqueio durante recuperação de sacrificados/detonados. Devolver pré-requisitos também devolve e cobra os descendentes, removendo evocações que deixaram de estar aprendidas. Não há cobrança nem alteração da build quando falta ouro. Investimentos e devoluções na vila/mapa são salvos automaticamente; em combate seguem as regras normais de salvamento.

Inimigos comuns deixam `max(2, round(xp * 0.35))` de ouro; chefes deixam o triplo. Não há drop em alvos de treino ou morte duplicada. O ouro usa um item dourado próprio no chão, duração de 45 segundos e coleta a menos de 1,8 unidades. Poções mantêm suas regras e ouro não restaura mana.

`skillTutorialState` registra o tutorial do primeiro nível ganho: `new`, `pending`, `allocating` ou `done`. Ao alcançar nível 2, pausa e apresenta um diálogo curto com acesso ao Grimório. Uma faixa orienta os três primeiros investimentos; depois o tutorial termina. É possível dispensá-lo. Saves já acima do nível 1 não recebem o tutorial retroativamente.

`skillEquipTutorialSeen` e `skillEquipTutorialPending` registram a orientação de slots. O primeiro desbloqueio de uma ação ainda não equipada agenda um diálogo que pausa o jogo e permite escolher entre os seis slots e atalhos reais. Slots vazios recebem destaque. A compra normal via `equipActionSkill` valida mana e recuperação de grupos antes de concluir o tutorial; uma tentativa inválida mantém o diálogo aberto com orientação. Ao concluir ou escolher alocar depois, a orientação dessa ação não reaparece automaticamente. Passivas e ranks adicionais não disparam o diálogo. Um botão nos detalhes das ações aprendidas e não equipadas permite reabrir a ajuda. A pendência é validada no carregamento do save e retomada quando aplicável.

O menu da árvore usa até 1800px / 98vw, remove a coluna de retrato nessa tela e mantém os controles no rodapé. O diagrama tem 390px de altura e os bônus agregados ficam recolhidos. A rolagem principal usa toda a altura disponível, sem o limite antigo do menu de status. Barras de rolagem possuem cores, trilho e puxador próprios, com suporte a Firefox e Chromium.

## Fontes e verificação

- `build-simulator/model.js`: grafo, descrições, pré-requisitos, exclusividade e modificadores compartilhados.
- `scripts/skill-trees.js`: adaptação ao combate, menu, progressão e migração.
- `scripts/skill-trees.css`: moldura e diagrama integrados à pausa.
- `node scripts/sync-skill-trees.js`: incorpora o modelo, regras e estilo no HTML único do jogo. A geração é idempotente e não exige dependências em tempo de execução.
- `node game_check.js`: cenários do motor existente, com expectativas de menu e recompensas atualizadas. Parte dos cenários isola regras legadas; os testes abaixo exercitam os adaptadores novos.
- `node --test scripts/skill-trees.test.js build-simulator/model.test.js`: migração, persistência do modelo, orçamento, bifurcações, sinergias, estatísticas de evocação e efeitos de combate novos.
- `scripts/fixtures/legacy-level30.json`: personagem sintético para validar a importação pela interface, em origem local isolada.

Os números são iniciais. Os testes confirmam as regras; equilíbrio entre builds e ritmo de progressão precisam de partidas completas.
