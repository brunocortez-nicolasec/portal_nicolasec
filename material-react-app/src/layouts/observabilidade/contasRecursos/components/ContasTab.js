// material-react-app/src/layouts/observabilidade/contasRecursos/components/ContasTab.js

import { useState, useEffect, useMemo } from "react";
import { useMaterialUIController } from "context";
import axios from "axios";

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";

function ContasTab() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState([]); // Armazenará as contas da API

  // (Lógica de fetch, delete, e modais será adicionada aqui)

  useEffect(() => {
    // Simula o carregamento (removeremos isso quando o backend estiver pronto)
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);


  // Definição das colunas da tabela
  const columns = useMemo(() => [
    {
      Header: "Login (ID no Sistema)",
      accessor: "login",
      Cell: ({ value }) => <MDTypography variant="caption" fontWeight="medium">{value}</MDTypography>
    },
    {
      Header: "Identidade (RH)",
      accessor: "identity",
      Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>
    },
    {
      Header: "Sistema",
      accessor: "system",
      align: "center",
      Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>
    },
    {
      Header: "Ações",
      accessor: "actions",
      align: "center",
      disableSortBy: true,
      Cell: () => (
        <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 1 }}>
          <Tooltip title="Gerenciar Acessos (Assignment)">
            <MDTypography component="a" color="dark" sx={{ cursor: 'pointer' }}>
              <Icon fontSize="small">fact_check</Icon>
            </MDTypography>
          </Tooltip>
          <Tooltip title="Editar">
            <MDTypography component="a" color="info" sx={{ cursor: 'pointer' }}>
              <Icon fontSize="small">edit</Icon>
            </MDTypography>
          </Tooltip>
          <Tooltip title="Excluir">
            <MDTypography component="a" color="error" sx={{ cursor: 'pointer' }}>
              <Icon fontSize="small">delete</Icon>
            </MDTypography>
          </Tooltip>
        </MDBox>
      )
    },
  ], []);

  // Dados de placeholder (removeremos isso)
  const rows = useMemo(() => [
    { login: "joao.silva", identity: "João Silva (MAT100)", system: "Active Directory" },
    { login: "JSILVA_SAP", identity: "João Silva (MAT100)", system: "SAP" },
    { login: "ana.paula", identity: "Ana Paula (MAT101)", system: "Active Directory" },
  ], []);


  return (
    <MDBox pt={3} pb={2} px={2}>
      <MDBox display="flex" justifyContent="flex-end" mb={2}>
        <MDButton variant="gradient" color="info">
          <Icon sx={{ fontWeight: "bold" }}>add</Icon>
          &nbsp;Adicionar Conta
        </MDButton>
      </MDBox>
      <DataTable
        table={{ columns, rows }}
        isSorted={true}
        entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
        showTotalEntries
        noEndBorder
        canSearch
        isLoading={isLoading}
      />
      {/* (O modal de Adicionar/Editar Conta será adicionado aqui) */}
    </MDBox>
  );
}

export default ContasTab;