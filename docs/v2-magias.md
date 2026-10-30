# V2 — Magias equipáveis (E6b)

Segunda parte da E6. Chuva de Ossos, Explosão Necrótica, Muralha de Corpos,
Escudo de Carne e Maldição da Fraqueza agora podem ser equipadas nos seis slots
da arena, junto do Tiro de Osso, do Dash e das evocações da [horda](v2-horda.md).
As regras vigentes de cada magia estão em [habilidades](mecanicas/habilidades.md);
este guia registra como a v2 as integra e o que ainda falta.

## Como experimentar

Com **Grupos reais**, abra **Preparar e comandar a horda** e use **Usar build de
teste de magias**. O perfil de nível 24 (`SPELL_TEST_PROFILE`) equipa Chuva,
Explosão, Muralha, Escudo, Maldição e Dash. Para testar o sacrifício do Escudo,
troque o Dash por Zumbis no menu. A build não altera o save do jogo anterior.

Use 1–6 (ou Q E R T) ou os botões **Ativar** dos slots. A mira é o ponto do
chão sob o cursor; clicar no botão de um slot também mira onde o mouse está.
O HUD mostra o escudo restante e as recargas em andamento.

## Regras e fontes

`v2/tools/spell-source.cjs` lê custos, recargas, contagens, multiplicadores e
durações das funções `castChuva`, `castExplosao`, `castHands`, `castBarrier` e
`skillCastCurse`, incluindo os overrides de `scripts/skill-trees.js`. O
empacotador grava o resultado em `v2/scripts/spell-rules.mjs`; não edite esse
arquivo à mão. Se uma das funções mudar de forma, o build falha com
"Revisar regra de magia".

Cada lançamento valida tudo antes de pagar: slot equipado, nó aprendido, cena
de treino sem pausa, Zephyr vivo, recarga zerada, mana suficiente, mira válida
dentro de 9 u (exceto o Escudo, lançado em Zephyr) e, sem zumbi vivo, vida para
pagar o Escudo. Uma falha não cobra mana nem inicia recarga.

A recarga segue a mesma ordem dos wrappers do jogo atual: base, depois redução
de recarga dos itens com piso de 50% da base (6 s no Escudo), depois maestria.
Trocar o slot não reinicia nem zera uma recarga em andamento.

Os bônus vêm do mesmo modelo de árvore e maestria da [E6a](v2-grimorio.md),
inclusive sinergias diretas: no perfil de teste, 2 pontos em Tiro somam +8% ao
dano da Chuva.

| Magia | Integração na v2 |
| --- | --- |
| Explosão Necrótica | Dano imediato no lançamento, uma única vez, em todos os inimigos no raio. O anel é só visual e não agenda outro impacto |
| Chuva de Ossos | Sete fragmentos com dispersão aleatória, como no jogo atual. Cada um causa dano só depois de atraso e queda; o resultado independe do tamanho do passo de simulação e a pausa congela as quedas |
| Muralha de Corpos | Caixa orientada perpendicular à mira. A varredura impede que inimigos a atravessem em passos longos; inimigos no ar a ignoram. Dano de contato pulsa a cada 0,5 s até acabar a duração ou a resistência |
| Escudo de Carne | Sacrifica o zumbi equipado com menor proporção de vida (empate: o mais próximo) pelo caminho da [horda](v2-horda.md): 20 s de indisponibilidade, sem Pacto de Sangue. Sem zumbi, cobra 15% da vida máxima e falha se isso matar. Não expira; placas de carne e costelas mostram a absorção restante, com pulsação no impacto e aviso abaixo de 20% |
| Maldição da Fraqueza | Marca inimigos no raio e renova a duração sem acumular. A redução é aplicada no caminho comum de dano quando o atacante está amaldiçoado, valendo contra Zephyr e aliados |

Adaptações em relação ao jogo atual:

- A Maldição do jogo atual altera o dano do inimigo (`e.dmg`) e o restaura ao
  terminar. A v2 não altera o atributo: aplica a redução no instante do dano.
  O resultado é o mesmo para ataques diretos e não há estado para restaurar.
- `absorbWallProjectile` implementa a interceptação de projéteis hostis pela
  Muralha e, desde a E8, recebe os projéteis reais dos inimigos. Flechas aliadas e o Tiro de Osso atravessam o
  muro, como no jogo atual.

## Encerramento e saves

