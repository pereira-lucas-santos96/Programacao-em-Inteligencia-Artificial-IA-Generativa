# Relatório técnico de QA — Lista de tarefas

> **Registro histórico:** os achados abaixo referem-se à versão original, preservada em `qa/fixtures/atividade-original.html`. A aplicação atual foi reimplementada como **Próximo Passo**. Consulte `qa/ENTREGA-PROXIMO-PASSO.md` para o mapeamento das correções e a validação da nova versão.

**Data:** 22/09/2026  
**Objeto:** `atividade-bugs-lista-tarefas.html` — 176 linhas  
**Escopo:** HTML, CSS, JavaScript, fluxo funcional, integridade dos dados em memória, usabilidade e acessibilidade.  
**Parecer:** **não apto para uso funcional no estado atual**. Existem bloqueios no cadastro e na renderização, além de exclusão indevida e inconsistência do estado das tarefas.

## 1. Resumo executivo

Foram identificados **16 achados por análise estática: 7 de gravidade alta, 7 média e 2 baixa**. As falhas mais relevantes impedem cadastrar/renderizar tarefas, não permitem alternar a conclusão e removem mais itens do que o usuário selecionou.

| Gravidade | Quantidade | Critério aplicado |
|---|---:|---|
| Alta | 7 | Bloqueia uma função principal, remove dados indevidamente ou impede sua operação por teclado. |
| Média | 7 | Gera comportamento incorreto, informação enganosa ou barreira relevante de uso. |
| Baixa | 2 | Defeito visual localizado, sem perda direta de dados. |

Não foi atribuída gravidade crítica: não há evidência de comprometimento de sistemas externos, exposição de dados ou indisponibilidade de um serviço de produção. A gravidade considera a finalidade local desta atividade.

### Base de evidência e limitações

- **Executado:** leitura integral do código com referência de linhas e cálculo independente do contraste das cores, pela fórmula de luminância relativa da WCAG.
- **Não executado:** testes no navegador, em aparelho móvel e com leitor de tela. A tentativa de iniciar o Chrome foi bloqueada porque a revisão automática de aprovação falhou com HTTP 404 no serviço de revisão. Não foi uma conclusão de que a ação era insegura.
- Os passos de reprodução abaixo são **roteiros derivados do código**, ainda sem confirmação dinâmica. Os resultados descritos são consequências identificáveis das instruções presentes no arquivo.
- Foi preparado `qa/validar-lista-tarefas.html`, com **19 verificações pendentes de execução**: 16 evidências de defeitos, 2 cenários com correções funcionais simuladas e 1 controle de renderização segura de texto.
- O arquivo analisado foi preservado. Nenhuma correção foi aplicada à atividade original.
- SHA-256 da versão analisada: `8B21AECD008D323016D71615178BBD079F7E06937EA6E2D7024F8C502F3FEBAC`.

## 2. Inventário dos achados

| ID | Tipo | Problema | Gravidade | Linhas |
|---|---|---|---|---|
| BUG-01 | Integração HTML/JS/CSS | Identificador da lista divergente | Alta | 51, 99, 107, 126 |
| BUG-02 | JavaScript / execução | Atribuição a uma constante na validação | Alta | 114–116 |
| BUG-03 | Eventos / funcional | Cadastro ligado a cliques no formulário inteiro | Média | 112 |
| BUG-04 | Formulário / estado | Submissão nativa não é cancelada | Alta | 92–97, 112–123 |
| BUG-05 | Algoritmo / renderização | Laço acessa uma posição além do array | Alta | 128–133, 156 |
| BUG-06 | Estado / funcional | Operação de conclusão não altera o estado | Alta | 159–161 |
| BUG-07 | Integridade de dados | Exclusão remove até duas tarefas | Alta | 164–166 |
| BUG-08 | Regra de negócio | Contador calcula concluídas como pendentes | Média | 169–171 |
| BUG-09 | CSS / sintaxe | `padding` sem unidade | Baixa | 17 |
| BUG-10 | CSS / sintaxe | Nome de cor inválido | Baixa | 65–67 |
| BUG-11 | Responsividade | Ausência de configuração de viewport móvel | Média | 3–5, 20, 29–40 |
| BUG-12 | Layout / entrada | Texto longo sem tratamento de quebra | Média | 57–63, 94, 137–138 |
| BUG-13 | Acessibilidade / formulário | Campo sem rótulo persistente | Média | 94 |
| BUG-14 | Acessibilidade / teclado | Conclusão depende de `span` clicável | Alta | 137–149 |
| BUG-15 | Acessibilidade / feedback | Contador sem semântica de mensagem de status | Média | 101, 169–171 |
| BUG-16 | Acessibilidade / visual | Contraste insuficiente nos botões | Média | 43–44, 71–72 |

