// src/layouts/credenciais/data/credentialsTableData.js

import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";

// Componente para a coluna de Ação
function Action() {
  return (
    <MDBox>
      <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium" mr={2}>
        Edit
      </MDTypography>
      <MDTypography component="a" href="#" variant="caption" color="error" fontWeight="medium">
        Delete
      </MDTypography>
    </MDBox>
  );
}

// Dados estáticos de exemplo
const sampleData = [
    { name: "API Gateway", credential: "api_key", value: "**********xyz" },
    { name: "Banco de Dados Produção", credential: "db_user_prod", value: "**********" },
    { name: "Servidor SMTP", credential: "smtp_user", value: "**********" },
];

export default function data() {
  const columns = [
    { Header: "nome da conta", accessor: "name", width: "40%", align: "left" },
    { Header: "credencial", accessor: "credential", align: "left" },
    { Header: "valor", accessor: "value", align: "left" },
    { Header: "ação", accessor: "action", align: "center" },
  ];

  const rows = sampleData.map(item => ({
    name: <MDTypography variant="button" fontWeight="medium">{item.name}</MDTypography>,
    credential: <MDTypography variant="caption">{item.credential}</MDTypography>,
    value: <MDTypography variant="caption">{item.value}</MDTypography>,
    action: <Action />,
  }));

  return { columns, rows };
}