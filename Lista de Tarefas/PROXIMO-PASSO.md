# Próximo Passo — agenda do aluno

Organizador pessoal de estudos e projetos, pensado para alunos do SENAI São Paulo. A organização por Meu dia, importância e prazos se inspira no Microsoft To Do. O visual usa uma identidade própria: vermelho, azul-escuro, tons claros e uma ilustração de degraus que representa o progresso do aluno.

## Abrir a aplicação

Abra **`atividade-bugs-lista-tarefas.html`** no Chrome, Edge, Firefox ou Safari atual. A aplicação não exige instalação, conta, fontes externas ou conexão com a internet. Mantenha `tarefas.css` e `tarefas.js` na mesma pasta do HTML.

O jogo da forca continua disponível em `index.html`.

## O que você pode fazer

- **Meu dia:** selecionar as tarefas que quer realizar hoje. Use o botão de sol da tarefa ou a opção no editor. Tarefas criadas nessa visão já entram no planejamento de hoje.
- **Importantes:** marcar e desmarcar prioridades com a estrela. Novas tarefas criadas nessa visão recebem importância automaticamente.
- **Planejadas:** consultar as tarefas que têm data de entrega. O app identifica entregas vencidas e a data de hoje.
- **Todas as tarefas / Concluídas:** consultar o conjunto completo ou suas conquistas. O checkbox permite concluir e reabrir tarefas.
- **Listas:** agrupar por disciplina, projeto ou objetivo. Há três listas iniciais; você pode criar outras e renomeá-las pelo lápis ao lado do título.
- **Busca e ordenação:** buscar títulos e anotações dentro da visão atual, inclusive sem acentos, e ordenar por data de criação, prazo, importância ou nome.
- **Detalhes:** clicar no título para editar nome, lista, prazo, prioridade, Meu dia, anotações e etapas. As alterações só são aplicadas ao salvar.
- **Etapas:** dividir trabalhos maiores em passos menores. Enter no campo de etapa adiciona o item. Concluir todas as etapas não conclui automaticamente a tarefa principal.
- **Desfazer exclusão:** recuperar a última tarefa excluída pela mensagem exibida. A opção permanece até outra ação que gere mensagem, uma nova exclusão, fechamento da mensagem ou recarga.
- **Progresso:** acompanhar pendências do dia, entregas em atraso e percentual de conclusão das tarefas escolhidas para hoje.
- **Exportar:** baixar uma cópia JSON de listas, tarefas e etapas.

### Regras de uso

- Título: até 300 caracteres; nome da lista: até 45; anotação: até 5.000; etapa: até 200. Os limites mantêm os campos adequados à agenda e são informados pelos próprios controles de entrada.
- Espaços sozinhos não são aceitos como título ou nome de lista. Listas com nomes equivalentes, desconsiderando maiúsculas e acentos, não são duplicadas. Tarefas podem ter títulos iguais e recebem IDs diferentes.
- A contagem da visão considera o filtro de busca atual. Os cartões de resumo e as contagens da navegação consideram todas as tarefas correspondentes.
- Meu dia é renovado a cada data local. As tarefas do dia anterior continuam nas suas listas e em Todas as tarefas.
- Remover uma tarefa de Meu dia ou das Importantes não exclui a tarefa.
- Ao cadastrar uma tarefa que não corresponde à visão atual, o app muda para Todas as tarefas para mostrar o resultado.

## Salvamento e limites da versão

Os dados ficam no **navegador e no endereço em que o app foi aberto**, usando a chave `senai_proximo_passo_v1`. Abrir por arquivo, por `localhost`, por `127.0.0.1` ou por outra porta pode usar áreas de armazenamento diferentes. Apagar os dados do navegador também apaga o planejamento salvo.

Se a gravação falhar, o app mantém a sessão funcionando e mostra um aviso. Se encontrar dados incompatíveis ou corrompidos na inicialização, preserva o conteúdo anterior e trabalha em memória, permitindo exportar as novas tarefas.

Esta versão não implementa conta Microsoft, sincronização entre dispositivos/abas, compartilhamento de listas, notificações de prazo nem importação do JSON pela interface. Exportar produz uma cópia dos dados; os prazos são sinalizados enquanto você usa a aplicação. Para evitar sobrescritas entre sessões simultâneas, edite em uma aba por vez.

## Teclado e acessibilidade

Use Tab para navegar, Enter para enviar os formulários e Espaço para alternar os checkboxes. Os diálogos nativos podem ser fechados com Escape. Há rótulos associados aos campos, mensagens de status, indicadores de foco, contraste ajustado e suporte à preferência por movimento reduzido.

A navegação real com leitor de tela e os testes em dispositivos móveis ainda precisam de conferência manual. As verificações programáticas não equivalem a certificação WCAG.

## Testes

Foram preparados **29 cenários de regressão** em `qa/testar-proximo-passo.html`. Eles usam dados isolados em memória e não alteram suas tarefas reais.

Para servir o projeto localmente sem instalar dependências, abra um terminal nesta pasta e execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\qa\servir.ps1
```

O parâmetro de política vale apenas para esse processo; não altera a política global do Windows. O servidor aceita somente leitura de arquivos HTML, CSS, JS e SVG dentro do projeto e escuta apenas em `127.0.0.1`. Encerre com Ctrl+C.

- Aplicação: `http://127.0.0.1:8080/atividade-bugs-lista-tarefas.html`
- Testes: `http://127.0.0.1:8080/qa/testar-proximo-passo.html`

Também é possível usar qualquer servidor estático já disponível. Se Python estiver instalado, `python -m http.server 8080 --bind 127.0.0.1` serve a pasta atual.

**Estado da validação:** a análise estática conferiu referências de elementos, IDs, estrutura dos arquivos e contraste. A execução do navegador foi bloqueada por uma falha HTTP 404 no serviço de aprovação automática. Os 29 cenários estão preparados, mas não foram executados nesta entrega.

O relatório de implementação está em `qa/ENTREGA-PROXIMO-PASSO.md`. O diagnóstico antigo e seus testes foram preservados com a versão original em `qa/fixtures/atividade-original.html`.