## 3. Detalhamento, correções e critérios de aceite

### BUG-01 — Identificador divergente da lista

**Evidência e causa:** o HTML declara `id="tasklist"`, mas JavaScript e CSS procuram `task-list`. Assim, `taskList` recebe `null`; a instrução `taskList.innerHTML = ''` lança `TypeError`. O seletor `ul#task-list` também não estiliza a lista existente.

**Reprodução proposta:** abrir o console e executar `renderTasks()`. O teste direto isola este problema da falha de cadastro BUG-02.

**Correção:** padronizar o HTML para `<ul id="task-list"></ul>`, preservando os seletores já utilizados no CSS e no JavaScript.

**Aceite:** a busca pelo ID retorna a lista real; com BUG-05 também corrigido, renderizar zero, uma ou várias tarefas não lança exceção e aplica os estilos previstos.

### BUG-02 — Atribuição a constante na condição

**Evidência e causa:** `taskText` é declarado com `const`, mas `if (taskText = '')` tenta atribuir uma string vazia. O problema não é erro de sintaxe: ocorre em execução, quando o handler é chamado, com `TypeError: Assignment to constant variable`.

**Reprodução proposta:** digitar uma tarefa e clicar no campo ou no botão. Por causa do BUG-03, um simples clique no formulário já alcança essa instrução. A inserção em `tasks` não acontece.

**Correção:** usar `if (taskText === '') return;` ou `if (!taskText) return;`, mantendo `trim()`. Trocar apenas `const` por `let` não resolve: a atribuição apagaria o texto e a condição seria falsa.

**Aceite:** vazio e espaços não criam tarefas; um texto válido é preservado e incluído uma única vez, sem exceções, após corrigir os demais bloqueios.

### BUG-03 — Evento inadequado para cadastro

**Evidência e causa:** o listener usa `click` no formulário inteiro. Cliques no campo, no botão ou em outros elementos internos propagam até ele. Isso associa inclusão a uma interação que não representa necessariamente envio.

**Reprodução proposta:** em uma cópia com BUG-01, BUG-02 e BUG-05 corrigidos, preencher o campo e clicar novamente nele. A tarefa será incluída sem uma solicitação explícita de cadastro.

**Correção:** escutar `submit` em `taskForm`; o botão permanece `type="submit"`. Concentrar cadastro e validação nesse único fluxo.

**Aceite:** clicar/focar o campo não inclui tarefa; clicar em Adicionar ou enviar pelo teclado inclui exatamente uma. Não presumir que Enter sempre falha no original: alguns navegadores sintetizam o clique do botão na submissão implícita. O problema é o contrato de evento incorreto.

### BUG-04 — Submissão nativa não cancelada

**Evidência e causa:** existe um formulário com botão de submissão, mas não há `event.preventDefault()`. Sem `action`, o destino padrão é a própria página; a submissão pode navegar/recarregar o documento. As tarefas existem somente em memória e são reinicializadas.

