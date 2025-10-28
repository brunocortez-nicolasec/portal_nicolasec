import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useMaterialUIController } from "context";

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

function SystemProfilesModal({ open, onClose, system }) {
  const [controller] = useMaterialUIController();
  const { token } = controller;
  const [identitiesList, setIdentitiesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (color, title, message) => setSnackbar({ open: true, color, title, message });

  const fetchIdentitiesForSystem = async (signal) => {
    // --- INÍCIO DA MODIFICAÇÃO: Remover verificação do RH ---
    // Removemos a verificação específica para system.id === 'rh'
    if (!open || !system || !token /* || system.id === 'rh' REMOVIDO */) {
      setIdentitiesList([]);
      setLoading(false);
      setError(null);
      return;
    }
    // --- FIM DA MODIFICAÇÃO ---

    setLoading(true);
    setError(null);

    try {
      // A chamada API agora buscará ?sourceSystem=RH
      const response = await axios.get(`/identities`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { sourceSystem: system.name },
        signal: signal,
      });
      setIdentitiesList(response.data || []);
    } catch (err) {
      if (!axios.isCancel(err)) {
          console.error("Erro ao buscar identidades para o sistema:", err);
          setError(err.response?.data?.message || "Não foi possível carregar as identidades.");
          setIdentitiesList([]);
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
    fetchIdentitiesForSystem(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [open, system, token]);

  const handleOpenConfirm = () => setIsConfirmOpen(true);
  const handleCloseConfirm = () => setIsConfirmOpen(false);

  const handleConfirmClear = async () => {
    // A lógica de limpeza já permite limpar o RH porque removemos a proteção no backend
    if (!system || isClearing) return;

    setIsClearing(true);
    handleCloseConfirm();

    try {
      await axios.delete(`/identities`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { sourceSystem: system.name }
      });

      showSnackbar("success", "Sucesso", `Identidades do sistema "${system.name}" limpas.`);
      setIdentitiesList([]);

    } catch (err) {
        console.error(`Erro ao limpar identidades do sistema ${system.name}:`, err);
        showSnackbar("error", "Erro ao Limpar", err.response?.data?.message || "Não foi possível limpar as identidades.");
    } finally {
        setIsClearing(false);
    }
  };

  const columns = useMemo(() => [
      { Header: "ID da Identidade", accessor: "identityId", Cell: ({value}) => <MDTypography variant="caption">{value}</MDTypography> },
      { Header: "Nome", accessor: "name", Cell: ({value}) => <MDTypography variant="caption">{value || '-'}</MDTypography> },
      { Header: "Email", accessor: "email", Cell: ({value}) => <MDTypography variant="caption">{value || '-'}</MDTypography> },
      { Header: "Status", accessor: "status", align: "center", Cell: ({value}) => <MDTypography variant="caption">{value || '-'}</MDTypography> },
      { Header: "Perfil", accessor: "profile.name", align: "left", Cell: ({value}) => <MDTypography variant="caption">{value || 'N/A'}</MDTypography> },
  ], []);

  const isRhSystem = system?.id === 'rh'; // Variável continua útil para o Tooltip do botão Limpar

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Identidades Associadas a "{system?.name || ''}"</DialogTitle>
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
                table={{ columns, rows: identitiesList }}
                isSorted={true}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 20, 50] }}
                showTotalEntries
                noEndBorder
                canSearch
                entriesCount={identitiesList.length}
                 customMessageNoData="Nenhuma identidade encontrada para este sistema."
                tableProps={{ size: 'small' }}
              />
            </MDBox>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 2, py: 1.5 }}>
          {/* O botão Limpar Dados já permite limpar RH (a lógica está no backend) */}
          <Tooltip title={isRhSystem ? "Limpar todas as identidades do RH" : `Limpar todas as identidades do sistema ${system?.name}`}>
            <span>
              <MDButton
                onClick={handleOpenConfirm}
                color="error"
                // A única restrição para desabilitar é se estiver carregando, limpando ou vazio
                disabled={loading || isClearing || identitiesList.length === 0}
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
                  Você tem certeza que deseja **excluir TODAS as identidades** associadas ao sistema "{system?.name || ''}"?
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

export default SystemProfilesModal;