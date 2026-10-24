# Zephyr — revisão das habilidades do Ato I

Status: conjunto básico implementado na versão Canvas. Sintaxe e 13 cenários de regras aprovados por `node game_check.js`; validação visual e balanceamento por partidas ainda pendentes.

Revisão do documento `zephyr_habilidades_ato_1.md`, comparada com a versão atual em `necromancer-canvas.html`. Os números abaixo são hipóteses de protótipo, não resultados de testes de combate.

## Parecer

Aplicar o conceito. A sequência dano direto → invocação → controle → sacrifício reforça a identidade do necromante e aproveita as quatro fases existentes. A troca exige alterar comportamento, progressão, interface e saves; apenas renomear Nova e Barreira manteria as mecânicas antigas.

As evoluções propostas ficam para uma segunda etapa. Primeiro validar o conjunto básico contra as salas da Cripta, as seis ondas da Floresta e o Capitão.

## Conjunto básico recomendado

| Habilidade | Entrada | Regra para o primeiro protótipo | Desbloqueio |
|---|---|---|---|
| Raio Necrótico | `1` seleciona; clique dispara | 40 de dano base, 20 MP, recarga própria de 0,5 s, alcance 9, um alvo por projétil | Ao entrar na Cripta |
| Invocação de Zumbis | `Q` abre a roda | Preservar a invocação atual, inicialmente só com zumbis | Ao entrar na Floresta |
| Mãos dos Mortos | `2` seleciona; clique posiciona | 35 MP, raio 3,5, alcance de colocação 9, duração 5 s, lentidão de 40%, zero dano, recarga própria de 12 s | Ao entrar na Trilha |
| Escudo de Carne | `Espaço` ativa imediatamente | 15 MP + um zumbi vivo; absorção de 70% do HP máximo dele, duração 8 s, recarga própria de 12 s | Ao entrar no Posto |

`1` e `2` continuam sendo seleção de magia, conforme o padrão atual do jogo. Não transformar essas teclas em lançamento imediato sem também revisar a mira e o controle.

Desbloquear no início da fase permite que o jogador aprenda e use a habilidade durante o desafio. Não depender da recompensa de conclusão.

## Decisões que faltavam no conceito

### Raio e economia de mana

O raio atual custa 30 MP, causa `spellDmg × 1,4` e usa velocidade 14 e vida útil de 2 s. O novo raio precisa retirar esse multiplicador e limitar explicitamente a distância percorrida a 9 unidades; trocar apenas o custo não atende à proposta. Manter upgrades de dano como bônus explícitos e reservar perfuração para evolução.

Com regeneração básica de 4 MP/s, 20 MP equivalem a 5 s de regeneração. Disparar a cada 0,5 s consome 40 MP/s, ou 36 MP/s líquidos. Logo, 0,5 s é uma janela de explosão de dano, não uma cadência sustentável. Mãos + Escudo custam mais 50 MP, antes de invocações.

Começar com os valores do documento, medir tempo sem mana e disponibilidade de poções na Cripta. Se houver espera frequente sem ação útil, testar raio a 12–15 MP antes de aumentar a regeneração global, que também baratearia todas as outras habilidades. Não aumentar o HP dos inimigos para compensar a perda do dano em área antes de testar as salas existentes.

### Mãos dos Mortos

- Área fixa no chão, com prévia do raio e da distância antes de lançar; clique fora do alcance falha sem consumir recursos.
- Lentidão existe apenas enquanto o inimigo está dentro da área. Áreas sobrepostas usam o maior efeito, sem somar percentuais.
- Aplicar multiplicador à velocidade de movimento, preservando a velocidade base; remover o efeito não pode apagar outros modificadores.
- Para chefes, propor 20% de lentidão somente no deslocamento normal. Investidas, telegráficos e tempos de ataque continuam com seus valores próprios.
- Não adicionar imobilização ou dano ao conjunto inicial. Usar mãos visíveis e borda de área legível sobre os cenários.
- Limpar áreas ao morrer, reiniciar ou trocar de fase; pausa congela duração e recarga.

### Escudo de Carne

- Seleção automática: zumbi vivo com menor proporção `hp / maxHp`; empate resolvido pela menor distância de Zephyr. Esqueletos e outros minions não são elegíveis.
- Calcular `floor(maxHp × 0,7)` usando o HP máximo efetivo do zumbi, incluindo seus upgrades. Com os 130 HP base definidos atualmente ao final do arquivo, isso gera 91 de escudo antes de bônus; com 180 HP, gera 126.
- Validar mana, recarga e vítima antes de qualquer cobrança. Uma ativação inválida não gasta MP, zumbi ou recarga.
- Sacrificado ocupa sua capacidade de invocação e fica indisponível por 20 s de combate ativo. Durante esse período, `R` e reduções de recuperação não o antecipam; ao terminar, volta com 30% de HP, como o renascimento automático atual.
- Essa recuperação é maior que os 12 s de morte normal atuais. Reter a capacidade evita substituir imediatamente o sacrificado por uma nova invocação.
- Sacrifício não dispara o efeito de morte de Pacto de Sangue. Separar a causa da morte evita uma explosão gratuita a cada defesa; uma sinergia futura pode autorizar isso explicitamente.
- Novo escudo substitui o restante, sem acumular absorção. Remover a redução de dano dos minions associada à antiga barreira, caso aplicada, para manter o benefício básico limitado à proteção de Zephyr.
- Interface informa absorção restante, duração, recarga e recuperação do zumbi. Usar “Escudo de Carne” como nome principal em português.

