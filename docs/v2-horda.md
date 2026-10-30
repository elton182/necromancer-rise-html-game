# V2 — horda em grupos (E5)

A arena 3D oferece **Grupos reais** e o antigo **Teste de carga** de 6–64
esqueletos. O segundo serve à conferência visual e não representa evocação.
O perfil novo começa sem aliados aprendidos. No menu, abra a preparação da
horda e escolha **Usar build de teste** para experimentar os cinco tipos.
Esse perfil de nível 24 é exclusivo do laboratório: não aplica o personagem
importado nem concede progressão ao jogo original. Os atributos do jogador
continuam básicos; inimigos e Fallen King ainda usam regras de treinamento.

## Preparação e ações

Seis slots aceitam Tiro de Osso, Dash e grupos aprendidos, sem duplicatas.
A capacidade usa a função vigente `summonSlotCount`, limitada aos cinco tipos
existentes. O perfil de teste equipa tiro e cinco grupos; troque um grupo por
Dash para usá-lo. As teclas 1–6 ativam os slots; C exige Dash equipado.

Preparação no menu é gratuita. Em combate, novos integrantes custam mana:
zumbi 20, esqueleto 30, arqueiro 30 e Abominação 25. Possessão custa 45 MP por corpo, ao ativar, e equipar seu slot é gratuito.
Trocar a posição dos slots preserva o grupo. Integrantes dispensados ficam
em reserva com sua saúde e estado; dispensa não apaga indisponibilidade.
Grupos com membros detonados ou sacrificados não podem ser dispensados.

Os cinco tipos usam atributos, tamanhos de grupo e passivas do perfil,
calculados pelas fontes atuais. A build de teste inicia com 10 integrantes e o slot de Possessão disponível.
O modelo da Abominação é **provisório**, derivado do zumbi no Blender,
com o rig e as animações existentes. A arte dedicada continua pendente.

## Comportamento e recuperação

Aliados guardam a região de Zephyr, perseguem alvos e retornam ao se afastar.
Navegação contorna paredes; separação reduz sobreposição. Zumbis, esqueletos
e arqueiros podem reagir a ameaças sem ganhar invulnerabilidade.
Shift + clique direito emite uma ordem de ataque/reunião por 14 segundos,
limitada à região configurada (8, 16 ou 24 unidades).

As habilidades automáticas incluem mordida com lentidão, golpe circular,
salva de flechas e rugido. Os comandos dependem das
passivas aprendidas: detonação de um zumbi, tiro forte, salto da Abominação,
possessão de cadáver e reunião dos esqueletos. A detonação remove
apenas um integrante; o salto causa dano no impacto. O boss resiste à lentidão.

Morte comum permite renascimento em 12 segundos com 50% de vida; a passiva
espectral modifica esse tempo. Sacrifício exige 20 segundos. A reanimação
manual custa 30 MP, restaura 60% de vida e respeita os bloqueios de
detonação/sacrifício. V usa o integrante elegível mais próximo. O painel
também permite reanimar durante a pausa; os relógios permanecem congelados.
Regeneração e cura compartilhada usam as passivas calculadas, sem um segundo
caminho de dano. O Pacto não ressuscita o jogador morto.

## Persistência e fontes

O snapshot nativo guarda perfil, slots, grupos, reserva, saúde, tempos de
recuperação e recargas automáticas. Menu/reinício não apagam esses estados.
Posições, alvos, ordens, flechas e efeitos são transitórios e são limpos na
troca de cena. O arquivo importado antigo continua arquivado separadamente;
seus grupos ainda não são aplicados ao treino (equipamentos importados são, desde a E7). Veja [saves](v2-saves.md).

- [Runtime](../v2/scripts/horde.mjs) e [painel](../v2/scripts/horde-panel.mjs).
- [Adaptador das fontes](../v2/tools/horde-source.cjs): definições e overrides,
  custos, comandos e habilidades automáticas vigentes.
- `horde-rules.mjs`, `horde-stats.mjs` e `shared-build.mjs` são gerados por
  `node v2/tools/build.cjs`; edite suas fontes, não apenas a saída.
- [Asset provisório](../blender/scripts/v2_abomination.py).

## Verificação

Na raiz do repositório, execute `node --test v2/tests/horde.test.mjs`.
O teste de navegador `node v2/tests/horde-browser-check.cjs` exige Playwright
e Edge. Usa armazenamento isolado, não o save pessoal.

As evidências em [review/v2/e5](../review/v2/e5/) cobrem cinco tipos, seis
slots, detonação, persistência de recuperação, reanimação, ordens, pausa,
flechas, salto e fundos claro/escuro com qualidade baixa. Regressões de
combate, movimento e saves também foram exercitadas. Controle físico,
campanha, todos os inimigos e desempenho em outras máquinas seguem pendentes.

## Possessão (Espectro)

O ID `specter` e os pontos existentes são preservados. O slot agora invoca um
Espectro dentro de um cadáver: selecione a posição com a mira e ative o slot.
Escolhe o cadáver mais próximo em até 4 unidades da mira, dentro da região da
horda e com linha livre desde Zephyr. Chefes não são elegíveis. Sem alvo válido,
sem mana ou no limite, não gasta mana nem inicia recarga.

Cada uso custa 45 MP e tem recarga base de 8 s. Passo Espectral e Cortejo dos
Mortos reduzem a recarga; maestria também se aplica. Permite 2 possuídos vivos,
com mais 2 por Cortejo dos Mortos. Não requer aprender Passo Espectral para usar.
Enquanto o slot está equipado, cadáveres comuns ficam disponíveis por 12 s.

O corpo torna-se lacaio por 60 s, mantém modelo, vida e dano básicos do inimigo,
com bônus espectrais, e segue as ordens e a região da horda. Arqueiros e magos
usam projéteis; os demais usam ataque básico de contato. Poderes especiais
hostis não são transferidos nesta entrega. O tempo congela na pausa.

O cadáver original é consumido. O possuído pode morrer antes do prazo; ao
expirar ou Zephyr morrer, desaba. Não renasce, não pode ser reanimado e não
concede XP, ouro, loot nem novo cadáver utilizável. Possuídos não entram no
snapshot de grupos/reserva e desaparecem na troca de cena, inclusive menu.

Validação: testes de horda, possessão, inimigos, saves e Grimório. O teste
`node v2/tests/possession-browser-check.cjs` confere o comportamento dentro do
HTML autocontido em Edge com Playwright; evidência em `review/v2/possession/`.