**Reprodução proposta:** observar a navegação ao acionar Adicionar. Em teste isolado, despachar um evento `submit` cancelável e verificar que `defaultPrevented` continua falso. A exceção no handler de clique não equivale a cancelar o comportamento padrão.

**Correção:** executar `event.preventDefault()` no início do handler de `submit`, antes da validação. Corrigir em conjunto com BUG-03.

**Aceite:** inclusão por botão e Enter não navega nem recarrega; tarefas existentes permanecem na lista após adicionar outra.

### BUG-05 — Limite incorreto do laço

**Evidência e causa:** `i <= tasks.length` permite `i === tasks.length`, posição inexistente. `tasks[i]` retorna `undefined` e o acesso a `task.completed` lança exceção. Com uma lista vazia, falha já na primeira iteração; com itens, pode renderizar parcialmente e não alcançar `updateCounter()`.

**Reprodução proposta:** corrigir apenas o ID em uma cópia e executar `renderTasks()` primeiro com array vazio, depois com uma tarefa.

**Correção:** usar `i < tasks.length` ou percorrer `tasks.forEach((task, index) => ...)`.

**Aceite:** renderização completa com zero, uma e várias tarefas; nenhuma leitura fora dos limites; atualização do contador sempre alcançada.

### BUG-06 — Conclusão não altera o objeto

**Evidência e causa:** `tasks[index].completed != tasks[index].completed` apenas calcula uma comparação e descarta seu resultado. Não existe atribuição. O valor booleano permanece igual.

**Reprodução proposta:** após desbloquear a renderização em uma cópia, clicar no texto de uma tarefa pendente e inspecionar `completed`; ele permanece `false`.

**Correção:** `tasks[index].completed = !tasks[index].completed;`. Preferir um checkbox associado ao texto, atendendo também ao BUG-14.

**Aceite:** alternar pendente → concluída → pendente atualiza estado, estilo e contador, sem alterar outras tarefas.

### BUG-07 — Exclusão remove item adicional

**Evidência e causa:** em `tasks.splice(index, 2)`, o segundo argumento é a quantidade a remover. Não representa índice final. O código remove o selecionado e o seguinte, quando existente.

**Reprodução proposta:** em cópia com renderização desbloqueada, criar A, B e C e excluir A. O código deixa apenas C; o resultado correto é B e C. Excluir o último item isoladamente não evidencia o defeito.

**Correção:** `tasks.splice(index, 1)`. Caso o produto evolua para filtros ou ordenação, considerar IDs estáveis para que a exclusão não dependa da posição visual.

**Aceite:** excluir primeiro, intermediário e último item remove somente o selecionado; excluir a única tarefa deixa a lista vazia, sem exceção.

### BUG-08 — Contagem invertida

**Evidência e causa:** `tasks.filter(t => t.completed).length` conta concluídas, mas o rótulo informa pendentes.

**Reprodução proposta:** definir duas tarefas pendentes e uma concluída e chamar `updateCounter()`. O texto produzido é `Tarefas pendentes: 1`; o esperado é 2. Pode ser isolado sem renderizar a lista.

**Correção:** `const pending = tasks.filter(t => !t.completed).length;`.

**Aceite:** contagem correta com lista vazia, todas pendentes, todas concluídas e estados mistos; atualização após inclusão, conclusão, reabertura e exclusão.

### BUG-09 — Espaçamento CSS inválido

**Evidência e causa:** `padding: 24` não é uma declaração válida para um comprimento CSS não nulo. O navegador a descarta; a intenção aparente de espaçamento interno não é aplicada.

**Reprodução proposta:** inspecionar a regra e o estilo computado de `.container` nas ferramentas do navegador.

**Correção:** `padding: 24px;`. Usar também `box-sizing: border-box`, pois adicionar padding com o modelo padrão aumenta a largura externa do componente.

**Aceite:** espaçamento interno de 24 pixels aplicado e largura externa mantida dentro da tela.

