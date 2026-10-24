# Guia visual de combate — BASE-01

Referência inicial aplicada ao Tiro de Osso em 24/10/2026.

## Escala e contraste

O jogo usa 36 pixels por unidade de mundo. Conferir também 24 px/u para leitura
à distância e 48 px/u para revisão próxima. A arena inclui miniaturas de 32,
48 e 64 px. Conferir em fundo escuro e pedra clara, com e sem horda.

Usar silhuetas grandes, poucos detalhes internos e bordas coloridas finas.
No Tiro de Osso, o corpo marfim permanece opaco; o brilho e o rastro têm baixa
opacidade. O olho deve localizar o projétil sem depender do brilho aditivo.
Evitar contorno preto espesso, múltiplos anéis sobrepostos e dezenas de fragmentos.

| Família | Corpo / destaque | Sombra ou borda | Forma principal |
| --- | --- | --- | --- |
| Ossos | `#f1e5c4` / `#fff7df` | `#697b80` | Osso alongado, ponta direcional |
| Energia aliada dos ossos | `#8bd4bd` | Transparência baixa | Rastro curto e arco de saída |
| Carne | Tons médios orgânicos | Verde/castanho dessaturado | Massa, pulsação e dissolução |
| Espíritos | Azul/ciano | Azul acinzentado | Formas leves e deslocamento curto |
| Sombras | Violeta com centro legível | Violeta dessaturado | Símbolos e bordas definidas |
| Perigo inimigo | Cor quente a definir por família | Contraste com o chão | Área delimitada e aviso de execução |

As três últimas famílias ainda são diretrizes para os próximos cartões, sem
afirmar que todas as skills existentes já seguem este padrão. Avisos hostis
devem diferir dos aliados também pela forma e pelo movimento.

## Tiro de Osso — SK-01

- Saída de 0,14 s, acompanhando o lançamento imediato já existente. Sem acrescentar tempo de preparação ao combate.
- Projétil com duas saliências largas, ponta clara, borda fina e rastro de até 0,85 unidade.
- Impacto de 0,22 s centrado no alvo atingido, com cinco fragmentos grandes; três na qualidade baixa.
- Luz ambiente reduzida para 1,4 unidade, com tonalidade suave, em lugar do halo de 4,5 unidades.
- Sem criação de partículas persistentes. No máximo 48 acentos de saída/impacto
  deste tipo; atingir o limite remove somente o acento visual mais antigo.
- O osso permanece visível na qualidade baixa; somente os detalhes secundários diminuem.

Custo de 20 MP, recarga de 0,5 s, velocidade de 14 u/s, alcance de 9 unidades,
regra de colisão, perfuração e cálculo de dano foram preservados. O caso sem
equipamentos testado no navegador mantém 20 de dano sobre a base mágica 40.

## Tiro de Osso com Estilhaços — SK-01b

- Três projéteis em leque (15° entre si) saindo do mesmo ponto, cada um com acento de saída.
- Corpo modelado no Blender (`blender/bone_shard.py`): osso partido, uma saliência
  larga e ponta em lascas, para diferenciar do osso inteiro do tiro comum.
  Mesma paleta marfim e borda fina; rastro de até 0,6 unidade, mais curto que o do tiro único.
- Giro em torno do eixo a 14 quadros/s; na qualidade baixa o giro para.
- Custo, recarga, velocidade, alcance e dano por acerto iguais ao tiro comum.
  Os três compartilham o registro de acertos: cada inimigo é atingido uma vez por disparo.

## Arena e fluxo de atualização

Execute `node tools/combat-lab-server.js` e abra
`http://127.0.0.1:4173/tools/combat-lab.html`. O servidor escuta somente em
127.0.0.1. A arena é uma ferramenta separada, sem entrada no menu do jogador.

A arena lê os sprites embutidos no HTML e compartilha o renderizador novo
`scripts/skill-vfx.js` com o jogo. Permite selecionar os quatro inimigos atuais,
alternar fundo/escala/qualidade, colocar 16 ou 32 inimigos com uma horda de seis,
repetir o disparo e selecionar um instante da animação. A versão anterior é
reproduzida como referência visual; a arena não simula dano nem IA de combate.

Depois de editar o renderizador: `node scripts/sync-skill-vfx.js`.
O sincronizador embute a fonte no HTML para preservar a distribuição independente.
Alterações de colisão e gatilhos continuam no próprio jogo.

Verificação funcional: `node game_check.js`.
Verificação de navegador: `node scripts/skill-vfx-browser-check.js` com Playwright
e Chrome disponíveis. Esse teste serve os arquivos em memória, sem precisar
de servidor ou acesso à rede, e salva evidências em `docs/concepts/`.

## Orçamento inicial e evidências

Meta local inicial: P95 de até 4 ms para desenhar os dois painéis da arena,
com 32 inimigos, seis aliados e dois personagens principais por painel,
na qualidade baixa. O orçamento é uma referência de desenvolvimento para
esta máquina; não equivale a um limite universal nem ao tempo total de quadro do jogo.

O teste registra o P95 de 100 amostras em Chrome headless. Comparar resultados
na mesma máquina e cenário ao alterar o renderizador. O contador da arena inclui
o custo de desenho da comparação inteira e exclui o carregamento dos sprites.
Na primeira entrega, a cena animada descrita acima registrou **3,4 ms** de P95.

Evidências:

- `concepts/tiro-osso-comparacao.png`: antes/depois, fundo escuro e escala do jogo.
- `concepts/tiro-osso-grupo-distante.png`: grupo numeroso, fundo claro, 24 px/u e qualidade baixa.
- `concepts/tiro-osso-impacto.png`: impacto na cena com grupo.

O teste de navegador também confere oito direções, restauração do estado do Canvas,
custo/recarga/dano/alcance reais no HTML, expiração dos efeitos e limite da fila
sem remover efeitos de outras skills.
