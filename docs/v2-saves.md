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
preservado para as migrações seguintes. **Atributos, equipamento e progresso
importados ainda não são aplicados ao combate experimental.** A arena não altera
XP, ouro ou o personagem arquivado, mesmo quando alguém sofre dano no treino.

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
  um encontro novo. Não restaura posição, vida do treino ou inimigos derrotados.
- Pausa: congela o relógio do treino e limpa entradas. Perda de foco também pausa.
- Menu, reinício, aplicação de save e morte: limpam efeitos/ataques pendentes;
  ao reconstruir a arena, novas identidades substituem as entidades anteriores.
- Morte: interrompe a simulação, deixa a animação de morte terminar e oferece
  nova tentativa. Retomar pausa não revive o personagem.
- Prévia de importação: pausa o treino. Cancelar mantém a pausa; retomar é explícito.

Mundo Three.js, entidades, posições, alvos, vida da luta, projéteis, efeitos,
animações, cooldowns e pausa não são capturados pelo snapshot persistido.
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
