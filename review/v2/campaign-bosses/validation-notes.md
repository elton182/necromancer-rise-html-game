# Bento Ferraz e Mãe-Tecelã — 13/11/2026

## Implementado

Bento recebe 7,5× a vida do soldado raro de sua área (2,5× o multiplicador anterior), dano ×1,45 e velocidade ×1,4. Contra alvos distantes, escolhe investida. Abaixo de 65% de vida encadeia duas varreduras, cada uma com sua preparação e direção travada. Há menos espera entre as ações. A 50% tenta chamar uma reserva finita de seis soldados/atiradores; sinalização e combustível continuam oferecendo vantagens reais. A ordem é interrompida com 7% da vida máxima perdida durante sua preparação de 1,5 s.

A Mãe-Tecelã deixa de ser apenas uma aranha rara e usa IA própria. Reutiliza o GLB animado da aranha, em escala 2,6 e raio corporal 1,15 u, com tinta e barra próprias. Vida ×8, dano ×1,45 e velocidade ×1,35 sobre a aranha rara da área. Mordida em setor, veneno com áreas preparadas e persistentes, leque de teias e duas eclosões finitas de três/cinco filhotes. A segunda fase aumenta a pressão e a quantidade de áreas/projéteis. Os filhotes não dão XP nem loot. Resgate exige concluir todo o grupo cave-queen; os IDs e saves antigos foram preservados.

Ambos usam isBoss e as regras comuns já existentes para controle de chefes. O dano passa pelo caminho comum, preservando defesa, Dash, barreiras, horda e crédito de abate. Áreas e projéteis próprios da rainha são cancelados na morte da fonte; os guardas e filhotes sobreviventes continuam fazendo parte do encontro. Não foi criado outro caminho de dano.

## Verificação

- Build autocontido: `node v2/tools/build.cjs`, 78,6 MiB nesta execução.
- Testes Node executados com sucesso: `campaign-bosses`, `cedro`, `itauna`, `nilo-quest`, `enemies`, `elements-lunar` e `distribution`, em v2/tests. Os testes novos cobrem preparo idempotente, bloqueio do resgate antes de chefe/guarda, persistência da vitória, preparação das poças, limpeza dos perigos na morte, Dash contra teias, limite/ausência de recompensa dos filhotes, investida contra alvo distante e preparação separada do combo.
- `node v2/tests/campaign-bosses-browser-check.cjs`: Chrome headless com Playwright, arquivo offline, contexto e armazenamento isolados. Chefe gigante e barra, bloqueio/liberação do casulo via G, veneno, leque de teias, eclosão, horda, fundos claro/escuro em qualidade baixa, investida de Bento, segundo golpe do combo e seis reforços. Sem erros de página ou requisições HTTP/HTTPS. Os valores observados nesta configuração estão em result.json.
- Inspeção das capturas da rainha com horda/veneno e do combo de Bento.
- `git diff --check` nos arquivos afetados sem problemas de espaços.

## Limites

As etapas, vida dos personagens, posições e alguns estados de ataque da conferência de navegador são controlados. Isso valida comportamento e apresentação; não mede taxa de vitória, tempo de luta ou dificuldade das seis classes. O simulador matemático atual não modela estes padrões/rotas da v2, por isso não foi apresentado como validação de IA. É necessário playtest completo para calibrar dificuldade e recompensas de progressão. Modelos foram reaproveitados: não houve produção de nova malha nem alterações em assets de João ou em outros personagens.

Vitórias já salvas permanecem concluídas. Para testar os novos encontros, use uma jornada em que o respectivo grupo ainda esteja pendente. Morte e mudança de cena mantêm a retomada normal; vida parcial e estados de ataque não entram no save.
