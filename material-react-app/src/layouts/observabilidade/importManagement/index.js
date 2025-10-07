import { useState, useEffect } from "react";
import axios from "axios";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MDAlert from "components/MDAlert";
import Box from "@mui/material/Box";


// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import Footer from "examples/Footer";
import { useMaterialUIController } from "context";

function ImportManagement() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetSystem, setTargetSystem] = useState(null);
  const systems = ["Geral", "RH", "SAP", "Salesforce", "ServiceNow", "IDM", "Cofre", "TruAm", "TruIM", "TruPAM", "VPN", "Acesso Internet"];
  const [notification, setNotification] = useState({ open: false, color: "info", icon: "info", title: "", content: "" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/imports', { headers: { "Authorization": `Bearer ${token}` } });
      setHistory(response.data);
    } catch (error) {
      console.error("Fetch History Error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Falha ao buscar o histórico.";
      setNotification({ open: true, color: "error", icon: "error", title: "Erro de Rede", content: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) { fetchHistory(); }
  }, [token]);
  
  const proceedWithUpload = async () => {
    const formData = new FormData();
    formData.append("csvFile", selectedFile);
    formData.append("targetSystem", targetSystem);

    try {
      await axios.post('/imports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      fetchHistory();
      setSelectedFile(null);
      setTargetSystem(null);
      setNotification({ open: true, color: "success", icon: "check", title: "Sucesso", content: "Arquivo processado e log registrado com sucesso!" });
    } catch (error) {
      console.error("Upload Error:", error);
      fetchHistory(); 
      const errorMessage = error.response?.data?.message || error.message || "Falha no upload do arquivo.";
      setNotification({ open: true, color: "error", icon: "error", title: "Erro no Upload", content: errorMessage });
    }
  };

  const handleUpload = async () => {
    if (!token) {
        setNotification({ open: true, color: "error", icon: "error", title: "Erro de Autenticação", content: "Sua sessão parece ter expirado." });
        return;
    }
    if (!selectedFile || !targetSystem) {
        setNotification({ open: true, color: "warning", icon: "warning", title: "Atenção", content: "Por favor, selecione um arquivo e um sistema de destino." });
        return;
    }

    try {
      const checkResponse = await axios.get(`/imports/check/${targetSystem}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (checkResponse.data.exists) {
        setConfirmDialogOpen(true);
      } else {
        proceedWithUpload();
      }
    } catch (error) {
      console.error("Check Error:", error);
      setNotification({ open: true, color: "error", icon: "error", title: "Erro", content: "Não foi possível verificar a plataforma." });
    }
  };
  
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmAndUpload = () => {
    handleCloseConfirmDialog();
    proceedWithUpload();
  };

  const handleOpenDeleteDialog = (id) => { setLogToDelete(id); setDialogOpen(true); };
  const handleCloseDeleteDialog = () => { setLogToDelete(null); setDialogOpen(false); };

  const handleConfirmDelete = async () => {
    if (!logToDelete) return;
    try {
      await axios.delete(`/imports/${logToDelete}`, { headers: { "Authorization": `Bearer ${token}` } });
      setHistory(currentHistory => currentHistory.filter(log => log.id !== logToDelete));
      setNotification({ open: true, color: "success", icon: "check", title: "Sucesso", content: "Registro de importação excluído." });
    } catch (error) {
      console.error("Delete Error:", error);
      if (error.response && error.response.status === 404) {
        setHistory(currentHistory => currentHistory.filter(log => log.id !== logToDelete));
      } else {
        const errorMessage = error.response?.data?.message || "Falha ao excluir o registro.";
        setNotification({ open: true, color: "error", icon: "error", title: "Erro", content: errorMessage });
      }
    } finally {
      handleCloseDeleteDialog();
    }
  };
  const handleOpenDetailsDialog = (log) => { setSelectedLogDetails(log); setDetailsDialogOpen(true); };
  const handleCloseDetailsDialog = () => { setSelectedLogDetails(null); setDetailsDialogOpen(false); };
  const closeNotification = () => setNotification({ ...notification, open: false });
  
  const handleOpenTemplateModal = () => setTemplateModalOpen(true);
  const handleCloseTemplateModal = () => setTemplateModalOpen(false);

  // ======================= INÍCIO DA ALTERAÇÃO =======================
  const handleDownloadTemplate = () => {
    const header = "id_user,nome_completo,email,status,cpf,userType,last_login,perfil\n";
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_importacao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // ======================== FIM DA ALTERAÇÃO =======================

  const { columns, rows } = {
    columns: [
        { Header: "Status", accessor: "status", width: "10%", align: "center" },
        { Header: "Sistema", accessor: "sistema", align: "left" },
        { Header: "Arquivo", accessor: "arquivo", align: "left" },
        { Header: "Data", accessor: "data", align: "center" },
        { Header: "Usuário", accessor: "usuario", align: "center" },
        { Header: "Registros", accessor: "registros", align: "center" },
        { Header: "Ações", accessor: "acoes", align: "center" },
    ],
    rows: history.map(log => ({
        status: <MDBadge badgeContent={log.status} color={log.status === "SUCCESS" ? "success" : log.status === "FAILED" ? "error" : "warning"} size="sm" container />,
        sistema: <MDTypography variant="caption">{log.targetSystem}</MDTypography>,
        arquivo: <MDTypography variant="caption" fontWeight="medium">{log.fileName}</MDTypography>,
        data: <MDTypography variant="caption">{new Date(log.createdAt).toLocaleString('pt-BR')}</MDTypography>,
        usuario: <MDTypography variant="caption">{log.user?.name || "N/A"}</MDTypography>,
        registros: <MDTypography variant="caption">{`${log.processedRows} / ${log.totalRows}`}</MDTypography>,
        acoes: (
          <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 2 }}>
            <MDTypography component="a" color="text" sx={{ cursor: "pointer" }} onClick={() => handleOpenDetailsDialog(log)}><Icon>visibility</Icon></MDTypography>
            <MDTypography component="a" color="error" sx={{ cursor: "pointer" }} onClick={() => handleOpenDeleteDialog(log.id)}><Icon>delete</Icon></MDTypography>
          </MDBox>
        )
    }))
  };

  const ColumnDetail = ({ name, description, example }) => (
    <Box component="li" sx={{ "&::marker": { color: "info.main" }, mb: 1.5 }}>
      <MDTypography variant="body2" color="text">
        <Box component="strong" sx={{ fontWeight: 'bold' }}>{name}:</Box> {description}
      </MDTypography>
      <MDTypography variant="caption" color="text" sx={{ fontFamily: 'monospace' }}>
        Exemplo: {example}
      </MDTypography>
    </Box>
  );

  const DetailItem = ({ icon, label, children }) => (
    <Grid item xs={12} sm={6}>
      <MDBox display="flex" alignItems="center" py={1}>
        <Icon color="secondary" sx={{ mr: 1.5 }}>{icon}</Icon>
        <MDTypography variant="button" fontWeight="bold">{label}:&nbsp;</MDTypography>
        <MDTypography variant="body2">{children}</MDTypography>
      </MDBox>
    </Grid>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox 
                mx={2} mt={-3} py={2} px={2} 
                variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
                display="flex" justifyContent="space-between" alignItems="center"
              >
                <MDTypography variant="h6" color="white">Nova Importação de CSV</MDTypography>
                <MDButton variant="contained" color="dark" onClick={handleOpenTemplateModal}>
                  Visualizar Template
                </MDButton>
              </MDBox>
              <MDBox p={3}>
                <Grid container spacing={3} mt={-2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <MDBox sx={{ border: "2px dashed", borderColor: "lightgray", borderRadius: "10px", textAlign: "center", padding: "24px", cursor: "pointer" }} onClick={() => document.getElementById('file-input').click()}>
                      <Icon fontSize="large" color="secondary">upload_file</Icon>
                      <MDTypography variant="h6" mt={1} fontSize="1rem">{selectedFile ? selectedFile.name : "Arraste e solte o arquivo ou clique aqui"}</MDTypography>
                      <input id="file-input" type="file" accept=".csv" hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={2}>
                      <Autocomplete options={systems} value={targetSystem} onChange={(event, newValue) => setTargetSystem(newValue)} renderInput={(params) => <TextField {...params} label="Selecione o Sistema de Destino" />} />
                    </MDBox>
                    <MDButton variant="gradient" color="info" fullWidth onClick={handleUpload} disabled={!selectedFile || !targetSystem}><Icon>play_arrow</Icon>&nbsp;Processar Arquivo</MDButton>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Card>
              <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info">
                <MDTypography variant="h6" color="white">Histórico de Importações</MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable table={{ columns, rows }} isSorted={false} entriesPerPage={{ defaultValue: 10, entries: [5, 10, 20] }} showTotalEntries noEndBorder canSearch />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <Dialog open={dialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent><DialogContentText>Você tem certeza que deseja excluir este registro de importação? Esta ação não pode ser desfeita.</DialogContentText></DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDeleteDialog} color="secondary">Cancelar</MDButton>
          <MDButton onClick={handleConfirmDelete} color="error" autoFocus>Excluir</MDButton>
        </DialogActions>
      </Dialog>
      
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar Substituição</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Essa plataforma já possui um CSV processado. Você deseja fazer a substituição dos dados?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseConfirmDialog} color="secondary">Não</MDButton>
          <MDButton onClick={handleConfirmAndUpload} color="info" autoFocus>Sim</MDButton>
        </DialogActions>
      </Dialog>
      
      <Dialog open={templateModalOpen} onClose={handleCloseTemplateModal} fullWidth maxWidth="md">
        <DialogTitle>Template do Arquivo CSV</DialogTitle>
        <DialogContent dividers>
          <MDTypography variant="h6" gutterBottom>
            Estrutura do Arquivo CSV
          </MDTypography>
          <DialogContentText sx={{ mb: 2 }}>
            Para garantir a importação, o cabeçalho do seu arquivo CSV deve conter as seguintes colunas, na ordem exata:
          </DialogContentText>
          {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
          <Box component="ul" sx={{ pl: 2, listStyle: 'disc' }}>
            <ColumnDetail name="id_user" description="Identificador único do usuário no sistema de origem." example="1023A" />
            <ColumnDetail name="nome_completo" description="Nome completo do colaborador." example="Ana Carolina de Souza" />
            <ColumnDetail name="email" description="Endereço de e-mail principal do usuário." example="ana.souza@empresa.com" />
            <ColumnDetail name="status" description="Situação atual da conta (ex: Ativo, Inativo)." example="Ativo" />
            <ColumnDetail name="cpf" description="CPF do usuário (apenas números, sem pontos ou traços)." example="11122233344" />
            <ColumnDetail name="userType" description="Define o tipo de vínculo do usuário (ex: Funcionário, Terceirizado)." example="Funcionário" />
            <ColumnDetail name="last_login" description="Data do último acesso no formato AAAA-MM-DD." example="2025-09-15" />
            <ColumnDetail name="perfil" description="Define o perfil de acesso do usuário (ex: Admin, Usuário)." example="Admin" />
          </Box>
          {/* ======================== FIM DA ALTERAÇÃO ======================= */}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <MDButton onClick={handleDownloadTemplate} color="success" variant="contained" startIcon={<Icon>download</Icon>}>
            Baixar Template
          </MDButton>
          <Box sx={{ flex: '1 1 auto' }} />
          <MDButton onClick={handleCloseTemplateModal} color="dark">
            Fechar
          </MDButton>
        </DialogActions>
      </Dialog>

      {selectedLogDetails && (() => {
          const startTime = new Date(selectedLogDetails.createdAt);
          const endTime = selectedLogDetails.completedAt ? new Date(selectedLogDetails.completedAt) : null;
          let duration = "Em andamento...";
          if (endTime) {
            const diffSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
            duration = `${diffSeconds.toFixed(2)} segundos`;
          }
          return (
            <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} fullWidth maxWidth="md">
              <DialogTitle>
                <MDBox display="flex" alignItems="center"><Icon sx={{ mr: 1 }}>visibility</Icon>Detalhes da Importação #{selectedLogDetails.id}</MDBox>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={1}>
                  <DetailItem icon="badge" label="Usuário">{selectedLogDetails.user?.name || "N/A"}</DetailItem>
                  <DetailItem icon="storage" label="Sistema">{selectedLogDetails.targetSystem}</DetailItem>
                  <DetailItem icon="description" label="Arquivo">{selectedLogDetails.fileName}</DetailItem>
                  <DetailItem icon="numbers" label="Registros">{`${selectedLogDetails.processedRows} / ${selectedLogDetails.totalRows}`}</DetailItem>
                  <DetailItem icon="play_arrow" label="Início">{startTime.toLocaleString('pt-BR')}</DetailItem>
                  <DetailItem icon="check_circle" label="Término">{endTime ? endTime.toLocaleString('pt-BR') : "N/A"}</DetailItem>
                  <DetailItem icon="timer" label="Duração">{duration}</DetailItem>
                  <DetailItem icon="task_alt" label="Status"><MDBadge badgeContent={selectedLogDetails.status} color={selectedLogDetails.status === "SUCCESS" ? "success" : selectedLogDetails.status === "FAILED" ? "error" : "warning"} size="md" container /></DetailItem>
                </Grid>
                {selectedLogDetails.status === "FAILED" && selectedLogDetails.errorDetails && (
                  <MDBox mt={3}>
                    <MDAlert color="error"><MDTypography variant="body2" color="white" sx={{ whiteSpace: "pre-wrap" }}><strong>Detalhes do Erro:</strong><br/>{selectedLogDetails.errorDetails}</MDTypography></MDAlert>
                  </MDBox>
                )}
              </DialogContent>
              <DialogActions>
                <MDButton onClick={handleCloseDetailsDialog} color="info">Fechar</MDButton>
              </DialogActions>
            </Dialog>
          )
      })()}

      <MDSnackbar color={notification.color} icon={notification.icon} title={notification.title} content={notification.content} dateTime="agora" open={notification.open} onClose={closeNotification} close={closeNotification} />
    </DashboardLayout>
  );
}

export default ImportManagement;