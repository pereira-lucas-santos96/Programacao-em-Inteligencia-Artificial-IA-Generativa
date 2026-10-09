# Inspiration 3D — Esculturas generativas

Abra **index.html** no Chrome, Edge ou Firefox atual, com WebGL habilitado. O projeto funciona offline: todas as bibliotecas estão em `vendor/`. Não precisa de instalação, servidor ou chave de API.

A aplicação oferece cinco composições: **Lótus, Sol, Lua, Estrela e Lucas Pereira**. Lótus é a composição inicial. Os volumes são calculados por código, com pontos conectados, cores geradas por semente e rotação contínua. No nome, os pontos são interpolados sobre contornos tipográficos e distribuídos em diferentes profundidades. URLs com estilos indisponíveis abrem Lótus.

## Lucas Pereira

Selecione **Lucas Pereira** no painel para visualizar a escultura do nome. Ela aceita os controles de pontos, espessura, velocidade, semente e exportação PNG. Acesse também `index.html#style=name` para abrir diretamente essa composição.

O arquivo `Lucas Pereira - 3D.png` é uma arte tipográfica separada de 2048 × 1536 pixels, produzida por código com efeito de extrusão, cores verde e dourada e fundo estrelado. Foi inspecionada visualmente. Não é uma captura da rede de pontos do Three.js nem uma imagem gerada por IA. `gerar-lucas-pereira.ps1` contém sua implementação para Windows com System.Drawing.

## Requisitos atendidos

| Requisito | Implementação |
|---|---|
| Cena 3D funcional em tela inteira | Câmera perspectiva, iluminação ambiente e pontual, WebGLRenderer responsivo. |
| Pontos algorítmicos | Superfícies paramétricas de pétalas, esferas, raios, crescente e estrela, com variações pseudoaleatórias. |
| Conexões entre pontos | Tubos instanciados conectam vizinhos das superfícies, formando redes. |
| Rotação contínua | `requestAnimationFrame`, com velocidade ajustada pelo tempo entre quadros. |
| Paletas geradas | Matizes HSL calculados pelo gerador pseudoaleatório de cada semente. |
| Gerar nova escultura | Nova semente, novas posições e cores, substituição da obra e liberação de recursos anteriores. |

## Melhorias implementadas

1. Sliders de quantidade de pontos, velocidade e espessura.
2. Câmera orbital com mouse ou toque: arraste para orbitar; role ou use pinça para zoom.
3. Exportação da vista atual em PNG de 2048 × 2048 pixels, sem a interface.
4. Semente reproduzível, armazenada também no fragmento da URL com estilo, quantidade e espessura.
5. Cinco estilos: Lótus, Sol, Lua, Estrela e Lucas Pereira. Sol tem núcleo esférico e raios volumétricos em cores quentes; Lua é um crescente com profundidade e cores frias; Estrela tem cinco pontas e volume; Lucas Pereira tem letras com profundidade. As proporções e paletas variam de forma reproduzível por semente.
6. Fundo com estrelas, partículas em movimento e neblina.
7. Luz com variação suave de cor ao longo do tempo.
8. Pausar/retomar, restaurar câmera e modo de foco.
9. Layout adaptado a celular, rótulos acessíveis e navegação dos controles por teclado.

## Como reproduzir uma obra

Guarde a semente, o estilo e a quantidade de pontos. Selecione os mesmos valores, digite a semente e pressione Enter ou o botão ↵. A geometria e a paleta serão idênticas. A espessura também pode ser recuperada pela URL. A câmera e o instante da animação afetam a imagem exportada; para uma vista frontal, use “Restaurar câmera” e pause a rotação.

O botão de exportação usa o download do navegador; o local de salvamento depende das suas configurações. Para guardar o PNG nesta pasta, selecione-a na janela de download ou mova o arquivo depois.

## Arquivos

- `index.html`: estrutura da interface.
- `style.css`: visual e adaptação de layout.
- `sculpture.js`: fórmulas, conexões, paleta e gerador pseudoaleatório.
- `app.js`: Three.js, interação, animação, exportação e gerenciamento dos recursos.
- `assets/lucas-pereira.js`: contornos das letras do nome, necessários para essa composição.
- `vendor/three.min.js`: Three.js 0.128.0, distribuição clássica local.
- `vendor/OrbitControls.js`: controle orbital da mesma versão.
- `vendor/THREE-LICENSE.txt`: licença MIT das bibliotecas.
- `tests.html`: verificações da geração e da interação no navegador.

A distribuição clássica foi escolhida para permitir abrir `index.html` diretamente por arquivo, sem importações de módulos ou dependências externas. Entregue os arquivos HTML/CSS/JS junto com a pasta `vendor/`, preservando essa estrutura.

## Validação

Nesta atualização foram verificadas as referências locais, os contornos do nome e a imagem PNG. A suíte foi ajustada para a versão atual, mas não foi executada novamente no navegador. A tentativa anterior de autorizar o Chrome headless foi bloqueada por erro 404 no serviço de revisão automática. O relatório em `validacao.txt` registra o estado da entrega atual.

`tests.html` verifica as cinco geometrias nos limites de densidade, determinismo, variação entre sementes, conexões, rotação, pausa, controles, seleção dos estilos, descarte de geometria e exportação PNG. Para executar a parte de integração, sirva a pasta por um servidor HTTP local e abra `/tests.html`: a política de origem de alguns navegadores impede a inspeção do iframe ao abrir esse teste por `file://`. Essa restrição não impede o uso normal de `index.html` por duplo clique.
