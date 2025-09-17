// src/layouts/administrar/usuarios/data/usersTableData.js

import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDBox from "components/MDBox";
import defaultAvatar from "assets/images/default-avatar.jpg"; // Corrigido para .png se necessário

// Componente Author (sem alterações)
function Author({ image, name }) {
  return (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image || defaultAvatar} name={name} size="sm" />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}

// --- MUDANÇA 1: O componente Action agora recebe as funções de clique como props ---
function Action({ onEdit, onDelete }) {
  return (
    <MDBox>
      <MDTypography onClick={onEdit} component="a" href="#" variant="caption" color="text" fontWeight="medium" mr={2}>
        Editar
      </MDTypography>
      <MDTypography onClick={onDelete} component="a" href="#" variant="caption" color="error" fontWeight="medium">
        Deletar
      </MDTypography>
    </MDBox>
  );
}

// --- MUDANÇA 2: A função principal agora aceita as funções de manipulação como argumentos ---
export default function data(users, handleEdit, handleDelete) {
  const columns = [
    { Header: "usuário", accessor: "user", width: "35%", align: "left" },
    { Header: "email", accessor: "email", align: "left" },
    { Header: "função", accessor: "role", align: "center" },
    { Header: "criado em", accessor: "created", align: "center" },
    { Header: "ação", accessor: "action", align: "center" },
  ];

  const rows = users.map(user => ({
    user: <Author image={user.profile_image} name={user.name} />,
    email: <MDTypography variant="caption">{user.email}</MDTypography>,
    role: <MDTypography variant="caption">{user.role}</MDTypography>,
    created: (
      <MDTypography variant="caption">
        {new Date(user.createdAt).toLocaleDateString()}
      </MDTypography>
    ),
    // --- MUDANÇA 3: Passamos as funções para o componente Action ---
    // Envolvemos em arrow functions para passar o usuário específico de cada linha.
    action: <Action onEdit={() => handleEdit(user)} onDelete={() => handleDelete(user.id)} />,
  }));

  return { columns, rows };
}