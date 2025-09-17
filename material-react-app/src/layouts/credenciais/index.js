// src/layouts/credenciais/index.js - VERSÃO COM ENVIO DE DADOS PARA O MODAL

import { useState } from "react";
import axios from "axios";
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert";
import { CircularProgress } from "@mui/material";
import CredentialModal from "./components/CredentialModal";

function Credenciais() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [error, setError] = useState(null);

  // --- MUDANÇA 1: Estado para guardar os dados das políticas ---
  const [policies, setPolicies] = useState([]);

  const handleOpenModal = async () => {
    setIsLoadingPolicies(true);
    setError(null);
    try {
      const portalToken = localStorage.getItem("token");
      const api = axios.create({ headers: { Authorization: `Bearer ${portalToken}` } });
      const response = await api.get("http://localhost:8080/conjur/policies");
      
      // --- MUDANÇA 2: Salva os dados recebidos no estado ---
      setPolicies(response.data);
      
      setIsModalOpen(true);
    } catch (err) {
      setError("Falha ao carregar dados do Conjur. Verifique o log do backend.");
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveCredential = (data) => {
    console.log("Dados recebidos do modal:", data);
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Credenciais"
      buttonText="Adicionar Credencial"
      onButtonClick={handleOpenModal}
    >
      <MDBox p={2}>
        {error && (
           <MDBox mb={2}>
            <MDAlert color="error">{error}</MDAlert>
           </MDBox>
        )}
        
        {isLoadingPolicies ? (
          <MDBox display="flex" justifyContent="flex-end">
            <CircularProgress size={24} />
          </MDBox>
        ) : (
          <MDTypography variant="body2">
            Clique em "Adicionar Credencial" para buscar as políticas e cadastrar um novo segredo.
          </MDTypography>
        )}
      </MDBox>

      {/* --- MUDANÇA 3: Passa os dados das políticas para o modal --- */}
      <CredentialModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCredential}
        policies={policies}
      />
    </AdminPageLayout>
  );
}

export default Credenciais;