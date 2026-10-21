# LUPES TOUR

Chatbot de viagens em **HTML, CSS e JavaScript puro**, sem frameworks, dependências npm ou etapa de build. O servidor usa módulos nativos do Node.js e mantém credenciais fora do navegador.

## Executar

Pré-requisito: **Node.js 22 ou superior**, com `node` e `npm` no PATH. Não é necessário executar `npm install`.

Crie a configuração privada somente se ainda não existir:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Preencha o `.env` conforme um dos modos abaixo e inicie:

```powershell
npm start
```

Acesse `http://127.0.0.1:3000`. Após alterar o `.env`, reinicie o servidor e recarregue a página. Variáveis já definidas no terminal têm precedência sobre o `.env`.

Para uma prévia sem IA, abra `index.html` diretamente. Outra opção é `npm run demo`, que inicia o servidor sem carregar `.env`; variáveis existentes no terminal continuam valendo. As respostas de demonstração são estáticas e identificadas como tal.

As fontes usam Google Fonts com alternativa sans-serif local. Ícones e ilustrações SVG são locais.

## Configuração do Foundry

### Modelo direto

Este é o modo validado com a implantação `gpt-5-mini`. Não executa o agente `LUPES-TOUR:2` nem carrega suas ferramentas ou instruções.

```dotenv
FOUNDRY_MODE=model
FOUNDRY_ENDPOINT=https://SEU-RECURSO.openai.azure.com/openai/v1/
FOUNDRY_API_KEY=sua-chave-do-recurso
FOUNDRY_MODEL=gpt-5-mini
PORT=3000
HOST=127.0.0.1
```

`FOUNDRY_MODEL` deve ser o **nome real da implantação**. A chamada usa `/openai/v1/chat/completions`, autenticação `api-key` e o prompt de viagens definido em `server.js`.

### Agente LUPES-TOUR

Para executar o agente existente do anexo, use o endpoint do projeto e autenticação Microsoft Entra:

```dotenv
FOUNDRY_MODE=agent
FOUNDRY_PROJECT_ENDPOINT=https://SEU-RECURSO.services.ai.azure.com/api/projects/SEU-PROJETO
FOUNDRY_AGENT_NAME=LUPES-TOUR
FOUNDRY_AGENT_VERSION=2
```

Copie o **endpoint do projeto** que contém o agente. O nome do projeto não é necessariamente o nome do agente. Não use o endereço do portal nem o endpoint `openai.azure.com` nesse campo.

Escolha uma das autenticações abaixo. A chave `FOUNDRY_API_KEY` não é usada no modo agente.

**Token temporário para desenvolvimento**

Com Azure CLI instalada, autentique uma conta com permissão de execução no projeto. O token fica na variável do terminal, sem ser exibido:

```powershell
az login
$env:FOUNDRY_ACCESS_TOKEN = az account get-access-token --resource https://ai.azure.com/ --query accessToken --output tsv
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($env:FOUNDRY_ACCESS_TOKEN)) { throw 'Não foi possível obter o token Entra.' }
npm start
```

Deixe `FOUNDRY_ACCESS_TOKEN` vazio no `.env` ao usar a variável do terminal. Se preencher esse campo privado manualmente, nunca compartilhe o token. Em caso de expiração, obtenha outro token e reinicie o servidor.

**Identidade de aplicação com renovação de token**

Configure uma aplicação Microsoft Entra com as permissões de RBAC necessárias no projeto e preencha:

```dotenv
AZURE_TENANT_ID=identificador-do-diretorio
AZURE_CLIENT_ID=identificador-da-aplicacao
AZURE_CLIENT_SECRET=valor-do-segredo-da-aplicacao
FOUNDRY_ACCESS_TOKEN=
```

Se houver token no terminal, remova-o antes de usar a identidade de aplicação:

```powershell
Remove-Item Env:FOUNDRY_ACCESS_TOKEN -ErrorAction SilentlyContinue
npm start
```

O servidor solicita tokens para `https://ai.azure.com/.default`, mantém um cache em memória e obtém outro próximo da expiração. O segredo da aplicação é diferente da chave do recurso Foundry.

A execução usa `/openai/v1/responses` com `agent_reference` contendo nome e versão. O modelo, as instruções e as ferramentas vêm da versão selecionada no Foundry. Este projeto não cria nem publica agentes. Para mudar de versão, atualize `FOUNDRY_AGENT_VERSION` explicitamente.

## Diagnóstico

| Comando | Finalidade |
| --- | --- |
| `npm run check` | Verificar a sintaxe de todos os arquivos JavaScript da aplicação. |
| `npm run diagnose -- --config` | Verificar campos necessários, sem chamar o Azure. |
| `npm run diagnose` | Enviar uma mensagem curta real no modo configurado. |
| `npm run diagnose -- --model` | Testar o modelo direto sem modificar o `.env`. |

