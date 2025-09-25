// src/layouts/observabilidade/trupam/index.js

import { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Papa from "papaparse";
import Modal from "@mui/material/Modal";

// --- MODIFICAÇÃO: Importar o hook de contexto ---
import { useDashboard } from "context/DashboardContext";

// Componentes do Template
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import PieChart from "examples/Charts/PieChart";
import TimelineList from "examples/Timeline/TimelineList";
import TimelineItem from "examples/Timeline/TimelineItem";

function InitialState({ onImportClick }) {
  return (
    <MDBox textAlign="center" py={10}>
      <MDTypography variant="h3" color="text" mb={2}>
        Dashboard de Observabilidade TruPAM
      </MDTypography>
      <MDTypography variant="body1" color="text" mb={4}>
        Para começar, importe um arquivo de dados no formato CSV.
      </MDTypography>
      <MDButton variant="gradient" color="info" onClick={onImportClick}>
        <Icon sx={{ fontWeight: "bold" }}>upload_file</Icon>
        &nbsp;Importar CSV
      </MDButton>
    </MDBox>
  );
}

function DashboardTruPAM() {
  // --- MODIFICAÇÃO: Usar o estado do contexto global ---
  const { truPAMData, updateTruPAMData } = useDashboard();

  // Estado local para controlar o que é exibido na tela
  const [displayData, setDisplayData] = useState(null);

  // Estados locais para controle da UI
  const [csvFileName, setCsvFileName] = useState(null);
  const fileInputRef = useRef(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", data: { columns: [], rows: [] } });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleImportClick = () => fileInputRef.current.click();

  const transformAndSetData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      setDisplayData(null);
      return;
    }

    let filteredData = rawData;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredData = rawData.filter(row => {
        const rowDate = row.data_sessao ? new Date(row.data_sessao) : null;
        return rowDate && rowDate >= start && rowDate <= end;
      });
    }

    const contasPrivilegiadas = new Set(filteredData.map(row => row.id_conta)).size;
    const sessoesAtivas = filteredData.filter(row => row.sessao_ativa === 'true').length;
    const segredosNoCofre = filteredData.length;
    const alertasCriticos = filteredData.filter(row => row.evento_recente_severidade === 'error').length;

    const sessoesPorDia = {
      "Servidores Core": [0,0,0,0,0,0,0], "Bancos de Dados": [0,0,0,0,0,0,0], "Cloud": [0,0,0,0,0,0,0], "Redes": [0,0,0,0,0,0,0], "Aplicações Críticas": [0,0,0,0,0,0,0],
    };
    filteredData.forEach(row => {
      const diaDaSemana = new Date(row.data_sessao).getDay();
      if (sessoesPorDia[row.tipo_sistema]) {
        sessoesPorDia[row.tipo_sistema][diaDaSemana]++;
      }
    });
    const sessoesPrivilegiadas = {
      labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      datasets: [
        { label: "Servidores Core", data: sessoesPorDia["Servidores Core"], color: "error" },
        { label: "Bancos de Dados", data: sessoesPorDia["Bancos de Dados"], color: "info" },
        { label: "Cloud", data: sessoesPorDia["Cloud"], color: "dark" },
        { label: "Aplicações Críticas", data: sessoesPorDia["Aplicações Críticas"], color: "warning" },
      ],
    };

    const senhas = filteredData.reduce((acc, row) => {
      acc[row.status_senha] = (acc[row.status_senha] || 0) + 1;
      return acc;
    }, {});
    const conformidadeSenhas = {
      labels: ["Em conformidade", "Expiradas", "Fora do Padrão"],
      datasets: { label: "Credenciais", backgroundColors: ["success", "warning", "error"], data: [senhas.em_conformidade || 0, senhas.expirada || 0, senhas.fora_do_padrao || 0] },
    };

    const getStatusComponent = (status) => {
        const colorMap = { "Revisão Urgente": "error", "Revisão Pendente": "warning", "Revisada": "success" };
        return <MDTypography variant="caption" color={colorMap[status] || "dark"} fontWeight="medium">{status}</MDTypography>
    }
    const auditoriaSessoes = {
        columns: [ { Header: "usuário", accessor: "user", width: "25%" }, { Header: "sistema de destino", accessor: "target", width: "30%" }, { Header: "pontuação de risco", accessor: "riskScore", align: "center" }, { Header: "duração", accessor: "duration", align: "center" }, { Header: "status", accessor: "status", align: "center" } ],
        rows: filteredData.map(row => ({ user: row.usuario_privilegiado, target: row.sistema_destino, riskScore: row.pontuacao_risco_sessao, duration: `${row.duracao_sessao_min} min`, status: getStatusComponent(row.status_auditoria_sessao) })),
    };

    const comandos = filteredData.reduce((acc, row) => {
      if(row.comando_risco_executado) acc[row.comando_risco_executado] = (acc[row.comando_risco_executado] || 0) + 1;
      return acc;
    }, {});
    const comandosDeRisco = {
      labels: Object.keys(comandos),
      datasets: { label: "Execuções", data: Object.values(comandos) },
    };

    const atividadesRecentes = filteredData
      .filter(row => row.evento_recente_descricao)
      .sort((a, b) => new Date(b.evento_recente_timestamp) - new Date(a.evento_recente_timestamp))
      .slice(0, 4)
      .map(row => ({
        color: row.evento_recente_severidade,
        icon: row.evento_recente_severidade === 'error' ? 'code' : 'schedule',
        title: row.evento_recente_descricao,
        dateTime: new Date(row.evento_recente_timestamp).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      }));

    const newData = {
      kpis: { contasPrivilegiadas, sessoesAtivas, segredosNoCofre, alertasCriticos },
      sessoesPrivilegiadas, conformidadeSenhas, auditoriaSessoes, comandosDeRisco, atividadesRecentes,
      impactoFinanceiro: {
        custoMedioViolacao: "R$ 25 Milhões", perdaPotencialAcessoIndevido: "R$ 1.47 Bilhão", riscoReputacional: "Incalculável", mitigacao: "95%", perdaEvitadaAnual: "R$ 1.4 Bilhão",
      }
    };
    setDisplayData(newData);
  };
  
  useEffect(() => {
    if (truPAMData) {
      transformAndSetData(truPAMData);
    } else {
      setDisplayData(null);
    }
  }, [truPAMData, startDate, endDate]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFileName(file.name);
      setStartDate("");
      setEndDate("");
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          updateTruPAMData(results.data);
        },
        error: (error) => console.error("Erro ao processar o CSV:", error),
      });
    }
  };
  
  const handlePieChartClick = (event, elements) => {
    if (!elements || elements.length === 0 || !displayData) return;
    
    const { index } = elements[0];
    const clickedLabel = displayData.conformidadeSenhas.labels[index];
    const filterMap = {
      "Em conformidade": "em_conformidade", "Expiradas": "expirada", "Fora do Padrão": "fora_do_padrao",
    };
    const filterValue = filterMap[clickedLabel];

    if (filterValue) {
      const detailedData = truPAMData.filter(row => row.status_senha === filterValue);

      setModalContent({
        title: `Detalhes: Contas com Senhas ${clickedLabel}`,
        data: {
          columns: [ { Header: "Usuário Privilegiado", accessor: "usuario" }, { Header: "Sistema de Destino", accessor: "sistema" }, { Header: "Status da Senha", accessor: "status" } ],
          rows: detailedData.map(row => ({ usuario: row.usuario_privilegiado, sistema: row.sistema_destino, status: clickedLabel }))
        }
      });
      handleOpenModal();
    }
  };
  
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Modal open={isModalOpen} onClose={handleCloseModal} sx={{ display: "grid", placeItems: "center" }}>
        <Card sx={{ width: "80%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
          <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h6">{modalContent.title}</MDTypography>
            <MDButton iconOnly onClick={handleCloseModal}><Icon>close</Icon></MDButton>
          </MDBox>
          <MDBox p={2}>
            <DataTable table={modalContent.data} isSorted={false} entriesPerPage={{ defaultValue: 10, entries: [5, 10, 25] }} showTotalEntries />
          </MDBox>
        </Card>
      </Modal>

      <MDBox py={3}>
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
        
        {!displayData ? (
          <InitialState onImportClick={handleImportClick} />
        ) : (
          <>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
              <MDBox display="flex" alignItems="center" mt={2}>
                <MDTypography variant="body2" color="text" fontWeight="bold" mr={1}>Período:</MDTypography>
                <MDInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <MDTypography variant="body2" color="text" mx={1}>até</MDTypography>
                <MDInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </MDBox>
              <MDBox display="flex" alignItems="center" mt={2}>
                {csvFileName && <MDTypography variant="button" color="text" mr={2}><strong>{csvFileName}</strong></MDTypography>}
                <MDButton variant="gradient" color="info" onClick={handleImportClick}>
                  <Icon sx={{ fontWeight: "bold" }}>upload_file</Icon>
                  &nbsp;Importar Outro
                </MDButton>
              </MDBox>
            </MDBox>
            
            {!displayData.kpis || displayData.kpis.contasPrivilegiadas === 0 ? (
               <MDBox textAlign="center" py={5}>
                <MDTypography variant="h5" color="text">Nenhum dado encontrado para os filtros selecionados.</MDTypography>
              </MDBox>
            ) : (
              <>
                <MDBox mb={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard icon="admin_panel_settings" title="Contas Privilegiadas" count={displayData.kpis.contasPrivilegiadas} percentage={{ color: "success", label: "no período" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="info" icon="cast_connected" title="Sessões Ativas" count={displayData.kpis.sessoesAtivas} percentage={{ color: "info", label: "atualmente em uso" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="secondary" icon="key" title="Segredos no Cofre" count={displayData.kpis.segredosNoCofre} percentage={{ color: "secondary", label: "segredos no período" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="error" icon="notification_important" title="Alertas de Risco Crítico" count={displayData.kpis.alertasCriticos} percentage={{ color: "error", label: "eventos de alta severidade" }} /></Grid>
                  </Grid>
                </MDBox>

                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={3}>Análise de Sessões e Conformidade</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}><DefaultLineChart icon={{ component: "insights" }} title="Tendência de Sessões Privilegiadas" description="Volume de sessões por tipo de sistema nos últimos 7 dias." chart={displayData.sessoesPrivilegiadas} /></Grid>
                    <Grid item xs={12} lg={5}>
                      <PieChart 
                        icon={{ component: "task_alt" }} 
                        title="Conformidade de Rotação de Senhas" 
                        description={<><strong>{displayData.kpis.contasPrivilegiadas}</strong> contas monitoradas</>} 
                        chart={displayData.conformidadeSenhas}
                        onClick={handlePieChartClick}
                      />
                    </Grid>
                  </Grid>
                </MDBox>
                
                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={2}>Governança e Auditoria de Sessões</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}><Card><MDBox pt={3} px={2}><MDTypography variant="h6">Gravações Recentes para Auditoria</MDTypography></MDBox><MDBox p={2}><DataTable table={displayData.auditoriaSessoes} isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder /></MDBox></Card></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="fact_check" title="Relatórios de Auditoria" description="Relatórios gerados vs. relatórios pendentes de revisão." value="152 Gerados / 12 Pendentes" /></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="lock_clock" title="Acessos de Emergência" description="Usos do 'break-glass' nos últimos 30 dias." value="3 utilizações" /></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="policy" title="Conformidade de Comandos" description="Percentual de comandos executados dentro das políticas." value="99.8% em conformidade" /></Grid>
                  </Grid>
                </MDBox>
                
                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={3}>Análise de Ameaças e Riscos</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}><ReportsBarChart color="error" title="Top 5 Comandos de Risco Executados" description="Comandos perigosos mais frequentes em sessões privilegiadas." chart={displayData.comandosDeRisco} /></Grid>
                    <Grid item xs={12} lg={5}><TimelineList title="Atividades Recentes de Risco">{displayData.atividadesRecentes.map(item => (<TimelineItem key={item.title} color={item.color} icon={item.icon} title={item.title} dateTime={item.dateTime} />))}</TimelineList></Grid>
                  </Grid>
                </MDBox>
                
                <MDBox mb={3}>
                  <MDTypography variant="h5" mb={3}>Análise de Impacto Financeiro (ROI)</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="warning" icon="security" title="Custo Médio de Violação" count={displayData.impactoFinanceiro.custoMedioViolacao} percentage={{ color: "error", amount: "segundo a indústria", label: "" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="error" icon="business" title="Perda por Acesso Indevido" count={displayData.impactoFinanceiro.perdaPotencialAcessoIndevido} percentage={{ color: "error", amount: "em caso de incidente", label: "grave" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="dark" icon="public" title="Risco Reputacional" count={displayData.impactoFinanceiro.riscoReputacional} percentage={{ color: "warning", amount: "perda de confiança", label: "do mercado" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="success" icon="shield" title="Mitigação com TruPAM" count={displayData.impactoFinanceiro.mitigacao} percentage={{ color: "success", amount: "prevenção de ameaças", label: "avançadas" }} /></Grid>
                  </Grid>
                  <Grid container justifyContent="center" sx={{ mt: 3 }}><Grid item xs={12} md={8} lg={7}><DefaultInfoCard icon="payments" title="Valor Anual Evitado com TruPAM" description="Nossa plataforma protege seus ativos mais críticos, prevenindo perdas catastróficas por violação de acessos privilegiados." value={<MDTypography variant="h2" fontWeight="medium" textGradient color="success">{displayData.impactoFinanceiro.perdaEvitadaAnual}</MDTypography>} /></Grid></Grid>
                </MDBox>
              </>
            )}
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default DashboardTruPAM;