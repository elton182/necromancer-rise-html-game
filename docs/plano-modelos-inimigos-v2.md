# Plano — modelos importados de inimigos da v2

Estado: primeira passagem implementada em 28/10/2026: seis modelos com ações exportadas, acessórios e integração à v2. Revisão visual em andamento; o acabamento fino dos rigs não está declarado concluído. Fontes e limitações em [notas da entrega](../blender/notes/imported_enemies_v2.md).
Escopo: os dez GLBs fornecidos em 28/10/2026, formando seis inimigos e quatro acessórios. As etapas abaixo preservam a proposta original como referência; a nota da entrega registra a execução.

## Diagnóstico confirmado

Inspeção dos metadados GLB: todos contêm uma malha e nenhum contém animações ou referências externas de buffers/imagens. Cavaleiro, ladrão, mago e humanoide grifo têm um skin com 65 juntas; lobo tem 32 e aranha tem 21. Os quatro acessórios não têm skin. Contagens iguais não comprovam compatibilidade de rigs nem qualidade de pesos. Pose de repouso, topologia, orientação, texturas e deformações ainda precisam de inspeção no Blender.

Referências de integração: [inimigos atuais](v2-inimigos.md), [fontes da v2](../v2/README.md), [pipeline Blender](../blender/README.md) e [orientações de assets](../blender/AGENTS.md). A documentação antiga de sprites não define o formato desta entrega: a v2 usa modelos 3D animados incorporados ao HTML, sem atlas de oito direções.

## Elenco e associação proposta

| Arquivo de personagem | Equipamento determinado | Destino proposto |
| --- | --- | --- |
| `medieval+knight+3d+model.glb` | `polygonal+shield+3d+model.glb` e `medieval+sword+3d+model.glb` | Visual do Guerreiro atual |
| `hooded+mage+3d+model.glb` | `wooden+fire+staff+3d+model.glb` | Visual do Mago Vivo atual |
| `wolf+creature+3d+model.glb` | Nenhum | Visual do Cão de Cripta, condicionado à anatomia inspecionada |
| `fantasy+hooded+thief+3d+model.glb` | `dagger+3d+model.glb` | Novo inimigo: Ladrão |
| `griffin-like+humanoid+3d+model.glb` | Nenhum | Novo inimigo: Humanoide Grifo |
| `low-poly+spider+3d+model.glb` | Nenhum | Novo inimigo: Aranha |

Todos são hostis; não substituir modelos da horda. Arqueiro, Bruto, Acólito e Rei permanecem no elenco. As três associações existentes são propostas, não renomeações de IDs. Novos tipos entram após os índices atuais; nunca reordenar o catálogo gerado. Não inferir voo, veneno, furtividade ou bloqueio funcional apenas da aparência ou dos acessórios.

## Etapa 1 — preservar e auditar

1. Conferir novamente o Git antes de editar e preservar o trabalho local existente.
2. Copiar apenas os dez arquivos selecionados para `blender/reference/imported_enemies/`, com nomes em snake_case; manter os originais intactos. Registrar origem e hashes em nota própria. Não incluir outros GLBs presentes em Downloads.
3. Importar em cena de auditoria separada, sem limpar ou salvar sobre a cena aberta do usuário. Inspecionar hierarquia, eixos, unidades, malhas, materiais, texturas, juntas, pesos e pose de repouso.
4. Testar flexão de quadris, joelhos, ombros, cotovelos e extremidades. No lobo testar coluna, patas e mandíbula; na aranha, cadeias das oito patas. Não tratar skin existente como rig aprovado.
5. Medir triângulos, vértices, materiais e texturas. Registrar custo original e decidir redução somente após observar o custo no jogo e a perda visual. Conferir procedência/licença disponível para a distribuição.

Saída: relatório por asset, capturas de frente/lado/câmera de jogo e lista concreta de correções. Ainda sem integração ao encontro.

## Etapa 2 — preparar rigs e armas

- Fontes reproduzíveis em `blender/scripts/`, cenas em `blender/models/` e GLBs finais em `blender/exports/`, com prefixo `v2_enemy_` e nomes em snake_case.
- Reaproveitar esqueletos válidos; criar controles de animação e corrigir pesos onde necessário. Retarget entre humanoides só depois de comparar hierarquia, eixos e bind pose. Quadrúpede e aranha exigem soluções próprias.
- Fixar espada na mão direita e escudo na esquerda do cavaleiro; adaga na direita do ladrão; cajado na mão principal do mago, usando a outra como apoio quando a pose exigir. Ajustar origem, escala e rotação no encaixe e conferir dedos/empunhadura em todas as ações.
- Exportar personagem e acessórios juntos, com acessórios presos aos ossos e materiais/texturas incorporados. Rig de controle fica no `.blend`; exportar apenas o necessário para reprodução.
- Padronizar chão, frente, altura visual e escala com os atores atuais. Separar altura visual de raio de colisão. Animações de deslocamento ficam no lugar: o motor controla a translação.

## Etapa 3 — produzir animações

