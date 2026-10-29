# V2 — inimigos e Rei Caído (E8)

A arena da V2 usa os seis índices de `ENEMY_TYPES`, na ordem original. Fontes:
`v2/scripts/enemies.mjs`, `fallen-king.mjs`, `training-model.mjs` e os modelos
canônicos em `scripts/`. Execute `node v2/tools/build.cjs` na raiz para gerar
catálogo, parâmetros, modelos compartilhados e a distribuição offline. Não edite
`enemy-types.mjs`, `enemy-rules.mjs` ou `shared-*.mjs` diretamente.

## Encontros e escala

**Encontro de treino** (1–60) escolhe a composição e a escala, sem desbloqueios ou
recompensa de conclusão. Não é a Arena Infinita da E10. São oito inimigos e o Rei.
A composição usa `CryptHoundModel.arenaTypes` e `WarAcolyteModel.arenaTypes`: só
Guerreiros no primeiro encontro, introdução isolada do cão no quarto, acólito no
sexto, depois combinações. No sexto em diante, os espaços 6 e 8 recebem as
raridades mágica e rara. A escolha persiste; saves anteriores começam no encontro 1.

Vida, dano e XP usam `EquipmentModel.waveStats`; velocidade e intervalos corpo a corpo usam
`COMBAT_TUNING`; cão/acólito e o ataque básico a distância preservam os overrides
dos runtimes atuais (incluindo o intervalo de 1,9 s a distância). As raridades de `ExpeditionModel.tiers` multiplicam os atributos
uma vez, incluindo XP, e fornecem chance e pesos de loot. O nível dos itens ainda
é o campo separado **Nível dos itens do treino**, até os modos E9/E10.
O Rei usa os atributos do chefe do Extermínio com a escala do encontro; não
recebe multiplicadores de elite. Ouro, XP e loot passam pela recompensa única da E7.

## Arquétipos

| Índice | Tipo | Comportamento e resposta |
| --- | --- | --- |
| 0 | Guerreiro | Persegue e ataca perto; Golpe pesado avisa um círculo na própria posição antes do dano. Saia do círculo. |
| 1 | Arqueiro | Atira a distância e recua devagar quando pressionado; Tiro forte trava a direção, avisa o trajeto e dispara uma flecha mais rápida. Desloque-se de lado ou use cobertura. |
| 2 | Bruto | Corpo maior e ataque corpo a corpo; Salto devastador marca o destino, sobe e só causa dano no pouso. Saia da marca. |
| 3 | Mago Vivo | Projéteis mágicos e recuo; Erupção trava a posição do alvo e deixa fogo por três segundos, com dano a cada segundo. Saia da área e não volte enquanto estiver ativa. |
| 4 | Cão de Cripta | Investida com preparação, trajetória travada, varredura contra alvos e obstáculos, parada no primeiro contato e recuperação. Desvie de lado ou use sólidos/Muralha. |
| 5 | Acólito de Guerra | Litania prepara e canaliza aura de 5,5 u durante quatro segundos. Reforça em 30% o dano dos aliados elegíveis, sem empilhar. Matar a fonte encerra o bônus imediatamente. |

Os números dos especiais vêm de `MOB_ABILITIES` mais os ajustes vigentes de
`COMBAT_TUNING.specials`; cão e acólito executam os próprios modelos canônicos.
Alvos seguem a preferência atual: aliado próximo a menos de cinco unidades,
senão jogador. As áreas podem atingir jogador e horda pelo dano comum.
Projéteis varrem a trajetória e respeitam sólidos e Muralha; a Muralha absorve
o dano e pode ser destruída. O Dash, defesa, barreira e Escudo de Ossos continuam
no caminho comum. O fogo já lançado continua após morrer o mago, como na fonte;
projéteis já lançados também continuam; preparações da fonte morta são canceladas.

## Rei Caído

`FallenKingModel.update/pose` determina as fases, recargas e progresso dos clipes:

- Corte Real: direção travada, setor de 120° e alcance 2,8 u; contato depois da preparação.
- Queda do Rei: destino limitado a sete unidades, altura lógica, impacto de raio 2,6 u somente ao pousar.
- Abaixo de 50% da vida: fase 2, recargas reduzidas e Chamado da Coroa; dois Guerreiros por chamado, no máximo quatro vivos.
- Morte cancela o golpe, remove avisos, zera altura e desfaz os reforços vivos sem XP ou loot adicional.

Avisos são derivados do estado real e não aplicam dano. O setor é preenchido;
marcas circulares indicam salto e invocação. Horda de grupos reais considera os
avisos hostis para evasão; a aura do acólito não é tratada como área de dano.
Pausa congela a simulação; menu, morte do jogador e reinício limpam projéteis,
fogo, habilidades e estados temporários. O chão e as entidades nunca entram no save.

