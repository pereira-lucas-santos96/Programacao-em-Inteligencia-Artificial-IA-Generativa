# Livraria Bahubali

Dashboard de vendas inspirado no universo de Bahubali, com identidade verde e dourada, palácio e livros em ilustrações SVG originais. Desenvolvido com HTML, CSS, JavaScript puro, Chart.js e PapaParse locais.

## Abrir

Dê um duplo clique em **index.html** e abra com Edge, Chrome ou Firefox atualizado. Não é necessário instalar dependências, iniciar servidor ou acessar a internet. Mantenha os arquivos e as pastas `assets` e `vendor` juntos.

## Atualizar as vendas

1. Clique em **Atualizar base**.
2. Escolha seu CSV ou arraste o arquivo para a área indicada.
3. Confira a mensagem com o total de vendas importadas e clique em **Fechar**.

A importação substitui toda a base, reinicia os filtros e atualiza os seis indicadores, os quatro gráficos e a tabela. Envie o histórico completo quando quiser manter a comparação entre meses. Arquivos com erros são rejeitados integralmente, preservando a base atual.

A última importação fica salva no armazenamento local deste navegador quando permitido. Limpar dados do navegador, trocar de navegador/dispositivo ou mover o projeto pode exigir uma nova importação. Guarde o CSV como cópia dos dados. Use **Restaurar base fornecida** para voltar às 188 vendas originais.

### Formato do arquivo

```csv
Data,Loja,Categoria,Produto,Quantidade,Valor
2026-08-26,Centro,Ficção,Exemplo de livro,2,59.80
```

- Cabeçalhos obrigatórios: `Data`, `Loja`, `Categoria`, `Produto`, `Quantidade`, `Valor`.
- `Data`: data real no formato AAAA-MM-DD, entre 1900 e 2100.
- `Quantidade`: inteiro positivo, até 1.000.000.
- `Valor`: **total do registro de venda**, não preço unitário; valor não negativo, até duas casas decimais e até R$ 1 bilhão.
- Separadores aceitos: vírgula, ponto e vírgula ou tabulação. Valores decimais com vírgula devem estar entre aspas se a vírgula também separar as colunas.
- Codificação UTF-8 ou Windows-1252. No Excel, prefira **CSV UTF-8**.
- Limites: 5 MB, 20.000 registros, 100 lojas, 30 categorias; nomes de até 180 caracteres.
- Nomes de lojas e categorias são obtidos do CSV. Evite grafias diferentes para o mesmo nome.
- Há um botão **Baixar modelo CSV** na janela de importação.

## Recursos e critérios dos cálculos

- **Filtros combinados:** loja e categoria atualizam todo o dashboard. `Limpar filtros` retorna à visão completa.
- **Receita:** soma de `Valor`, calculada em centavos para evitar erros de soma decimal.
- **Itens vendidos:** soma de `Quantidade`.
- **Número de vendas:** quantidade de registros; a base não possui identificador de pedido.
- **Ticket médio:** receita dividida pelo número de registros.
- **Produto mais vendido:** soma das unidades por nome de produto. Empates são sinalizados; o primeiro em ordem alfabética é mostrado e o título do cartão lista os empatados.
- **Variação mensal:** receita do último mês presente na base comparada ao mês calendário anterior, sempre respeitando os filtros. Fórmula: `(atual − anterior) / anterior × 100`. Quando não há receita no mês anterior, exibe `—` com explicação. Meses parciais são considerados conforme os registros disponíveis; não há projeção.
- **Gráficos:** receita por categoria, participação percentual por categoria, evolução mensal e top 5 produtos por unidades. O período se adapta às novas bases; meses intermediários sem vendas aparecem com zero.
- **Animações:** ao alterar filtros, importar um CSV ou restaurar a base, os gráficos transitam suavemente entre os valores, com uma breve entrada visual. A preferência de movimento reduzido do navegador desativa essas animações.
- **Tabela:** as dez vendas mais recentes dos filtros atuais. Clique em qualquer cabeçalho para ordenar **essas dez vendas**, alternando crescente e decrescente. Empates de data usam a ordem inversa do arquivo.
- **Exportar seleção:** baixa todos os registros filtrados, não apenas os dez da tabela. Inclui proteção contra fórmulas em campos de texto para planilhas.
- **Acessibilidade:** navegação por teclado, foco visível, rótulos de gráficos com os dados, mensagens anunciadas, janela de importação acessível e respeito à preferência por movimento reduzido.

## Referência da base fornecida

| Indicador | Resultado |
| --- | --- |
| Período | 01/01/2026 a 26/08/2026 |
| Receita | R$ 35.378,30 |
| Itens | 670 |
| Vendas | 188 |
| Ticket médio | R$ 188,18 |
| Produtos líderes | Finanças Sem Mistério e O Jardim Esquecido: 42 unidades cada |
| Variação agosto/julho | +10,8% |

## Arquivos

- `index.html`, `style.css`, `script.js`: aplicação.
- `vendas_livraria.csv`: dados originais, preservados.
- `dados-iniciais.js`: cópia do CSV original que permite abrir por duplo clique sem restrições de leitura de arquivo do navegador. Para atualizações usuais, utilize o botão de importação; não é necessário editar código.
- `assets/`: emblema e ilustração SVG originais.
- `vendor/`: Chart.js 4.4.8 e PapaParse 5.5.2 fornecidos, com licenças preservadas.
- `PROMPTS.md`: solicitação recebida e decisões de desenvolvimento assistido.
- `tests/dashboard.html`: verificação automatizada em navegador; execute somente em perfil de teste, pois importa dados temporários e restaura a base original.
- `tests/browser-result.html`: resultado da execução automatizada.
- `tests/dashboard-desktop.png`: captura da interface real.
- `tests/dashboard-mobile.png`: captura da interface em uma tela de 390 px.
- `demonstracao-bahubali.webm`: vídeo legendado de aproximadamente 45 segundos, montado com capturas reais de dez etapas da aplicação, incluindo filtros, gráficos, tabela, importação inválida e válida, restauração e tela móvel. Abra no navegador para assistir.
- `tests/gravar-demo.cjs`: rotina usada para produzir o vídeo com um navegador de teste isolado.

Se hospedado por HTTP, o projeto procura o CSV da pasta ao iniciar; na abertura direta utiliza a cópia em `dados-iniciais.js`. Em ambos os casos, uma base importada salva no navegador tem prioridade. Não há backend ou envio dos dados a serviços externos.

## Verificação

41 verificações passaram no Microsoft Edge: totais originais, quatro gráficos, 20 combinações de filtros, tabela e ordenação, CSV com ponto e vírgula/decimal brasileiro, armazenamento, seleção vazia, dados inválidos, texto semelhante a HTML, receita zero, restauração e ausência de rolagem horizontal a 390 px. Não foram observados erros JavaScript durante a execução.

Para repetir os testes, use um perfil isolado do navegador e abra `tests/dashboard.html` permitindo acesso entre arquivos locais, ou sirva a pasta por HTTP. O teste modifica e restaura o armazenamento da aplicação no perfil utilizado.
