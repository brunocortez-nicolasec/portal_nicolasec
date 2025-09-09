// src/layouts/administrar/grupos/index.js

// Importa o layout padrão de página administrativa
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import MDTypography from "components/MDTypography";

function GerenciarGrupos() {

  const handleAddGroup = () => {
    // Lógica para adicionar um novo grupo (implementaremos depois)
    alert("Função 'Adicionar Novo Grupo' a ser implementada.");
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Grupos"
      buttonText="Adicionar Grupo"
      onButtonClick={handleAddGroup}
    >
      {/* O conteúdo principal da página virá aqui, como uma tabela de grupos. */}
      <MDTypography variant="body2">
        A tabela com a lista de grupos será exibida aqui.
      </MDTypography>
      
    </AdminPageLayout>
  );
}

export default GerenciarGrupos;