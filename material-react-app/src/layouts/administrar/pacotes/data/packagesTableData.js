import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import { Chip } from "@mui/material";

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

export default function data(packages, handleEdit, handleDelete) {
  const columns = [
    { Header: "nome do pacote", accessor: "name", width: "40%", align: "left" },
    { Header: "plataformas inclusas", accessor: "platforms", width: "30%", align: "left" },
    { Header: "nº de usuários", accessor: "users", align: "center" },
    { Header: "ação", accessor: "action", align: "center" },
  ];

  const rows = packages.map(pkg => ({
    name: (
      <MDTypography variant="button" color="text" fontWeight="medium">
        {pkg.name}
      </MDTypography>
    ),
    platforms: (
      <MDBox sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {pkg.platforms.map(platform => (
          // --- MUDANÇA AQUI ---
          <Chip key={platform.id} label={platform.name} size="small" color="info" />
        ))}
      </MDBox>
    ),
    users: (
      <MDTypography variant="caption">
        {pkg._count.users}
      </MDTypography>
    ),
    action: <Action onEdit={() => handleEdit(pkg)} onDelete={() => handleDelete(pkg.id)} />,
  }));

  return { columns, rows };
}