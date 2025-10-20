// material-react-app/src/layouts/observabilidade/importManagement/index.js

import { useState, useEffect, useMemo } from "react";
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
import Card from "@mui/material/Card";
import Modal from "@mui/material/Modal";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDSnackbar from "components/MDSnackbar";
import PropTypes from 'prop-types';

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

// --- NOVOS COMPONENTES FILHOS ---
import HistoryTable from "./components/HistoryTable";
import ImportCard from "./components/ImportCard";


// --- Componentes auxiliares para os modais ---

// Modal de Template (Reformatado)
const ColumnDetail = ({ name, description, example }) => (
  <MDBox mb={2}>
    <MDTypography variant="button" fontWeight="bold" color="info" textGradient sx={{ fontFamily: 'monospace' }}>
      {name}
    </MDTypography>
    <MDTypography variant="body2" color="text" display="block" sx={{ mt: 0.5 }}>
      {description}
    </MDTypography>
    <MDTypography variant="caption" color="text" display="block" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
      Exemplo: {example}
    </MDTypography>
  </MDBox>
);

ColumnDetail.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  example: PropTypes.string.isRequired,
};

// Componente Helper Padronizado
function DetailItem({ icon, label, value, children, darkMode }) {
  const valueColor = darkMode ? "white" : "text.secondary";
  return (
    <MDBox display="flex" alignItems="center" mb={1.5} lineHeight={1}>
      <Icon color="secondary" fontSize="small" sx={{ mr: 1.5 }}>{icon}</Icon>
      <MDTypography variant="button" fontWeight="bold" color="text">{label}:&nbsp;</MDTypography>
      {value != null && value !== '' && (<MDTypography variant="button" fontWeight="regular" color={valueColor}>{value}</MDTypography>)}
      {!value && value !== false && !children && (<MDTypography variant="button" fontWeight="regular" color={valueColor}>N/A</MDTypography>)}
      {children}
    </MDBox>
  );
}

DetailItem.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  children: PropTypes.node,
  darkMode: PropTypes.bool,
};

const statusMap = {
    SUCCESS: { text: "SUCESSO", color: "success" },
    FAILED: { text: "FALHA", color: "error" },
    PENDING: { text: "PENDENTE", color: "warning" },
    PROCESSING: { text: "PROCESSANDO", color: "info" },
};

