// src/layouts/observabilidade/truim/index.js

import { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Papa from "papaparse";
import Modal from "@mui/material/Modal";
import Chip from "@mui/material/Chip";

// --- MODIFICAÇÃO: Importar nosso hook de contexto ---
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
        Dashboard de Observabilidade TruIM
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

function DashboardTruIM() {
  // --- MODIFICAÇÃO: Usar o estado do contexto global ---
  const { truIMData, updateTruIMData } = useDashboard();
  
  // Estado local para controlar o que é exibido na tela
  const [displayData, setDisplayData] = useState(null);
  
  // Estados locais para controle da UI
  const [csvFileName, setCsvFileName] = useState(null);
  const fileInputRef = useRef(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeChartFilter, setActiveChartFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", data: { columns: [], rows: [] } });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleImportClick = () => fileInputRef.current.click();
  const clearChartFilter = () => setActiveChartFilter(null);

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
        const rowDate = row.data_provisionamento ? new Date(row.data_provisionamento) : null;
        return rowDate && rowDate >= start && rowDate <= end;
      });
    }

    if (activeChartFilter) {
      filteredData = filteredData.filter(row => row[activeChartFilter.type] === activeChartFilter.value);
    }
    
    // Lógica de transformação
    const hoje = new Date().setHours(0, 0, 0, 0);
    const novosUsuariosHoje = filteredData.filter(row => new Date(row.data_provisionamento).setHours(0, 0, 0, 0) === hoje).length;
    const solicitacoesPendentes = filteredData.filter(row => row.status_solicitacao === 'pendente').length;
    const identidadesOrfas = filteredData.filter(row => row.tipo_identidade === 'orfa').length;
    
    const cicloDeVida = {
      labels: ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"],
      datasets: [ { label: "Usuários Provisionados", data: [0,0,0,0,0,0], color: "success" }, { label: "Usuários Desprovisionados", data: [0,0,0,0,0,0], color: "error" } ],
    };
    filteredData.forEach(row => {
      if (row.data_provisionamento) {
        const mes = new Date(row.data_provisionamento).getMonth();
        if (mes >= 3 && mes <= 8) cicloDeVida.datasets[0].data[mes - 3]++;
      }
      if (row.data_desprovisionamento) {
        const mes = new Date(row.data_desprovisionamento).getMonth();
        if (mes >= 3 && mes <= 8) cicloDeVida.datasets[1].data[mes - 3]++;
      }
    });

    const solicitacoes = filteredData.reduce((acc, row) => {
      acc[row.status_solicitacao] = (acc[row.status_solicitacao] || 0) + 1;
      return acc;
    }, {});
    const solicitacoesAcesso = {
      labels: ["Aprovadas Automaticamente", "Aprovadas Manualmente", "Negadas", "Pendentes"],
      datasets: { label: "Solicitações", backgroundColors: ["success", "info", "error", "warning"], data: [solicitacoes.aprovada_auto || 0, solicitacoes.aprovada_manual || 0, solicitacoes.negada || 0, solicitacoes.pendente || 0] },
    };

    const campanhasUnicas = [...new Map(filteredData.map(item => [item['campanha_revisao_nome'], item])).values()];
    const getStatusComponent = (status) => {
        const colorMap = { "Em dia": "success", "Concluída": "text", "Em Risco": "warning", "Atrasada": "error" };
        return <MDTypography variant="caption" color={colorMap[status] || "dark"} fontWeight="medium">{status}</MDTypography>
    }
    const revisoesAcesso = {
      columns: [
        { Header: "campanha de revisão", accessor: "campaign", width: "40%" }, { Header: "progresso", accessor: "progress" }, { Header: "prazo", accessor: "deadline", align: "center" }, { Header: "status", accessor: "status", align: "center" },
      ],
      rows: campanhasUnicas.filter(c => c.campanha_revisao_nome).map(c => ({ campaign: c.campanha_revisao_nome, progress: c.campanha_revisao_progresso, deadline: c.campanha_revisao_prazo, status: getStatusComponent(c.campanha_revisao_status) })),
    };

    const violacoes = filteredData.reduce((acc, row) => {
        if(row.aplicacao_violacao) acc[row.aplicacao_violacao] = (acc[row.aplicacao_violacao] || 0) + 1;
        return acc;
    }, {});
    const violacoesPorApp = {
      labels: Object.keys(violacoes),
      datasets: { label: "Violações", data: Object.values(violacoes) },
    };

    const atividadesRecentes = filteredData
      .filter(row => row.evento_descricao)
      .sort((a, b) => new Date(b.evento_timestamp) - new Date(a.evento_timestamp))
      .slice(0, 4)
      .map(row => ({
        color: row.evento_severidade === "error" ? "error" : row.evento_severidade === "warning" ? "warning" : "info",
        icon: row.evento_severidade === "error" ? "key" : row.evento_severidade === "warning" ? "lock_open" : "public",
        title: row.evento_descricao,
        dateTime: new Date(row.evento_timestamp).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      }));
    
    const newData = {
      kpis: { totalIdentidades: filteredData.length, novosUsuariosHoje, solicitacoesPendentes, identidadesOrfas },
      cicloDeVida, solicitacoesAcesso, revisoesAcesso, violacoesPorApp, atividadesRecentes,
      impactoFinanceiro: {
        perdaHora: "R$ 1.68 Milhão", perdaDia: "R$ 40.2 Milhões", perdaMes: "R$ 1.2 Bilhão", mitigacao: "90%", perdaEvitadaAnual: "R$ 1.296 Bilhão",
      }
    };
    setDisplayData(newData);
  };
  
  // Efeito principal que reage a mudanças nos dados brutos (do contexto) ou nos filtros locais
  useEffect(() => {
    if (truIMData) {
      transformAndSetData(truIMData);
    } else {
      setDisplayData(null);
    }
  }, [truIMData, startDate, endDate, activeChartFilter]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFileName(file.name);
      setStartDate("");
      setEndDate("");
      setActiveChartFilter(null);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Ação principal: salva os dados brutos no contexto global
          updateTruIMData(results.data);
        },
        error: (error) => console.error("Erro ao processar o CSV:", error),
      });
    }
  };
  
  const handlePieChartClick = (event, elements) => {
    if (!elements || elements.length === 0 || !displayData) return;
    const { index } = elements[0];
    const clickedLabel = displayData.solicitacoesAcesso.labels[index];
    const filterMap = {
      "Aprovadas Automaticamente": "aprovada_auto", "Aprovadas Manualmente": "aprovada_manual", "Negadas": "negada", "Pendentes": "pendente",
    };
    const filterValue = filterMap[clickedLabel];
    if (filterValue) {
      const detailedData = truIMData.filter(row => row.status_solicitacao === filterValue);
      setModalContent({
        title: `Detalhes: Solicitações ${clickedLabel}`,
        data: {
          columns: [ { Header: "ID do Usuário", accessor: "id_usuario" }, { Header: "Data", accessor: "data" }, { Header: "Aplicação", accessor: "aplicacao" } ],
          rows: detailedData.map(row => ({ id_usuario: row.id_usuario, data: new Date(row.data_provisionamento).toLocaleDateString("pt-BR"), aplicacao: row.aplicacao_violacao || "N/A" }))
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
              <MDBox display="flex" alignItems="center" mt={2} flexWrap="wrap">
                <MDTypography variant="body2" color="text" fontWeight="bold" mr={1}>Período:</MDTypography>
                <MDInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={{mr: 1, mb: {xs: 1, md: 0}}} />
                <MDTypography variant="body2" color="text" mx={1}>até</MDTypography>
                <MDInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={{mr: 2, mb: {xs: 1, md: 0}}}/>
                {activeChartFilter && (
                    <Chip 
                        label={`Filtro: ${activeChartFilter.label}`} 
                        onDelete={clearChartFilter} 
                        color="info" 
                        sx={{ height: "auto", "& .MuiChip-label": { lineHeight: "1.5", p: 1 } }}
                    />
                )}
              </MDBox>

              <MDBox display="flex" alignItems="center" mt={2}>
                {csvFileName && <MDTypography variant="button" color="text" mr={2}><strong>{csvFileName}</strong></MDTypography>}
                <MDButton variant="gradient" color="info" onClick={handleImportClick}>
                  <Icon sx={{ fontWeight: "bold" }}>upload_file</Icon>
                  &nbsp;Importar Outro
                </MDButton>
              </MDBox>
            </MDBox>
            
            {displayData.kpis.totalIdentidades === 0 ? (
              <MDBox textAlign="center" py={5}>
                <MDTypography variant="h5" color="text">Nenhum dado encontrado para os filtros selecionados.</MDTypography>
              </MDBox>
            ) : (
              <>
                <MDBox mb={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard icon="people" title="Total de Identidades" count={displayData.kpis.totalIdentidades} percentage={{ color: "success", amount: "", label: "no período selecionado" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="info" icon="person_add" title="Novos Usuários (Hoje)" count={displayData.kpis.novosUsuariosHoje} percentage={{ color: "success", amount: "", label: "provisionados hoje" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="warning" icon="pending_actions" title="Solicitações Pendentes" count={displayData.kpis.solicitacoesPendentes} percentage={{ color: "warning", amount: "", label: "no período" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="secondary" icon="no_accounts" title="Contas Órfãs" count={displayData.kpis.identidadesOrfas} percentage={{ color: "secondary", amount: "", label: "encontradas no período" }} /></Grid>
                  </Grid>
                </MDBox>
            
                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={3}>Análise de Ciclo de Vida e Acessos</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}><DefaultLineChart icon={{ component: "leaderboard" }} title="Ciclo de Vida de Usuários" description="Fluxo de entradas e saídas de colaboradores." chart={displayData.cicloDeVida} /></Grid>
                    <Grid item xs={12} lg={5}>
                      <PieChart 
                        icon={{ component: "rule" }} 
                        title="Status das Solicitações de Acesso" 
                        description={<><strong>{displayData.solicitacoesAcesso.datasets.data.reduce((a, b) => a + b, 0)}</strong> solicitações no total</>} 
                        chart={displayData.solicitacoesAcesso}
                        onClick={handlePieChartClick}
                      />
                    </Grid>
                  </Grid>
                </MDBox>
                
                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={2}>Governança e Conformidade</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}><Card><MDBox pt={3} px={2}><MDTypography variant="h6">Campanhas de Revisão de Acesso</MDTypography></MDBox><MDBox p={2}><DataTable table={displayData.revisoesAcesso} isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder /></MDBox></Card></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="policy" title="Conformidade de Políticas" description="Verificação automática de segregação de função (SoD)." value="98.5% em conformidade" /></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="gpp_bad" title="Violações de SoD" description="Conflitos de segregação de função detectados." value="12 violações ativas" /></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="timer" title="Tempo Médio de Acesso" description="Tempo médio para aprovar e provisionar um novo acesso." value="2.5 horas" /></Grid>
                  </Grid>
                </MDBox>

                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={3}>Atividades e Alertas de Risco</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}><ReportsBarChart color="info" title="Aplicações com Violações de SoD" description="Total de violações de política de segregação de função por aplicação." chart={displayData.violacoesPorApp} /></Grid>
                    <Grid item xs={12} lg={5}><TimelineList title="Atividades Recentes de Risco">{displayData.atividadesRecentes.map(item => (<TimelineItem key={item.title} color={item.color} icon={item.icon} title={item.title} dateTime={item.dateTime} />))}</TimelineList></Grid>
                  </Grid>
                </MDBox>
                
                <MDBox mb={3}>
                  <MDTypography variant="h5" mb={3}>Análise de Impacto Financeiro (ROI)</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="warning" icon="timer" title="Perda Potencial (1 Hora)" count={displayData.impactoFinanceiro.perdaHora} percentage={{ color: "error", amount: "criticidade", label: "altíssima" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="error" icon="calendar_today" title="Perda Potencial (1 Dia)" count={displayData.impactoFinanceiro.perdaDia} percentage={{ color: "error", amount: "paralisação", label: "de operações" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="dark" icon="event" title="Perda Potencial (30 dias)" count={displayData.impactoFinanceiro.perdaMes} percentage={{ color: "error", amount: "impacto", label: "estratégico" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="success" icon="shield" title="Mitigação com TruIM" count={displayData.impactoFinanceiro.mitigacao} percentage={{ color: "success", amount: "alta disponibilidade", label: "da plataforma" }} /></Grid>
                  </Grid>
                  <Grid container justifyContent="center" sx={{ mt: 3 }}><Grid item xs={12} md={8} lg={7}><DefaultInfoCard icon="payments" title="Valor Anual Evitado com TruIM" description="Nossa plataforma garante a continuidade do seu negócio, evitando perdas anuais bilionárias com falhas de acesso e identidade." value={<MDTypography variant="h2" fontWeight="medium" textGradient color="success">{displayData.impactoFinanceiro.perdaEvitadaAnual}</MDTypography>} /></Grid></Grid>
                </MDBox>
              </>
            )}
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default DashboardTruIM;