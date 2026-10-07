// Base de dados dos Módulos da Topologia
const topologyData = [
  {
    id: "node-itam",
    cluster: "governance",
    clusterName: "ITAM & CMDB",
    icon: "fa-solid fa-layer-group",
    title: "Gestão de Ativos & Governança de CMDB",
    subtitle: "Atuação Profissional | Telefônica Brasil (Vivo)",
    description: "Gestão ponta a ponta do ciclo de vida de ativos de hardware e software, qualidade e acurácia de dados no CMDB, alinhamento aos processos de Workplace Services e integração operacional com Microsoft MECM/SCCM.",
    skills: ["Hardware Asset Management", "Software Asset Management", "CMDB Governance", "MECM / SCCM", "Workplace Services", "ServiceNow"]
  },
  {
    id: "node-sn-csa",
    cluster: "servicenow",
    clusterName: "ServiceNow Ecosystem",
    icon: "fa-solid fa-server",
    title: "ServiceNow Certified System Administrator",
    subtitle: "Certificação Oficial",
    description: "Administração da plataforma ServiceNow, incluindo governança do modelo CSDM, automação de fluxos com Flow Designer, construção de formulários no Service Portal e suporte técnico a processos ITSM/ITAM.",
    skills: ["ServiceNow CSA", "CSDM", "Flow Designer", "Service Portal", "ITSM", "Data Reconciliation"]
  },
  {
    id: "node-ai",
    cluster: "servicenow",
    clusterName: "Inovação & IA",
    icon: "fa-solid fa-brain",
    title: "Programação em IA Generativa",
    subtitle: "Formação Técnica | SENAI",
    description: "Estudos aplicados de Inteligência Artificial Generativa, estruturação de fluxos de automação, engenharia de prompts e aplicação de modelos preditivos e generativos na resolução de problemas operacionais de TI.",
    skills: ["IA Generativa", "Engenharia de Prompts", "Automação de Processos", "Python", "LLMs"]
  },
  {
    id: "node-pos-arch",
    cluster: "academic",
    clusterName: "Especialização",
    period: "Previsão Início 2027",
    icon: "fa-solid fa-diagram-project",
    title: "Arquitetura de Software",
    subtitle: "Pós-Graduação Planejada | FIAP",
    description: "Planejamento para especialização avançada em padrões de arquitetura de software, ecossistemas de microsserviços, arquitetura orientada a eventos e engenharia de sistemas de alta disponibilidade.",
    skills: ["Arquitetura de Software", "Microsserviços", "Desenvolvimento Distribuído", "FIAP", "Design Patterns"]
  },
  {
    id: "node-ads",
    cluster: "academic",
    clusterName: "Graduação",
    icon: "fa-solid fa-code",
    title: "Análise e Desenvolvimento de Sistemas",
    subtitle: "Graduação Superior | FATEC Praia Grande",
    description: "Formação acadêmica focada em fundamentos de programação, lógica orientada a objetos, modelagem e gestão de bancos de dados relacionais e ciclo de vida de desenvolvimento de software.",
    skills: ["ADS", "FATEC", "Lógica de Programação", "Bancos de Dados SQL", "Engenharia de Software"]
  },
  {
    id: "node-etec",
    cluster: "academic",
    clusterName: "Comunicação & Operações",
    icon: "fa-solid fa-route",
    title: "Técnico em Guia de Turismo",
    subtitle: "Qualificação Técnica | ETEC",
    description: "Capacitação focada em mediação cultural e corporativa, planejamento e execução logística, gestão de fluxos operacionais de grupos e comunicação interpessoal estruturada.",
    skills: ["ETEC", "Comunicação Estratégica", "Gestão de Projetos e Itinerários", "Mediação"]
  }
];

// Renderiza a Topologia no Canvas
function renderTopology() {
  const container = document.getElementById("topologyMesh");
  container.innerHTML = "";

  topologyData.forEach(node => {
    const card = document.createElement("div");
    card.className = `node-card cluster-${node.cluster}`;
    card.id = `card-${node.id}`;
    card.onclick = () => openDrawer(node);

    card.innerHTML = `
      <div class="node-card-header">
        <i class="${node.icon} node-icon"></i>
        <span class="node-cluster-badge cluster-${node.cluster}">${node.clusterName}</span>
      </div>
      <h3 class="node-card-title">${node.title}</h3>
      <p class="node-card-sub">${node.subtitle}</p>
      <div class="node-card-footer">
        <span>INSPECIONAR NÓ</span>
        <i class="fa-solid fa-arrow-right"></i>
      </div>
    `;
    container.appendChild(card);
  });
}

// Filtra e destaca clusters específicos no Mesh
function highlightCluster(clusterName) {
  // Atualiza os botões do HUD
  document.querySelectorAll(".hud-btn").forEach(btn => btn.classList.remove("active"));
  
  const activeBtnMap = {
    'all': 'btn-all',
    'governance': 'btn-gov',
    'servicenow': 'btn-sn',
    'academic': 'btn-acad'
  };
  if (activeBtnMap[clusterName]) {
    document.getElementById(activeBtnMap[clusterName]).classList.add("active");
  }

  // Altera opacidade dos cards
  const cards = document.querySelectorAll(".node-card");
  cards.forEach(card => {
    if (clusterName === "all") {
      card.classList.remove("dimmed");
    } else {
      if (card.classList.contains(`cluster-${clusterName}`)) {
        card.classList.remove("dimmed");
      } else {
        card.classList.add("dimmed");
      }
    }
  });
}

// Gerenciamento do Drawer Lateral (Telemetria)
function openDrawer(node) {
  document.getElementById("nodeTag").innerText = node.clusterName;
  document.getElementById("nodeTitle").innerText = node.title;
  document.getElementById("nodeSubtitle").innerText = node.subtitle;
  document.getElementById("nodeDescription").innerText = node.description;

  const skillsContainer = document.getElementById("nodeSkills");
  skillsContainer.innerHTML = "";
  node.skills.forEach(skill => {
    const badge = document.createElement("span");
    badge.className = "skill-badge";
    badge.innerText = `# ${skill}`;
    skillsContainer.appendChild(badge);
  });

  document.getElementById("telemetryDrawer").classList.add("open");
}

function closeDrawer() {
  document.getElementById("telemetryDrawer").classList.remove("open");
}

// Inicializa a aplicação
document.addEventListener("DOMContentLoaded", renderTopology);