# Simulador de builds — Grimório dos Mortos

Protótipo independente do combate e dos saves do jogo. Abra `index.html` diretamente no navegador ou sirva a raiz do repositório e acesse `/build-simulator/`.

## Regras

- Nível 1 começa sem pontos; cada subida concede 3 pontos compartilhados entre Minions e Profana. Limite do simulador: 60.
- Seis escolas, 42 habilidades e 12 talentos finais. Cada escola tem uma raiz e uma bifurcação em duas especializações.
- Raiz: nível 1. Primeira bifurcação: nível 6. Evoluções: nível 12. Talentos finais: nível 22.
- Cada ligação exige 2 pontos no pai. Skills comuns aceitam 5 pontos; talentos finais, 1.
- Caminhos intermediários podem ser misturados; apenas os dois talentos finais de uma mesma escola são exclusivos.
- Remover pontos pode devolver descendentes que perderam pré-requisitos. Diminuir o nível também remove investimentos incompatíveis ou acima do orçamento, começando pelos últimos nós do modelo.
- Sinergias usam pontos diretos e bônus aditivos. Bônus exibidos são modificadores propostos, não DPS validado em combate. Efeitos sem habilidade receptora aprendida ficam dormentes.
- Vida do zumbi aprimorada por Carne Reanimada é uma sinergia conceitual com Escudo de Carne; o simulador mostra modificadores de vida e absorção separadamente, sem calcular absorção absoluta.
- Souls não participam do modelo. Os valores são propostas para validação, sem alteração da economia do jogo atual.

## Exemplos

Colosso Imortal, Horda Explosiva, Legião de Arqueiros, Tempestade de Ossos e Ceifador Híbrido. São pontos de partida no nível 30, com pontos restantes para personalizar.

## Persistência e compartilhamento

Salvamento no armazenamento local do navegador. Exportação/importação por código base64 e links com `#build=`. Links locais só funcionam em dispositivos com acesso ao mesmo servidor; o código pode ser importado em qualquer cópia deste simulador.

## Verificação

`node --test build-simulator/model.test.js`

Sintaxe: `node --check build-simulator/model.js` e `node --check build-simulator/app.js`.
