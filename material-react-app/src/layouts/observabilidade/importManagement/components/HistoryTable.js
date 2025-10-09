// material-react-app/src/layouts/observabilidade/importManagement/components/HistoryTable.js

import React from "react";
import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import DataTable from "examples/Tables/DataTable";

// Mapeamento de status para cores e texto
const statusMap = {
  SUCCESS: { text: "SUCESSO", color: "success" },
  FAILED: { text: "FALHA", color: "error" },
  PENDING: { text: "PENDENTE", color: "warning" },
  PROCESSING: { text: "PROCESSANDO", color: "info" },
};

function HistoryTable({ history, isLoading, onOpenDetails, onOpenDelete }) {
  const { columns, rows } = {
    columns: [
      { Header: "Status", accessor: "status", width: "10%", align: "center" },
      { Header: "Destino", accessor: "sistema", align: "left" },
      { Header: "Arquivo", accessor: "arquivo", align: "left" },
      { Header: "Data", accessor: "data", align: "center" },
      { Header: "Usuário", accessor: "usuario", align: "center" },
      { Header: "Registros", accessor: "registros", align: "center" },
      { Header: "Ações", accessor: "acoes", align: "center" },
    ],
    rows: history.map(log => ({
      status: (
        <MDBadge 
          badgeContent={statusMap[log.status]?.text || log.status} 
          color={statusMap[log.status]?.color || "secondary"} 
          size="sm" 
          container 
        />
      ),
      sistema: <MDTypography variant="caption">{log.targetSystem}</MDTypography>,
      arquivo: <MDTypography variant="caption" fontWeight="medium">{log.fileName}</MDTypography>,
      data: <MDTypography variant="caption">{new Date(log.createdAt).toLocaleString('pt-BR')}</MDTypography>,
      usuario: <MDTypography variant="caption">{log.user?.name || "N/A"}</MDTypography>,
      registros: <MDTypography variant="caption">{`${log.processedRows} / ${log.totalRows}`}</MDTypography>,
      acoes: (
        <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 2 }}>
          <MDTypography component="a" color="text" sx={{ cursor: "pointer" }} onClick={() => onOpenDetails(log)}>
            <Icon>visibility</Icon>
          </MDTypography>
          <MDTypography component="a" color="error" sx={{ cursor: "pointer" }} onClick={() => onOpenDelete(log.id)}>
            <Icon>delete</Icon>
          </MDTypography>
        </MDBox>
      )
    }))
  };

  return (
    <Grid item xs={12} sx={{ mt: 3 }}>
      <Card>
        <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info">
          <MDTypography variant="h6" color="white">Histórico de Importações</MDTypography>
        </MDBox>
        <MDBox pt={3}>
          <DataTable 
            table={{ columns, rows }} 
            isSorted={false} 
            entriesPerPage={{ defaultValue: 10, entries: [5, 10, 20] }} 
            showTotalEntries 
            noEndBorder 
            canSearch 
            isLoading={isLoading}
          />
        </MDBox>
      </Card>
    </Grid>
  );
}

HistoryTable.propTypes = {
  history: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  onOpenDetails: PropTypes.func.isRequired,
  onOpenDelete: PropTypes.func.isRequired,
};

HistoryTable.defaultProps = {
  isLoading: false,
};

export default HistoryTable;