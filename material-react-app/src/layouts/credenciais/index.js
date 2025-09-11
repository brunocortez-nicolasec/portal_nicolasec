// src/layouts/credenciais/index.js - VERSÃO DINÂMICA

import { useState, useEffect } from "react";
import axios from "axios";

// Componentes do template
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert";

// Nossos outros componentes
import CredentialModal from "./components/CredentialModal";
// O import do 'credentialsTableData' estático não é mais necessário aqui

function Credenciais() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NOVO: Estado para os dados da tabela ---
  const [tableData, setTableData] = useState({ columns: [], rows: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const portalToken = localStorage.getItem("token");
        const api = axios.create({ headers: { Authorization: `Bearer ${portalToken}` } });

        // Não precisamos mais guardar o token do Conjur no estado,
        // pois o backend cuidará disso a cada requisição.

        // 1. Busca os dados das políticas do Conjur através do nosso backend
        const response = await api.get("http://localhost:8080/conjur/policies");
        const policies = response.data; // Supondo que a resposta seja um array de políticas

        // 2. Formata os dados para a tabela (temporário, como pediu)
        const columns = [
          { Header: "ID da Política", accessor: "id", width: "70%", align: "left" },
          { Header: "Criado em", accessor: "created_at", align: "left" },
        ];
        const rows = policies.map(policy => ({
          id: <MDTypography variant="button" fontWeight="medium">{policy.id}</MDTypography>,
          created_at: <MDTypography variant="caption">{new Date(policy.created_at).toLocaleString()}</MDTypography>,
        }));

        setTableData({ columns, rows });

      } catch (err) {
        setError("Falha ao carregar dados do Conjur. Verifique o log do backend.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveCredential = (data) => {
    console.log("Dados recebidos do modal:", data);
    // Lógica para salvar a nova credencial usando o token que o backend gera
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <MDBox p={3} textAlign="center">
          <MDTypography>Carregando políticas do Conjur...</MDTypography>
        </MDBox>
      );
    }
    if (error) {
      return (
        <MDBox p={3}>
          <MDAlert color="error">{error}</MDAlert>
        </MDBox>
      );
    }
    return (
      <>
        <DataTable
          table={tableData}
          isSorted={false}
          entriesPerPage={false}
          showTotalEntries={false}
          noEndBorder
        />
        <CredentialModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCredential}
        />
      </>
    );
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Credenciais"
      buttonText="Adicionar Credencial"
      onButtonClick={handleOpenModal}
    >
      {renderContent()}
    </AdminPageLayout>
  );
}

export default Credenciais;


