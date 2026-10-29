# V2 — progressão, equipamentos e loot (E7)

Fontes da v2: `v2/scripts/progression.mjs`, `rewards.mjs`, `drops.mjs`,
`gear.mjs`, `consumables.mjs`, `gear-panel.mjs` e a normalização em
`save-model.mjs`. Os caminhos deste guia são relativos à raiz do projeto.
Regras vigentes do jogo atual: [personagem](mecanicas/personagem-e-progressao.md)
e [equipamentos e loot](mecanicas/equipamentos-e-loot.md).

## Fontes das regras

| Regra | Origem | Como chega à v2 |
| --- | --- | --- |
| Curva de XP, nível 60, cura por nível, ouro, orbes, preços e pilhas | `scripts/skill-trees.js`, `scripts/equipment.js` e `SHOP_ITEMS` em `necromancer-canvas.html` | `v2/tools/progression-source.cjs` gera `v2/scripts/progression-rules.mjs`; falha claramente se a fonte mudar |
| Geração de itens, raridades, afixos, validação, bônus, preços e estimativas | `scripts/equipment-model.js` | `shared-equipment.mjs`, gerado por `node v2/tools/build.cjs`; a v2 não mantém fórmulas paralelas |
| Pontos e efeitos da árvore | `build-simulator/model.js` | `shared-build.mjs` (E6) |

Não edite os arquivos gerados. O manifesto de empacotamento registra os
hashes das fontes. O teste `v2/tests/progression.test.mjs` compara as regras
geradas com a leitura atual das fontes.

## Nível, XP e atributos

O nível do personagem e o do perfil do Grimório são o mesmo progresso:
`character.level` e `horde.profile.level` convergem ao carregar (vale o maior,
o XP é ajustado ao nível final) e sobem juntos. Com grupos reais, o nível efetivo
é o do perfil; no teste de carga, o do personagem.

- XP para o próximo nível: `piso(100 × 1,4^(N − 1))`; máximo 60, onde o XP não acumula.
- Ao subir: atributos recalculados, **+20 de vida e +5 de mana** sobre o valor de
  antes (sem passar do máximo; um personagem morto não é curado) e +3 pontos
  de habilidade. Vários níveis de uma vez aplicam a cura por nível.
- Vida, mana, dano mágico, regeneração, movimento, defesa e redução de recarga vêm
  de `EquipmentModel.snapshot` — o mesmo cálculo do inventário atual — a partir do
  nível, da árvore e dos itens. As tabelas de exemplo da página de personagem
  são reproduzidas por teste.
- Trocar nível, árvore ou itens **preserva a proporção** de vida e mana e não cura.
  Um encontro novo começa com vida e mana cheias.
- A regeneração de vida (`0,2 × (N − 1)` por segundo) agora é aplicada, como no
  jogo atual. Os itens da horda (`dano base`, `dano %` e `vida %`) entram nos
  atributos dos aliados e preservam a proporção de vida deles.
- Afixos de pontos de habilidade reforçam apenas nós já investidos e não liberam
  pré-requisitos (`EquipmentModel.effects`); as magias e a horda usam esse cálculo.

Um **perfil de teste** (builds de teste da horda e das magias, nível 24) substitui
o nível em memória e zera o XP. Salvar depois disso grava o nível de teste.

## Recompensa por abate

`rewardKill` (`rewards.mjs`) é o único caminho, chamado pela morte do inimigo
(`onEnemyDeath`), seja qual for a fonte do dano. Cada inimigo paga uma vez, pela
marca `rewarded`. Inimigos sem XP válido (zero, negativo ou não numérico) não pagam nada.

Ordem, como no jogo atual: XP de maestria das habilidades equipadas (com o nível
anterior) → XP e nível do personagem → ouro → orbe → equipamento.

| Drop | Chance | Duração no chão | Coleta |
| --- | --- | --- | --- |
| Ouro | sempre; `máx(2, arredondar(XP × 0,35))`, chefe ×3 | 45 s | 1,8 u |
| Orbe de mana (40% da mana máxima) | 12% | 22 s | ≈1,34 u |
| Orbe de vida (30% da vida máxima) | 4% | 22 s | ≈1,34 u |
| Equipamento | 16%; o chefe sempre, mágico ou melhor | até o fim do encontro | 1,8 u |

O sorteio do orbe decide se ele existe e outro decide o tipo. A vida útil só corre
com a simulação ativa; pausa e menu congelam. Desde a [E8](v2-inimigos.md), inimigos usam o XP do tipo, escala do encontro e raridade;
o chefe usa a referência do Extermínio com escala.

## Equipamentos

- **Nível dos drops e do mercador:** `settings.gearLevel` (campo “Nível dos itens do
  treino”, 1–60, padrão 1). É uma escolha explícita da v2 enquanto não há waves; a
  Arena (E10) e a campanha (E9) trarão a regra por fase/wave. A recuperação de nível
  (`EquipmentModel.dropRoll`) funciona normalmente sobre esse nível.
