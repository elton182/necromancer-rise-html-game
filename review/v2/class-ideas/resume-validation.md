# Retomada da horda permanente — 08/11/2026

Concluída a integração iniciada pelo Claude: cães, Cérbero e esqueletos magos seguem o ciclo dos demais grupos permanentes. Corrigidas a consulta de maestria inexistente, a preparação dos testes antigos que presumiam só cinco tipos e a ordem dos IDs antigos de ações. Árvore de habilidades e guias atualizados.

- Build: `node v2/tools/build.cjs`, aprovado; HTML autocontido regenerado.
- Suíte completa: 615 testes aprovados. Log: [resume-tests.log](resume-tests.log). No PowerShell, os caminhos foram expandidos com `Get-ChildItem v2/tests/*.test.mjs` antes de passá-los a `node --test`. Os testes do servidor local precisaram de execução fora do ambiente restrito.
- Testes diretamente relacionados: 74 aprovados, incluindo reserva, morte no save, ordens e ausência de maestrias dedicadas. Log: [resume-targeted-tests.log](resume-targeted-tests.log).
- `node v2/tests/class-ideas-browser-check.cjs`: aprovado no Edge com armazenamento isolado; [result.json](result.json). Confere as três classes, dano, painel da horda, reanimação manual/automática e persistência após recarregar, sem erros de página nem requisições externas. Capturas do Necromante em chão escuro e claro/qualidade baixa inspecionadas.
- Verificação adicional `node v2/tests/horde-browser-check.cjs`: timeout de 30 s depois da captura da salva do arqueiro e antes da captura do salto da Abominação. Não foi concluída nem usada como evidência de aprovação dessa etapa.

Arte provisória: cryptHound com tinta para os cães, cão maior para Cérbero e skeleton roxo para os magos. Modelo de três cabeças e maestrias dedicadas não foram produzidos. A troca de atributos proporcionais de Zephyr para a escala da horda está documentada; não foi feita validação completa de balanceamento/IA pelo simulador.
