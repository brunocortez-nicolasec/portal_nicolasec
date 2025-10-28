// src/layouts/observabilidade/politicas/components/SodTab.js

import { useState, useEffect } from "react";
import axios from "axios";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Hook do Contexto Principal
import { useMaterialUIController } from "context";

// Componentes SOD customizados
import SodTable from "./sod/SodTable";
import SodModal from "./sod/SodModal";

// --- Componente Principal SodTab ---
function SodTab() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  // Estados dos Dados
  const [loadingData, setLoadingData] = useState(true);
  const [sodRules, setSodRules] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allSystems, setAllSystems] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null); // Armazena a regra para edição

  // Estado do Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (color, title, message) => setSnackbar({ open: true, color, title, message });

  // Busca de Dados Iniciais
  const fetchInitialData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const rulesPromise = axios.get("/sod-rules", { headers: { Authorization: `Bearer ${token}` } });
      const profilesPromise = axios.get("/profiles", { headers: { Authorization: `Bearer ${token}` } });
      const systemsPromise = axios.get("/systems", { headers: { Authorization: `Bearer ${token}` } });
      const attributesPromise = axios.get("/identity-attributes", { headers: { Authorization: `Bearer ${token}` } });

      const [rulesResponse, profilesResponse, systemsResponse, attributesResponse] = await Promise.all([
        rulesPromise, profilesPromise, systemsPromise, attributesPromise,
      ]);

      setSodRules(rulesResponse.data);
      setAllProfiles(profilesResponse.data);
      setAllSystems(systemsResponse.data);
      setAllAttributes(attributesResponse.data);
    } catch (error) {
      console.error("Erro ao buscar dados iniciais de SOD:", error);
      showSnackbar("error", "Erro de Rede", "Não foi possível carregar os dados necessários. Verifique a API.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  // Handlers do Modal
  const handleOpenModal = (rule = null) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Handler de Deleção
  const handleDelete = async (ruleId) => {
    if (window.confirm("Tem certeza que deseja deletar esta regra SOD?")) {
      try {
        await axios.delete(`/sod-rules/${ruleId}`, { headers: { Authorization: `Bearer ${token}` } });
        showSnackbar("success", "Sucesso", "Regra de SOD deletada.");
        fetchInitialData(); // Recarrega
      } catch (error) {
        console.error("Erro ao deletar regra SOD:", error);
        showSnackbar("error", "Erro ao Deletar", error.response?.data?.message || "Erro inesperado.");
      }
    }
  };

  return (
    <>
      {/* Botão Adicionar e Título */}
      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <MDTypography variant="h5">Gerenciar Regras de SOD</MDTypography>
        <MDButton variant="gradient" color="info" onClick={() => handleOpenModal(null)}>
          <Icon sx={{ mr: 1 }}>add</Icon>
          Adicionar Regra
        </MDButton>
      </MDBox>

      {/* Tabela SOD */}
      <SodTable
        loading={loadingData}
        rules={sodRules}
        profiles={allProfiles}
        systems={allSystems}
        attributes={allAttributes}
        onEdit={handleOpenModal} // Passa a função para abrir o modal
        onDelete={handleDelete}
      />

      {/* Modal SOD */}
      {/* Renderiza o modal condicionalmente ou sempre, controlando apenas com 'open' */}
      <SodModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onRefresh={fetchInitialData} // Para recarregar após salvar
        showSnackbar={showSnackbar} // Para exibir notificações do modal
        token={token}
        ruleToEdit={editingRule} // Passa a regra em edição (ou null)
        // Passa todas as listas necessárias para os Autocompletes
        profiles={allProfiles}
        systems={allSystems}
        attributes={allAttributes}
      />

      {/* Snackbar */}
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

export default SodTab;