## Modelos e validação

Na entrega original da E8, quinze GLBs eram incorporados ao HTML. Os tipos usavam os assets existentes:
`raider`, `lowpoly_earcher`, `corrupted`, `skeleton_mage`, `mob_cryptHound` e
`mob_warAcolyte`. Cão, acólito e Rei têm clipes específicos; os outros usam o ataque
normalizado para preparação e ação. Não houve alteração de malhas ou cenas Blender.
Os nomes e a raridade ficam sobre os inimigos; silhueta e avisos complementam a cor.

Verificação na raiz, com Node e Playwright/Edge disponíveis para os checks:

```powershell
$tests = (Get-ChildItem v2/tests/*.test.mjs).FullName
node --test $tests
node --test scripts/crypt-hound.test.js scripts/war-acolyte.test.js scripts/fallen-king.test.js
node v2/tests/enemies-browser-check.cjs
node v2/tests/browser-check.cjs
node game_check.js
```

Evidências em `review/v2/e8/`. As cenas controladas do navegador avançam a simulação
real e verificam seis modelos, especiais, salto, invocação e limpeza, nos dois fundos
e qualidade baixa. O check geral valida HTML copiado offline, saves, pausa e reinício.
Isso não valida campanha/Expedições/Conquista ainda não migradas, nem desempenho em
outras máquinas ou equilíbrio completo de IA; as fórmulas compartilhadas foram
preservadas, sem apresentar estimativas do simulador como teste da IA.

## Modelos importados — primeira passagem

Esta entrega acrescenta três entradas ao catálogo GLB e substitui três visuais hostis. Guerreiro usa o cavaleiro com espada/escudo; Mago Vivo usa o mago encapuzado com cajado de fogo; Cão de Cripta usa o lobo importado. Os modelos da horda permanecem separados. Fontes e comandos estão nas [notas dos assets](../blender/notes/imported_enemies_v2.md).

A extensão exclusiva da v2, em `v2/scripts/enemies.mjs`, acrescenta os índices 6 (Ladrão com adaga), 7 (Humanoide Grifo) e 8 (Aranha). Os seis índices canônicos não mudam. Esta primeira passagem reutiliza os atributos e recompensas do Guerreiro como base provisória. Nenhum dos três recebe magia, veneno, voo ou invisibilidade.

Os novos inimigos perseguem o alvo com navegação comum. Dentro do alcance de 1,4 u e com linha livre, travam alvo/direção e preparam por 0,25 s; o contato aplica o dano comum uma vez, seguido de ação até 0,4 s e recuperação até 0,6 s. Sair do alcance ou quebrar a linha evita o golpe; morte cancela a ação e pausa congela seu relógio. A cadência usa o intervalo corpo a corpo compartilhado. Ladrão aparece a partir do encontro 9, grifo do 11 e aranha do 13, substituindo espaços de tipos básicos e preservando cão/acólito. Não há mudança no formato do save.

Cavaleiro e mago agora mostram clipes próprios na preparação dos especiais e uma janela explícita de 0,3 s de execução/recuperação após o efeito. Nessa janela não se deslocam; o dano, alcance e instante lógico dos especiais foram preservados. Ataques comuns desses tipos ainda têm emissão/contato imediato, conforme a E8; os clipes começam na ação e retornam à guarda. A reação a dano só substitui descanso/caminhada no renderizador, sem atordoar nem cancelar golpes.

Verificação adicional: `node --test v2/tests/imported-enemies.test.mjs` e `node v2/tests/imported-enemies-browser-check.cjs`. Evidências em `review/v2/imported-enemies/`. Os movimentos são uma primeira passagem, com refinamento artístico de dedos, tecido e apoios ainda pendente.

### Revisão: harpia em voo baixo

O Humanoide Grifo agora é apresentado como harpia em voo, preservando seu ID e índice. Asas e braços são independentes; o voo usa batimento e pernas recolhidas, a 0,85 u do chão com oscilação visual de 0,09 u. A morte desce ao chão em 0,8 s; pausa congela a oscilação. Colisões, obstáculos, alvos, alcance e dano continuam usando a projeção comum no chão, sem imunidade ou passagem por sólidos. O golpe preparado mantém a regra descrita acima.

Cavaleiro, mago e ladrão têm a altura corporal calibrada pelo player em descanso, sem contar seus equipamentos. Armas e escudo foram reduzidos e reposicionados sem mudar alcance ou colisão. As fontes Blender e a distribuição offline foram atualizadas.