// --- Componente Principal (Pai/Orquestrador) ---
function ImportManagement() {
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller;

    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [systemOptions, setSystemOptions] = useState([]);
    const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedLogDetails, setSelectedLogDetails] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState(null);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    // ======================= INÍCIO DA CORREÇÃO =======================
    const fetchSystems = async () => {
        if (!token) return;
        try {
            // Busca TODOS os sistemas (agora o backend retorna 'type' e 'databaseType')
            const response = await axios.get('/systems', { headers: { "Authorization": `Bearer ${token}` } });
            
            // Filtra APENAS os sistemas do tipo "CSV"
            const csvSystems = response.data.filter(system => system.type === "CSV"); 
            const systemNames = csvSystems.map(system => system.name);
            
            // Adiciona "RH" e atualiza o estado
            setSystemOptions(["RH", ...systemNames]); 

        } catch (error) {
            console.error("Erro ao buscar a lista de sistemas:", error);
            setSystemOptions(["RH"]); // Mantém RH como opção mínima
            setNotification({ open: true, color: "error", title: "Erro", content: "Não foi possível carregar a lista de sistemas para importação." });
        }
    };
    // ======================== FIM DA CORREÇÃO =========================
    
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
            fetchSystems(); // Chama a versão CORRIGIDA
        }
    }, [token]);

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
    
    const handleOpenDetailsModal = (log) => { setSelectedLogDetails(log); setDetailsModalOpen(true); };
    const handleCloseDetailsModal = () => { setSelectedLogDetails(null); setDetailsModalOpen(false); };
    
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
                            systemOptions={systemOptions} // Passa a lista JÁ FILTRADA
                            isLoading={isUploading}
                            onOpenTemplate={handleOpenTemplateModal}
                        />
                    </Grid>
                    
                    <HistoryTable
                        history={history}
                        isLoading={isLoading}
                        onOpenDetails={handleOpenDetailsModal}
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
                <DialogTitle sx={{ p: 2 }}>
                  <MDTypography variant="h5">Template do Arquivo CSV</MDTypography>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3, borderTop: "none" }}>
                    <MDTypography variant="h6" gutterBottom> Estrutura do Arquivo CSV </MDTypography>
                    <DialogContentText component="div" sx={{ mb: 3 }}>
                      <MDTypography variant="body2" color="text">
                        Para garantir a importação, o cabeçalho do seu arquivo CSV deve conter as seguintes colunas, na ordem exata:
                      </MDTypography>
                    </DialogContentText>
                    <MDBox>
                        <ColumnDetail name="id_user" description="Identificador único do usuário no sistema de origem." example="1023A" />
                        <ColumnDetail name="nome_completo" description="Nome completo do colaborador." example="Ana Carolina de Souza" />
                        <ColumnDetail name="email" description="Endereço de e-mail principal do usuário." example="ana.souza@empresa.com" />
                        <ColumnDetail name="status" description="Situação atual da conta (ex: Ativo, Inativo)." example="Ativo" />
                        <ColumnDetail name="cpf" description="CPF do usuário (apenas números, sem pontos ou traços)." example="11122233344" />
                        <ColumnDetail name="userType" description="Define o tipo de vínculo do usuário (ex: Funcionário, Terceirizado)." example="Funcionário" />
                        <ColumnDetail name="last_login" description="Data do último acesso no formato AAAA-MM-DD." example="2025-09-15" />
                        <ColumnDetail name="perfil" description="Define o perfil de acesso do usuário (ex: Admin, Usuário)." example="Admin" />
                    </MDBox>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <MDButton onClick={handleDownloadTemplate} color="success" variant="gradient" startIcon={<Icon>download</Icon>}> Baixar Template </MDButton>
                    <MDButton onClick={handleCloseTemplateModal} color="info"> Fechar </MDButton>
                </DialogActions>
            </Dialog>

            {/* Modal de Detalhes da Importação (Padronizado) */}
            {selectedLogDetails && (() => {
                const startTime = new Date(selectedLogDetails.createdAt);
                const endTime = selectedLogDetails.completedAt ? new Date(selectedLogDetails.completedAt) : null;
                let duration = "Em andamento...";
                if (endTime) {
                    const diffSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
                    duration = `${diffSeconds.toFixed(2)} segundos`;
                }
                const statusInfo = statusMap[selectedLogDetails.status] || { text: selectedLogDetails.status, color: "secondary" };

                return (
                    <Modal open={detailsModalOpen} onClose={handleCloseDetailsModal} sx={{ display: "grid", placeItems: "center" }}>
                      <Card sx={{ width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
                          <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                              <MDTypography variant="h5">Detalhes da Importação #{selectedLogDetails.id}</MDTypography>
                              <Icon
                                  sx={({ typography: { size }, palette: { dark, white } }) => ({
                                      fontSize: `${size.lg} !important`,
                                      color: darkMode ? white.main : dark.main,
                                      stroke: "currentColor",
                                      strokeWidth: "2px",
                                      cursor: "pointer",
                                  })}
                                  onClick={handleCloseDetailsModal}
                              >
                                  close
                              </Icon>
                          </MDBox>
                          
                          <MDBox p={3} pt={1}>
                              <Grid container spacing={3}>
                                  {/* Coluna da Esquerda */}
                                  <Grid item xs={12} md={6}>
                                      <DetailItem icon="badge" label="Usuário" value={selectedLogDetails.user?.name} darkMode={darkMode} />
                                      <DetailItem icon="storage" label="Sistema" value={selectedLogDetails.targetSystem} darkMode={darkMode} />
                                      <DetailItem icon="description" label="Arquivo" value={selectedLogDetails.fileName} darkMode={darkMode} />
                                      <DetailItem icon="numbers" label="Registros" value={`${selectedLogDetails.processedRows} / ${selectedLogDetails.totalRows}`} darkMode={darkMode} />
                                  </Grid>
                                  {/* Coluna da Direita */}
                                  <Grid item xs={12} md={6}>
                                      <DetailItem icon="play_arrow" label="Início" value={startTime.toLocaleString('pt-BR')} darkMode={darkMode} />
                                      <DetailItem icon="check_circle" label="Término" value={endTime ? endTime.toLocaleString('pt-BR') : ""} darkMode={darkMode} />
                                      <DetailItem icon="timer" label="Duração" value={duration} darkMode={darkMode} />
                                      <DetailItem icon="task_alt" label="Status" darkMode={darkMode}>
                                          <MDBadge badgeContent={statusInfo.text} color={statusInfo.color} size="sm" variant="gradient" container sx={{ ml: 1 }}/>
                                      </DetailItem>
                                  </Grid>
                              </Grid>

                              {selectedLogDetails.status === "FAILED" && selectedLogDetails.errorDetails && (
                                  <>
                                      <Divider sx={{ my: 2 }} />
                                      <MDAlert color="error" sx={{ mt: 1 }}>
                                          <MDTypography variant="button" color="white" sx={{ whiteSpace: "pre-wrap" }}>
                                              <strong>Detalhes do Erro:</strong><br/>{selectedLogDetails.errorDetails}
                                          </MDTypography>
                                      </MDAlert>
                                  </>
                              )}
                          </MDBox>
                          <MDBox p={2} pt={0} display="flex" justifyContent="flex-end">
                            <MDButton onClick={handleCloseDetailsModal} color="info">Fechar</MDButton>
                          </MDBox>
                      </Card>
                    </Modal>
                );
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

// Adicionando PropTypes faltantes
DetailItem.defaultProps = {
  darkMode: false,
  value: null,
  children: null,
};


export default ImportManagement;