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
zumbi 20, esqueleto 30, arqueiro 30, espectro 45 e Abominação 25.
Trocar a posição dos slots preserva o grupo. Integrantes dispensados ficam
em reserva com sua saúde e estado; dispensa não apaga indisponibilidade.
Grupos com membros detonados ou sacrificados não podem ser dispensados.

Os cinco tipos usam atributos, tamanhos de grupo e passivas do perfil,
calculados pelas fontes atuais. A build de teste possui 12 integrantes.
O modelo da Abominação é **provisório**, derivado do zumbi no Blender,
com o rig e as animações existentes. A arte dedicada continua pendente.

## Comportamento e recuperação

Aliados guardam a região de Zephyr, perseguem alvos e retornam ao se afastar.
Navegação contorna paredes; separação reduz sobreposição. Zumbis, esqueletos
e arqueiros podem reagir a ameaças sem ganhar invulnerabilidade.
Shift + clique direito emite uma ordem de ataque/reunião por 14 segundos,
limitada à região configurada (8, 16 ou 24 unidades).

As habilidades automáticas incluem mordida com lentidão, golpe circular,
salva de flechas, passagem espectral e rugido. Os comandos dependem das
passivas aprendidas: detonação de um zumbi, tiro forte, salto da Abominação,
reposicionamento espectral e reunião dos esqueletos. A detonação remove
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
