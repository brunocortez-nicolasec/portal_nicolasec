// material-react-app/src/layouts/observabilidade/sistemas/index.js

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useMaterialUIController } from "context";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContentText from "@mui/material/DialogContentText";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";
import MDBadge from "components/MDBadge";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// --- Importações dos Modais ---
import DataSourceModal from "./components/DataSourceModal";
import DataSourceViewModal from "./components/DataSourceViewModal";
import SystemProfilesModal from "./components/SystemProfilesModal";

function GerenciarDataSources() {
  const [controller] = useMaterialUIController();
  const { token, darkMode } = controller;
  const navigate = useNavigate();

  const [systems, setSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [dataSourceToView, setDataSourceToView] = useState(null);

  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [systemForProfiles, setSystemForProfiles] = useState(null);

  const fetchSystems = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/systems', {
        headers: { "Authorization": `Bearer ${token}` },
      });
      setSystems(response.data);
    } catch (error) {
      console.error("Erro ao buscar fontes de dados:", error);
      setSystems([]);
      setNotification({ open: true, color: "error", title: "Erro de Rede", content: "Não foi possível carregar as fontes de dados da API." });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (token) {
      fetchSystems();
    } else {
      setSystems([]);
      setIsLoading(false);
    }
  }, [token]);

  const handleOpenModal = () => {
    setEditingDataSource(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (dataSource) => {
    setEditingDataSource(dataSource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDataSource(null);
  };
  const handleViewClick = (dataSource) => {
    setDataSourceToView(dataSource);
    setIsViewModalOpen(true);
  };
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setDataSourceToView(null);
  };

  const handleSaveDataSource = async (formData) => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      let action = "criada";
      let response;

      const isEditing = !!editingDataSource?.id;

      if (isEditing) {
        action = "atualizada";
        response = await axios.patch(`/systems/${editingDataSource.id}`, formData, { headers });
        
        setNotification({
          open: true,
          color: "success",
          title: "Sucesso",
          content: `Fonte de dados "${response.data.name_datasource}" ${action} com sucesso!`
        });
        handleCloseModal();
        fetchSystems();

      } else {
        response = await axios.post('/systems', formData, { headers });
        
        const newDataSource = response.data;
        
        handleCloseModal();
        
        // Após criar (Passo 1 e 2), redireciona para o Mapeamento
        // com o ID da nova Fonte de Dados
        if (newDataSource.id) {
          // Se for SISTEMA, o onSave do modal já cuidou de criar o System (Catálogo)
          // e o SystemConfig. Agora só precisamos mapear.
          navigate(`/observabilidade/mapeamento-dados/${newDataSource.id}`);
        } else {
          setNotification({ open: true, color: "error", title: "Erro", content: "Não foi possível obter o ID da nova fonte." });
          fetchSystems();
        }
      }

    } catch (error) {
      console.error("Erro ao salvar fonte de dados:", error);
      const errorMessage = error.response?.data?.message || "Ocorreu um erro inesperado.";
      // Erro é mostrado no Modal pelo `onSave`
      // Mas caso o onSave não trate,
      if (!isModalOpen) {
         setNotification({
          open: true,
          color: "error",
          title: "Erro ao Salvar",
          content: errorMessage
        });
      }
      // Retorna o erro para o Modal (para ele não fechar)
      throw new Error(errorMessage);
    }
  };

  const handleOpenDeleteDialog = (system) => {
    setSystemToDelete(system);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setSystemToDelete(null);
    setIsDeleteDialogOpen(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!systemToDelete) return;
    try {
      await axios.delete(`/systems/${systemToDelete.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      setNotification({ open: true, color: "success", title: "Sucesso", content: `Fonte de dados "${systemToDelete.name_datasource}" excluída.` });
      handleCloseDeleteDialog();
      fetchSystems();
    } catch (error) {
      console.error("Erro ao excluir fonte de dados:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível excluir a fonte de dados.";
      setNotification({ open: true, color: "error", title: "Erro", content: errorMessage });
      handleCloseDeleteDialog();
    }
  };

  const closeNotification = () => setNotification({ ...notification, open: false });

  const handleOpenProfilesModal = (system) => {
    setSystemForProfiles(system);
    setIsProfilesModalOpen(true);
  };

  const handleCloseProfilesModal = () => {
    setSystemForProfiles(null);
    setIsProfilesModalOpen(false);
  };

  const columns = useMemo(() => [
    {
      Header: "Nome da Fonte",
      accessor: "name_datasource",
      Cell: ({ value }) => <MDTypography variant="caption" fontWeight="medium">{value}</MDTypography>
    },
    {
      Header: "Origem",
      accessor: "origem_datasource",
      align: "center",
      Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>
    },
    {
      Header: "Tipo",
      accessor: "type_datasource",
      align: "center",
      Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>
    },
    {
      Header: "Mapeamento",
      accessor: "mapping", 
      align: "center",
      disableSortBy: true,
      Cell: ({ row: { original: dataSource } }) => {
        const { origem_datasource, mappingRH, mappingIDM, mappingSystem } = dataSource;
        let isMapped = false;

        // ======================= INÍCIO DA CORREÇÃO =======================
        // Os nomes dos campos foram atualizados para bater com o schema (sem 'map_')
        if (origem_datasource === "RH") {
          isMapped = mappingRH && 
                     mappingRH.identity_id_hr && 
                     mappingRH.email_hr && 
                     mappingRH.status_hr;
                     
        } else if (origem_datasource === "IDM") {
          isMapped = mappingIDM && 
                     mappingIDM.identity_id_idm && 
                     mappingIDM.email_idm && 
                     mappingIDM.status_idm;
                     
        } else if (origem_datasource === "SISTEMA") {
          const map = mappingSystem;
          const contasMapeadas = map && 
                                 map.accounts_id_in_system && // <-- Corrigido
                                 map.accounts_identity_id;   // <-- Corrigido
          const recursosMapeados = map && 
                                   map.resources_name;         // <-- Corrigido
                                   
          isMapped = contasMapeadas && recursosMapeados;
        }
        // ======================== FIM DA CORREÇÃO =========================

        return (
          <MDBadge
            color={isMapped ? "success" : "warning"}
            badgeContent={isMapped ? "Mapeado" : "Pendente"}
            variant="gradient"
            size="sm"
            container
          />
        );
      }
    },
    {
      Header: "Criado em",
      accessor: "createdAt",
      align: "center",
      Cell: ({ value }) => <MDTypography variant="caption">{value ? new Date(value).toLocaleDateString('pt-BR') : "N/A"}</MDTypography>
    },
    {
      Header: "Ações",
      accessor: "actions",
      align: "center",
      disableSortBy: true,
      Cell: ({ row: { original: dataSource } }) => {
        
        return (
          <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 1 }}>
            <Tooltip title="Visualizar Detalhes">
              <MDTypography component="a" color="text" sx={{ cursor: "pointer" }} onClick={() => handleViewClick(dataSource)}>
                <Icon fontSize="small">visibility</Icon>
              </MDTypography>
            </Tooltip>

            <Tooltip title="Listar Dados Processados">
              <MDTypography component="a" color="dark" sx={{ cursor: 'pointer' }} onClick={() => handleOpenProfilesModal(dataSource)}>
                <Icon fontSize="small">people</Icon>
              </MDTypography>
            </Tooltip>
            
            <Tooltip title="Editar">
              <MDTypography component="a" color="info" sx={{ cursor: 'pointer' }} onClick={() => handleEditClick(dataSource)}>
                <Icon fontSize="small">edit</Icon>
              </MDTypography>
            </Tooltip>

             <Tooltip title="Excluir">
               <MDTypography component="a" color="error" sx={{ cursor: 'pointer' }} onClick={() => handleOpenDeleteDialog(dataSource)}>
                 <Icon fontSize="small">delete</Icon>
               </MDTypography>
             </Tooltip>
          </MDBox>
        );
      }
    },
  ], [systems]); 

  const rows = useMemo(() => systems.map(system => ({
    ...system,
  })), [systems]);


  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2} mt={-3} py={3} px={2}
                variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
                display="flex" justifyContent="space-between" alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Gerenciamento de Fontes de Dados
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={handleOpenModal}>
                  <Icon sx={{ fontWeight: "bold" }}>add</Icon>
                  &nbsp;Adicionar Fonte de Dados
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                  showTotalEntries
                  noEndBorder
                  canSearch
                  isLoading={isLoading}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {isModalOpen && (
        <DataSourceModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={async (formData) => {
            try {
              await handleSaveDataSource(formData);
              handleCloseModal(); // Fecha SOMENTE em caso de sucesso
            } catch (error) {
              // O erro já foi setado no 'handleSaveDataSource'
              // e será exibido no modal
              console.error("Falha ao salvar, modal permanece aberto.");
            }
          }}
          initialData={editingDataSource}
          darkMode={darkMode}
        />
      )}

      {isViewModalOpen && (
        <DataSourceViewModal
          open={isViewModalOpen}
          onClose={handleCloseViewModal}
          dataSource={dataSourceToView}
          darkMode={darkMode}
        />
      )}

      {isProfilesModalOpen && (
        <SystemProfilesModal
          open={isProfilesModalOpen}
          onClose={handleCloseProfilesModal}
          dataSource={systemForProfiles} 
          onDataClear={fetchSystems} 
        />
      )}

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você tem certeza que deseja excluir a fonte de dados "<strong>{systemToDelete?.name_datasource}</strong>"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDeleteDialog} color="secondary">
            Cancelar
          </MDButton>
          <MDButton onClick={handleConfirmDelete} color="error" variant="gradient">
            Excluir
          </MDButton>
        </DialogActions>
      </Dialog>

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

export default GerenciarDataSources;