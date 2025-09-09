// src/layouts/administrar/funcoes/index.js

// Importa o layout padrão de página administrativa
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import MDTypography from "components/MDTypography";

function GerenciarFuncoes() {

  const handleAddRole = () => {
    // Lógica para adicionar uma nova função/role (implementaremos depois)
    alert("Função 'Adicionar Nova Função' a ser implementada.");
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Funções"
      buttonText="Adicionar Função"
      onButtonClick={handleAddRole}
    >
      {/* O conteúdo principal da página virá aqui, como uma tabela de funções. */}
      <MDTypography variant="body2">
        A tabela com a lista de funções (roles) e suas permissões será exibida aqui.
      </MDTypography>
      
    </AdminPageLayout>
  );
}

export default GerenciarFuncoes;