### BUG-10 — Cor inválida para tarefa concluída

**Evidência e causa:** `graay` não é uma cor CSS válida. A declaração é descartada. O `text-decoration: line-through` é válido e continua aplicável; não é correto afirmar que toda a regra deixa de funcionar.

**Reprodução proposta:** em cópia com renderização desbloqueada, renderizar uma tarefa concluída e inspecionar `color` e `text-decoration`.

**Correção:** substituir por uma cor válida com contraste suficiente, por exemplo `#595959`, mantendo a indicação semântica de conclusão sugerida no BUG-14.

**Aceite:** cor computada corresponde à especificação e a conclusão não depende exclusivamente de mudança de cor.

### BUG-11 — Viewport móvel não configurado

**Evidência e causa:** falta `<meta name="viewport" content="width=device-width, initial-scale=1">`. Em navegadores móveis que usam um viewport virtual mais largo por padrão, a página pode ser reduzida visualmente, prejudicando leitura e toque. Há ainda uma largura preferencial de 400 pixels e controles flex sem ajustes explícitos para telas estreitas.

**Reprodução proposta:** abrir em dispositivo móvel ou emulação móvel real, não apenas reduzir a janela desktop; verificar tamanho dos textos e controles. Medir adicionalmente 320 e 375 pixels CSS.

**Correção:** adicionar a meta viewport, aplicar `box-sizing: border-box`, usar largura fluida com limite máximo e permitir redução do input (`min-width: 0`). Exemplo: `.container { width: min(400px, 100%); }`, considerando os recuos do `body`.

**Aceite:** leitura sem zoom inicial obrigatório e sem cortes em telas estreitas. **Não foi confirmado transbordamento apenas pela largura de 400px**: o item flex pode encolher. Esse comportamento precisa de medição, especialmente após corrigir o padding.

### BUG-12 — Conteúdo longo pode romper o layout

**Evidência e causa:** o texto é inserido em um `span` dentro de uma linha flex, sem regra de quebra para sequências extensas. Um token longo sem espaços aumenta a largura mínima do conteúdo e pode deslocar o botão Excluir para fora da área disponível.

**Reprodução proposta:** em cópia com cadastro/renderização desbloqueados, inserir 150 caracteres `W` consecutivos e comparar os limites do texto, da lista e do botão.

**Correção:** permitir redução e quebra do texto: `.task span { flex: 1; min-width: 0; overflow-wrap: anywhere; }`; adicionar `gap` à linha e `flex-shrink: 0` ao botão. Um limite de caracteres só deve ser adotado se definido como regra do produto.

**Aceite:** nomes extensos, URLs e palavras sem espaços não geram rolagem horizontal indevida; Excluir permanece visível e acionável.

### BUG-13 — Campo sem rótulo persistente

**Evidência e causa:** o input tem apenas placeholder. Não há `<label>` associado nem identificação explícita via ARIA. O placeholder desaparece durante a digitação e não substitui um rótulo persistente.

**Reprodução proposta:** preencher o campo e avaliar a identificação visual; inspecionar a associação de rótulo e o nome acessível no navegador.

**Correção:** incluir `<label for="task-input">Nova tarefa</label>`, mantendo o placeholder somente como exemplo ou instrução complementar.

**Aceite:** o campo continua identificado após preenchimento e apresenta nome acessível coerente. Alguns navegadores usam placeholder como fallback do nome acessível; a ausência de rótulo explícito não comprova, sozinha, ausência total de nome em todas as tecnologias assistivas. Referências: WCAG 1.3.1 e 3.3.2.

### BUG-14 — Conclusão inacessível por teclado

**Evidência e causa:** um `span` recebe listener de clique, mas não é um controle nativo focável, não define função interativa e não expõe o estado de conclusão. O usuário de teclado não consegue alcançar esse comando pelo fluxo normal de Tab.

