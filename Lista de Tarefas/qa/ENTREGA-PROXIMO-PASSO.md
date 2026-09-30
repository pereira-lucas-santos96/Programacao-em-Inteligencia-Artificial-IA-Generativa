# Entrega técnica — Próximo Passo

**Escopo:** corrigir os 16 achados do diagnóstico da lista de tarefas e evoluir a aplicação para um planejador de estudos inspirado na organização do Microsoft To Do, com visual próprio voltado aos alunos do SENAI São Paulo.

**Situação:** implementação concluída; validação estática realizada; aprovação dinâmica pendente. Não há declaração de testes de navegador aprovados nesta entrega.

## 1. Mapeamento das correções implementadas

| Achado | Correção aplicada | Evidência para regressão |
|---|---|---|
| BUG-01 — ID divergente | HTML e JavaScript usam `task-list`; referências centralizadas no helper `$` | Inicialização e criação de linhas |
| BUG-02 — atribuição a const | Validação de texto com `trim()` e validade do campo, sem atribuição em condição | Vazio, espaços e inclusão válida |
| BUG-03 — cadastro no clique do form | Um único handler de `submit` para cadastro | Clique/foco no campo não inclui |
| BUG-04 — recarga | `preventDefault()` executado no início dos handlers dos formulários | Submissão cancelada e documento preservado |
| BUG-05 — limite do array | Renderização com `map()` e filtragem; sem iteração além do array | Zero, um, vários itens e exclusão do último |
| BUG-06 — conclusão sem alteração | Checkbox nativo atualiza `completed` pelo estado `checked` | Concluir/reabrir, estilo, contador e progresso |
| BUG-07 — remoção dupla | Busca por ID estável e `splice(index, 1)`; possibilidade de desfazer | Exclusão filtrada, intermediária e de item único |
| BUG-08 — contagem invertida | Pendências filtradas por `!task.completed` | Estados mistos e visão Concluídas |
| BUG-09 — padding inválido | CSS refeito com unidades válidas e `box-sizing: border-box` | Inspeção de layout e dimensões |
| BUG-10 — cor inválida | Concluídas usam `#59656d`, riscado e checkbox marcado | Estilo e semântica de conclusão |
| BUG-11 — viewport ausente | Meta viewport, layout fluido e regras para celular/tablet | 320, 375, 768 e 1280 pixels |
| BUG-12 — texto longo | `min-width: 0`, `overflow-wrap: anywhere` e ações reorganizadas no celular | Título de 300 caracteres sem espaços |
| BUG-13 — rótulo do campo | Labels explícitos para formulário, busca, edição e listas | Associação label/input |
| BUG-14 — span clicável | Checkbox nativo para conclusão e botão para abrir detalhes | Foco, estado do checkbox e operação por teclado |
| BUG-15 — status | Contador com `role="status"`, `aria-live="polite"` e `aria-atomic="true"` | Feedback após ações; anúncio assistivo ainda manual |
| BUG-16 — contraste | Botão principal branco sobre `#c32936`: **5,69:1**; placeholder `#69747c` sobre branco: **4,78:1** | Cálculo WCAG realizado; demais estados exigem inspeção visual |

As soluções estão implementadas no código. Este mapeamento não substitui o aceite em navegador.

## 2. Evolução funcional

| Área | Comportamento entregue |
|---|---|
| Planejamento diário | Meu dia por data local, sem apagar as tarefas ao mudar o dia |
| Prioridade | Estrela e visão Importantes |
| Prazos | Data de entrega, identificação de hoje e de atrasos, visão Planejadas |
| Organização | Listas iniciais, criação e renomeação; movimentação de tarefa pelo editor |
| Consulta | Todas, Concluídas, busca por título/anotações e quatro formas de ordenação |
| Edição | Título, anotações, lista, prazo, prioridade, Meu dia e etapas |
| Recuperação | Desfazer a última exclusão, mantendo os dados da tarefa |
| Progresso | Pendências do dia, atrasos e percentual de conclusão |
| Dados | Persistência local com schema versionado, validação, aviso de falha e exportação JSON |
| Identidade visual | Marca Próximo Passo, referência ao contexto SENAI SP e ilustração de degraus feita em CSS |

Não foram usados imagens de telas prontas, fontes externas, frameworks ou serviços de terceiros. A aplicação pode ser aberta diretamente por arquivo. O jogo da forca permanece separado em `index.html`.

