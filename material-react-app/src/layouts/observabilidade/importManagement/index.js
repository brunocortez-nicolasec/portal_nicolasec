// CÓDIGO FINAL E CORRIGIDO

import { useState, useEffect } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDSnackbar from "components/MDSnackbar";
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
  const systems = ["Geral", "SAP", "Salesforce", "ServiceNow", "IDM", "Cofre", "TruAm", "TruIM", "TruPAM", "VPN", "Acesso Internet"];
  const [notification, setNotification] = useState({ open: false, color: "info", icon: "info", title: "", content: "" });

  const fetchHistory = async () => {
    if (!token) return; // Adiciona uma guarda extra
    setIsLoading(true);
    try {
      const response = await axios.get('/imports', {
        headers: { "Authorization": `Bearer ${token}` },
      });
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

  const handleUpload = async () => {
    // --- INÍCIO DA CORREÇÃO ---
    // Adicionamos uma verificação para garantir que o token existe ANTES de fazer a chamada
    if (!token) {
        setNotification({ open: true, color: "error", icon: "error", title: "Erro de Autenticação", content: "Sua sessão parece ter expirado. Por favor, recarregue a página ou faça login novamente." });
        return;
    }
    // --- FIM DA CORREÇÃO ---

    if (!selectedFile || !targetSystem) {
        setNotification({ open: true, color: "warning", icon: "warning", title: "Atenção", content: "Por favor, selecione um arquivo e um sistema de destino." });
        return;
    }
    const formData = new FormData();
    formData.append("csvFile", selectedFile);
    formData.append("targetSystem", targetSystem);
    try {
      const response = await axios.post('/imports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      const newLog = response.data;
      setHistory([newLog, ...history]);
      setSelectedFile(null);
      setTargetSystem(null);
      setNotification({ open: true, color: "success", icon: "check", title: "Sucesso", content: "Arquivo enviado e log registrado com sucesso!" });
    } catch (error) {
      console.error("Upload Error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Falha no upload do arquivo.";
      setNotification({ open: true, color: "error", icon: "error", title: "Erro no Upload", content: errorMessage });
    }
  };

  const closeNotification = () => setNotification({ ...notification, open: false });

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
        acoes: <MDTypography component="a" href="#" color="text" sx={{ cursor: "pointer" }}><Icon>visibility</Icon></MDTypography>
    }))
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info">
                <MDTypography variant="h6" color="white">Nova Importação de CSV</MDTypography>
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
      <MDSnackbar color={notification.color} icon={notification.icon} title={notification.title} content={notification.content} dateTime="agora" open={notification.open} onClose={closeNotification} close={closeNotification} />
    </DashboardLayout>
  );
}

export default ImportManagement;