### Alternativa sem zumbi

Propor para teste: 15 MP + 15% do HP máximo de Zephyr, gerando escudo de 25% do HP máximo por 8 s, com a mesma recarga de 12 s. Arredondar o custo de HP para cima e a absorção para baixo; bloquear se o pagamento deixar menos de 1 HP.

A alternativa só ocorre quando não existe zumbi vivo elegível e deve aparecer no tooltip antes da ativação. Não selecionar essa modalidade automaticamente por falta de mana. É uma proposta nova desta revisão, ainda sem validação de balanceamento.

## Aplicação no código atual

| Área | Alteração necessária |
|---|---|
| `SPELL_UPGRADES`, árvore de habilidades e estado inicial | Raio como raiz; Mãos como controle posterior; substituir referências e pré-requisitos de Nova; revisar Bastião para não multiplicar silenciosamente o novo escudo |
| `castRaio`, `updateBolts`, `castSpell` | Dano, custo, distância máxima e recarga própria; registrar Mãos no dispatcher |
| `castBarrier`, absorção de dano e desenho da barreira | Substituir o custo e a fórmula, selecionar vítima e representar o sacrifício |
| `killMinion`, `tryReanimate`, atualização de minions | Distinguir morte comum e sacrifício; respeitar bloqueio e capacidade ocupada |
| Atualização e desenho de efeitos | Área persistente de Mãos, lentidão reversível e limpeza de estado |
| `CAMP_GATE`, `CAMP_STAGES`, `campGrant`, `campSyncSlots` | Conceder Raio/Mãos/Escudo nas fases 1/3/4 e preservar invocação na fase 2 |
| `TUT_DEFS`, história e mapa | Substituir aulas de Nova, raio perfurante e barreira; ensinar o custo do sacrifício antes do chefe |
| Barra, menu de pausa, teclado e gamepad | Atualizar ordem, nomes, custos, descrições, seleção e indicadores de recarga em todas as entradas |
| Save/load e resets | Versionar a migração e limpar estados temporários sem apagar o personagem |
| `README.md` | Atualizar controles e descrição do conjunto inicial |

Trabalhar na versão Canvas indicada pelo README e usada pelo `index.html`. As versões Three.js e demo são históricas.

## Saves e modo livre

Não fazer uma substituição global de `nova` por `raio`: saves antigos podem conhecer ambos e possuir upgrades distintos.

Para saves de campanha, reconstruir os desbloqueios considerando fases concluídas e a fase já acessível: Raio desde a fase 1, invocação a partir da 2, Mãos a partir da 3 e Escudo a partir da 4. Manter os demais atributos e recursos. Mapear a seleção antiga para uma habilidade válida.

Preservar upgrades de Raio compatíveis. Reembolsar o custo histórico dos upgrades de Nova removidos e de melhorias de barreira incompatíveis, calculando cada nível pela curva de preço existente. Não converter dano de Nova em lentidão sem uma regra explícita. Registrar versão de migração para impedir reembolsos repetidos.

No modo livre, usar o mesmo conjunto e a mesma ordem de teclas; disponibilizar Mãos e Escudo pela árvore. Chuva de Ossos e Explosão de Almas continuam fora do Ato I, nas posições 3 e 4. A migração do modo livre deve preservar aquisições compatíveis e reembolsar as removidas.

## Validação antes de considerar aplicado

1. Nova campanha: cada habilidade é concedida antes do seu tutorial; nenhuma pode ser comprada antecipadamente na campanha.
2. Raio: um alvo sem perfuração, 9 unidades de alcance, recarga respeitada por mouse, teclado e controle; falhas não gastam mana.
3. Mãos: inimigos entram e saem recuperando a velocidade correta; sobreposição não acumula; investida do Capitão mantém o telegráfico previsível.
4. Escudo: vítima correta, fórmula baseada no HP máximo e absorção correta quando o golpe excede o restante do escudo.
5. Sacrifício: `R`, upgrades de recuperação e novas invocações não anulam a indisponibilidade; Pacto não explode por acidente.
6. Alternativa de HP: custo informado, sem morte pela cobrança, mesma recarga e sem acúmulo de escudos.
7. Pausa, morte e transição: não deixam lentidão residual, efeitos órfãos ou zumbis presos em recuperação.
8. Save antigo: progresso preservado, seleção válida e migração/reembolso executados apenas uma vez.
9. Jogar Cripta, Floresta e Capitão com magia, horda e combinação das duas; observar tempo sem mana, tempo para derrotar grupos e frequência de sacrifício.

O arquivo `game_check.js` agora valida sintaxe e executa funções reais do jogo em cenários isolados de combate e migração. A verificação visual pelo navegador integrado foi bloqueada pela política de URLs locais (`file://`); os números ainda precisam de testes em uma partida completa.
