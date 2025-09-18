import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDBox from "components/MDBox";
import defaultAvatar from "assets/images/default-avatar.jpg";

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
    
    // --- MUDANÇA PRINCIPAL AQUI ---
    // Acessamos user.role.name para obter o nome da função.
    // O '?.' (optional chaining) previne erros se a 'role' for nula.
    role: <MDTypography variant="caption">{user.role?.name || "Sem função"}</MDTypography>,
    
    created: (
      <MDTypography variant="caption">
        {new Date(user.createdAt).toLocaleDateString()}
      </MDTypography>
    ),
    action: <Action onEdit={() => handleEdit(user)} onDelete={() => handleDelete(user.id)} />,
  }));

  return { columns, rows };
}