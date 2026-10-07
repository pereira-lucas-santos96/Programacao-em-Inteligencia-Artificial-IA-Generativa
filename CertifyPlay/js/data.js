/* Base editorial local. Termos em inglês são preservados quando usuais em TI.
 * Cenários ensinam princípios; contratos e documentação do fabricante prevalecem
 * nas decisões reais de licenciamento. Nenhuma chamada de rede é necessária. */
window.CertifyPlay = window.CertifyPlay || {};
(function (CP) {
  'use strict';
  const themes = [
    { id: 'itam', name: 'Gestão de Ativos', short: 'ITAM / HAM / SAM', description: 'Ciclo de vida de ativos, inventário e reconciliação.' },
    { id: 'licenciamento', name: 'Licenciamento de Software', short: 'Licenciamento', description: 'Métricas, direitos de uso, auditoria e conformidade.' },
    { id: 'mecm', name: 'MECM / SCCM', short: 'MECM / SCCM', description: 'Microsoft Configuration Manager e gestão de endpoints.' },
    { id: 'servicenow', name: 'ServiceNow', short: 'ServiceNow', description: 'CMDB, CSDM, descoberta e serviços.' },
    { id: 'intune', name: 'Microsoft Intune', short: 'Intune', description: 'MDM, MAM, conformidade e políticas.' },
    { id: 'cobit', name: 'COBIT 2019', short: 'COBIT 2019', description: 'Governança e gestão de informação e tecnologia.' },
    { id: 'itil', name: 'ITIL 4', short: 'ITIL 4', description: 'Cocriação de valor e gestão de serviços.' },
    { id: 'scrum', name: 'Scrum / Ágil', short: 'Scrum / Ágil', description: 'Empirismo, entregas incrementais e adaptação.' },
    { id: 'projetos', name: 'Gestão de Projetos TI', short: 'Projetos de TI', description: 'Escopo, riscos, dependências e entregas.' }
  ];
  // Cada tema tem quatro desafios de Forca e duas palavras de cinco letras.
  const wordSets = {
    itam: {
      forca: [
        ['INVENTARIO', 'Registro dos ativos encontrados; deve ser reconciliado com dados financeiros e direitos de uso.'],
        ['RECONCILIACAO', 'Processo que compara instalações e consumo com os direitos de licenciamento adquiridos.'],
        ['CICLO DE VIDA', 'Abrange planejamento, aquisição, uso, manutenção e descarte de um ativo.'],
        ['NORMALIZACAO', 'Padroniza nomes de fabricantes, produtos e versões para evitar duplicidades no inventário.']
      ],
      termo: [['ASSET', 'Ativo, em inglês: recurso cujo ciclo de vida precisa ser gerenciado.'], ['STOCK', 'Estoque, em inglês: equipamentos disponíveis também precisam de controle patrimonial.']]
    },
    licenciamento: {
      forca: [
        ['CAL', 'Licença de acesso de cliente; em certos modelos Server/CAL, é exigida por usuário ou dispositivo.'],
        ['CORE', 'Unidade de processamento usada como métrica de licenciamento, sujeita a mínimos e regras do produto.'],
        ['OVERAGE', 'Consumo que excede o volume contratado; o tratamento depende dos termos do contrato.'],
        ['SUBSCRICAO', 'Modelo que concede direitos de uso por um período, condicionado aos termos da assinatura.']
      ],
      termo: [['SUITE', 'Conjunto de produtos; seus direitos de uso dependem do pacote contratado.'], ['AUDIT', 'Auditoria, em inglês: verificação de evidências e direitos de uso.']]
    },
    mecm: {
      forca: [
        ['COLLECTION', 'Agrupamento de dispositivos ou usuários com regras de associação, usado para direcionar implantações.'],
        ['DISTRIBUTION POINT', 'Função que armazena e entrega conteúdo aos clientes do Configuration Manager.'],
        ['SOFTWARE CENTER', 'Interface do cliente para instalar aplicativos disponíveis e consultar implantações.'],
        ['CO MANAGEMENT', 'Permite gerenciar dispositivos Windows com Configuration Manager e Intune, distribuindo workloads.']
      ],
      termo: [['PATCH', 'Correção de software que pode ser distribuída aos dispositivos gerenciados.'], ['AGENT', 'Agente instalado no endpoint para executar tarefas e comunicar seu estado.']]
    },
    servicenow: {
      forca: [
        ['CMDB', 'Base que mantém itens de configuração e seus relacionamentos para apoiar a gestão de serviços.'],
        ['CSDM', 'Modelo de dados de serviços da ServiceNow que orienta a organização consistente da CMDB.'],
        ['DISCOVERY', 'Recurso que descobre infraestrutura e atualiza itens de configuração usando mecanismos de identificação.'],
        ['MID SERVER', 'Componente que executa tarefas e integrações entre a instância e recursos da rede interna.']
      ],
      termo: [['TABLE', 'Tabela, em inglês: estrutura que reúne registros e campos na plataforma.'], ['QUERY', 'Consulta, em inglês: permite localizar registros conforme critérios.']]
    },
    intune: {
      forca: [
        ['COMPLIANCE', 'Avalia se o dispositivo atende aos requisitos definidos, como criptografia e versão mínima do sistema.'],
        ['AUTOPILOT', 'Tecnologia de provisionamento que simplifica a configuração inicial de dispositivos Windows.'],
        ['APP PROTECTION', 'Políticas de proteção dos dados corporativos em aplicativos compatíveis, inclusive em cenários sem inscrição MDM.'],
        ['ENROLLMENT', 'Processo de inscrição do dispositivo para gerenciamento pelo serviço.']
      ],
      termo: [['CLOUD', 'Nuvem, em inglês: o Intune é um serviço de gerenciamento baseado nela.'], ['SCOPE', 'Escopo, em inglês: tags de escopo ajudam a delimitar a visibilidade administrativa.']]
    },
    cobit: {
      forca: [
        ['GOVERNANCA', 'Avalia necessidades, direciona e monitora a organização para alcançar objetivos das partes interessadas.'],
        ['CASCATA DE METAS', 'Traduz necessidades das partes interessadas em metas corporativas, de alinhamento e objetivos de governança e gestão.'],
        ['FATORES DE DESENHO', 'Elementos como estratégia, perfil de risco e requisitos regulatórios usados para adaptar o sistema de governança.'],
        ['EDM', 'Domínio de governança: avaliar, direcionar e monitorar.']
      ],
      termo: [['COBIT', 'Framework da ISACA para governança e gestão de informação e tecnologia.'], ['GOALS', 'Metas, em inglês: sua cascata conecta necessidades do negócio aos objetivos de governança e gestão.']]
    },
    itil: {
      forca: [
        ['INCIDENTE', 'Interrupção não planejada de um serviço ou redução de sua qualidade.'],
        ['PROBLEMA', 'Causa, ou causa potencial, de um ou mais incidentes.'],
        ['MELHORIA CONTINUA', 'Prática que alinha serviços às necessidades em mudança por meio de melhorias recorrentes.'],
        ['VALOR', 'Benefícios, utilidade e importância percebidos; é cocriado por provedores, consumidores e outras partes interessadas.']
      ],
      termo: [['EVENT', 'Evento, em inglês: mudança de estado significativa para a gestão de um serviço ou item de configuração.'], ['VALUE', 'Valor, em inglês: é cocriado nas relações de serviço.']]
    },
    scrum: {
      forca: [
        ['PRODUCT OWNER', 'Accountability responsável por maximizar o valor do produto e pelo gerenciamento eficaz do Product Backlog.'],
        ['SPRINT', 'Evento de duração fixa de um mês ou menos em que ideias são transformadas em valor.'],
        ['DEFINITION OF DONE', 'Descrição formal do estado do Incremento quando atende às medidas de qualidade exigidas.'],
        ['RETROSPECTIVA', 'Evento para planejar maneiras de aumentar a qualidade e a eficácia do Scrum Team.']
      ],
      termo: [['SCRUM', 'Framework leve para gerar valor por meio de soluções adaptativas para problemas complexos.'], ['DAILY', 'Evento de 15 minutos para os Developers inspecionarem o progresso em direção à Meta da Sprint.']]
    },
    projetos: {
      forca: [
        ['CAMINHO CRITICO', 'Sequência de atividades que determina a menor duração possível do projeto em um cronograma.'],
        ['ESCOPO', 'Trabalho necessário para entregar os produtos e resultados acordados.'],
        ['RISCO', 'Evento ou condição incerta que, se ocorrer, afeta um ou mais objetivos do projeto.'],
        ['STAKEHOLDER', 'Parte interessada que pode afetar, ser afetada ou perceber-se afetada pelo projeto.']
      ],
      termo: [['RISKY', 'Arriscado, em inglês: qualifica uma decisão com exposição relevante à incerteza.'], ['PLANO', 'Organiza como alcançar objetivos, executar entregas e acompanhar resultados.']]
    }
  };
  const forca = [], termo = [];
  Object.entries(wordSets).forEach(([theme, games]) => {
    Object.entries(games).forEach(([mode, entries]) => entries.forEach(([word, hint], index) => {
      (mode === 'forca' ? forca : termo).push({ id: `${mode}-${theme}-${index}`, theme, word, hint });
    }));
  });
  /* Cada alternativa possui sua própria justificativa. Uma sessão sorteia três
   * cenários sem repetição; a ordem das alternativas também é sorteada. */
  const quiz = [];
  function scenario(theme, question, options, correct, explanations) {
    quiz.push({ id: `quiz-${theme}-${quiz.filter(q => q.theme === theme).length}`, theme, question, options, correct, explanations });
  }
  scenario('itam', 'O inventário mostra 420 instalações de um produto, mas há 350 direitos de uso registrados. Qual é o melhor próximo passo?',
    ['Comprar imediatamente 70 licenças.', 'Normalizar o inventário e reconciliar uso, contratos, métricas e direitos.', 'Excluir 70 registros para equilibrar os totais.', 'Considerar que toda instalação é coberta pela compra do equipamento.'], 1,
    ['A diferença bruta não prova um déficit: duplicidades, métricas e direitos precisam ser avaliados.', 'A reconciliação identifica o consumo licenciável e os direitos válidos antes de decidir a remediação.', 'Excluir evidências distorce o inventário e não resolve um eventual déficit.', 'A aquisição do hardware não concede automaticamente direitos sobre todo software instalado.']);
  scenario('itam', 'Um lote de notebooks será descartado. Qual procedimento fecha corretamente o ciclo de vida dos ativos?',
    ['Dar baixa somente na planilha financeira.', 'Enviar os equipamentos ao reciclador sem tratamento.', 'Sanitizar os dados, registrar a destinação e a baixa e revisar direitos de software reutilizáveis.', 'Apagar apenas os atalhos dos usuários.'], 2,
    ['A baixa financeira não cobre sanitização, rastreabilidade e obrigações ambientais.', 'É necessário tratar dados e manter evidências da destinação.', 'O descarte exige segurança dos dados, rastreabilidade e revisão contratual antes de reaproveitar licenças.', 'Atalhos não são os dados; sua exclusão não constitui sanitização.']);
  scenario('itam', 'O SAM registra três nomes diferentes para a mesma versão de um produto, inflando o relatório. O que corrigir primeiro?',
    ['A normalização e as regras de identificação, preservando os dados de origem.', 'A quantidade de licenças compradas, reduzindo-a.', 'O nome de todos os dispositivos.', 'A política de backup da empresa.'], 0,
    ['Normalizar fabricantes, produtos e versões permite reconciliar dados sem contar duplicidades como produtos distintos.', 'Alterar compras não corrige a qualidade dos dados de descoberta.', 'O problema é a identificação do software, não o nome dos dispositivos.', 'Backup é necessário, mas não elimina inconsistências de normalização.']);
  scenario('licenciamento', 'Uma auditoria de SQL Server em VMs encontra licenças por Core. Como avaliar a conformidade?',
    ['Contar apenas usuários simultâneos.', 'Contar apenas o número de VMs.', 'Aplicar sempre uma CAL por VM.', 'Verificar edição, versão, contrato, cores licenciáveis, mínimos e direitos de virtualização.'], 3,
    ['Usuários simultâneos não são a métrica do modelo por Core.', 'A quantidade de VMs, isoladamente, não determina o consumo por Core.', 'CAL não substitui o cálculo das licenças por Core.', 'A apuração depende dos termos aplicáveis, incluindo mínimos, edição e eventuais benefícios de assinatura ou Software Assurance.']);
  scenario('licenciamento', 'Uma instalação Oracle está em um cluster virtualizado. A equipe quer licenciar somente as vCPUs visíveis na VM. Qual decisão é mais adequada?',
    ['Aceitar esse cálculo para qualquer contrato.', 'Validar contrato, métrica, tecnologia de particionamento e escopo com especialistas antes de calcular.', 'Considerar todo hypervisor um hard partitioning aceito.', 'Remover o agente de inventário para reduzir a exposição.'], 1,
    ['vCPUs visíveis não determinam, por si sós, o escopo contratual de licenciamento.', 'Direitos e escopo variam; é preciso confrontar contrato e políticas aplicáveis sem presumir isolamento de licenças.', 'Nem toda virtualização é reconhecida como particionamento limitador para licenciamento.', 'Ocultar inventário não altera direitos de uso nem corrige a conformidade.']);
  scenario('licenciamento', 'Um painel interno marca um grupo como “Purples” e indica overage de uma assinatura. O que fazer?',
    ['Tratar “Purples” como uma métrica universal de licenciamento.', 'Presumir que o excedente é sempre gratuito.', 'Confirmar o significado do rótulo na ferramenta e reconciliar consumo, franquia e regras contratuais do excedente.', 'Converter todas as assinaturas em licenças perpétuas sem revisar contratos.'], 2,
    ['“Purples” não é uma métrica universal; seu significado precisa ser confirmado no contexto da ferramenta ou organização.', 'Overage pode gerar cobrança ou exigir regularização, conforme o contrato.', 'Rótulos internos não substituem métricas contratuais. A reconciliação esclarece o excedente e a ação de regularização.', 'Uma mudança de modelo exige avaliação de direitos, custos e necessidades; não resolve automaticamente o excedente.']);
  scenario('mecm', 'Um aplicativo está implantado, mas não aparece no Software Center de alguns dispositivos. Qual é a melhor investigação inicial?',
    ['Reinstalar o site inteiro.', 'Verificar associação à Collection, implantação, recebimento de política e saúde do cliente.', 'Excluir o Distribution Point.', 'Desativar o inventário em todos os clientes.'], 1,
    ['Reinstalar o site é uma ação desproporcional sem diagnóstico.', 'O alvo precisa pertencer à Collection e receber a política por um cliente saudável; logs como PolicyAgent.log ajudam a investigar.', 'Excluir o DP pode interromper conteúdo e não resolve o direcionamento da política.', 'O inventário não deve ser desativado como tentativa genérica de corrigir a implantação.']);
  scenario('mecm', 'O cliente recebe a implantação, mas o download fica parado. Qual conjunto de verificações é mais útil?',
    ['Somente a licença do Windows.', 'A resolução da tela do usuário.', 'Conteúdo distribuído no DP, Boundary Groups, conectividade e logs CAS.log e ContentTransferManager.log.', 'A quantidade de usuários no Active Directory, sem analisar logs.'], 2,
    ['A licença do Windows não explica, por si só, uma falha na obtenção de conteúdo.', 'Resolução de tela não interfere na localização e transferência do conteúdo.', 'Essas verificações cobrem disponibilidade, localização e transferência de conteúdo para o cliente.', 'O diagnóstico deve focar no caminho do conteúdo e nas evidências do cliente.']);
  scenario('mecm', 'A equipe ativou co-management e espera que todas as políticas passem automaticamente para o Intune. Como corrigir essa expectativa?',
    ['Revisar a autoridade de cada workload e migrar gradualmente usando grupos piloto.', 'Desinstalar todos os clientes do Configuration Manager.', 'Mover qualquer workload sem validar requisitos.', 'Deixar ambos os serviços configurarem indiscriminadamente a mesma função.'], 0,
    ['Co-management permite transição por workload; grupos piloto ajudam a validar a gestão antes da expansão.', 'O cliente do Configuration Manager participa do co-management; removê-lo não é requisito geral.', 'Cada workload precisa de requisitos, políticas e validação apropriados.', 'Autoridade e políticas precisam ser planejadas para evitar conflitos.']);
  scenario('servicenow', 'A descoberta e uma integração criam CIs duplicados na CMDB. Qual abordagem é mais adequada?',
    ['Apagar a CMDB diariamente.', 'Desativar todas as regras de identificação.', 'Dar permissão irrestrita a toda integração.', 'Revisar identificadores, fontes autoritativas e o uso do Identification and Reconciliation Engine (IRE).'], 3,
    ['Excluir a base perde relacionamentos e evidências sem corrigir a origem.', 'Sem identificação consistente, o problema tende a aumentar.', 'Permissões amplas não resolvem identificação nem precedência entre fontes.', 'O IRE ajuda a identificar o CI correto e controlar quais fontes podem atualizar seus atributos.']);
  scenario('servicenow', 'O time quer mapear serviços de negócio e ofertas de forma consistente entre áreas. Qual referência usar?',
    ['Uma tabela sem relacionamentos para cada equipe.', 'O CSDM e suas orientações para modelagem de serviços.', 'Somente nomes de servidores físicos.', 'Uma cópia isolada da CMDB para cada gestor.'], 1,
    ['Tabelas isoladas dificultam consistência e análise de impacto.', 'O Common Service Data Model orienta a modelagem de serviços e seus relacionamentos na plataforma.', 'Servidores são parte da infraestrutura, mas não representam sozinhos os serviços de negócio.', 'Bases isoladas aumentam divergências e retrabalho.']);
  scenario('servicenow', 'O Discovery não alcança servidores de uma rede interna. A instância está operacional. O que inspecionar primeiro?',
    ['Estado do MID Server, credenciais e conectividade necessária até os alvos.', 'A cor do portal de serviços.', 'Somente a assinatura de e-mail do solicitante.', 'Excluir os relacionamentos de todos os CIs.'], 0,
    ['O MID Server executa tarefas na rede; disponibilidade, acesso e credenciais são essenciais à descoberta.', 'A aparência do portal não interfere na conectividade do Discovery.', 'A assinatura não participa da descoberta de infraestrutura.', 'Excluir relacionamentos causa perda de informação sem tratar o acesso aos alvos.']);
  scenario('intune', 'Um dispositivo está marcado como não conforme, mas continua acessando o Microsoft 365. Qual configuração está faltando possivelmente?',
    ['Um papel de parede corporativo.', 'Um aplicativo de inventário sem integração.', 'Uma política de Acesso Condicional no Entra ID que exija dispositivo conforme, com escopo e exclusões validados.', 'A exclusão de todas as políticas de conformidade.'], 2,
    ['Personalização visual não restringe acesso.', 'Inventário isolado não impõe a exigência de conformidade na autenticação.', 'O Intune avalia conformidade; o Acesso Condicional pode usar esse sinal para decidir acesso aos recursos protegidos.', 'Excluir políticas enfraquece a avaliação e não implementa a exigência de acesso.']);
  scenario('intune', 'A empresa quer proteger dados corporativos no Outlook de celulares pessoais sem exigir inscrição MDM em um cenário compatível. O que avaliar?',
    ['Somente uma política de firmware.', 'Políticas de proteção de aplicativos (MAM), aplicativos suportados e requisitos de identidade.', 'A formatação obrigatória de todos os celulares.', 'Uma Collection do Configuration Manager para celulares pessoais.'], 1,
    ['Firmware não fornece controles sobre dados dentro de aplicativos corporativos.', 'MAM pode proteger dados em aplicativos compatíveis sem inscrição MDM, respeitando os requisitos da plataforma e do cenário.', 'Formatar aparelhos não é requisito para esse modelo de proteção.', 'Collections do Configuration Manager não substituem políticas MAM do Intune.']);
  scenario('intune', 'Uma configuração do Intune aparece como “Conflito” em vários endpoints. Qual é o melhor próximo passo?',
    ['Criar mais três perfis com o mesmo ajuste.', 'Ignorar o status e considerar sucesso.', 'Remover o dispositivo da empresa imediatamente.', 'Comparar os perfis e suas atribuições, eliminar valores divergentes e sincronizar um piloto.'], 3,
    ['Mais perfis conflitantes aumentam a ambiguidade.', 'O status precisa ser investigado para saber qual configuração está efetiva.', 'Remover o dispositivo é uma resposta desproporcional sem diagnóstico.', 'Perfis sobrepostos podem definir valores incompatíveis; corrigir o escopo e validar em piloto reduz o risco.']);
  scenario('cobit', 'O conselho quer priorizar TI conforme objetivos do negócio. Como o COBIT 2019 ajuda?',
    ['Pela cascata de metas, conectando necessidades das partes interessadas a metas e objetivos de governança e gestão.', 'Escolhendo uma marca de servidor para toda empresa.', 'Trocando o conselho por uma equipe de suporte.', 'Eliminando a medição de resultados.'], 0,
    ['A cascata traduz necessidades em metas corporativas, de alinhamento e objetivos relevantes para I&T.', 'O COBIT não prescreve uma marca de tecnologia.', 'Governança mantém responsabilidades de avaliação, direcionamento e monitoramento.', 'Medir resultados permite avaliar se as metas estão sendo atingidas.']);
  scenario('cobit', 'Uma organização pretende implementar todos os objetivos do COBIT com a mesma prioridade. Qual orientação é melhor?',
    ['Copiar o desenho de uma empresa de outro setor.', 'Priorizar apenas os objetivos mais baratos.', 'Adaptar o sistema com fatores de desenho, estratégia, riscos e requisitos da organização.', 'Ignorar necessidades das partes interessadas.'], 2,
    ['O contexto de outra empresa não substitui o desenho adequado à organização.', 'Custo isolado não representa valor, risco e obrigações.', 'O COBIT 2019 prevê adaptação do sistema de governança ao contexto por meio de fatores de desenho.', 'As necessidades das partes interessadas orientam o sistema de governança.']);
  scenario('cobit', 'Uma equipe confunde governança com execução diária. Qual atividade pertence diretamente ao domínio EDM?',
    ['Instalar uma impressora.', 'Avaliar opções estratégicas, direcionar prioridades e monitorar benefícios e riscos.', 'Aplicar um patch em um notebook.', 'Resetar a senha de um usuário.'], 1,
    ['A instalação é execução operacional.', 'EDM significa Evaluate, Direct and Monitor e reúne objetivos de governança.', 'A aplicação de patches é execução de gestão e operação.', 'O reset de senha é atendimento operacional.']);
  scenario('itil', 'Um serviço crítico está fora do ar. Há um contorno seguro, mas a causa ainda não foi identificada. Qual é a prioridade da gestão de incidentes?',
    ['Esperar a causa raiz antes de qualquer restauração.', 'Encerrar todos os alertas sem verificar o serviço.', 'Criar um projeto de seis meses antes de atender usuários.', 'Restaurar o serviço rapidamente com o contorno aprovado e investigar a causa pela gestão de problemas.'], 3,
    ['A restauração não precisa aguardar toda a investigação da causa quando existe um contorno apropriado.', 'Encerrar alertas não significa restaurar o serviço.', 'A resposta ao incidente deve focar em reduzir o impacto imediato.', 'Gestão de incidentes busca restaurar o serviço; gestão de problemas trata causas e redução de recorrência.']);
  scenario('itil', 'Uma alteração recorrente, de baixo risco, tem procedimento documentado e autorização prévia. Como ela pode ser classificada?',
    ['Mudança padrão, se atender aos critérios definidos pela organização.', 'Mudança emergencial só porque se repete.', 'Incidente de segurança em qualquer situação.', 'Mudança sem necessidade de registro nem controle.'], 0,
    ['Mudanças padrão são de baixo risco, bem compreendidas e pré-autorizadas; seguem um procedimento estabelecido.', 'Emergência está ligada à urgência e ao contexto, não à repetição.', 'Uma mudança recorrente não é automaticamente um incidente de segurança.', 'Pré-autorização não elimina documentação, rastreabilidade e controle.']);
  scenario('itil', 'Um serviço cumpre a meta de disponibilidade, mas os usuários não conseguem concluir suas tarefas. O que a equipe deve fazer?',
    ['Considerar sucesso apenas porque o indicador técnico está verde.', 'Remover os canais de feedback.', 'Revisar resultados esperados, experiência e métricas com consumidores para melhorar o valor cocriado.', 'Aumentar o número de relatórios sem conversar com usuários.'], 2,
    ['Disponibilidade técnica isolada não garante resultados úteis para os consumidores.', 'Feedback é essencial para entender necessidades e oportunidades de melhoria.', 'A ITIL 4 enfatiza foco no valor; os resultados e a experiência precisam orientar a melhoria.', 'Mais relatórios não substituem entendimento dos resultados desejados.']);
  scenario('scrum', 'No meio da Sprint surge uma solicitação urgente. Qual resposta respeita o Scrum?',
    ['Qualquer gestor adiciona trabalho diretamente, sem negociação.', 'Developers e Product Owner negociam o escopo conforme necessário, sem colocar em risco a Meta da Sprint.', 'A Sprint precisa ser prorrogada automaticamente.', 'A Meta da Sprint é descartada sempre que aparece um pedido.'], 1,
    ['Mudanças no trabalho precisam de colaboração e atenção à Meta da Sprint.', 'O escopo pode ser esclarecido e renegociado com o Product Owner à medida que se aprende, preservando a Meta da Sprint.', 'A Sprint tem duração fixa; sua extensão não é o mecanismo de acomodação de pedidos.', 'A Meta da Sprint oferece foco e não deve ser descartada por qualquer pedido.']);
  scenario('scrum', 'Um item foi programado, mas não passou nos testes exigidos pela Definition of Done. Como tratá-lo na Sprint Review?',
    ['Contá-lo como pronto porque o código foi escrito.', 'Reduzir a Definition of Done depois da falha.', 'Ocultar a falha dos stakeholders.', 'Não considerá-lo parte do Incremento pronto; devolver o item ao Product Backlog para consideração futura.'], 3,
    ['Programar não basta quando os critérios de qualidade ainda não foram atendidos.', 'A qualidade não deve ser reduzida para maquiar uma entrega.', 'Transparência é um pilar do empirismo no Scrum.', 'Um item que não atende à Definition of Done não pode ser considerado parte de um Incremento pronto.']);
  scenario('scrum', 'A Daily Scrum virou uma prestação de contas de uma hora ao gerente. Qual ajuste é adequado?',
    ['Retomar 15 minutos para os Developers inspecionarem progresso rumo à Meta da Sprint e adaptarem o plano.', 'Exigir slides individuais diariamente.', 'Eliminar qualquer adaptação do Sprint Backlog.', 'Transformar a reunião em avaliação individual de desempenho.'], 0,
    ['A Daily é um evento de 15 minutos para os Developers; discussões detalhadas podem acontecer separadamente.', 'Slides de prestação de contas não são uma exigência do Scrum.', 'A adaptação do plano é uma finalidade da Daily Scrum.', 'Avaliação individual não é a finalidade desse evento.']);
  scenario('projetos', 'Um fornecedor avisa que uma entrega do caminho crítico atrasará dez dias. O que fazer primeiro?',
    ['Alterar a data final sem informar ninguém.', 'Remover a atividade do cronograma para esconder o atraso.', 'Analisar impacto e alternativas, atualizar riscos e comunicar a decisão pelo processo de controle de mudanças.', 'Presumir que toda atividade tem folga suficiente.'], 2,
    ['Mudanças precisam de análise, comunicação e governança adequadas.', 'Ocultar dependências destrói a confiabilidade do plano.', 'Uma atividade crítica pode afetar a conclusão; é preciso avaliar dependências, opções e decisões com transparência.', 'Atividades no caminho crítico normalmente não possuem folga total positiva no plano considerado.']);
  scenario('projetos', 'Uma área pede novas funcionalidades após a aprovação do escopo. Qual resposta evita expansão descontrolada?',
    ['Implementar tudo informalmente.', 'Registrar a solicitação, avaliar valor e impactos e submetê-la à decisão prevista na governança do projeto.', 'Recusar qualquer mudança em todos os projetos.', 'Trocar a equipe sem avaliar o pedido.'], 1,
    ['Mudanças informais podem comprometer prazo, custo e qualidade.', 'O controle adequado permite decisões conscientes; em contextos ágeis, inclui priorização e negociação do trabalho.', 'Mudanças podem agregar valor quando avaliadas e gerenciadas.', 'Trocar pessoas não resolve a avaliação de escopo.']);
  scenario('projetos', 'Uma migração depende de um especialista externo que pode ficar indisponível. Qual ação representa gestão proativa do risco?',
    ['Esperar a indisponibilidade acontecer para começar a pensar.', 'Remover essa dependência do relatório sem mudar o plano.', 'Tratar a ausência como certeza sem analisar probabilidade.', 'Registrar probabilidade e impacto, atribuir responsável e preparar mitigação e contingência.'], 3,
    ['Esperar reduz as opções de resposta e pode ampliar o impacto.', 'Ocultar o risco não reduz sua probabilidade nem seu impacto.', 'Risco envolve incerteza; uma ocorrência confirmada passa a demandar tratamento como questão ou problema existente.', 'Responsável, mitigação e contingência permitem antecipar e responder à possível indisponibilidade.']);
  const achievements = [
    { id: 'first', title: 'Primeiro passo', description: 'Conclua sua primeira partida.', icon: '▷' },
    { id: 'trio', title: 'Mente versátil', description: 'Conclua uma partida em cada modalidade.', icon: '⌘' },
    { id: 'xp500', title: 'Em ascensão', description: 'Acumule 500 XP.', icon: 'ϟ' },
    { id: 'perfect', title: 'Diagnóstico preciso', description: 'Acerte as três questões de um quiz.', icon: '✓' },
    { id: 'explorer', title: 'Explorador de TI', description: 'Conclua partidas que abordem os nove temas.', icon: '◇' }
  ];
  CP.data = {
    themes, forca, termo, quiz, achievements,
    // Vocabulário aceito: respostas + palpites técnicos de cinco letras.
    dictionary: [...new Set(termo.map(w => w.word).concat(['ADMIN', 'ALERT', 'ARRAY', 'AZURE', 'BOARD', 'BUILD', 'BYTES', 'CACHE', 'CABLE', 'CHART', 'CHECK', 'CISCO', 'CLASS', 'CLEAN', 'CLICK', 'CLONE', 'CODES', 'CORES', 'COUNT', 'CYCLE', 'DEBUG', 'DEPTH', 'DRIVE', 'ERROR', 'EXCEL', 'FIELD', 'FILES', 'FIXES', 'FLASH', 'FLOWS', 'FOCUS', 'FORMS', 'FRAME', 'FRONT', 'GRANT', 'GROUP', 'GUARD', 'GUIDE', 'HOSTS', 'INDEX', 'INPUT', 'INTEL', 'ISSUE', 'ITEMS', 'LAYER', 'LEADS', 'LEVEL', 'LIMIT', 'LINUX', 'LOCAL', 'LOGIC', 'LOGIN', 'MACRO', 'MERGE', 'MODEL', 'MODEM', 'MOUSE', 'NODES', 'OWNER', 'PHASE', 'PIXEL', 'PLANS', 'POINT', 'PORTS', 'POWER', 'PRINT', 'PROXY', 'QUEUE', 'QUOTA', 'REACT', 'RESET', 'RISCO', 'ROLES', 'ROUTE', 'RULES', 'SCALE', 'SCRUM', 'SETUP', 'SHARE', 'SHELL', 'SHIFT', 'SMART', 'SOLID', 'SPEED', 'STACK', 'STAGE', 'START', 'STATE', 'STORY', 'SWIFT', 'TABLE', 'TASKS', 'TEAMS', 'TESTE', 'TESTS', 'TOKEN', 'TOOLS', 'TRACE', 'TRACK', 'TRAIN', 'TRUST', 'TYPES', 'UNITS', 'USERS', 'VALID', 'VALOR', 'VIEWS', 'VIRUS', 'WHILE', 'WIRED']).filter(word => /^[A-Z]{5}$/.test(word)))],
    modeNames: { forca: 'Forca Tech', termo: 'Termo Técnico', quiz: 'Quiz de Troubleshooting' },
    normalize: text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(),
    themeName: id => themes.find(theme => theme.id === id)?.name || 'Todos os temas',
    pool: (mode, theme) => ({ forca, termo, quiz }[mode] || []).filter(item => theme === 'all' || item.theme === theme)
  };
})(window.CertifyPlay);
