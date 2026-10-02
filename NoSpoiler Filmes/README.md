# NoSpoiler

Aplicação frontend para pesquisar filmes e consultar informações da OMDb API.

O projeto implementa todos os requisitos do enunciado da atividade SENAI e acrescenta melhorias próprias de experiência e navegação.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- OMDb API

Não existe servidor, framework, pacote npm ou código Node.js neste projeto.

## Como executar

Use a extensão **Live Server** do VS Code:

1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito em `public/index.html`.
3. Selecione **Open with Live Server**.

Não são usadas bibliotecas, frameworks, fontes ou ícones via CDN.

## Requisitos atendidos

- Busca pelo nome ou parte do nome.
- Resultados com pôster, título e ano.
- Tela de detalhes com sinopse completa, gênero, direção, elenco e nota IMDb.
- Mensagens amigáveis para filme inexistente, chave inválida, limite diário e falha de conexão.
- Indicador visual de carregamento.
- Layout responsivo para desktop, tablet e celular.

## Melhorias implementadas

1. Favoritos persistentes com `localStorage`.
2. Filtro por filme, série ou episódio.
3. Filtro por ano de lançamento.
4. Paginação dos resultados.
5. Histórico das seis buscas mais recentes.
6. Link direto para o título no IMDb.
7. Nota revelada por película interativa no hover.

## Testes

Abra `public/test.html` pelo Live Server. A página executa sete verificações:

1. Disponibilidade do cliente JavaScript da OMDb.
2. Busca real por filmes.
3. Consulta real da ficha de um filme.
4. Filtros de tipo e ano.
5. Tratamento de busca sem resultados.
6. Persistência local para favoritos e histórico.
7. Recursos necessários do navegador.

## Arquivos

```text
public/
├── index.html   # Página principal
├── styles.css   # Interface responsiva preto e roxo
├── api.js       # Integração direta com a OMDb
├── app.js       # Catálogo, filtros, favoritos, histórico e modal
├── test.html    # Página visual de testes
└── test.js      # Testes funcionais no navegador
```

## Aviso sobre a API Key

Como esta versão é exclusivamente frontend, a chave da OMDb precisa ser enviada pelo navegador e pode ser visualizada nas ferramentas de desenvolvimento.

Não existe forma tecnicamente segura de esconder uma chave em HTML, CSS ou JavaScript executado no navegador. Minificação e ofuscação apenas dificultam a leitura, mas não protegem o segredo.

Para uma publicação pública com chave realmente privada, será necessário restaurar uma função serverless ou um backend proxy.