**Reprodução proposta:** após desbloquear a lista, navegar exclusivamente com Tab, Shift+Tab, Enter e Espaço e tentar concluir uma tarefa.

**Correção:** usar `<input type="checkbox">` associado ao texto por `<label>`; sincronizar `checked` e o objeto da tarefa pelo evento `change`. É preferível à implementação manual de foco, teclas e ARIA em um `span`.

**Aceite:** todas as tarefas podem ser concluídas e reabertas por teclado; o leitor de tela identifica rótulo, tipo do controle e estado. Referências: WCAG 2.1.1 e 4.1.2.

### BUG-15 — Atualização de status sem anúncio programático

**Evidência e causa:** o contador é um parágrafo cujo texto muda, sem `role="status"` ou região viva. A alteração não recebe a semântica apropriada para anúncio como status sem mover o foco.

**Reprodução proposta:** após corrigir o fluxo funcional, adicionar/concluir/excluir usando leitor de tela e verificar o anúncio da nova contagem.

**Correção:** usar `<p id="counter" role="status" aria-live="polite" aria-atomic="true">...</p>` e atualizar apenas quando necessário, evitando mensagens redundantes.

**Aceite:** a contagem atualizada é anunciada sem deslocar o foco. A experiência real de anúncio ainda precisa de teste assistivo; não foi executada nesta revisão. Referência: WCAG 4.1.3.

### BUG-16 — Contraste insuficiente nos botões

**Evidência medida:** considerando branco sobre as cores de fundo declaradas e texto de tamanho normal:

| Botão | Texto / fundo atual | Contraste calculado | Mínimo WCAG AA | Alternativa |
|---|---|---:|---:|---|
| Adicionar | `#FFFFFF` / `#4CAF50` | **2,78:1** | 4,5:1 | `#2E7D32`: **5,13:1** |
| Excluir | `#FFFFFF` / `#E74C3C` | **3,82:1** | 4,5:1 | `#B3261E`: **6,54:1** |

**Correção:** escurecer os fundos conforme as alternativas ou escolher outra combinação que atinja o mínimo. Validar também os estados de interação que forem implementados.

**Aceite:** contraste de pelo menos 4,5:1 para texto normal. Referência: WCAG 1.4.3. Os números foram calculados nesta revisão; não dependem de inspeção visual subjetiva.

## 4. Ordem recomendada de correção

1. **Desbloquear execução e renderização:** BUG-01, BUG-02 e BUG-05. Sem isso, outros defeitos ficam mascarados.
2. **Unificar o envio do formulário:** BUG-03 e BUG-04 em conjunto, com `submit` e `preventDefault()`.
3. **Restaurar integridade e regras:** BUG-07, BUG-06 e BUG-08. Priorizar a exclusão indevida antes de disponibilizar o fluxo.
4. **Tornar a operação acessível:** BUG-14, BUG-13, BUG-15 e BUG-16. O checkbox deve ser implementado junto da correção da conclusão.
5. **Ajustar apresentação e telas menores:** BUG-09, BUG-10, BUG-11 e BUG-12. Reavaliar largura após adicionar o padding correto.
6. **Executar regressão e critérios de aceite**, incluindo teclado, navegador móvel e tecnologia assistiva.

Essa ordem representa dependência técnica de implementação. Não significa que acessibilidade ou responsividade possam ser omitidas da aceitação final.

## 5. Plano de regressão e liberação

