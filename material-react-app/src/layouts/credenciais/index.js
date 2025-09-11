// src/layouts/credenciais/index.js - VERSÃO FINAL COM INTEGRAÇÃO CONJUR

import { useState, useEffect } from "react";
import axios from "axios";

// Componentes do template
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert"; // Para mensagens de erro

// Nossos outros componentes
import credentialsTableData from "./data/credentialsTableData";
import CredentialModal from "./components/CredentialModal";

function Credenciais() {
  const { columns, rows } = credentialsTableData(); // Dados estáticos da tabela
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- NOVOS ESTADOS PARA CONTROLAR A LÓGICA DO CONJUR ---
  const [conjurToken, setConjurToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- EFEITO PARA BUSCAR O TOKEN QUANDO A PÁGINA CARREGA ---
  useEffect(() => {
    const generateConjurToken = async () => {
      try {
        const portalToken = localStorage.getItem("token"); // Token de login do nosso portal
        
        // Chama o nosso backend para ele pegar o token do Conjur
        const response = await axios.post(
          "http://localhost:8080/conjur/token", // O endpoint que criamos no backend
          {}, // Corpo da requisição vazio, pois a autenticação é via token do portal
          { headers: { Authorization: `Bearer ${portalToken}` } }
        );
        
        console.log("Token do Conjur recebido com sucesso!");
        setConjurToken(response.data.token); // Salva o token do Conjur no estado
      } catch (err) {
        console.error("Erro ao obter token do Conjur:", err);
        setError("Falha ao obter autorização do Conjur. Verifique as configurações e o log do backend.");
      } finally {
        setIsLoading(false); // Termina o carregamento, com ou sem erro
      }
    };

    generateConjurToken();
  }, []); // O array vazio [] garante que rode apenas uma vez

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveCredential = (data) => {
    // Agora temos o token do Conjur para usar aqui no futuro!
    console.log("Dados recebidos do modal:", data);
    console.log("Token do Conjur disponível:", conjurToken);
    alert("Funcionalidade de salvar no Conjur a ser implementada. Verifique o console para ver os dados.");
  };

  // --- RENDERIZAÇÃO CONDICIONAL ---
  // Mostra mensagens de carregamento ou erro antes de exibir a página principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <MDBox p={3} textAlign="center">
          <MDTypography>Obtendo autorização do Conjur...</MDTypography>
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

    // Se tudo deu certo, mostra a tabela e o modal
    return (
      <>
        <MDBox>
          <DataTable
            table={{ columns, rows }}
            isSorted={false}
            entriesPerPage={false}
            showTotalEntries={false}
            noEndBorder
          />
        </MDBox>
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