// src/layouts/observabilidade/politicas/components/RbacTab.js

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

// Componentes RBAC customizados
import RbacTable from "./rbac/RbacTable";
import RbacModal from "./rbac/RbacModal";

// --- Componente Principal RbacTab ---
function RbacTab() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  const [loadingData, setLoadingData] = useState(true);
  const [rbacRules, setRbacRules] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null); // Armazena a regra para edição
  
  const [snackbar, setSnackbar] = useState({ open: false, color: "info", title: "", message: "" });

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (color, title, message) => setSnackbar({ open: true, color, title, message });

  const fetchInitialData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const [rulesRes, profilesRes, attributesRes] = await Promise.all([
        axios.get("/rbac-rules", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/profiles", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/identity-attributes", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRbacRules(rulesRes.data);
      setAllProfiles(profilesRes.data);
      setAllAttributes(attributesRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados RBAC:", error);
      showSnackbar("error", "Erro de Rede", "Falha ao carregar dados RBAC.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  const handleOpenModal = (rule = null) => {
    setEditingRule(rule); // Define a regra a ser editada (ou null para nova)
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null); // Limpa a regra em edição
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm("Tem certeza que deseja deletar esta regra RBAC?")) {
      try {
        await axios.delete(`/rbac-rules/${ruleId}`, { headers: { Authorization: `Bearer ${token}` } });
        showSnackbar("success", "Sucesso", "Regra RBAC deletada.");
        fetchInitialData(); // Recarrega
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
      <RbacTable
        loading={loadingData}
        rules={rbacRules}
        profiles={allProfiles}
        attributes={allAttributes}
        onEdit={handleOpenModal} // Passa a função de abrir o modal
        onDelete={handleDelete}
      />

      {/* --- Modal de Criação/Edição RBAC --- */}
      {/* O Modal só é renderizado (e busca seus dados) quando necessário, 
        mas para evitar complexidade, mantemos ele montado e apenas o controlamos com 'open'.
        Se os 'allProfiles' e 'allAttributes' forem MUITO grandes, poderíamos otimizar
        para só renderizar o Modal quando 'isModalOpen' for true.
      */}
      <RbacModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onRefresh={fetchInitialData}
        showSnackbar={showSnackbar}
        token={token}
        ruleToEdit={editingRule}
        profiles={allProfiles}
        attributes={allAttributes}
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

export default RbacTab;