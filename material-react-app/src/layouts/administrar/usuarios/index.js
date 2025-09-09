// src/layouts/administrar/usuarios/index.js - CORRIGIDO

// Importa nosso novo layout
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import MDTypography from "components/MDTypography";

function GerenciarUsuarios() {
  const handleAddUser = () => {
    // Lógica para adicionar um novo usuário (implementaremos depois)
    alert("Função 'Adicionar Novo Usuário' a ser implementada.");
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Usuários"
      buttonText="Adicionar Usuário"
      onButtonClick={handleAddUser}
    >
      {/* O conteúdo principal da página virá aqui. */}
      {/* Por enquanto, é um placeholder. No futuro, será uma tabela de dados. */}
      <MDTypography variant="body2">
        A tabela com a lista de usuários será exibida aqui.
      </MDTypography> {/* <-- A tag aqui foi corrigida de TDTypography para MDTypography */}
    </AdminPageLayout>
  );
}

export default GerenciarUsuarios;