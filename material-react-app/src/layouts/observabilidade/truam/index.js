// src/layouts/observabilidade/truam/index.js

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
        Dashboard de Observabilidade TruAM
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

function DashboardTruAM() {
  // --- MODIFICAÇÃO: Usar o estado do contexto global ---
  const { truAMData, updateTruAMData } = useDashboard();
  
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
        const rowDate = row.data_login ? new Date(row.data_login) : null;
        return rowDate && rowDate >= start && rowDate <= end;
      });
    }

    const hoje = new Date().setHours(0, 0, 0, 0);
    const appsIntegradas = new Set(filteredData.map(row => row.aplicacao)).size;
    const loginsSSOHoje = filteredData.filter(row => new Date(row.data_login).setHours(0, 0, 0, 0) === hoje && row.status_login === 'sucesso').length;
    const totalLoginsComMFA = filteredData.filter(row => row.metodo_mfa).length;
    const adocaoMFA = totalLoginsComMFA > 0 ? `${((totalLoginsComMFA / filteredData.length) * 100).toFixed(1)}%` : "0%";
    const acessosSuspeitos = filteredData.filter(row => row.evento_severidade === 'error' || row.evento_severidade === 'warning').length;

    const loginsPorDia = { sucesso: [0,0,0,0,0,0,0], falha: [0,0,0,0,0,0,0] };
    filteredData.forEach(row => {
      const diaDaSemana = new Date(row.data_login).getDay();
      if (row.status_login === 'sucesso') loginsPorDia.sucesso[diaDaSemana]++;
      else if (row.status_login === 'falha') loginsPorDia.falha[diaDaSemana]++;
    });
    const volumeLogins = {
      labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      datasets: [ { label: "Logins com Sucesso", data: loginsPorDia.sucesso, color: "success" }, { label: "Logins com Falha", data: loginsPorDia.falha, color: "error" } ],
    };

    const mfaCounts = filteredData.reduce((acc, row) => {
      if (row.metodo_mfa) acc[row.metodo_mfa] = (acc[row.metodo_mfa] || 0) + 1;
      return acc;
    }, {});
    const metodosMFA = {
      labels: ["Push", "OTP", "Biometria", "SMS"],
      datasets: { label: "Autenticações", backgroundColors: ["success", "info", "dark", "warning"], data: [mfaCounts.push || 0, mfaCounts.otp || 0, mfaCounts.biometria || 0, mfaCounts.sms || 0] },
    };

    const getStatusComponent = (status) => {
        const colorMap = { "Provisionado": "success", "Pendente": "warning", "Falhou": "error" };
        return <MDTypography variant="caption" color={colorMap[status] || "dark"} fontWeight="medium">{status}</MDTypography>
    }
    const statusProvisionamento = {
        columns: [ { Header: "usuário", accessor: "user", width: "30%" }, { Header: "aplicação", accessor: "app", width: "30%" }, { Header: "status", accessor: "status", align: "center" }, { Header: "data", accessor: "date", align: "center" } ],
        rows: filteredData.filter(row => row.status_provisionamento).map(row => ({ user: row.usuario, app: row.aplicacao, status: getStatusComponent(row.status_provisionamento), date: new Date(row.data_login).toLocaleString('pt-BR') })),
    };
    
    const falhas = filteredData.filter(row => row.status_login === 'falha').reduce((acc, row) => {
        acc[row.aplicacao] = (acc[row.aplicacao] || 0) + 1;
        return acc;
    }, {});
    const appsComFalhas = {
      labels: Object.keys(falhas),
      datasets: { label: "Falhas de Login", data: Object.values(falhas) },
    };
    
    const atividadesRecentes = filteredData
      .filter(row => row.evento_descricao)
      .sort((a, b) => new Date(b.evento_timestamp) - new Date(a.evento_timestamp))
      .slice(0, 4)
      .map(row => ({
        color: row.evento_severidade,
        icon: row.evento_severidade === 'error' ? 'block' : row.evento_severidade === 'warning' ? 'travel_explore' : 'policy',
        title: row.evento_descricao,
        dateTime: new Date(row.evento_timestamp).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      }));
    
    const newData = {
      kpis: { appsIntegradas, loginsSSOHoje, adocaoMFA, acessosSuspeitos },
      volumeLogins, metodosMFA, statusProvisionamento, appsComFalhas, atividadesRecentes,
      impactoFinanceiro: {
        horasProdutividade: "21.6 mil horas/ano", reducaoHelpDesk: "R$ 500 mil/ano", custoAccountTakeover: "R$ 2.5 Milhões", mitigacao: "99.9%", ganhoAnual: "R$ 1.5 Milhão+",
      }
    };
    setDisplayData(newData);
  };
  
  useEffect(() => {
    if (truAMData) {
      transformAndSetData(truAMData);
    } else {
      setDisplayData(null);
    }
  }, [truAMData, startDate, endDate]);

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
          updateTruAMData(results.data);
        },
        error: (error) => console.error("Erro ao processar o CSV:", error),
      });
    }
  };

  const handlePieChartClick = (event, elements) => {
    if (!elements || elements.length === 0 || !displayData) return;
    
    const { index } = elements[0];
    const clickedLabel = displayData.metodosMFA.labels[index];
    const filterMap = {
      "Push": "push", "OTP": "otp", "Biometria": "biometria", "SMS": "sms",
    };
    const filterValue = filterMap[clickedLabel];

    if (filterValue) {
      const detailedData = truAMData.filter(row => row.metodo_mfa === filterValue);
      setModalContent({
        title: `Detalhes: Autenticações via ${clickedLabel}`,
        data: {
          columns: [ { Header: "Usuário", accessor: "usuario" }, { Header: "Aplicação", accessor: "aplicacao" }, { Header: "Data do Login", accessor: "data" } ],
          rows: detailedData.map(row => ({ usuario: row.usuario, aplicacao: row.aplicacao, data: new Date(row.data_login).toLocaleString("pt-BR") }))
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
            
            {!displayData.kpis || displayData.kpis.appsIntegradas === 0 ? (
               <MDBox textAlign="center" py={5}>
                <MDTypography variant="h5" color="text">Nenhum dado encontrado para os filtros selecionados.</MDTypography>
              </MDBox>
            ) : (
              <>
                <MDBox mb={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard icon="apps" title="Aplicações Integradas" count={displayData.kpis.appsIntegradas} percentage={{ color: "success", label: "no período" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="info" icon="login" title="Logins via SSO (Hoje)" count={displayData.kpis.loginsSSOHoje} percentage={{ color: "info", label: "autenticações hoje" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="success" icon="phonelink_lock" title="Adoção de MFA" count={displayData.kpis.adocaoMFA} percentage={{ color: "success", label: "dos logins no período" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="error" icon="report_problem" title="Acessos Suspeitos" count={displayData.kpis.acessosSuspeitos} percentage={{ color: "error", label: "eventos de risco" }} /></Grid>
                  </Grid>
                </MDBox>

                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={3}>Análise de Autenticação e Uso</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}><DefaultLineChart icon={{ component: "assessment" }} title="Volume de Logins" description="Logins com sucesso vs. falhas nos últimos 7 dias." chart={displayData.volumeLogins} /></Grid>
                    <Grid item xs={12} lg={5}>
                      <PieChart 
                        icon={{ component: "fingerprint" }} 
                        title="Métodos de MFA Utilizados" 
                        description="Distribuição dos fatores de autenticação." 
                        chart={displayData.metodosMFA}
                        onClick={handlePieChartClick}
                      />
                    </Grid>
                  </Grid>
                </MDBox>

                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={2}>Governança e Provisionamento de Aplicações</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}><Card><MDBox pt={3} px={2}><MDTypography variant="h6">Logs de Provisionamento Recentes</MDTypography></MDBox><MDBox p={2}><DataTable table={displayData.statusProvisionamento} isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder /></MDBox></Card></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="star" title="Aplicação Mais Utilizada" description="App com o maior volume de logins SSO no mês." value="Office 365" /></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="savings" title="Otimização de Licenças" description="Potencial de redução de custos baseado em apps não utilizados." value="~ R$ 85 mil / mês" /></Grid>
                    <Grid item xs={12} md={4}><DefaultInfoCard icon="speed" title="Tempo Médio de Login" description="Tempo economizado por usuário com o uso de SSO." value="~ 45s por login" /></Grid>
                  </Grid>
                </MDBox>
                
                <MDBox mb={4.5}>
                  <MDTypography variant="h5" mb={3}>Análise de Risco e Comportamento</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}><ReportsBarChart color="warning" title="Top 5 Aplicações com Falhas de Login" description="Aplicações com maior número de tentativas de acesso mal sucedidas." chart={displayData.appsComFalhas} /></Grid>
                    <Grid item xs={12} lg={5}><TimelineList title="Eventos de Segurança Recentes">{displayData.atividadesRecentes.map(item => (<TimelineItem key={item.title} color={item.color} icon={item.icon} title={item.title} dateTime={item.dateTime} />))}</TimelineList></Grid>
                  </Grid>
                </MDBox>

                <MDBox mb={3}>
                  <MDTypography variant="h5" mb={3}>Análise de Impacto Financeiro (ROI)</MDTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="info" icon="work_history" title="Produtividade Ganha" count={displayData.impactoFinanceiro.horasProdutividade} percentage={{ color: "success", amount: "via SSO e autoatendimento", label: "" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="secondary" icon="support_agent" title="Redução de Custos" count={displayData.impactoFinanceiro.reducaoHelpDesk} percentage={{ color: "success", amount: "em tickets de senha", label: "" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="error" icon="person_off" title="Custo de Account Takeover" count={displayData.impactoFinanceiro.custoAccountTakeover} percentage={{ color: "error", amount: "risco mitigado", label: "com MFA" }} /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="success" icon="verified_user" title="Mitigação com TruAM" count={displayData.impactoFinanceiro.mitigacao} percentage={{ color: "success", amount: "em prevenção a fraudes", label: "" }} /></Grid>
                  </Grid>
                  <Grid container justifyContent="center" sx={{ mt: 3 }}>
                    <Grid item xs={12} md={8} lg={7}>
                      <DefaultInfoCard
                        icon="payments"
                        title="Ganho Anual Estimado com TruAM"
                        description="Somando ganhos de produtividade e redução de custos, o valor gerado pela plataforma para o negócio é de..."
                        value={<MDTypography variant="h2" fontWeight="medium" textGradient color="success">{displayData.impactoFinanceiro.ganhoAnual}</MDTypography>}
                      />
                    </Grid>
                  </Grid>
                </MDBox>
              </>
            )}
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default DashboardTruAM;