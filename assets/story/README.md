# Imagens da história — aprimoramento conservador

Os 23 painéis foram ampliados em 3× por interpolação Lanczos, com nitidez leve aplicada na resolução original. Não foi usada IA generativa na versão integrada ao jogo. Personagens, composição, enquadramento, cores e textos não foram redesenhados.

- `originals/`: WebP extraídos do jogo, preservados byte a byte.
- `enhanced/`: versões ampliadas em WebP de alta qualidade (97).
- `manifest.json`: títulos, dimensões, método, hashes dos arquivos e erro médio da codificação.

A ampliação não recupera detalhes ausentes no original; o ganho é conservador. A codificação de alta qualidade mantém o pacote menor que uma versão sem perdas dos pixels interpolados. Os painéis ampliados ocupam aproximadamente 13,7 MiB antes da codificação base64 usada no HTML.

As versões aprimoradas estão embutidas em `necromancer-canvas.html`, preservando a abertura offline do arquivo. O zoom animado da apresentação foi removido e a densidade do canvas da história usa a tela (até 2×), independentemente da redução de qualidade usada no combate.

Para reproduzir o processamento a partir dos originais, execute `python scripts/enhance_story.py` na raiz do repositório, com Pillow instalado. O script não altera os originais e atualiza os arquivos ampliados, o manifesto e as imagens embutidas no HTML. Os ajustes do renderizador ficam no próprio HTML.

Validação: `node game_check.js` verifica integridade dos originais e arquivos aprimorados, ampliação em 3×, integração dos 23 painéis e densidade de exibição da história. A conferência em execução no navegador permanece pendente.
