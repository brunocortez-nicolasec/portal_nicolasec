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

// Componentes RBAC customizados
import RbacTable from "./rbac/RbacTable";
import RbacModal from "./rbac/RbacModal";

// --- Componente Principal RbacTab ---
// <<< 1. Aceitar as props do GerenciarPoliticas (pai) >>>
function RbacTab({ allSystems, allProfiles, allAttributes }) {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  // <<< 2. Simplificar estados (loadingData agora é só para as regras) >>>
  const [loadingData, setLoadingData] = useState(true);
  const [rbacRules, setRbacRules] = useState([]);
  // const [allProfiles, setAllProfiles] = useState([]); // <<< REMOVIDO (Vem das props)
  // const [allAttributes, setAllAttributes] = useState([]); // <<< REMOVIDO (Vem das props)
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (color, title, message) => setSnackbar({ open: true, color, title, message });

  // <<< 3. Simplificar fetchInitialData para buscar APENAS rbac-rules >>>
  const fetchInitialData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      // Busca apenas as regras. Perfis, Sistemas e Atributos vêm das props.
      const rulesRes = await axios.get("/rbac-rules", { headers: { Authorization: `Bearer ${token}` } });
      setRbacRules(rulesRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados RBAC:", error);
      showSnackbar("error", "Erro de Rede", "Falha ao carregar regras RBAC.");
    } finally {
      setLoadingData(false);
    }
  };

  // useEffect agora só busca as regras quando o token muda.
  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  const handleOpenModal = (rule = null) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm("Tem certeza que deseja deletar esta regra RBAC?")) {
      try {
        await axios.delete(`/rbac-rules/${ruleId}`, { headers: { Authorization: `Bearer ${token}` } });
        showSnackbar("success", "Sucesso", "Regra RBAC deletada.");
        fetchInitialData(); // Recarrega (apenas as regras)
      } catch (error) {
        console.error("Erro ao deletar regra RBAC:", error);
        showSnackbar("error", "Erro ao Deletar", error.response?.data?.message || "Erro.");
      }
    }
  };

  return (
    <>
      {/* Botão Adicionar e Tabela */}
      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <MDTypography variant="h5">Gerenciar Regras de RBAC</MDTypography>
        <MDButton variant="gradient" color="info" onClick={() => handleOpenModal(null)}>
          <Icon sx={{ mr: 1 }}>add</Icon>
          Adicionar Regra
        </MDButton>
      </MDBox>

      {/* Seção da Tabela */}
      {/* <<< 4. Passar props recebidas para a Tabela >>> */}
      <RbacTable
        loading={loadingData}
        rules={rbacRules}
        profiles={allProfiles}     // Passa a prop recebida
        attributes={allAttributes} // Passa a prop recebida
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      {/* --- Modal de Criação/Edição RBAC --- */}
      {/* <<< 5. Passar TODAS as props (incluindo allSystems) para o Modal >>> */}
      <RbacModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onRefresh={fetchInitialData} // onRefresh agora só busca regras (correto)
        showSnackbar={showSnackbar}
        token={token}
        ruleToEdit={editingRule}
        systems={allSystems}       // <<< Passa a nova prop 'allSystems'
        profiles={allProfiles}     // <<< Passa a prop recebida
        attributes={allAttributes} // <<< Passa a prop recebida
      />

      {/* --- Snackbar para Notificações --- */}
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
RbacTab.propTypes = {
  allSystems: PropTypes.arrayOf(PropTypes.object).isRequired,
  allProfiles: PropTypes.arrayOf(PropTypes.object).isRequired,
  allAttributes: PropTypes.arrayOf(PropTypes.object).isRequired,
};
// --- Fim da Adição ---

export default RbacTab;