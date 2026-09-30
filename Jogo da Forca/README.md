# Forca Temática

Abra `index.html` no navegador. O jogo funciona sem instalação ou conexão à internet; mantenha os arquivos de áudio, CSS e JavaScript e a pasta `assets` junto ao HTML. O cenário e o explorador são desenhados em SVG, com seis partes reveladas conforme os erros. O fundo muda com o tema: mapas e bússola em Geografia, monumentos em História, pessoas e comunidades em Sociologia, livros e símbolos de reflexão em Filosofia. A imagem antiga `tema.jpg` não é mais utilizada.

Escolha seu nome e um dos quatro temas e clique em **Iniciar**. Use as letras na tela ou o teclado físico. Acentos e cedilha são reconhecidos, e a palavra aparece com sua grafia correta. Você perde a rodada no sexto erro.

Cada rodada oferece três cartas, com um uso cada:

- **Revelar letra:** revela todas as ocorrências de uma letra, sem gerar pontos ou aumentar o combo.
- **Eliminar 3 letras:** desativa até três letras ausentes da palavra, sem consumir tentativas.
- **Ativar escudo:** protege a próxima tentativa incorreta. Ainda desconta 10 pontos e encerra o combo.

Um acerto vale 40 pontos mais 8 vezes o combo atual. Um erro comum desconta 35 pontos e zera o combo. A pontuação não fica negativa. Na vitória, o bônus é `máximo(0, 240 − segundos × 2) + tentativas restantes × 22 + melhor combo × 16`.

O ranking guarda até 15 vitórias neste navegador, ordenadas por menos erros, menor tempo e mais pontos, nessa ordem. Se o navegador impedir a gravação, o jogo continua e mantém os novos resultados apenas enquanto a página estiver aberta. O som começa desligado e pode ser ativado pelo botão **Som**.

## Validação

A página `tests/validate.html` executa 23 verificações no navegador. Sirva a pasta por um servidor HTTP local e abra essa página. Por exemplo, se tiver Python instalado:

```powershell
python -m http.server 8000
```

Depois, acesse `http://localhost:8000/tests/validate.html`. O teste usa um ranking em memória e não altera seus resultados salvos.

As verificações cobrem regras, pontuação, cartas, repetição de letras, teclado físico, acentos nas 24 palavras, bloqueio de tema durante a rodada, vitória e derrota, foco do modal, reinício, cronômetro, proteção do ranking contra HTML e registros inválidos, falhas de armazenamento e de áudio, além de transbordamento horizontal em larguras de 320, 375, 768, 1024 e 1440 pixels.

A reprodução audível da música e a experiência com leitores de tela precisam de conferência manual; os testes verificam o tratamento de falhas de áudio, os estados acessíveis e a navegação de foco.
