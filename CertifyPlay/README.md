# CertifyPlay

Plataforma educativa em português, construída com HTML5, CSS3 e JavaScript puro. Funciona offline, sem instalação, bibliotecas, fontes externas ou etapa de build.

## Executar

Abra `index.html` em um navegador moderno (Chrome, Edge, Firefox ou Safari). Todos os arquivos devem permanecer na estrutura abaixo. Para uma origem de armazenamento consistente durante o desenvolvimento, também é possível servir a pasta com qualquer servidor HTTP estático.

```text
CertifyPlay/
├── index.html
├── style.css
├── js/
│   ├── data.js
│   ├── storage.js
│   ├── forca.js
│   ├── termo.js
│   ├── quiz.js
│   └── app.js
└── README.md
```

## Jogar

1. Escolha um dos nove temas ou **Todos os temas**.
2. Selecione Forca Tech, Termo Técnico ou Quiz de Troubleshooting.
3. Use os controles na tela ou o teclado. O Termo também possui campo de texto para o teclado do celular.
4. Volte ao menu a qualquer momento. **Continuar partida** retoma a sessão salva; atualizar a página preserva inclusive letras digitadas e respostas do quiz.
5. Ao iniciar outra partida com uma ainda em andamento, o aplicativo pede confirmação antes de substituí-la.

## Conteúdo e pontuação

- **Forca:** 36 termos, seis vidas. Vitória: 40 XP + 10 XP por vida restante (até 100 XP). Derrota: 0 XP. Espaços já são revelados; acentos são normalizados.
- **Termo:** 18 respostas de exatamente cinco letras e vocabulário adicional para palpites. Vitória: 150, 130, 110, 90, 70 ou 50 XP, conforme a tentativa. Derrota: 0 XP. Palavras inválidas ou repetidas não gastam tentativas. Letras repetidas respeitam o número de ocorrências da resposta.
- **Quiz:** 27 cenários, três por tema; cada sessão sorteia três sem repetição e embaralha as quatro alternativas. Cada acerto vale 50 XP, creditados ao concluir o quiz. Todas as alternativas têm justificativa.
- **Conquistas:** primeira partida, três modalidades, 500 XP, quiz perfeito e contato com os nove temas em partidas concluídas. O nível sobe a cada 500 XP.

Termos em inglês são usados quando comuns na área. ITIL e CSDM aparecem no conteúdo conceitual, mas não como respostas do Termo, pois têm quatro letras. “Purples” é tratado como rótulo contextual que exige confirmação de significado, e não como métrica universal de licenciamento. Cenários contratuais ensinam a validar os direitos aplicáveis em vez de assumir regras universais.

## Persistência e arquitetura

O namespace `window.CertifyPlay` conecta os módulos carregados em ordem com `defer`. Essa organização dispensa imports e permite abrir o HTML diretamente. A navegação por hash suporta voltar/avançar do navegador.

`storage.js` usa a chave `certifyplay.progress.v1` do `localStorage` para salvar XP, contadores, cinco conquistas, últimos 50 resultados, filtro e uma partida ativa. IDs de conclusão evitam duplicar XP ao atualizar a página. A progressão histórica de temas e modalidades não depende do limite de 50 registros. Alterações em outra aba são sincronizadas por evento de armazenamento.

Os dados pertencem ao navegador e à origem usados, sem conta ou sincronização entre dispositivos. O comportamento de `localStorage` para URLs `file://` varia entre navegadores. Quando o armazenamento está bloqueado ou sem espaço, o aplicativo mostra um aviso e mantém o estado em memória durante a sessão. Limpar os dados do site remove o progresso. O armazenamento local não é um mecanismo contra adulteração de pontuação.

## Acessibilidade e adaptação

Layout com Grid/Flexbox, navegação semântica, foco visível, link para pular ao conteúdo, teclado virtual e físico, avisos com regiões de status, nomes acessíveis para letras e pistas de posição, controles de formulário rotulados e respeito à preferência de movimento reduzido.

## Verificação

`tests/rules.cjs` executa verificações de integridade do conteúdo, sintaxe dos módulos, regras dos jogos, alocação de letras repetidas, pontuação, retomada de estado, conquistas e armazenamento. Usa apenas módulos nativos do Node.js e um armazenamento em memória, sem alterar seu progresso:

```sh
node tests/rules.cjs
```

Resultado obtido na implementação: **11.086 verificações aprovadas**.

`tests/test.html` contém verificações adicionais das interações da interface. Sirva a pasta do projeto por HTTP e abra essa página na mesma origem; ela carrega a aplicação em um iframe. Execute em um perfil de teste, sem outras abas da aplicação: as verificações substituem temporariamente o progresso e restauram os dados originais ao terminar. A validação automatizada em navegador não pôde ser executada neste ambiente por falha do serviço de aprovação; os testes de lógica acima foram executados.
