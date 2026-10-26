# Maestrias das habilidades

Cada uma das **12 habilidades equipáveis** tem nível e experiência próprios,
além da progressão do personagem, do Grimório e dos equipamentos. Acesso:
**ESC → Habilidades → Maestrias**. O nível também aparece nos slots do HUD.

Há **seis slots de especialização, vinculados diretamente aos seis slots da
barra de combate**. Somente as habilidades aprendidas que ocupam esses slots
ganham XP, permitem distribuir pontos próprios e ativam os bônus de maestria.
Trocar uma habilidade na barra troca também a especialização daquele slot.
A tela mostra os seis slots no topo e a árvore do slot selecionado abaixo;
slots vazios permitem escolher uma habilidade pelo seletor já usado no HUD.

Fontes: `scripts/skill-mastery-model.js`, `scripts/skill-mastery.js` e
`scripts/skill-mastery.css`. O jogo publicado continua num HTML independente;
`node scripts/sync-equipment.js` incorpora os módulos e as pontes de save.

## Experiência

- Começa no nível **1**, máximo **20**. Saves existentes começam com maestrias
  no nível 1 e preservam o personagem, os pontos do Grimório e os equipamentos.
- Toda concessão válida de XP do jogo concede a mesma quantidade para **cada
  habilidade aprendida e equipada**, sem dividir entre os slots. Slots vazios e
  habilidades bloqueadas não recebem XP; duplicatas não recebem duas vezes.
- Não depende de apertar o botão, causar dano ou acertar o último golpe.
  Dash, Escudo e Maldição evoluem pela mesma regra das evocações e magias.
- A XP necessária ao próximo nível é `piso(80 × nívelDaMaestria^1,65)`.
- Uma habilidade abaixo de `mínimo(20; teto(nívelDoPersonagem / 3))` ganha XP
  em dobro até alcançar esse patamar. A XP restante de uma recompensa grande
  volta à taxa normal ao cruzar o patamar.
- Personagens no nível 60 continuam ganhando XP de maestria, mesmo com a
  progressão do personagem encerrada.
- Desequipar, morrer ou devolver o desbloqueio no Grimório preserva o nível,
  a XP e os pontos próprios. Ao reaprender, a habilidade recupera a maestria.
  Fora da barra, o progresso fica congelado e os bônus de maestria ficam
  dormentes. Reequipar reativa a mesma progressão, sem pagar ou reiniciar níveis.
- Nas evocações, o progresso pertence à habilidade do grupo inteiro. Morte,
  explosão, sacrifício e renascimento dos aliados não retiram experiência.

## Crescimento automático

Os valores abaixo são ganhos por nível **após o primeiro**. Somam dentro da
maestria e multiplicam os atributos calculados com personagem, Grimório e itens.
São valores iniciais de balanceamento.

| Habilidade | Ganho automático por nível |
|---|---|
| Zumbis, Guerreiros, Arqueiros, Espectros, Abominação | +3% dano, +4% vida |
| Tiro de Osso, Chuva de Ossos, Explosão Necrótica | +3% dano |
| Muralha de Corpos | +3% dano, +4% resistência |
| Escudo de Carne | +4% absorção |
| Dash | +1% distância, +0,5% redução de recarga |
| Maldição da Fraqueza | +2% duração |

A vida dos aliados mantém a proporção atual quando os atributos mudam. Aliados
mortos continuam mortos; recargas já em andamento não são reiniciadas.

## Árvores próprias

Cada subida de nível concede **1 ponto exclusivo daquela habilidade**, totalizando
19 pontos no nível 20. Não concede nem consome os pontos atuais do Grimório.
Cada árvore possui **três ramos, com dois nós por ramo**. Ramos podem ser
misturados. Nós avançados exigem maestria 6 e 2 pontos no fundamento daquele ramo.

Os valores nas tabelas são por ponto. Cada nó aceita até 5 pontos, exceto
Perfuração do Tiro de Osso, que aceita 2. Há mais opções que pontos disponíveis.

| Árvore | Ramo 1: fundamento → aprofundamento | Ramo 2 | Ramo 3 |
|---|---|---|---|
| Cada evocação | +4% dano → +6% dano | +6% vida → +12% regeneração | +3% redução de recarga → +4% movimento |
| Tiro de Osso | +4% dano → +6% dano | +2% redução de recarga → +3% redução de recarga | +1 alvo perfurado → +6% dano |
| Chuva de Ossos / Explosão Necrótica | +4% dano → +6% dano | +5% área → +5% dano | +2% redução de recarga → +3% redução de recarga |
| Muralha de Corpos | +5% dano → +6% dano | +8% resistência → +10% resistência | +5% duração → +3% redução de recarga |
| Escudo de Carne | +6% absorção → +8% absorção | +2% redução de recarga → +3% redução de recarga | +4% absorção → +7% absorção |
| Dash | +3% distância → +4% distância | +2% redução de recarga → +3% redução de recarga | +2% distância → +2% redução de recarga |
| Maldição da Fraqueza | +1 p.p. redução do dano inimigo → +1 p.p. | +6% área → +6% duração | +2% redução de recarga → +3% redução de recarga |

Área aumenta a superfície: o raio é multiplicado pela raiz quadrada do bônus.
A redução do dano inimigo pela Maldição continua limitada a 75%.

A redução de recarga da maestria é limitada a 50% e multiplica a recarga já
calculada com os outros sistemas. Nas evocações, afeta tanto o comando manual
quanto a habilidade automática individual; não aumenta a frequência dos ataques
básicos nem reduz o tempo de renascimento. O dano da evocação também fortalece
os comandos e as habilidades automáticas que usam seu dano como base.

## Redistribuição e salvamento

Redistribuir uma maestria é gratuito nesta primeira versão. Devolve somente os
pontos da árvore selecionada, preservando nível e XP. Usa os mesmos locais
seguros do Grimório: vila, mapa ou pausa entre waves sem inimigos e sem aliados
detonados/sacrificados em recuperação. A devolução de pontos do Grimório continua
com seu custo atual.

Os campos `skillMasteryVersion` e `skillMastery` são persistidos no save local e
na exportação existente. A migração valida níveis, XP, limites de pontos e
pré-requisitos. A comparação de equipamentos inclui a maestria no dano, nas
recargas e nos atributos estimados da horda.

As árvores desta primeira versão trabalham com atributos. Transformações como
zumbis explodirem ao morrer ou deixarem nuvens de podridão ainda não fazem parte
destes nós.

## Verificação

- `node --test scripts/skill-mastery.test.js`: níveis, curvas, recuperação,
  orçamento de pontos, pré-requisitos, migração e prévias de equipamentos.
- `node scripts/skill-mastery-browser-check.js` (Playwright disponível via
  `NODE_PATH`): interface, combate, árvores, redistribuição, tela pequena,
  recarregamento de save e progressão no nível máximo do personagem.

### Decomposição dos zumbis

O nó avançado `power_deep` substitui Ferocidade por Decomposição. A Mordida Pútrida passa a aplicar 20% do dano do zumbi por segundo por ponto, durante 4 segundos. Novas mordidas renovam a duração sem acumular efeitos; vale também contra chefes. Pontos já investidos são preservados. O fundamento Fome dos Mortos mantém +4% de dano por ponto.