- **Bolsa:** 60 espaços em duas bolsas; equipados não ocupam espaço. **Equipar** troca
  a peça e devolve a antiga; anéis aceitam os dois lados; **Desequipar** exige espaço.
- **Comparação:** tabela equipado × selecionado (base e afixos, “inativo” para
  afixos de habilidade sem ponto) e status do personagem com prévia da troca, inclusive
  mitigação de defesa e DPS das habilidades (`snapshot`, estimativas do modelo atual).
- **Filtro de loot** (`settings.lootFilter`): peças abaixo da raridade ficam ocultas e
  não são coletadas; ouro e orbes não são filtrados. Mochila cheia mantém a peça no
  chão e avisa uma vez por 3 s.
- **Menu como vila:** o mercador de relíquias (preço `25 + 10 × nível`), a venda
  (15% do preço) e a compra de consumíveis só funcionam no menu, fora do encontro.
  No encontro, a opção é **Descartar**. Descartar tudo pede segundo clique.
- **Sair do encontro** (menu ou recomeçar) coleta o que o filtro permite e cabe; o
  restante se perde com aviso. **Morrer** perde as peças do chão. Carregar um save
  nunca restaura o chão.
- Troca de itens não reinicia recargas nem recuperação da horda; defesa, movimento e
  redução de recarga entram no caminho comum de dano, no Dash, no tiro e nas magias.

Atalho **I** (ou botão **Inventário**) abre o painel, que pausa o treino como o Grimório.
Não há arrastar e soltar; use selecionar e **Equipar**.

## Consumíveis

| Item | Preço | Pilha | Efeito |
| --- | ---: | ---: | --- |
| Poção de Vida | 30 | 5 | +50 de vida |
| Poção de Mana | 25 | 5 | +40 de mana |
| Escudo de Ossos | 45 | 3 | bloqueia o próximo golpe inteiro |
| Bomba de Almas | 55 | 3 | 80 de dano em raio 5 ao redor de Zephyr, pelo caminho comum de dano |

Comprados no menu, usados no encontro com **F1–F5** (ordem da barra) ou pelo botão.
Como no jogo atual, o item é consumido mesmo quando não muda nada. O **Pergaminho** voltou com a [E9](v2-campanha.md): custa 20 ouro e teleporta ao portal da cena, sem encerrar o encontro.

## Saves

Formato 1 mantido; campos novos são opcionais e têm padrão para saves anteriores.

```json
{
  "character": { "level": 1, "exp": 0, "gold": 0, "mode": "free",
    "equipment": { "staff": { "...": "item v2" } }, "gearBag": [], "inventory": [{ "id": "potion_hp", "count": 2 }] },
  "settings": { "gearLevel": 1, "lootFilter": "common" }
}
```

- Itens são validados pelo modelo compartilhado ao carregar e ao salvar; peças
  inválidas ou duplicadas (entre equipados e mochila) são descartadas, e o formato
  de item 1 é convertido. Recarregar nunca sorteia de novo. Consumíveis desconhecidos,
  repetidos ou fora da pilha são descartados.
- XP acima do necessário para o nível é reduzido ao limite; no nível 60 é zero.
- **Importação do save antigo** passa a aplicar nível, XP, ouro, **equipamentos, mochila e
  consumíveis** válidos. Árvore, maestrias, barra de ações, grupos, campanha e Conquista
  continuam **só no arquivo preservado** (`legacy.data`), intacto. Um personagem importado
  começa sem pontos investidos e com os pontos do nível livres.
- O chão, a vida do encontro, recargas e mensagens são transitórios e nunca persistem.

## Verificação

Na raiz:

```powershell
node v2/tools/build.cjs
node --test v2/tests/progression.test.mjs v2/tests/gear.test.mjs
node --test v2/tests/*.test.mjs
node --test scripts/equipment.test.js scripts/skill-mastery.test.js scripts/skill-trees.test.js
node v2/tests/progression-browser-check.cjs
node v2/tests/gear-browser-check.cjs
node game_check.js
```

Os checks de navegador usam Playwright e Edge (veja o [README da v2](../v2/README.md))
com armazenamento isolado e a chave antiga preservada. Evidências em
[review/v2/e7](../review/v2/e7/): drops de ouro e orbes, inventário e raridades nos
fundos escuro, claro e qualidade baixa, filtro de loot e resultados em JSON.

## Limites

- Chão, mercador e nível dos itens são do treino: campanha, vila, waves, missões,
  Arena, Expedições e Conquista (E9/E10) reaproveitam esses módulos e definem seus fluxos.
- Importação não aplica árvore, maestrias nem barra de ações do arquivo antigo.
- Sem arrastar e soltar, sem áudio de coleta, sem comparação de balanceamento com o simulador
  e sem teste de desempenho em outras máquinas. Hardware de controle não conferido.
- Itens só entram por drop, compra ou importação; não há ajuste de drop/dano para testes.
