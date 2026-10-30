# V2 — Laboratório

Tela dentro do jogo para ver animações e medir dano. É uma arena vazia que usa o seu personagem atual (nível, Grimório,
equipamentos e horda), sem inimigos atacando. Nada que acontece lá é salvo.

## Como abrir

Relicário → aba **Laboratório** → **Entrar no Laboratório**. Está disponível na Vila de Eldrin e no menu inicial; não abre
no meio de um encontro. Dentro dele, o painel flutuante à esquerda não pausa o jogo. **Sair** (ou *Voltar à vila* no
Relicário) leva de volta à vila, ou ao menu quando não há campanha.

No menu inicial (modo livre), use antes o *Perfil de teste* e equipe os grupos na aba Horda, senão o personagem entra só
com o básico do nível 1.

## Aba Modelos: ver cada animação

- Escolha um **inimigo** (os nove tipos), **chefe** (Rei Caído, Lich), **lacaio** (Zumbi, Esqueleto, Arqueiro Ósseo,
  Espectro, Abominação), o **jogador** (Zephyr) ou um **morador**. Só aparecem os modelos carregados.
- Cada clipe do GLB vira um botão com a duração em segundos (por exemplo `slam_windup · 0,75 s`). Toque num clipe para vê-lo.
- **Pausar/Tocar**, **Repetir clipe**, **velocidade** (0,1× a 2×), barra para **arrastar quadro a quadro**, **Todas em
  sequência**, **Girar** (ou girar sozinho) e **Aproximar/Afastar**.
- **Câmera acompanha o modelo** (ligada por padrão) centra a câmera no modelo escolhido; desligue para voltar ao personagem.
- O modelo é um ator neutro: não ataca, não é alvo da horda e não conta como inimigo. A animação vem da mesma lista de clipes e
  durações que o jogo usa, então o que aparece é o que o combate mostra.

## Aba Boneco e DPS: medir builds

O **boneco de madeira** tem vida enorme (restaurada a cada quadro) e nunca morre nem dá XP, ouro ou loot. Todos os golpes que
ele recebe entram no medidor: Tiro de Osso, Explosão Necrótica, Chuva de Ossos, Muralha de Corpos, Podridão (cajado
especial) e cada grupo da horda (Zumbi, Esqueleto, Arqueiro Ósseo, Espectro, Abominação). Outras fontes aparecem como
*Zephyr*. A horda ataca o boneco como atacaria um inimigo, e a Maldição da Fraqueza também funciona nele.

Leituras:

| Campo | Significado |
| --- | --- |
| DPS médio | dano total ÷ tempo de combate (mínimo de 1 s, para um golpe isolado não virar DPS enorme) |
| Últimos 5 s | média da janela dos últimos 5 s |
| Pico em 1 s | maior dano somado numa janela de 1 s |
| Dano total, golpes, tempo | desde o primeiro golpe; sem golpes por 3 s a medição congela |
| Lista por origem | participação, DPS e golpes de cada habilidade ou grupo |

Os acertos aparecem como números subindo sobre o boneco.

- **Bonecos**: de 1 a 5, em fila, para testar dano em área. **Mover para a mira** leva o conjunto ao ponto de mira.
- **Teste cronometrado** (10, 30 ou 60 s): *Iniciar teste* enche a mana, zera as recargas e arma o medidor; a contagem começa no
  primeiro golpe e termina no tempo escolhido. Golpes depois do fim não contam. O resultado entra em **Testes concluídos** com o
  nome que você digitou (ou nível e habilidades equipadas), DPS, pico, total, golpes, nível e as maiores origens, com a diferença
  percentual em relação ao primeiro teste. A lista vale para a sessão do navegador e não é gravada no save.
- **Mana infinita** e **Sem recargas** servem para medir o potencial de rotação. Ficam desligadas por padrão e só valem no
  Laboratório.
- **Atalhos**: Grimório, Equipamentos e Horda abrem o Relicário na aba correspondente para trocar o build entre testes.

Para comparar builds com justiça, use a mesma duração, o mesmo número de bonecos e a mesma forma de jogar (o dano do Tiro de Osso
depende de você apertar). O boneco não tem defesa nem resistência: o DPS aqui não considera o dano que um inimigo real reduziria.

## Fontes e testes

| Fonte | Responsabilidade |
| --- | --- |
| `v2/scripts/lab-model.mjs` | Medidor de DPS e catálogo de modelos (puro, sem DOM) |
| `v2/scripts/lab.mjs` | Cena do Laboratório: arena, bonecos, visualizador, opções e testes |
| `v2/scripts/lab-panel.mjs`, `lab.css` | Painel flutuante e aba do Relicário |
| `v2/scripts/renderer.mjs` | Modelo procedural do boneco (`buildDummy`, com balanço ao ser atingido) e foco da câmera |
| `v2/scripts/combat.mjs`, `spells.mjs` | `dealDamage` aceita um rótulo opcional de origem (`tag`) e avisa `w.onDummyHit`; não muda dano |

`node --test v2/tests/lab-model.test.mjs v2/tests/lab.test.mjs` cobre o medidor (janelas, congelamento, teste cronometrado), a
entrada e saída, o boneco que nunca morre, a contagem por origem incluindo a horda, as opções, o visualizador (laço, arrastar,
sequência, pausa) e a limpeza ao sair.

Verificado no navegador integrado (Chromium, arquivo servido localmente): aba no Relicário, entrada, painel, escolha do Rei Caído
com seus clipes, teste de 30 s com a horda de teste e resultado na lista. Não foi executado nenhum `*-browser-check.cjs`
(Playwright não está instalado neste repositório). Não foi verificado com controle físico.
