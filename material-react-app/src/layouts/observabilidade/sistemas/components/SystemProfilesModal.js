import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useMaterialUIController } from "context";
import PropTypes from 'prop-types';

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import DialogContentText from "@mui/material/DialogContentText";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDSnackbar from "components/MDSnackbar";
import DataTable from "examples/Tables/DataTable";
import MDBadge from "components/MDBadge";

function SystemProfilesModal({ open, onClose, system }) {
  const [controller] = useMaterialUIController();
  const { token } = controller;
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (color, title, message) => setSnackbar({ open: true, color, title, message });

  const fetchDataForSystem = async (signal) => {
    if (!open || !system || !token) {
      setDataList([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setDataList([]);

    const isRh = system.id === 'rh' || system.name?.toUpperCase() === 'RH';
    let url = '';
    let params = {};

    try {
      if (isRh) {
        // Lógica para RH
        url = `/identities`;
        params = { sourceSystem: 'RH' };
      } else {
        // Lógica para Outros Sistemas (Accounts)
        url = `/accounts`;
        params = { systemId: system.id, includeProfiles: true };
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
        signal: signal,
      });

      setDataList(response.data || []);

    } catch (err) {
      if (!axios.isCancel(err)) {
          console.error(`Erro ao buscar dados para o sistema ${system.name}:`, err);
          setError(err.response?.data?.message || `Não foi possível carregar os dados de ${system.name}.`);
          setDataList([]);
      } else {
          console.log("Requisição de busca cancelada.");
      }
    } finally {
       if (!signal?.aborted) {
           setLoading(false);
       }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchDataForSystem(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [open, system, token]);

  const handleOpenConfirm = () => setIsConfirmOpen(true);
  const handleCloseConfirm = () => setIsConfirmOpen(false);

  const handleConfirmClear = async () => {
    if (!system || isClearing) return;

    setIsClearing(true);
    handleCloseConfirm();

    const isRh = system.id === 'rh' || system.name?.toUpperCase() === 'RH';
    let url = '';
    let params = {};

    try {
      if (isRh) {
        url = `/identities`;
        params = { sourceSystem: 'RH' };
      } else {
        url = `/accounts`;
        params = { systemId: system.id };
      }

      await axios.delete(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: params
      });

      showSnackbar("success", "Sucesso", `Dados do sistema "${system.name}" limpos.`);
      setDataList([]);

    } catch (err) {
        console.error(`Erro ao limpar dados do sistema ${system.name}:`, err);
        showSnackbar("error", "Erro ao Limpar", err.response?.data?.message || "Não foi possível limpar os dados.");
    } finally {
        setIsClearing(false);
    }
  };

  const isRhSystem = system?.id === 'rh' || system.name?.toUpperCase() === 'RH';

  const columns = useMemo(() => [
      { 
        Header: "ID no Sistema", 
        accessor: "accountIdInSystem",
        Cell: ({ row: { original } }) => (
            <MDTypography variant="caption">
                {isRhSystem ? original.identityId : original.accountIdInSystem}
            </MDTypography>
        )
      },
      { Header: "Nome", accessor: "name", Cell: ({value}) => <MDTypography variant="caption">{value || '-'}</MDTypography> },
      { Header: "Email", accessor: "email", Cell: ({value}) => <MDTypography variant="caption">{value || '-'}</MDTypography> },
      { 
        Header: "Status", 
        accessor: "status", 
        align: "center", 
        Cell: ({ value }) => (
            value ? 
            <MDBadge 
                badgeContent={value} 
                color={value.toLowerCase() === 'ativo' ? 'success' : 'error'} 
                variant="gradient" 
                size="sm" 
            /> : 
            <MDTypography variant="caption">-</MDTypography>
        )
      },
      { 
        Header: "Perfil (Sistema)", 
        accessor: "profiles",
        align: "left", 
        Cell: ({ value }) => { // value é o array [ { id: 1, name: 'Admin' } ]
            if (isRhSystem || !Array.isArray(value) || value.length === 0) {
                 return <MDTypography variant="caption">N/A (RH)</MDTypography>;
            }
            // --- INÍCIO DA CORREÇÃO ---
            // Removemos '.profile' pois o backend já simplificou o array
            const profileNames = value.map(p => p?.name).filter(Boolean).join(', ');
            // --- FIM DA CORREÇÃO ---
            return <MDTypography variant="caption">{profileNames || 'Nenhum'}</MDTypography>;
        }
      },
      {
         Header: "Vínculo (Identidade)",
         accessor: "identity",
         Cell: ({ value }) => (
            <MDTypography variant="caption">
                {isRhSystem ? "Fonte Autoritativa" : (value ? value.name || value.email || `ID: ${value.id}` : 'Sem Vínculo (Órfã)')}
            </MDTypography>
         )
      }
  ], [isRhSystem]); // Dependência correta

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Contas e Identidades Associadas a "{system?.name || ''}"</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {loading && (
            <MDBox display="flex" justifyContent="center" alignItems="center" p={3}>
              <CircularProgress color="info" />
            </MDBox>
          )}
          {!loading && error && (
            <MDTypography variant="body2" color="error" textAlign="center" p={2}>
              Erro: {error}
            </MDTypography>
          )}
          {!loading && !error && (
            <MDBox p={1}>
              <DataTable
                table={{ columns, rows: dataList }}
                isSorted={true}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 20, 50] }}
                showTotalEntries
                noEndBorder
                canSearch
                entriesCount={dataList.length}
                customMessageNoData={isRhSystem ? "Nenhuma identidade encontrada." : "Nenhuma conta encontrada para este sistema."}
                tableProps={{ size: 'small' }}
              />
            </MDBox>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 2, py: 1.5 }}>
          <Tooltip title={isRhSystem ? `Limpar todas as identidades do RH` : `Limpar todas as contas do sistema ${system?.name}`}>
            <span>
              <MDButton
                onClick={handleOpenConfirm}
                color="error"
                disabled={loading || isClearing || dataList.length === 0}
              >
                {isClearing ? "Limpando..." : "Limpar Dados"}
              </MDButton>
            </span>
          </Tooltip>
          <MDButton onClick={onClose} color="secondary" disabled={isClearing}>
            Fechar
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmação */}
      <Dialog open={isConfirmOpen} onClose={handleCloseConfirm}>
          <DialogTitle>Confirmar Limpeza</DialogTitle>
          <DialogContent>
              <DialogContentText>
                  Você tem certeza que deseja excluir **TODAS as {isRhSystem ? "identidades" : "contas"}** associadas ao sistema "{system?.name || ''}"?
                  <br/>
                  Esta ação **não pode ser desfeita**.
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <MDButton onClick={handleCloseConfirm} color="secondary">
                  Cancelar
              </MDButton>
              <MDButton onClick={handleConfirmClear} color="error" variant="gradient">
                  Confirmar Exclusão
              </MDButton>
          </DialogActions>
      </Dialog>

      {/* Snackbar Local */}
      <MDSnackbar
          color={snackbar.color}
          icon={snackbar.color === "success" ? "check" : "warning"}
          title={snackbar.title}
          content={snackbar.message}
          dateTime="agora"
          open={snackbar.open}
          onClose={closeSnackbar}
          close={closeSnackbar}
      />
    </>
  );
}

// Adiciona PropTypes
SystemProfilesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  system: PropTypes.object,
};

SystemProfilesModal.defaultProps = {
  system: null,
};

export default SystemProfilesModal;