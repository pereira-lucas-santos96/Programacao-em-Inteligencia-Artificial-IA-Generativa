# Brisa · Previsão do tempo

Aplicação responsiva em português para consultar o clima de localidades no mundo inteiro usando a API pública Open-Meteo, sem chave.

## Executar

Abra **`index.html`** no Chrome, Edge ou Firefox. Não é necessário instalar dependências nem compilar o projeto. É preciso ter internet para buscar os dados.

Para desenvolvimento, você também pode usar a extensão **Live Server** do VS Code ou qualquer servidor estático. A geolocalização depende da permissão do usuário e das regras do navegador; se não estiver disponível ao abrir o arquivo, sirva a aplicação em `localhost` ou HTTPS. A busca por cidade continua disponível.

## Funcionalidades

- Busca com sugestões de cidades e identificação do estado/país, navegação por teclado e atalhos de localidades.
- Histórico das últimas cinco cidades consultadas por escolha do usuário, sem duplicatas por coordenadas, com opção de limpar. A busca e o histórico têm paginação para não criar listas com rolagem.
- Geolocalização mediante permissão. As coordenadas são exibidas porque a API utilizada não oferece geocodificação reversa.
- Alternância Celsius/Fahrenheit para temperatura atual, sensação térmica, máximas, mínimas e previsão por hora. A conversão é local e não faz uma nova requisição; vento permanece em km/h e precipitação em mm.
- Modos claro e escuro, com preferência salva. Na primeira visita, o tema segue a configuração do sistema. O tema da interface é independente do cenário meteorológico de dia/noite.
- Temperatura, sensação térmica, umidade, vento, precipitação e horários de nascer/pôr do sol.
- Previsão para sete dias e para as próximas seis horas, com probabilidade de precipitação.
- Cenários vetoriais animados em loop, como um GIF: sol, nuvens, chuva, neve, nevoeiro, trovoadas e noite. CSS e SVG locais evitam depender de serviços de GIF. O fundo acompanha o código meteorológico WMO retornado pela API.
- Botão para pausar animações e respeito à preferência de movimento reduzido do sistema.
- Atualização automática a cada cinco minutos enquanto a página está visível, atualização manual e nova consulta ao retornar à página ou recuperar a conexão.
- Persistência da última localidade consultada com sucesso, histórico de cidades, unidade, tema e preferência de animação no `localStorage`.
- Tratamento de carregamento, consulta sem resultados, ausência de rede, limite de consultas e falhas da API. Respostas antigas não substituem a cidade selecionada.
- Indicador de carregamento visível em qualquer visualização e transição suave ao receber os dados de uma nova cidade.
- Painel ajustado à altura disponível (`100dvh`), com as visualizações **Agora**, **7 dias** e **Por hora** na mesma página. No desktop, Agora também inclui a previsão semanal; no celular, os períodos são acessados pelos botões para manter o conteúdo sem rolagem de página.
- Ícones meteorológicos ilustrados com cores próprias para sol, nuvens, chuva e tempestades, além de variantes noturnas.

**Sobre “tempo real”:** são as condições atuais disponíveis na Open-Meteo, estimadas por modelos meteorológicos, não uma leitura de sensor a cada segundo. A interface informa o horário dos dados e da consulta. Todos os horários meteorológicos usam o fuso da cidade, independentemente do fuso do computador. Ao falhar uma atualização, os dados anteriores da mesma cidade permanecem com aviso de desatualização; ao trocar a cidade, esses dados são limpos.

## Organização

```text
index.html                   Estrutura semântica e acessível
styles.css                   Layout responsivo e cenários animados
styles/dashboard.css         Painel ajustado à tela, temas e ícones ilustrados
assets/favicon.svg           Identidade visual local
src/domain/weather.js        Regras WMO, normalização e formatação
src/services/open-meteo.js   HTTP, geocodificação, timeout e cancelamento
src/services/preferences.js  Persistência defensiva de preferências
src/ui/view.js               Renderização e elementos visuais
src/app.js                   Estado, eventos e orquestração da aplicação
tests/weather.test.cjs       Testes das regras e integração HTTP simulada
tests/browser.test.cjs       Testes de fluxos e layout no Chrome headless
```

O domínio não conhece o DOM nem a rede. Os serviços isolam integrações externas. A interface recebe dados normalizados e renderiza textos externos com `textContent`. O controlador coordena as camadas, cancela solicitações anteriores e confere a identidade da consulta antes de atualizar a tela. Scripts clássicos com escopo fechado e um único namespace permitem execução direta por `file://`, sem bundler.

## Validação

Com Node.js 20 ou superior:

```sh
node --test tests/weather.test.cjs
```

Com Node.js 22 ou superior e Google Chrome instalado (ou variável `CHROME_PATH` apontando para o executável):

```sh
node tests/browser.test.cjs
```

Os testes de navegador usam respostas simuladas e determinísticas. Verificam carregamento, busca, troca rápida de cidade, falha e recuperação, cenários, geolocalização, teclado, persistência, conversão de temperatura, temas e histórico. Também verificam as três visualizações em nove dimensões, de 320 × 568 a 1440 × 900, incluindo orientação horizontal, tanto para rolagem de página quanto para conteúdo cortado. Capturas são gravadas em `tests/artifacts/`. A disponibilidade real da Open-Meteo deve ser verificada separadamente com acesso à internet.

Para incluir uma consulta real no teste de navegador, defina a variável de ambiente `BRISA_LIVE_TEST=1` antes da execução. No PowerShell: `$env:BRISA_LIVE_TEST='1'`.

## APIs e créditos

- [Previsão Open-Meteo](https://open-meteo.com/en/docs): `https://api.open-meteo.com/v1/forecast`.
- [Geocodificação Open-Meteo](https://open-meteo.com/en/docs/geocoding-api): `https://geocoding-api.open-meteo.com/v1/search`.
- Dados de localidades: [GeoNames](https://www.geonames.org/).
- Tipografia: DM Sans e Manrope via Google Fonts, com fontes locais de fallback.
- Ilustrações, ícones e animações em SVG/CSS incluídos no projeto.

A API gratuita está sujeita aos [termos da Open-Meteo](https://open-meteo.com/en/terms). O PDF presente na pasta foi usado como referência visual para busca, localização e previsão semanal.
