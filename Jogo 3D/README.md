# Aang | Avatar: Domínio dos Elementos

Jogo 3D de coleta e sobrevivência em JavaScript e Three.js, com ilha flutuante, templo, vegetação, Aang modelado em 3D e cinco fases procedurais. Interface em português, adaptável à altura da janela, sem rolagem da página em computador ou celular. Em janelas menores, informações secundárias são recolhidas; as instruções e os modais podem rolar internamente para manter o conteúdo acessível.

## Executar

Abra **index.html** diretamente no Chrome, Edge ou Firefox, com WebGL e aceleração de hardware habilitados. Não é necessário instalar Node.js, executar um build ou iniciar um servidor. O arquivo **Aang - Avatar.html** também abre o jogo.

O Three.js está incluído em `vendor/three.min.js`, na versão fixa 0.160.1, com sua licença MIT em `vendor/THREE-LICENSE.txt`. O jogo funciona sem internet. Somente as fontes opcionais do Google Fonts usam rede; Georgia e Arial são utilizadas automaticamente se elas não estiverem disponíveis.

Se preferir, use a extensão Live Server do editor ou qualquer servidor de arquivos estáticos na pasta do projeto.

## Controles

| Ação | Controle |
| --- | --- |
| Mover Aang | WASD ou setas; direções relativas à tela |
| Esquiva do ar | Espaço, Shift ou botão de esquiva; recarga de 2,6 s |
| Pausar / continuar | P ou Esc |
| Reiniciar a fase | R |
| Ativar / desativar som | M ou botão de áudio |
| Tela cheia | Botão de expansão no jogo |
| Celular / tablet | Direcional de toque, exibido durante a partida |

Clique em **Iniciar jornada**. Colete todas as esferas azuis, contornando obstáculos e sobrevivendo às ameaças vermelhas. O som começa desativado e pode ser habilitado pelo jogador. Trocar de aba ou abrir as instruções pausa a partida, os inimigos, as áreas de perigo e a recarga da esquiva.

## Sobrevivência

- **Três vidas por fase:** caçadores, projéteis e erupções retiram uma vida por acerto. Sem vidas, a fase reinicia automaticamente com o mesmo mapa. Vencer a fase também restaura as vidas.
- **Caçadores desde a fase 2:** perseguem Aang, desviam dos obstáculos e tentam cercá-lo. Não podem ser eliminados; o objetivo é escapar e coletar as esferas.
- **Sentinelas desde a fase 2:** alguns obstáculos recebem anéis vermelhos. Uma linha avisa onde vão disparar com 0,85 s de antecedência. A mira fica fixa durante o aviso, permitindo esquivar; os obstáculos bloqueiam os disparos.
- **Erupções desde a fase 3:** círculos vermelhos marcam áreas prestes a explodir, com aviso de 1,25 s. O dano acontece somente durante a explosão, não durante o aviso.
- **Esquiva do ar:** impulso de 0,22 s na direção do movimento ou na última direção usada. Durante a esquiva, Aang fica invulnerável e dissipa projéteis que o atingirem. A esquiva respeita obstáculos e bordas.
- **Proteções:** 2,5 s de segurança no início das fases com inimigos e 1,35 s de invulnerabilidade após um acerto, evitando perder todas as vidas em um único contato.
- **Feedback:** corações, indicador de ameaças, barra de recarga, aviso de última vida, partículas e feedback visual/sonoro de dano. A opção de redução de movimento do sistema desativa o tremor da câmera.

## Fases

| Fase | Elemento | Esferas | Obstáculos | Tempo | Caçadores | Sentinelas | Áreas por erupção | Semente |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Ar | 8 | 12 | 65 s | 0 | 0 | 0 | 1337 |
| 2 | Água | 10 | 16 | 60 s | 2 | 1 | 0 | 2674 |
| 3 | Terra | 12 | 20 | 55 s | 3 | 2 | 1 | 4011 |
| 4 | Fogo | 14 | 24 | 50 s | 4 | 3 | 2 | 5348 |
| 5 | Metal | 16 | 28 | 45 s | 5 | 4 | 3 | 6685 |

Cada fase combina os cinco tipos de obstáculos. A velocidade dos perseguidores aumenta de 2,9 para 4,4 unidades/s; os projéteis passam de 8 para 11 unidades/s e as sentinelas disparam com maior frequência. Concluir uma fase avança automaticamente depois de uma breve celebração. Tempo esgotado ou morte reiniciam somente a fase atual. A vitória final exibe as 60 energias da jornada, tempo ativo total, esquivas, danos sofridos e derrotas. Estatísticas acumulam todas as tentativas e são zeradas em uma nova jornada.

## Implementação

- `index.html`: estrutura acessível, HUD, instruções, telas de pausa e vitória.
- `style.css`: interface, tipografia, estados e adaptações responsivas.
- `game-core.js`: PRNG determinístico, configurações de fases, geração de posições, movimento normalizado e colisão circular por distância euclidiana no plano X/Z.
- `combat-core.js`: simulação de sobrevivência independente do Three.js, perseguição, mira telegrafada, projéteis, erupções, vidas e esquiva.
- `script.js`: renderização Three.js, modelo de Aang, cenário, animações, áudio sintetizado, controles e máquina de estados.
- `vendor/`: biblioteca incluída e licença.

As posições dos itens, obstáculos e caçadores são geradas por amostragem de rejeição, com uma zona inicial protegida. Caçadores surgem a pelo menos oito unidades da origem. Obstáculos ficam separados por mais que o diâmetro do jogador e afastados da borda; os itens também têm margem de acesso. O movimento usa subpassos e separação entre círculos. A simulação de combate subdivide a atualização em intervalos de até 1/60 s, e projéteis usam colisão varrida para não atravessar alvos entre quadros. A câmera ortográfica acompanha Aang suavemente; as diagonais são normalizadas antes do deslocamento.

As árvores, o templo e as formações externas são decoração, fora da arena circular. Aang possui roupa amarela/vermelha, cajado, animação de caminhada e seta azul emissiva sobre a cabeça. Não é necessário baixar modelos ou texturas externos.

## Diagnóstico

Abra `index.html?debug=1` para habilitar `window.AvatarDebug` no console: `snapshot()` lê o estado e o combate, `step(segundos)` avança a lógica e `teleport(x, z)` posiciona Aang para verificações. Esses auxiliares não são habilitados na abertura normal do jogo. As regras puras estão disponíveis em `window.AvatarCore` e `window.AvatarCombat`. Uma chamada de simulação de combate processa no máximo 0,25 s; o cronômetro continua medindo todo o tempo ativo transcorrido.

Projeto não oficial feito por fãs. Avatar e seus personagens pertencem aos respectivos titulares. A arte 3D desta implementação é criada proceduralmente; a imagem de referência não é redistribuída.
