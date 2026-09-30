# Lab.dev · Portfólio de projetos

Projetos práticos do curso de **Programação em Inteligência Artificial Generativa — SENAI**. O objetivo é aplicar ferramentas de IA como apoio à lógica de programação, ao desenvolvimento de código e à criação de soluções funcionais.

O [**index.html da raiz**](index.html) é a entrada do portfólio: apresenta os cinco projetos, com busca por nome ou recurso, filtros de aplicações e jogos, ilustrações locais e links para abrir cada experiência.

## Projetos

| Projeto | O que explorar | Acessar |
| --- | --- | --- |
| Brisa — Previsão do Tempo | API Open-Meteo, geolocalização, previsões e cenários animados | [Abrir aplicação](Previs%C3%A3o%20do%20Tempo/index.html) |
| Próximo Passo — Lista de Tarefas | Organização de estudos, listas, prioridades e progresso | [Abrir agenda](Lista%20de%20Tarefas/atividade-bugs-lista-tarefas.html) |
| Carrinho de Compras | Produtos e lógica de carrinho de compras | [Abrir carrinho](Carrinho%20de%20compra/atividade-bugs-carrinho-compras.html) · [Ver vitrine](Carrinho%20de%20compra/index.html) |
| Forca Temática | Palavras, temas de conhecimento, cartas de ajuda e ranking | [Jogar](Jogo%20da%20Forca/index.html) |
| Templo da Memória | Pares, níveis de dificuldade e até três jogadores locais | [Jogar](jogo%20da%20memoria/index.html) |

## Abrir no computador

Abra `index.html` na raiz pelo navegador ou use **Open with Live Server** no VS Code. A página inicial não exige instalação, compilação ou bibliotecas JavaScript. Os links são relativos e funcionam tanto localmente quanto em um site estático.

A navegação do catálogo funciona mesmo sem JavaScript; busca e filtros são melhorias opcionais. As prévias dos cartões são ilustrações em HTML/CSS/SVG, não capturas ao vivo. Google Fonts é opcional, com fontes do sistema como alternativa. Alguns projetos usam APIs, imagens e estilos externos; consulte a documentação de cada pasta para seus requisitos.

## Publicar no GitHub Pages

Para apresentar uma página navegável, além da lista de arquivos do GitHub:

1. Envie `index.html`, `assets/` e as pastas dos projetos para a raiz do repositório, preservando os nomes das pastas e arquivos.
2. No GitHub, acesse **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch **main** e a pasta **/ (root)**. Salve.
5. Após o GitHub concluir a publicação, use o endereço exibido em **Pages**. Adicione esse endereço ao campo **Website** da seção **About** do repositório.

O endereço esperado, de acordo com o repositório apresentado, é:

```text
https://pereira-lucas-santos96.github.io/Programacao-em-Inteligencia-Artificial-IA-Generativa/
```

A criação dos arquivos locais não publica o site automaticamente. Os links HTML no README do GitHub abrem o código dos arquivos; no portfólio publicado, os botões abrem as aplicações.

## Organização

```text
index.html                         Página inicial e catálogo dos projetos
assets/portfolio/
  styles.css                       Identidade visual, prévias e responsividade
  script.js                        Busca e filtros do catálogo
  favicon.svg                      Ícone do portfólio
Carrinho de compra/                Loja, vitrine e atividade de carrinho
Jogo da Forca/                     Jogo de palavras
jogo da memoria/                   Jogo de pares
Lista de Tarefas/                  Agenda Próximo Passo
Previsão do Tempo/                 Aplicação Brisa
```

Os arquivos do portfólio têm uma pasta própria, sem alterar os estilos e scripts dos projetos. Os arquivos de atividades, manutenção e testes continuam em suas pastas de origem e não aparecem como projetos duplicados no catálogo.

## Adicionar um projeto

1. Crie a pasta do projeto e seu arquivo de entrada.
2. Adicione um `article.project-card` em `index.html`, seguindo os cartões existentes. Defina `data-category="app"` ou `data-category="game"`, palavras-chave em `data-keywords`, título, descrição, tecnologias e link relativo correto.
3. Atualize as contagens de projetos na página e a tabela deste README.

A busca ignora diferenças entre maiúsculas, minúsculas e acentos e combina os termos digitados com a categoria selecionada. Nenhuma informação é enviada a servidores por essa funcionalidade.
