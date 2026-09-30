# Templo da Memória

Abra `index.html` em um navegador moderno. Não há instalação nem compilação.

## Como jogar

- Abra **Configurar jogo**, escolha 6, 8 ou 10 pares e de 1 a 3 jogadores. Clique em **Nova expedição** para aplicar as configurações.
- Encontre duas cartas iguais. Um acerto mantém a vez; um erro passa a vez ao próximo jogador.
- **Revelar** mostra as cartas por dois segundos, uma vez por partida, antes de escolher uma carta.
- Recordes são salvos neste navegador, por dificuldade, somente no modo solo sem dica. Menos movimentos vence; o tempo desempata.
- Use Tab para navegar, Enter ou Espaço para virar cartas e as setas para percorrer o tabuleiro. Escape fecha o resultado.
- O cronômetro começa na primeira carta ou dica e continua contando ao trocar de aba. O som fica silencioso enquanto a aba está oculta.

## Organização

- `index.html`: estrutura semântica e controles acessíveis.
- `style.css`: cores, componentes, proporção das cartas e adaptação para celular.
- `catalog.js`: imagens e nomes do catálogo original.
- `script.js`: estado da partida, pontuação, temporizadores, dica e recordes.
- `audio.js`: trilhas sintetizadas com Web Audio, sem arquivos externos.

As imagens do catálogo dependem de sites externos. Se uma imagem falhar, as duas cartas do par recebem o mesmo selo ilustrado local. As imagens usam `object-fit: contain` para preservar a composição, sem cortes ou deformações. O tabuleiro se ajusta à altura disponível da tela: um `ResizeObserver` calcula as colunas e o tamanho das cartas, mantendo a proporção de 3:4. As configurações ficam em um diálogo separado, que permite rolagem quando necessário em telas pequenas.

Nenhuma biblioteca externa é necessária. Os recordes usam `localStorage`; se o navegador bloquear o armazenamento, o jogo continua funcionando sem salvar o resultado.
