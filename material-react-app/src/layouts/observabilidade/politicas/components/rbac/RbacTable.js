// src/layouts/observabilidade/politicas/components/rbac/RbacTable.js

import React from "react";

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

function RbacTable({ loading, rules, profiles, attributes, onEdit, onDelete }) {
  const getConditionDisplay = (rule) => {
    switch (rule.conditionType) {
      case "BY_PROFILE":
        const reqProfileName = profiles.find((p) => p.id === rule.requiredProfileId)?.name;
        return `Requer Perfil: ${reqProfileName || `(ID: ${rule.requiredProfileId})`}`;
      case "BY_SINGLE_ATTRIBUTE":
        const attrName = attributes.find((a) => a.id === rule.requiredAttributeId)?.name || rule.requiredAttributeId;
        const opLabelSingle =
          comparisonOperators.find((op) => op.id === rule.requiredAttributeOperator)?.label ||
          rule.requiredAttributeOperator;
        return `Atributo: ${attrName} ${opLabelSingle} "${rule.requiredAttributeValue}"`;
      case "BY_MULTIPLE_ATTRIBUTES":
        if (!Array.isArray(rule.attributeConditions) || rule.attributeConditions.length === 0)
          return "(Nenhuma condição)";
        const logicLabel = logicalOperators.find((lo) => lo.id === rule.logicalOperator)?.id || "E";
        return rule.attributeConditions
          .map((cond) => {
            const attrNameCond = attributes.find((a) => a.id === cond.attributeId)?.name || cond.attributeId;
            const opLabelMulti = comparisonOperators.find((op) => op.id === cond.operator)?.label || cond.operator;
            return `(${attrNameCond} ${opLabelMulti} "${cond.attributeValue}")`;
          })
          .join(` ${logicLabel} `);
      default:
        return "(Condição desconhecida)";
    }
  };

  const rbacColumns = [
    { Header: "Nome da Regra", accessor: "name", width: "20%" },
    {
      Header: "Tipo Condição",
      accessor: "conditionType",
      Cell: ({ value }) => conditionTypes.find((ct) => ct.id === value)?.label || value,
    },
    {
      Header: "Condição",
      accessor: "conditionDisplay",
      Cell: ({ row }) => getConditionDisplay(row.original),
      width: "35%",
    },
    {
      Header: "Perfil Concedido",
      accessor: "grantedProfile.name",
      Cell: ({ value }) => value || "(inválido)",
    },
    { Header: "Owner", accessor: "owner", Cell: ({ value }) => value || "N/A", width: "10%" },
    {
      Header: "Ações",
      accessor: "actions",
      align: "center",
      width: "10%",
      Cell: ({ row: { original } }) => (
        <MDBox>
          <Tooltip title="Editar">
            <IconButton onClick={() => onEdit(original)}>
              {" "}
              <Icon>edit</Icon>{" "}
            </IconButton>
          </Tooltip>
          <Tooltip title="Deletar">
            <IconButton color="error" onClick={() => onDelete(original.id)}>
              {" "}
              <Icon>delete</Icon>{" "}
            </IconButton>
          </Tooltip>
        </MDBox>
      ),
    },
  ];

  if (loading) {
    return (
      <MDBox p={3} sx={{ textAlign: "center" }}>
        <CircularProgress color="info" />
        <MDTypography variant="body2" color="text" sx={{ mt: 2 }}>
          {" "}
          Carregando regras RBAC...{" "}
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
    />
  );
}

export default RbacTable;