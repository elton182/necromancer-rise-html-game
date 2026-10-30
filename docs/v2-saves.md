# V2 — cenas e contrato de saves (E2)

Implementado em `../v2/scripts/save-model.mjs`, `session.mjs` e `app.mjs`.
O [plano](../v2/plano-migracao.md) acompanha o restante da migração.

## Formato e chave

A distribuição atual usa `necromancer_v2`. A distribuição 3D usa uma chave
diferente: **`necromancer_rise_3d_save`**. A v2 não grava nem remove a chave antiga.

O formato da v2 tem versão própria, independente do nome da pasta:

```json
{
  "format": "necromancer-rise-3d",
  "version": 1,
  "savedAt": 0,
  "character": { "level": 1, "exp": 0, "gold": 0, "mode": "free" },
  "settings": { "horde": 6, "ground": "dark", "quality": "high" }
}
```

Quando há save antigo importado, existe também
`legacy: { key: "necromancer_v2", data: <objeto antigo completo> }`.
Itens, IDs, ranks, maestrias, campanha, grupos, reserva de evocações, Conquista
e campos desconhecidos permanecem nesse objeto, sem descarte ou recálculo.
Campos extras de um save nativo da v2 também sobrevivem à normalização.

Na E2, `character` serve para resumo do personagem, e `legacy.data` é um arquivo
preservado para as migrações seguintes. **Na E2 atributos, equipamento e progresso
importados não eram aplicados.** Desde a E7 o nível, o XP, o ouro, os equipamentos, a mochila
e os consumíveis passam ao personagem nativo e a arena os altera ao recompensar abates;
árvore, maestrias, barra de ações e modos continuam apenas no arquivo preservado.
Veja [progressão](v2-progressao.md).

## Defaults e validação

- Campos opcionais ausentes recebem nível 1, XP/ouro/data 0, modo livre,
  seis aliados, chão escuro e qualidade alta.
- Nível deve ser inteiro entre 1 e 60; XP, ouro e data devem ser números finitos
  não negativos dentro do intervalo de inteiros seguros do JavaScript.
- Horda aceita as opções oferecidas pela interface: 6, 16, 32 e 64. Chão aceita
  `dark`/`light`; qualidade, `high`/`low`.
- Importação antiga exige objeto com nível inteiro 1–60, `maxHp` finito positivo
  e `learnedSkills` como lista de strings, além de valores válidos para o resumo.
- O conteúdo restante do save antigo é preservado como JSON; essa validação não
  certifica que cada equipamento ou build seja válido para o motor completo.
- Formato/versão desconhecidos da v2 são rejeitados, preservando o arquivo.
  Não há coerção de strings numéricas nem tentativa de interpretar versões futuras.
- Limite de entrada e saída: 5 MB de texto JSON em UTF-8.

Os normalizadores antigos foram consultados: por exemplo,
`skillMigrateSave` em `scripts/skill-trees.js` depende de funções do motor e pode
recalcular/remover dados; `EquipmentModel.migrate` valida e normaliza itens.
Eles **não são executados sobre o arquivo preservado da E2**. A aplicação das
regras reais deve ocorrer nas etapas dos sistemas correspondentes, mantendo a
cópia original e testes para qualquer transformação.

## Fluxos disponíveis

Em **Personagem e saves**:

- **Salvar v2** grava opções e dados arquivados, com data atual. Não há autosave.
- **Exportar v2** baixa o estado persistível atual, inclusive o arquivo antigo
  preservado; funciona mesmo quando o armazenamento do navegador está bloqueado.
- **Importar arquivo** aceita o JSON direto exportado pelo jogo anterior ou um
  JSON da v2. A prévia mostra personagem e limite da integração. Cancelar não grava.
- **Buscar save antigo** lê a chave antiga somente após o clique, quando ela é
  acessível nessa página. Páginas `file://` podem ter armazenamento separado;
  nesse caso, exporte no jogo anterior e importe o JSON.
- **Exportar cópia anterior** baixa a única cópia guardada na última substituição
  por importação; não é um histórico de todas as gravações.

A confirmação de importação só aplica o novo estado em memória depois que a
gravação termina com sucesso. Se já existir save da v2, seu texto bruto é copiado
antes para `necromancer_rise_3d_save_backup`, inclusive se estiver corrompido.
Uma falha nessa cópia impede a substituição. Uma falha na gravação principal
preserva o valor anterior, usando a atomicidade de `localStorage.setItem`.

Salvar normalmente recusa sobrescrever um save corrompido ou de versão futura.
Uma importação explícita pode substituí-lo após a prévia, preservando a cópia.
JSON inválido nunca altera o armazenamento. Falha de acesso/quota aparece na
interface e não impede entrar no treino ou exportar o estado em memória.

Mover/copiar o HTML pode mudar o armazenamento acessível, dependendo do navegador;
o arquivo exportado é a forma de transportar o save entre páginas/navegadores.

## Cenas e estado transitório

`session.mjs` coordena três estados: `menu`, `training` e `dead`.

- Abertura: menu, simulação congelada, opções do save nativo carregadas se válido.
- Entrar/recomeçar: arena experimental nova, com os aliados escolhidos.
- Continuar: relê o save nativo, restaura opções/arquivo do personagem e começa
  um encontro novo. Não restaura posição, vida do jogador ou inimigos derrotados.
  Desde a E5, restaura saúde e recuperação dos integrantes da horda real.