## 3. Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `atividade-bugs-lista-tarefas.html` | Estrutura e controles semânticos da nova aplicação |
| `tarefas.css` | Layout, identidade visual, responsividade, foco e movimento reduzido |
| `tarefas.js` | Modelo, validação, persistência, filtros, edição e renderização segura |
| `PROXIMO-PASSO.md` | Manual de uso, regras, limites e execução dos testes |
| `qa/testar-proximo-passo.html` | 29 cenários de regressão do comportamento esperado |
| `qa/servir.ps1` | Servidor estático local opcional, sem dependências externas |
| `qa/fixtures/atividade-original.html` | Versão original congelada para reproduzir o diagnóstico |
| `qa/validar-lista-tarefas.html` | Testes de caracterização antigos, agora direcionados à cópia original |

## 4. Decisões de desenvolvimento

- IDs estáveis identificam tarefas e etapas, independentemente da busca, ordenação ou posição visual.
- Conteúdo do usuário é inserido com `textContent` e propriedades de formulário. Não é interpolado em `innerHTML`.
- A edição usa um rascunho das etapas. Cancelar não modifica o objeto original.
- A conclusão de etapas e a da tarefa principal são independentes e isso é informado na interface.
- Datas de entrega usam `AAAA-MM-DD` e são comparadas como datas locais, evitando deslocamento por conversão UTC.
- O schema persistido valida versão, IDs, referências de listas, datas, booleanos, tamanhos e etapas. Dados inválidos não são sobrescritos na inicialização.
- Falhas de armazenamento não interrompem o fluxo atual. A interface informa que a sessão não foi salva e oferece exportação.
- O foco é restaurado no controle equivalente após renderização; se o item sai da visão, o fluxo volta ao campo de cadastro ou ao próximo item na exclusão.
- O formulário usa controles nativos para validação, envio e seleção. Os modais usam `<dialog>`.

## 5. Validação realizada e pendente

### Conferências executadas

- Correspondência estática entre os IDs referenciados pelo JavaScript e os elementos do HTML: nenhuma referência direta ausente.
- Ausência de IDs duplicados no novo HTML.
- Cálculo de contraste da cor principal e correção do placeholder inicialmente abaixo do mínimo.
- Conferência do checksum da cópia original: `8B21AECD008D323016D71615178BBD079F7E06937EA6E2D7024F8C502F3FEBAC`.
- Revisão do fluxo de cadastro, seleção por identidade, exclusão, contagem, datas, rascunhos, filtros e tratamento de armazenamento.
- Verificação sintática do script PowerShell pelo parser estático, sem iniciar o servidor.

### Limitações do ambiente

A tentativa de executar Chrome headless foi rejeitada porque o serviço de revisão automática de aprovação respondeu HTTP 404. O navegador não chegou a executar os testes. Uma tentativa adicional de checagem de JavaScript pelo runtime do editor também não iniciou por restrição de processo/Crashpad; portanto não constitui validação sintática do JavaScript.

O Windows bloqueou a primeira tentativa de iniciar o servidor de testes por política de execução de scripts. O manual fornece uma execução com política restrita ao processo; essa alternativa não foi executada nesta entrega. Nenhuma política global foi alterada.

### Próximos passos de aceite

1. Executar `qa/testar-proximo-passo.html` por um servidor HTTP local e registrar o resultado dos **29 cenários**.
2. Conferir a aparência em desktop e celular, inclusive títulos extensos, zoom de 200% e listas com muitos itens.
3. Validar Enter real, Tab, Shift+Tab, Espaço e Escape, além de retorno de foco e anúncio de status com leitor de tela.
4. Conferir a exportação de JSON, recarga na mesma origem e comportamento quando o armazenamento é bloqueado pelo navegador real.
5. Executar os testes de caracterização antigos separadamente; ali, PASS confirma o defeito da cópia histórica, não um defeito da versão nova.

## 6. Limites de produto

O app guarda dados no navegador atual. Não há autenticação, sincronização em nuvem/entre abas, integração com a Microsoft, compartilhamento, notificação de prazo ou importação pela interface. A exclusão de listas também não foi incluída; é possível criá-las e renomeá-las. Esses limites são distintos das correções do diagnóstico original.
