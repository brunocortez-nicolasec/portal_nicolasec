// material-react-app/src/layouts/observabilidade/importManagement/components/HistoryTable.js

import React, { useMemo } from "react"; // <<< ALTERAÇÃO: Adicionado 'useMemo'
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
    // <<< INÍCIO DA ALTERAÇÃO >>>
    // A definição de 'columns' e 'rows' foi reestruturada para separar os dados da renderização,
    // permitindo que o filtro de pesquisa funcione corretamente.
    const columns = useMemo(() => [
        { 
            Header: "Status", 
            accessor: "status", 
            width: "10%", 
            align: "center",
            Cell: ({ value }) => (
                <MDBadge 
                    badgeContent={statusMap[value]?.text || value} 
                    color={statusMap[value]?.color || "secondary"} 
                    size="sm" 
                    container 
                />
            )
        },
        { 
            Header: "Destino", 
            accessor: "targetSystem", // A busca agora usa este campo de texto simples
            align: "left",
            Cell: ({ value }) => <MDTypography variant="caption">{value}</MDTypography>
        },
        { 
            Header: "Arquivo", 
            accessor: "fileName", 
            align: "left",
            Cell: ({ value }) => <MDTypography variant="caption" fontWeight="medium">{value}</MDTypography>
        },
        { 
            Header: "Data", 
            accessor: "createdAt", 
            align: "center",
            Cell: ({ value }) => <MDTypography variant="caption">{new Date(value).toLocaleString('pt-BR')}</MDTypography>
        },
        { 
            Header: "Usuário", 
            accessor: "user.name", 
            align: "center",
            Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>
        },
        { 
            Header: "Registros", 
            accessor: "records", // Um accessor customizado para não quebrar a busca
            align: "center",
            Cell: ({ row: { original: log } }) => <MDTypography variant="caption">{`${log.processedRows} / ${log.totalRows}`}</MDTypography>
        },
        { 
            Header: "Ações", 
            accessor: "acoes", 
            align: "center",
            disableSortBy: true, // Ações não precisam ser ordenáveis
            Cell: ({ row: { original: log } }) => (
                <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 2 }}>
                    <MDTypography component="a" color="text" sx={{ cursor: "pointer" }} onClick={() => onOpenDetails(log)}>
                        <Icon>visibility</Icon>
                    </MDTypography>
                </MDBox>
            )
        },
    ], []);

    const rows = useMemo(() => history, [history]);
    // <<< FIM DA ALTERAÇÃO >>>

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