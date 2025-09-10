// src/layouts/credenciais/index.js

import { useState } from "react";

// Componentes do template
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDBox from "components/MDBox";

// Nossos novos componentes
import credentialsTableData from "./data/credentialsTableData";
import CredentialModal from "./components/CredentialModal";

function Credenciais() {
  // Pega os dados estáticos da tabela
  const { columns, rows } = credentialsTableData();

  // Estado para controlar se o modal está aberto
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveCredential = (data) => {
    // Lógica para salvar a nova credencial (implementaremos depois)
    console.log("Dados recebidos do modal:", data);
    // Aqui, no futuro, você faria a chamada à API e atualizaria a tabela
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Credenciais"
      buttonText="Adicionar Credencial"
      onButtonClick={handleOpenModal} // O botão principal agora abre o modal
    >
      <MDBox>
        <DataTable
          table={{ columns, rows }}
          isSorted={false}
          entriesPerPage={false}
          showTotalEntries={false}
          noEndBorder
        />
      </MDBox>

      {/* O modal só é renderizado quando está aberto */}
      <CredentialModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCredential}
      />
    </AdminPageLayout>
  );
}

export default Credenciais;