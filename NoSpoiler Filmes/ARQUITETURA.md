# Arquitetura da NoSpoiler

## Visão geral

A aplicação utiliza uma arquitetura frontend estática, sem processo de compilação e sem servidor próprio.

```text
index.html
   ├── styles.css
   ├── api.js ─────────────► OMDb API
   └── app.js ─────────────► localStorage
```

## Responsabilidades

### `index.html`

Define a estrutura semântica da aplicação: cabeçalho, busca, catálogo, paginação, apresentação institucional, rodapé e modal de detalhes.

### `styles.css`

Centraliza a identidade visual preto/roxo, responsividade, skeletons, estados de erro, modal e película de avaliação.

A película usa a metade inferior do pôster e é revelada por `:hover` ou foco de teclado.

### `api.js`

Encapsula as chamadas à OMDb em `window.NoSpoilerApi`:

- `search(title, page, filters)` pesquisa títulos com filtros opcionais.
- `details(imdbId)` carrega a ficha completa.

O arquivo trata falhas HTTP e mensagens de erro retornadas pela API.

### `app.js`

Controla estado, renderização e eventos:

1. Executa uma busca inicial por Batman.
2. Processa o formulário e sugestões rápidas.
3. Renderiza filmes e paginação.
4. Carrega notas quando os cards se aproximam da área visível.
5. Abre a ficha completa em um modal.
6. Mantém detalhes em cache durante a sessão.
7. Escapa dados externos antes da inserção no HTML.
8. Persiste favoritos e histórico no `localStorage`.
9. Sincroniza favoritos entre cards, catálogo e modal.

### `test.html` e `test.js`

Fornecem uma suíte simples no próprio navegador, sem bibliotecas ou runtime externo. Os testes exercitam o cliente da API, consultas reais, filtros, erros e persistência local.

## Requisitos do enunciado

| Solicitação | Implementação |
| --- | --- |
| Busca por filme | Formulário principal e sugestões rápidas |
| Lista de resultados | Grid com pôster, título, ano e tipo |
| Tela de detalhes | Modal com sinopse completa e ficha técnica |
| Tratamento de erros | Mensagens específicas e estados visuais |
| API OMDb | Cliente isolado em `api.js` |
| HTML, CSS e JavaScript | Sem frameworks, CDN ou etapa de build |

## Inovações implementadas

- **Favoritos locais:** títulos ficam disponíveis após recarregar a página.
- **Filtros combinados:** tipo e ano podem ser usados junto da busca textual.
- **Histórico inteligente:** evita duplicatas e mantém as seis buscas mais recentes.
- **Carregamento progressivo de notas:** detalhes são solicitados somente quando o card se aproxima da tela.
- **Cache em sessão:** uma ficha já consultada não gera chamada duplicada durante o uso.
- **Acesso ao IMDb:** o modal oferece um link seguro para a página oficial do título.
- **Experiência inclusiva:** navegação por teclado, `aria-live` e redução de movimento.

## Ideias para próximas versões

- Criar listas personalizadas, como “quero assistir” e “já assisti”.
- Permitir notas e comentários pessoais salvos no navegador.
- Comparar dois filmes lado a lado.
- Gerar uma sugestão aleatória baseada em gênero e ano.
- Exibir estatísticas dos favoritos por gênero e década.
- Adicionar compartilhamento de uma busca por parâmetros na URL.
- Criar um modo “sessão de cinema” para sortear um favorito.

## Fluxo de busca

1. O usuário informa um título.
2. `app.js` chama `NoSpoilerApi.search`.
3. `api.js` monta a URL da OMDb com `URLSearchParams`.
4. A resposta é validada e devolvida à interface.
5. Os cards são renderizados no catálogo.

## Responsividade e acessibilidade

- Grade adaptada para desktop, tablet e celular.
- Modal reorganizado em uma coluna em telas menores.
- Cards acessíveis por Enter e Espaço.
- Mensagens dinâmicas anunciadas por `aria-live`.
- Respeito à preferência `prefers-reduced-motion`.
- Textos alternativos nos pôsteres.

## Limitação de segurança

Uma aplicação somente frontend não consegue ocultar uma credencial usada para chamar uma API externa. A chave fica disponível no JavaScript e na aba Network do navegador.

Para proteger a chave em produção, a arquitetura precisa de ao menos uma função serverless ou proxy backend. Essa camada receberia a solicitação do navegador e adicionaria a chave fora do ambiente do usuário.
