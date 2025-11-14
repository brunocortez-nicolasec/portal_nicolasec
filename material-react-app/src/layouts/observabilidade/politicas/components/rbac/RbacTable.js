// material-react-app/src/layouts/observabilidade/politicas/components/rbac/RbacTable.js

import React from "react";
import PropTypes from 'prop-types'; // <<< Adicionado para PropTypes

// @mui material components
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DataTable from "examples/Tables/DataTable";

// Configs
import { conditionTypes, comparisonOperators, logicalOperators } from "./rbacConfig";

// ======================= INÍCIO DA CORREÇÃO (Props) =======================
// 1. A prop 'profiles' foi renomeada para 'resources'
function RbacTable({ loading, rules, resources, attributes, onEdit, onDelete }) {
// ======================== FIM DA CORREÇÃO (Props) =========================

  // A função getConditionDisplay não precisa de alterações,
  // pois 'profiles' e 'attributes' são as listas completas vindas do componente pai.
  const getConditionDisplay = (rule) => {
    switch (rule.conditionType) {
// ======================= INÍCIO DA CORREÇÃO (Lógica) =======================
      case "BY_PROFILE": { // Adicionado chaves para escopo
        // 2. Usa 'resources' e 'requiredResourceId'
        const reqProfileName = resources.find((p) => p.id === rule.requiredResourceId)?.name_resource;
        return `Requer Recurso: ${reqProfileName || `(ID: ${rule.requiredResourceId})`}`;
      }
// ======================== FIM DA CORREÇÃO (Lógica) =========================
      case "BY_SINGLE_ATTRIBUTE": {
        const attrName = attributes.find((a) => a.id === rule.attributeName)?.name || rule.attributeName; // Corrigido
        const opLabelSingle =
          comparisonOperators.find((op) => op.id === rule.attributeOperator)?.label ||
          rule.attributeOperator || '(?)'; // Fallback
        return `Atributo: ${attrName} ${opLabelSingle} "${rule.attributeValue}"`;
      }
      case "BY_MULTIPLE_ATTRIBUTES": {
        if (!Array.isArray(rule.attributeConditions) || rule.attributeConditions.length === 0)
          return "(Nenhuma condição)";
        const logicLabel = logicalOperators.find((lo) => lo.id === rule.logicalOperator)?.id || "E";
        return rule.attributeConditions
          .map((cond) => {
            const attrNameCond = attributes.find((a) => a.id === cond.attributeName)?.name || cond.attributeName; // Corrigido
            const opLabelMulti = comparisonOperators.find((op) => op.id === cond.operator)?.label || cond.operator || '(?)'; // Fallback
            return `(${attrNameCond} ${opLabelMulti} "${cond.attributeValue}")`;
          })
          .join(` ${logicLabel} `);
        }
      default:
        return "(Condição desconhecida)";
    }
  };

  // --- 1. Definição de Colunas ATUALIZADA ---
  const rbacColumns = [
    { Header: "Nome da Regra", accessor: "name", width: "15%" }, // Largura ajustada
// ======================= INÍCIO DA CORREÇÃO (Colunas) =======================
    { 
      Header: "Sistema", 
      accessor: "system.name_system", // 3. Corrigido para 'name_system'
      width: "15%",
      Cell: ({ value }) => <MDTypography variant="caption">{value || '(Inválido)'}</MDTypography>
    },
// ======================== FIM DA CORREÇÃO (Colunas) =========================
    {
      Header: "Tipo Condição",
      accessor: "conditionType",
      width: "15%", // Largura ajustada
      Cell: ({ value }) => {
          const type = conditionTypes.find((ct) => ct.id === value);
           return (
             <Tooltip title={type?.label || value}>
                 <MDTypography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                     {type?.label || value}
                 </MDTypography>
             </Tooltip>
           );
       }
    },
    {
      Header: "Condição",
      accessor: "conditionDisplay",
      Cell: ({ row }) => getConditionDisplay(row.original),
      width: "30%", // Largura ajustada
    },
// ======================= INÍCIO DA CORREÇÃO (Colunas) =======================
    {
      Header: "Recurso Concedido", // Corrigido
      accessor: "grantedResource.name_resource", // 4. Corrigido
      width: "15%", // Largura ajustada
      Cell: ({ value }) => <MDTypography variant="caption">{value || '(Inválido)'}</MDTypography>, // Padronizado
    },
// ======================== FIM DA CORREÇÃO (Colunas) =========================
    { Header: "Owner", accessor: "owner", Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>, width: "10%" }, // Padronizado
    {
      Header: "Ações",
      accessor: "actions",
      align: "center",
      width: "10%",
      Cell: ({ row: { original } }) => (
        <MDBox display="flex" justifyContent="center"> {/* Padronizado */}
          <Tooltip title="Editar">
            <IconButton onClick={() => onEdit(original)} size="small"> {/* Padronizado */}
              <Icon>edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Deletar">
            <IconButton color="error" onClick={() => onDelete(original.id)} size="small"> {/* Padronizado */}
              <Icon>delete</Icon>
            </IconButton>
          </Tooltip>
        </MDBox>
      ),
    },
  ];
  // --- Fim da Modificação ---


  if (loading) {
    return (
      <MDBox p={3} sx={{ textAlign: "center" }}>
        <CircularProgress color="info" />
        <MDTypography variant="body2" color="text" sx={{ mt: 2 }}>
          Carregando regras RBAC...
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <DataTable
      table={{ columns: rbacColumns, rows: rules }}
      isSorted={true}
      entriesPerPage={true}
      showTotalEntries={true}
      canSearch={true}
      pagination={{ variant: "gradient", color: "info" }}
      tableProps={{ size: 'small' }} // Sugestão para tabela mais compacta
      noEndBorder // Sugestão
    />
  );
}

// --- 2. Adicionar PropTypes ---
// ======================= INÍCIO DA CORREÇÃO (PropTypes) =======================
RbacTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  rules: PropTypes.arrayOf(PropTypes.object).isRequired,
  resources: PropTypes.arrayOf(PropTypes.object).isRequired, // 5. Corrigido
  attributes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
// ======================== FIM DA CORREÇÃO (PropTypes) =========================
// --- Fim da Adição ---

export default RbacTable;