- Pausa: congela o relógio do treino e limpa entradas. Perda de foco também pausa.
- Menu, reinício, aplicação de save e morte: limpam efeitos/ataques pendentes;
  ao reconstruir a arena, novas identidades substituem as entidades anteriores.
- Morte: interrompe a simulação, deixa a animação de morte terminar e oferece
  nova tentativa. Retomar pausa não revive o personagem.
- Prévia de importação: pausa o treino. Cancelar mantém a pausa; retomar é explícito.

Mundo Three.js, entidades, posições, alvos, vida do jogador, projéteis, efeitos,
animações e pausa não são capturados pelo snapshot persistido.
Na E5, a extensão opcional `horde` guarda perfil, slots, grupos e reserva,
saúde dos integrantes, tempos de recuperação e recargas automáticas.
`settings.armyMode` distingue grupos reais do teste de carga. Saves nativos
anteriores com opções mas sem esse campo mantêm o teste de carga; um perfil
novo começa em grupos reais sem aliados concedidos. O formato permanece na
versão 1, com defaults para os campos opcionais. Menu e pausa congelam os
relógios; reiniciar não elimina recuperação nem indisponibilidade.
Veja [horda da E5](v2-horda.md).
Dados parecidos existentes dentro do **arquivo antigo** continuam preservados
para as migrações futuras, sem serem restaurados na arena experimental.

## Verificação

Na raiz:

```powershell
node v2/tools/build.cjs
node --test v2/tests/training-model.test.mjs v2/tests/save-session.test.mjs
node v2/tests/browser-check.cjs
node game_check.js
```

O navegador requer Playwright no ambiente de desenvolvimento e Microsoft Edge.
Todos os testes usam dados fictícios e armazenamento isolado. Evidências em
[review/v2/e2](../review/v2/e2/): importação/cancelamento, preservação integral,
backup, exportação, reload, falhas de quota/acesso e transições de cena.
O teste não usa nem importa o save pessoal do usuário.


## Extensão E6a

`horde.mastery` guarda níveis, XP e pontos próprios de cada habilidade,
normalizados pelo modelo canônico. Campo ausente recebe defaults de nível 1,
sem pontos. Apenas ações equipadas ativam bônus; trocar slots não apaga a
maestria. O perfil do Grimório permanece em `horde.profile`, separado do
arquivo antigo arquivado. Reembolsos usam o ouro nativo da v2. Desde o fechamento da E6, abates no treino
somam XP a `horde.mastery`. Veja [Grimório](v2-grimorio.md).

## Extensão E7

`character` ganha `equipment`, `gearBag` e `inventory`, e `settings` ganha `gearLevel` e
`lootFilter`, todos opcionais e normalizados com padrões para saves anteriores. `character.level`
e `horde.profile.level` convergem ao carregar; o XP é limitado ao nível. Itens passam pelo
validador compartilhado. A importação do arquivo antigo aplica nível, XP, ouro, equipamentos,
mochila e consumíveis válidos, mantendo `legacy.data` intacto. Detalhes e limites em
[progressão](v2-progressao.md).

## Extensão E10c

`character.conquest` guarda o progresso de Valdoria (semente do mapa, influência, tenentes, fragmento, dificuldade,
ofertas e rotas), normalizado pelo modelo compartilhado; a semente é sorteada por personagem novo e, na falta, vale
170117. Valor que não seja objeto é rejeitado. A importação do arquivo antigo lê `conquest` e preserva o cajado
`special: 'carcomido'`. Veja [Conquista](v2-conquista.md).

## Extensão E10a

`character.waveProgress` (`best`, `unlocked`, `selected`) guarda o recorde da Arena e `settings.waveMode`
o modelo de waves escolhido (`expedition` por padrão ou `classic`). Ambos têm padrões para saves anteriores e são limitados
ao normalizar; a importação do arquivo antigo também lê `camp.eb`. Veja [Arena Infinita](v2-arena.md).

## Extensão E9

`campaign` preserva fases, liberações, histórias, tutoriais e retorno ao mapa/vila.
Campos ausentes recebem padrões; entidades e lutas não são retomadas. A importação
antiga mantém a campanha em `legacy.data`, sem conversão automática. Veja o
[guia da campanha](v2-campanha.md) para fluxo, compatibilidade e validação.

Equipamentos na versão 3: os itens v1 e v2 são normalizados pelo modelo compartilhado. Na passagem de v2 para v3, o afixo `defense` é convertido em `defensePercent` com o mesmo valor; os demais dados válidos são preservados. A defesa inerente de vestimenta, capuz e botas é calculada pelo tipo e nível, sem campo adicional no save.

Aprimoramentos de Bran persistem no campo opcional `enhancement` do equipamento (inteiro de 0 a 5; ausente equivale a +0). A base original permanece armazenada; o bônus é calculado ao usar o item. Afixos substituídos usam o mesmo contrato dos afixos sorteados.

`character.siege` persiste o Cerco ao Ritual: `unlocked` (1–20), `best` (0–20), `wins`, `shards`, `rune` e `runes` (bone/frost/plague/crypt, níveis 0–3). Saves anteriores recebem padrões por `normalizeSiege`; filas, essência, integridade, torres, guardiões e partida corrente não são salvos. Vitória atualiza esse progresso uma vez; importar/carregar começa em cena limpa.
