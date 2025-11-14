// material-react-app/src/layouts/observabilidade/politicas/components/SodTab.js

import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from 'prop-types'; // <<< ADICIONADO: Para validar as novas props

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
function SodTab({ allSystems, allResources, allAttributes }) { // Corrigido de allProfiles para allResources
// ======================== FIM DA CORREÇÃO (Props) =========================
  const [controller] = useMaterialUIController();
  const { token } = controller;

  // <<< 2. Simplificar estados (loadingData agora é só para as regras) >>>
  const [loadingData, setLoadingData] = useState(true);
  const [sodRules, setSodRules] = useState([]);
  // const [allProfiles, setAllProfiles] = useState([]); // <<< REMOVIDO (Vem das props)
  // const [allSystems, setAllSystems] = useState([]); // <<< REMOVIDO (Vem das props)
  // const [allAttributes, setAllAttributes] = useState([]); // <<< REMOVIDO (Vem das props)

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Estado do Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (color, title, message) => setSnackbar({ open: true, color, title, message });

  // <<< 3. Simplificar fetchInitialData para buscar APENAS sod-rules >>>
  const fetchInitialData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      // Busca apenas as regras de SoD. O restante vem das props.
      const rulesResponse = await axios.get("/sod-rules", { headers: { Authorization: `Bearer ${token}` } });
      setSodRules(rulesResponse.data);

      // REMOVIDO: profilesPromise, systemsPromise, attributesPromise e Promise.all
      // REMOVIDO: setAllProfiles, setAllSystems, setAllAttributes

    } catch (error) {
      console.error("Erro ao buscar dados iniciais de SOD:", error);
      showSnackbar("error", "Erro de Rede", "Não foi possível carregar as regras de SOD.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  // Handlers do Modal (sem alterações)
  const handleOpenModal = (rule = null) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Handler de Deleção (sem alterações, fetchInitialData agora está correto)
  const handleDelete = async (ruleId) => {
    if (window.confirm("Tem certeza que deseja deletar esta regra SOD?")) {
      try {
        await axios.delete(`/sod-rules/${ruleId}`, { headers: { Authorization: `Bearer ${token}` } });
        showSnackbar("success", "Sucesso", "Regra de SOD deletada.");
        fetchInitialData(); // Recarrega (apenas as regras)
      } catch (error) {
        console.error("Erro ao deletar regra SOD:", error);
        showSnackbar("error", "Erro ao Deletar", error.response?.data?.message || "Erro inesperado.");
      }
    }
  };

  return (
    <>
      {/* Botão Adicionar e Título (sem alterações) */}
      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <MDTypography variant="h5">Gerenciar Regras de SOD</MDTypography>
        <MDButton variant="gradient" color="info" onClick={() => handleOpenModal(null)}>
          <Icon sx={{ mr: 1 }}>add</Icon>
          Adicionar Regra
        </MDButton>
      </MDBox>

      {/* Tabela SOD */}
      {/* <<< 4. Passar props recebidas para a Tabela >>> */}
      <SodTable
        loading={loadingData}
        rules={sodRules}
        resources={allResources}   // Passa a prop correta
        systems={allSystems}       // Passa a prop recebida
        attributes={allAttributes} // Passa a prop recebida
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      {/* Modal SOD */}
      {/* <<< 5. Passar props recebidas para o Modal >>> */}
      <SodModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onRefresh={fetchInitialData} // onRefresh agora só busca regras
        showSnackbar={showSnackbar}
        token={token}
        ruleToEdit={editingRule}
        // Passa todas as listas necessárias para os Autocompletes
        resources={allResources} // Passa a prop correta
        systems={allSystems}
        attributes={allAttributes}
      />

      {/* Snackbar (sem alterações) */}
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

// --- 6. Adicionar PropTypes para as novas props ---
SodTab.propTypes = {
  allSystems: PropTypes.arrayOf(PropTypes.object).isRequired,
  allResources: PropTypes.arrayOf(PropTypes.object).isRequired, // Corrigido
  allAttributes: PropTypes.arrayOf(PropTypes.object).isRequired,
};
// --- Fim da Adição ---

export default SodTab;