| Área | Cenários mínimos | Resultado esperado |
|---|---|---|
| Cadastro | Texto válido, vazio, só espaços, espaços nas extremidades | Inclusão única de conteúdo válido, após `trim()` |
| Formulário | Botão, Enter, clique/foco no campo | Cadastro somente no envio, sem recarga |
| Renderização | Zero, um e vários itens; exclusão do último | Sem exceções e com DOM completo |
| Estado | Concluir e reabrir cada tarefa | Apenas a selecionada muda |
| Exclusão | Primeiro, intermediário, último e único item | Remoção de exatamente um item |
| Contagem | Todas pendentes, todas concluídas e mistura | Contador coincide com o estado real |
| Conteúdo | Acentos, emoji, texto longo e conteúdo parecido com HTML | Texto preservado, sem execução de marcação ou quebra do layout |
| Acessibilidade | Tab, Shift+Tab, Enter, Espaço e leitor de tela | Controles identificados, operáveis e com feedback |
| Visual | 320, 375, 768 e 1280px; zoom de 200%; contraste | Conteúdo legível e controles acessíveis |
| Compatibilidade | Chrome/Edge e Firefox atuais; Safari se fizer parte do público | Fluxo principal consistente |

**Critério de liberação recomendado:** fluxo CRUD completo sem exceções, nenhum item adicional removido, contagem correta, operação por teclado aprovada e ausência de problemas altos conhecidos. Os demais achados devem ser corrigidos ou explicitamente aceitos pelo responsável pelo produto, com justificativa registrada.

### Como executar as verificações preparadas

Sirva a raiz do projeto por HTTP. Por exemplo, se Python estiver instalado:

```powershell
python -m http.server 8000
```

Abra `http://localhost:8000/qa/validar-lista-tarefas.html`.

- Um **PASS em BUG-xx confirma a presença do defeito descrito**. Não significa que a aplicação está correta.
- `SOL-01` e `SOL-02` aplicam substituições em cópias carregadas em `iframe.srcdoc`; avaliam as propostas funcionais, sem modificar o arquivo original.
- `CTRL-01` verifica o comportamento seguro já existente de renderização de texto.
- O arquivo original deve permanecer na versão analisada para reproduzir esses achados. Após corrigi-lo, os testes de caracterização precisam ser adaptados para exigir o comportamento correto.
- Essa página não substitui a validação manual móvel ou com leitor de tela, nem é uma auditoria completa de conformidade WCAG.

## 6. Melhorias condicionadas a requisitos — não contabilizadas como bugs

| Oportunidade | Quando faz sentido | Possível abordagem |
|---|---|---|
| Persistência após fechar/reabrir | Se o produto exigir guardar tarefas entre sessões | `localStorage` com validação, versionamento e tratamento de indisponibilidade |
| Recuperação de exclusão | Se houver custo relevante de apagar por engano | Ação Desfazer, preservando o item e sua posição por um período definido |
| Limite e duplicidade de títulos | Se houver regra explícita de tamanho/unicidade | Definir regra de negócio antes de rejeitar títulos longos ou repetidos |
| IDs estáveis | Se houver filtros, ordenação ou sincronização | Gerar ID na criação e operar por identidade, não pela posição filtrada |
| Separação HTML/CSS/JS e análise automática | Se a atividade evoluir para um projeto mantido | Arquivos separados, formatter, ESLint e Stylelint, com regras para condições por atribuição e expressões sem efeito |
| Continuidade do foco após renderização | Se a lista inteira continuar sendo recriada | Preservar/restaurar o foco no controle equivalente ou atualizar somente a linha afetada; validar no fluxo real |

## 7. Pontos corretos que devem ser preservados

- `span.textContent = task.text` trata a entrada como texto. Não foi identificado um caminho de injeção de HTML nesse trecho; não substituir por `innerHTML` com conteúdo do usuário.
- `trim()` é adequado para normalizar espaços nas extremidades.
- O arquivo já declara UTF-8, idioma português e título da página.
- Existe um formulário nativo e o botão Adicionar já é `type="submit"`; o handler deve aproveitar essa estrutura.
- O índice do laço usa `let`; não há aqui o problema clássico de todos os listeners capturarem a mesma variável `var`.

**Conclusão técnica:** primeiro corrigir os bloqueios e a integridade do estado; depois confirmar cada comportamento com os testes indicados. As propostas de correção estão documentadas, mas sua aprovação dinâmica permanece pendente da execução do navegador.
