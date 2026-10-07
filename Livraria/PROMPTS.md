# Registro do desenvolvimento assistido por IA

## Solicitação recebida

> Você é especialista em desenvovilemnto sênior, com base na solicitação contida na pasta o Enunciado Dashboard Dados Gráficos, faça conforme solicitado, entretanto permitir que o usuário para o input do arquivo para que sempre que for necessário atualizar tenha como ser realizado de forma rápida e clara, Livraria bahubali, terá como tema a historia indiana de Mahantra bahubali. A base da dados a ser trabalhada esta na pasta o arquivo vendas_livraria

## Fontes utilizadas

- `enunciado-extraido.txt`, extraído do PDF `Enunciado Dashboard Dados Graficos.pdf`.
- `vendas_livraria.csv`.
- Bibliotecas locais Chart.js e PapaParse em `vendor/`.

## Decisões adotadas pelo assistente

As etapas abaixo documentam decisões de implementação; não representam mensagens adicionais enviadas pelo usuário.

1. Seguir os requisitos do enunciado com HTML, CSS e JavaScript separados, substituindo a marca Alfa por Livraria Bahubali.
2. Usar uma interpretação visual do universo épico de Bahubali em verde, dourado, arcos de palácio e livros; criar arte SVG original sem imagens externas.
3. Carregar os dados fornecidos também na abertura direta de `index.html`, por meio de uma cópia local do CSV em JavaScript.
4. Importar novas bases por seleção ou arrastar e soltar, validando datas, valores, quantidades e colunas antes de substituir a base.
5. Calcular valores monetários em centavos e comparar os últimos meses da base com os filtros aplicados.
6. Preservar a importação no navegador, oferecer restauração da base original, modelo de CSV e exportação da seleção.
7. Verificar cálculos e fluxos críticos em navegador real com dados válidos, inválidos e seleções vazias, incluindo responsividade.

## Resultado

Dashboard implementado com seis KPIs, quatro gráficos, filtros combinados, tabela ordenável, importação persistente e funcionamento offline. Consulte `README.md` para uso e critérios de cálculo, e `tests/browser-result.html` para a execução dos testes.
