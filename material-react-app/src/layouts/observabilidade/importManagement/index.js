// material-react-app/src/layouts/observabilidade/importManagement/index.js

import { useState, useEffect } from "react";
import axios from "axios";
import { useMaterialUIController } from "context";

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
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

// --- NOVOS COMPONENTES FILHOS ---
import HistoryTable from "./components/HistoryTable";
import ImportCard from "./components/ImportCard";

// --- Componentes auxiliares para os modais ---
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

const statusMap = {
  SUCCESS: { text: "SUCESSO", color: "success" },
  FAILED: { text: "FALHA", color: "error" },
  PENDING: { text: "PENDENTE", color: "warning" },
  PROCESSING: { text: "PROCESSANDO", color: "info" },
};

// --- Componente Principal (Pai/Orquestrador) ---
function ImportManagement() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  // Estados principais da página
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [systemOptions, setSystemOptions] = useState([]);
  const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });
  
  // Estados dos modais
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Funções de busca de dados
  const fetchSystems = async () => {
    if (!token) return;
    try {
      const response = await axios.get('/systems', { headers: { "Authorization": `Bearer ${token}` } });
      const systemNames = response.data.map(system => system.name);
      // Adiciona "RH" como a primeira opção da lista
      setSystemOptions(["RH", ...systemNames]);
    } catch (error) {
      console.error("Erro ao buscar a lista de sistemas:", error);
      setSystemOptions(["RH"]); // Garante que RH sempre exista, mesmo em caso de erro
      setNotification({ open: true, color: "error", title: "Erro", content: "Não foi possível carregar a lista de sistemas." });
    }
  };
  
  const fetchHistory = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/imports', { headers: { "Authorization": `Bearer ${token}` } });
      setHistory(response.data);
    } catch (error) {
      console.error("Fetch History Error:", error);
      setNotification({ open: true, color: "error", icon: "error", title: "Erro de Rede", content: "Falha ao buscar o histórico." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) { 
      fetchHistory(); 
      fetchSystems();
    }
  }, [token]);

  // Lógica de Upload Genérica
  const genericUpload = async (file, system, callback) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("targetSystem", system);

    try {
      await axios.post('/imports', formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } });
      setNotification({ open: true, color: "success", icon: "check", title: "Sucesso", content: "Arquivo enviado para processamento!" });
      if (callback) callback();
      fetchHistory();
    } catch (error) {
      console.error("Upload Error:", error);
      fetchHistory(); 
      const errorMessage = error.response?.data?.message || "Falha no upload do arquivo.";
      setNotification({ open: true, color: "error", icon: "error", title: "Erro no Upload", content: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (file, system, callback) => {
    if (!file || !system) return;
    try {
      const checkResponse = await axios.get(`/imports/check/${system}`, { headers: { "Authorization": `Bearer ${token}` } });
      if (checkResponse.data.exists) {
        setConfirmPayload({ file, system, callback });
        setConfirmDialogOpen(true);
      } else {
        await genericUpload(file, system, callback);
      }
    } catch (error) {
      console.error("Check Error:", error);
      setNotification({ open: true, color: "error", icon: "error", title: "Erro", content: "Não foi possível verificar a plataforma." });
    }
  };
  
  const handleConfirmAndUpload = async () => {
    if (confirmPayload) {
      await genericUpload(confirmPayload.file, confirmPayload.system, confirmPayload.callback);
    }
    setConfirmDialogOpen(false);
    setConfirmPayload(null);
  };

  // Handlers dos Modais
  const handleOpenDeleteDialog = (id) => { setLogToDelete(id); setDeleteDialogOpen(true); };
  const handleCloseDeleteDialog = () => { setLogToDelete(null); setDeleteDialogOpen(false); };
  const handleConfirmDelete = async () => {
    if (!logToDelete) return;
    try {
      await axios.delete(`/imports/${logToDelete}`, { headers: { "Authorization": `Bearer ${token}` } });
      setNotification({ open: true, color: "success", icon: "check", title: "Sucesso", content: "Registro de importação excluído." });
      fetchHistory();
    } catch (error) {
      console.error("Delete Error:", error);
      const errorMessage = error.response?.data?.message || "Falha ao excluir o registro.";
      setNotification({ open: true, color: "error", icon: "error", title: "Erro", content: errorMessage });
    } finally {
      handleCloseDeleteDialog();
    }
  };
  const handleOpenDetailsDialog = (log) => { setSelectedLogDetails(log); setDetailsDialogOpen(true); };
  const handleCloseDetailsDialog = () => { setSelectedLogDetails(null); setDetailsDialogOpen(false); };
  const closeNotification = () => setNotification({ ...notification, open: false });
  const handleOpenTemplateModal = () => setTemplateModalOpen(true);
  const handleCloseTemplateModal = () => setTemplateModalOpen(false);
  const handleCloseConfirmDialog = () => { setConfirmDialogOpen(false); setConfirmPayload(null); };
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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ImportCard 
              onUpload={handleUpload}
              systemOptions={systemOptions}
              isLoading={isUploading}
              onOpenTemplate={handleOpenTemplateModal}
            />
          </Grid>
          
          <HistoryTable
            history={history}
            isLoading={isLoading}
            onOpenDetails={handleOpenDetailsDialog}
            onOpenDelete={handleOpenDeleteDialog}
          />
        </Grid>
      </MDBox>

      {/* Seção de Modais */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
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
          <MDTypography variant="h6" gutterBottom> Estrutura do Arquivo CSV </MDTypography>
          <DialogContentText sx={{ mb: 2 }}> Para garantir a importação, o cabeçalho do seu arquivo CSV deve conter as seguintes colunas, na ordem exata: </DialogContentText>
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
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <MDButton onClick={handleDownloadTemplate} color="success" variant="contained" startIcon={<Icon>download</Icon>}> Baixar Template </MDButton>
          <Box sx={{ flex: '1 1 auto' }} />
          <MDButton onClick={handleCloseTemplateModal} color="dark"> Fechar </MDButton>
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
              <DialogTitle> <MDBox display="flex" alignItems="center"><Icon sx={{ mr: 1 }}>visibility</Icon>Detalhes da Importação #{selectedLogDetails.id}</MDBox> </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={1}>
                  <DetailItem icon="badge" label="Usuário">{selectedLogDetails.user?.name || "N/A"}</DetailItem>
                  <DetailItem icon="storage" label="Sistema">{selectedLogDetails.targetSystem}</DetailItem>
                  <DetailItem icon="description" label="Arquivo">{selectedLogDetails.fileName}</DetailItem>
                  <DetailItem icon="numbers" label="Registros">{`${selectedLogDetails.processedRows} / ${selectedLogDetails.totalRows}`}</DetailItem>
                  <DetailItem icon="play_arrow" label="Início">{startTime.toLocaleString('pt-BR')}</DetailItem>
                  <DetailItem icon="check_circle" label="Término">{endTime ? endTime.toLocaleString('pt-BR') : "N/A"}</DetailItem>
                  <DetailItem icon="timer" label="Duração">{duration}</DetailItem>
                  <DetailItem icon="task_alt" label="Status">
                    <MDBadge badgeContent={statusMap[selectedLogDetails.status]?.text || selectedLogDetails.status} color={statusMap[selectedLogDetails.status]?.color || "secondary"} size="md" container />
                  </DetailItem>
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

      <MDSnackbar
        color={notification.color}
        icon="notifications"
        title={notification.title}
        content={notification.content}
        dateTime="agora"
        open={notification.open}
        onClose={closeNotification}
        close={closeNotification}
      />
    </DashboardLayout>
  );
}

export default ImportManagement;