Morte, volta ao menu, reinício e carregamento removem quedas pendentes,
muralhas, maldições, escudo e recargas. O save guarda o loadout e a recuperação
dos integrantes sacrificados, nunca entidades da luta. Devolver um nó do
Grimório retira dos slots as magias que deixarem de estar disponíveis.

## Visual

Os ossos caindo usam o mesmo GLB do Tiro de Osso, com um disco escuro e um anel
marcando onde cada um vai cair. A Muralha usa sete cópias do zumbi, com contorno
e sombra no chão. O escudo usa seis placas 3D de carne e costelas ao redor de Zephyr, com lacunas para preservar a silhueta; a Maldição mostra
"Fraqueza · Ns" sobre o inimigo. A sombra sob Muralha e Chuva foi adicionada
porque, no fundo claro, só os contornos ficavam pouco legíveis.

## Verificação

Comandos na raiz do repositório:

```powershell
node v2/tools/build.cjs
node --test v2/tests/spells.test.mjs
node v2/tests/spells-browser-check.cjs
```

O check de navegador usa Playwright com Edge e armazenamento isolado, e mira
movendo o cursor até o ponto do chão. Ele confere: atalho e botão do slot, dano
imediato da Explosão, mana insuficiente, ossos visíveis antes do impacto,
bloqueio da Muralha, custo de vida e sacrifício do Escudo, rótulo da Maldição,
limpeza na morte, save/reload, preservação de `necromancer_v2` e ausência de
erros. Evidências em [review/v2/e6b](../review/v2/e6b/).

## Limites

- Vida, mana e dano mágico de Zephyr ainda são os valores básicos do treino
  (100 de vida, 80 de mana). Atributos e equipamentos do personagem importado
  entram na E7.
- Abates concedem XP de maestria ([Grimório](v2-grimorio.md#xp-de-maestria-por-abates)),
  mas ainda não XP do personagem, ouro ou drops (E7).
- Os inimigos e o boss ainda são de treino. Sem comparação de balanceamento
  nem áudio das magias.
- O piscar do escudo não é exercitado no check automático. A legibilidade foi
  avaliada em capturas headless, não em hardware de referência.

## Lança Sepulcral carregável (v2)

A especialização `lance` transforma o Tiro de Osso. Com o tiro no slot do clique
esquerdo, segure para carregar e solte para disparar. O gatilho direito do
controle usa o mesmo comportamento. Ativação por tecla ou botão de slot faz
um disparo de carga mínima. A carga não gasta mana; soltá-la paga o custo
normal do Tiro uma única vez e inicia sua recarga normal.

O limite de carga é 1,6 s. A montagem cresce de 3 a 11 ossos em V, com a ponta
voltada à mira. O conjunto avança inteiro em linha reta, sem dispersar em
leque. A carga aumenta alcance de 6 a 16 u, meia largura da formação de 0,55
a 1,9 u, dano de ×1 a ×2,5 sobre o Tiro especializado e perfurações base de 2
a 6, somadas às da árvore. O bônus anterior da especialização continua na
fórmula; esses números são o balanceamento inicial da nova mecânica.

Estilhaços não cria três cópias da Lança: seu bônus de dano permanece, mas
há uma única formação. Cada inimigo recebe dano só uma vez por disparo,
mesmo tocando vários ossos. A colisão varre cada osso entre quadros. Mantém
a regra do Tiro para sólidos (atravessa-os); a prévia mostra o corredor.

Pausa, morte, troca de cena, Dash, transformação e perda da especialização
cancelam a carga sem disparar nem cobrar mana. Durante a carga o jogador
pode mover e ajustar a mira. Carga não é persistida. Fontes: `combat.mjs`,
`input.mjs`, `session.mjs`, `app.mjs` e `renderer.mjs`, em `v2/scripts/`.

O Escudo de Carne mantém custo, sacrifício e absorção. O novo GLB vem de
`blender/scripts/flesh_shield.py`, com seis placas e costelas animadas; placas
somem em etapas conforme a absorção cai. Impactos contraem/pulsam a proteção;
o anel no chão reforça o aviso abaixo de 20%. Não cobre o rosto do jogador.

Verificação específica: `node --test v2/tests/lance.test.mjs` e
`node v2/tests/combat-rework-browser-check.cjs` (Playwright + Edge).
Capturas em `review/v2/combat-rework/`. Balanceamento em partidas reais
continua pendente.
