# Retratos dos moradores de Eldrin

O jogo usa `bram-painted.png`, `lysa-painted.png`, `tilda-painted.png` e
`merchant-painted.png`. Foram gerados com a ferramenta integrada `image_gen`,
um retrato por personagem, seguindo a referência medieval realista fornecida
pelo usuário. Os PNGs anteriores e os modelos Blender continuam disponíveis.
Esses novos retratos são ilustrações raster; não são novos modelos Blender.

As falas e a máquina de escrever estão em `scripts/npc-dialogue.js`.
Cada personagem tem sete falas sociais, separadas da apresentação do pedido.
Cada interação mostra uma só fala social. Um clique completa a frase em
andamento; o próximo clique na fala mostra diretamente a missão ou as
mercadorias. Não há botão de próxima fala nem uma sequência de sete falas na
mesma conversa. As sete opções se alternam ao voltar a conversar. Sem pedido,
o próximo clique encerra a conversa. Fechar cancela a digitação.

## Prompts finais

Cada chamada usou o template abaixo com o respectivo `Subject` e `id`:

```text
Create a production game NPC dialogue portrait. Subject: {Subject} Style: richly detailed hand-painted realistic medieval dark fantasy RPG character illustration, oil painting textures, believable human anatomy, finely painted hair, weathered leather and woven linen, warm golden edge lighting, deep brown shadows. Match the user's reference aesthetic of the kindly rugged painted blacksmith; not toy-like or 3D cartoon. Single character, waist-up portrait, centered, entire head and shoulders within frame, vertical composition. Dark softly painted medieval background. No words, letters, UI, border, watermark or logos. Save the output image as an asset for {id}; report the saved filesystem path.
```

- `bram`: Bram, a strong middle-aged male village blacksmith, broad muscular shoulders, weathered kind face, thick dark graying beard, wavy dark hair, dirty cream linen shirt with rolled sleeves, worn brown leather smith apron with brass rivets, hammer at his side.
- `lysa`: Lysa, an elderly wise village woman with deep wrinkles, expressive gentle eyes, silver hair, muted violet wool shawl and medieval layered robes, wooden walking staff, modest brass clasp.
- `tilda`: Tilda, a young village girl, cheerful curious expression, brown braided hair, modest rustic red wool dress over cream linen blouse, wholesome fully clothed medieval village child.
- `merchant`: A middle-aged male medieval traveling merchant, shrewd warm smile, trimmed dark beard, rich dark green wool coat with leather trim, modest brass medallion, leather ledger held at his side.

Validação: `node scripts/npc-dialog-browser-check.js` (Playwright e Chrome).