O diagnóstico carrega `.env` automaticamente e não exibe segredos nem o conteúdo da resposta. Chamadas reais podem consumir a cota do recurso. Se faltarem campos, ele interrompe antes de chamar o Azure.

O indicador da interface diferencia demonstração, configuração pendente e campos configurados. **Configurado não significa conexão validada**: envie uma mensagem ou use o diagnóstico. Uma configuração incompleta não é substituída por respostas de demonstração.

Se não houver resposta, verifique:

- Se a página foi aberta pelo servidor, e não diretamente como arquivo.
- Se `FOUNDRY_MODE` corresponde às credenciais preenchidas.
- Se o nome da implantação ou a versão do agente existem no recurso correto.
- Se o token expirou, a chave foi regenerada ou a identidade tem acesso ao projeto.
- Se o servidor foi reiniciado após a alteração do `.env`.

## Recursos e limites

- Oito temas: Previsão do Tempo, Aeroportos, Documentação, Traslado, Vacinação, Horários, Vistos e Moedas.
- Perguntas livres, contexto de conversa, carregamento, interrupção e tentativa novamente.
- Enter envia; Shift + Enter insere uma nova linha.
- Checklist persistente e até 20 conversas salvas, com reabertura e exclusão.
- Salvamento manual somente no navegador, sem sincronização. Limpar os dados do site remove o histórico salvo.
- Tela inicial adaptada à altura disponível e navegação por teclado com foco visível.

**Um modelo sozinho não consulta dados em tempo real.** No modo modelo, não há ferramentas para consultar clima, voos, câmbio ou regras vigentes. No modo agente, as ferramentas dependem da configuração no Foundry. Funções que exigem execução no cliente e aprovações MCP não são executadas por este chat e geram uma mensagem explicativa.

As respostas podem conter erros e não substituem orientação médica, consular ou financeira. Confirme informações em fontes oficiais e revise as instruções de segurança do agente no portal.

O contexto enviado contém até as 19 mensagens mais recentes. Cada pergunta aceita até 4.000 caracteres; cada conversa, até 200 mensagens. O servidor limita o corpo a 64 KiB, as respostas a 4.096 tokens e a espera a 120 segundos. Não há vínculo entre conversas locais e IDs de conversas remotas, nem preservação de resultados internos das ferramentas.

## Segurança

- Guarde chaves, tokens e segredos somente no `.env` privado ou no ambiente do servidor. Nunca preencha `.env.example` com credenciais reais. Regenere credenciais que tenham sido expostas.
- O `.env` é ignorado pelo Git. A lista explícita de arquivos públicos impede servir configurações e código do servidor.
- Mensagens são renderizadas como texto, sem executar HTML do usuário ou do modelo.
- Há validação de entrada, proteção de origem, limites por IP e concorrência, além de timeout. As verificações de concorrência antes e depois da leitura do corpo são intencionais.
- O servidor escuta em `127.0.0.1` por padrão. Esta é uma base local, não uma implantação pública autenticada.
- Antes de publicar, implemente autenticação, HTTPS, limites persistentes por usuário, gestão de segredos, monitoramento e política de privacidade. Se usar proxy reverso, configure `APP_ORIGIN` e revise a confiança nos cabeçalhos.
- Perguntas e contexto são enviados ao recurso Microsoft configurado. A aplicação não registra o corpo das conversas no servidor. Não envie documentos, senhas ou dados bancários.

## Estrutura mantida

```text
index.html          Estrutura da interface
styles.css          Aparência e responsividade
app.js              Chat, temas, checklist e armazenamento local
server.js           Rotas HTTP e proteções
foundry.js          Adaptadores de modelo/agente e autenticação
scripts/diagnose.js  Diagnóstico seguro de conexão
assets/             Ilustração e favicon SVG
.env.example        Exemplo de configuração sem credenciais
package.json        Comandos de execução e verificação
.gitignore          Exclusão de segredos, logs e temporários
```

O `.env` local não deve ser compartilhado. A pasta `.preview/` é temporária e não faz parte da aplicação; logs abertos pelo servidor em execução devem ser mantidos até o processo encerrar.

## Validação da limpeza

A tela inicial foi comparada antes e depois em oito resoluções, de celular a desktop: nenhuma diferença de estilos ou posições nos elementos visíveis e nenhuma barra de rolagem nas resoluções testadas. Também foram verificados os oito temas, chat demonstrativo, salvamento/reabertura, checklist, bloqueio de envio vazio, cancelamento, tentativa novamente e renderização segura de texto, sem exceções JavaScript.

Essa validação de limpeza não consome a API nem substitui uma auditoria completa de acessibilidade. Para repetir a checagem de conexão real, use o comando de diagnóstico.