Todos recebem `idle`, `walk`, `attack`, `hit` e `death`. `idle` e locomoção são cíclicos; ataques, reação e morte são ações únicas. `hit` exige ligação explícita no runtime e não concede interrupção nova por conta própria. A morte deve terminar em pose estável no chão. Acrescentar `run` apenas para estados que realmente o utilizem.

| Inimigo | Ações específicas a produzir | Leitura e vínculo com o combate |
| --- | --- | --- |
| Cavaleiro | `heavy_windup`, `heavy_attack`, `recover` | Espada prepara, corta e volta à guarda; escudo acompanha o corpo. Usar o Golpe pesado existente; guarda visual não cria redução de dano |
| Mago | `cast_windup`, `cast`, `eruption_windup`, `eruption_cast`, `recover` | Cajado aponta na emissão do projétil; Erupção acompanha a preparação e o surgimento da área existentes |
| Lobo | `charge_windup`, `charge`, `recover` | Antecipação baixa, avanço e desaceleração sincronizados à investida atual; nomes finais compatibilizados com o adaptador existente |
| Ladrão | `stab_windup`, `stab`, `recover` | Proposta inicial: aproximação e estocada legível; sem invisibilidade ou teleporte implícitos |
| Humanoide Grifo | `claw_windup`, `claw_attack`, `recover` | Proposta inicial: ataque de garras terrestre; voo/salto dependem de mecânica e anatomia confirmadas |
| Aranha | `bite_windup`, `bite`, `recover` | Proposta inicial: aproximação e mordida; sem teia ou veneno implícitos; caminhada alterna apoios sem deslizar |

Para cada ataque, registrar duração, começo/fim da preparação, instante de contato ou emissão e recuperação. Os nomes acima são contrato proposto: conferir os nomes consumidos pelo motor antes de exportar. Quando a mesma ação contiver várias fases, registrar os intervalos e mapeá-los explicitamente.

Ordem recomendada: cavaleiro completo como piloto; mago e ladrão; humanoide grifo; lobo; aranha. Validar um ciclo completo no jogo antes de multiplicar o pipeline para os demais.

## Etapa 4 — ligar animação e regra

1. Registrar exports, alturas, passadas, clipes obrigatórios e durações em `v2/assets/models.json`.
2. Ligar os estados e o progresso real em `v2/scripts/enemies.mjs` e `renderer.mjs`. Inspecionar também a criação dos atores em `training-model.mjs` e o adaptador `v2/tools/enemy-source.cjs`. Não editar somente os catálogos gerados.
3. Corrigir o contrato temporal antes de finalizar os clipes: hoje o ataque comum aplica dano/disparo ao iniciar e apresenta a animação por uma janela curta. O contato visual precisa coincidir com o evento lógico. Se a correção deslocar o instante de dano, registrar como mudança de regra e testar cancelamento, alvo, alcance e cadência; não ocultar isso como troca visual.
4. Para os três tipos novos, especificar alvo, alcance, preparação, contato, recuperação, recarga, atributos, recompensas e composição dos encontros antes de habilitá-los. Reusar dano, proteção, colisão, loot e progressão comuns. A tabela de animações não autoriza poderes adicionais.
5. Morte cancela preparações e ações pendentes conforme a regra; pausa congela clipes e eventos. Reinício/troca de cena limpa atores e efeitos. Preservar o comportamento já definido para projéteis e fogo lançados.
6. Empacotar com `node v2/tools/build.cjs`. A distribuição continua sendo `v2/necromancer-3d.html`, autocontida, aberta por arquivo e sem dependência de Downloads, Blender ou rede.

## Etapa 5 — revisão e critérios de conclusão

- Conferir no Blender repouso, extremos de passada, preparação, contato, recuperação, reação e morte; verificar arma solta, deformações, interpenetrações, pés, apoios e estabilidade dos loops.
- Conferir todos os clipes na câmera e escala reais do jogo, de vários ângulos, fundos claro/escuro, grupo com horda e qualidade baixa. Guardar evidências em `review/v2/imported-enemies/`; prévias de assets ficam em `blender/previews/`.
- Validar carregamento offline, clipes obrigatórios, clones independentes, reinícios e descarte de recursos. Medir tempo de carregamento, tamanho do HTML e desempenho comparando a mesma cena antes/depois, sem inventar orçamento numérico antes da auditoria.
- Executar os testes afetados da v2 com `node --test`, `node v2/tests/enemies-browser-check.cjs`, `node v2/tests/browser-check.cjs` e `node game_check.js`. Estender a conferência de navegador para os seis novos modelos e seus estados, com armazenamento isolado.
- Atualizar o guia de inimigos e o pipeline apenas com o que tiver sido entregue e executado. Entregar cenas editáveis, scripts reproduzíveis, exports, HTML atualizado e evidências.

## Pontos de decisão e limites atuais

A associação do cavaleiro, mago e lobo a tipos existentes foi adotada na primeira passagem, assim como os papéis básicos dos outros três. Refinamento de deformações, apoio e equilíbrio permanece separado da integração inicial. As verificações executadas e suas limitações estão nas notas da entrega; os critérios acima não constituem declaração automática de aprovação artística final.
