// src/layouts/observabilidade/politicas/components/sod/SodTable.js

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

// Configs - Importa também os operadores
import { ruleTypes, comparisonOperators } from "./sodConfig";

function SodTable({ loading, rules, profiles, systems, attributes, onEdit, onDelete }) {

  // Função helper refatorada: Retorna APENAS o nome (string) ou null/undefined
  const findItemName = (type, id) => {
      if (!type || !id) return id || 'N/A'; // Retorna ID ou N/A se não encontrar
      let list;
      let keyField = 'id';
      let idToCompare = id;

      switch (type) {
          case 'PROFILE':
              list = profiles;
              idToCompare = parseInt(id, 10);
              break;
          case 'SYSTEM':
              list = systems;
              idToCompare = parseInt(id, 10);
              break;
          case 'ATTRIBUTE':
              list = attributes;
              // id já é string
              break;
          default:
              return id; // Retorna o ID se o tipo for desconhecido
      }

      if (!Array.isArray(list)) {
          console.error(`Lista para tipo ${type} não é um array válido.`);
          return `${id} (lista inválida)`;
      }
      const found = list.find(item => item && item[keyField] === idToCompare);
      return found ? found.name : `${id} (não encontrado)`;
  };

  const sodColumns = [
    { Header: "Nome da Regra", accessor: "name", width: "15%" }, // Ajuste de largura
    {
      Header: "Tipo",
      accessor: "ruleType",
      width: "15%", // Ajuste de largura
      Cell: ({ value }) => {
        const type = ruleTypes.find(rt => rt.id === value);
        // Usar Tooltip para nomes longos
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
      Header: "Valor A",
      accessor: "valueAId",
      width: "25%", // Aumentar largura para acomodar operador/valor
      Cell: ({ row }) => {
        const { valueAType, valueAId, valueAOperator, valueAValue } = row.original;
        const nameA = findItemName(valueAType, valueAId); // Usa a função refatorada

        // Se for Atributo, formata com operador e valor
        if (valueAType === 'ATTRIBUTE') {
           const opLabel = comparisonOperators.find(op => op.id === valueAOperator)?.label || valueAOperator || '(?)';
           const displayValue = valueAValue !== null && typeof valueAValue !== 'undefined' ? `"${valueAValue}"` : '';
           return (
              <MDTypography variant="caption" title={`${nameA} ${opLabel} ${displayValue}`}> {/* Adiciona title completo */}
                 {`${nameA} ${opLabel} ${displayValue}`}
              </MDTypography>
           );
        }
        // Caso contrário, mostra apenas o nome (Perfil)
        return <MDTypography variant="caption">{nameA}</MDTypography>;
      }
    },
    {
      Header: "Valor B",
      accessor: "valueBId",
      width: "15%", // Ajuste de largura
      Cell: ({ row }) => {
        // Usa a função refatorada
        const nameB = findItemName(row.original.valueBType, row.original.valueBId);
        return <MDTypography variant="caption">{nameB}</MDTypography>;
       }
    },
    { Header: "Owner", accessor: "owner", Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>, width: "10%" }, // Ajuste de largura
    {
      Header: "Ações",
      accessor: "actions",
      align: "center",
      width: "10%",
      Cell: ({ row: { original } }) => (
        <MDBox display="flex" justifyContent="center">
          <Tooltip title="Editar">
            <IconButton onClick={() => onEdit(original)} size="small">
              <Icon>edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Deletar">
            <IconButton color="error" onClick={() => onDelete(original.id)} size="small">
              <Icon>delete</Icon>
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
          Carregando regras de SOD...
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <DataTable
      table={{ columns: sodColumns, rows: rules }}
      isSorted={true}
      entriesPerPage={true}
      showTotalEntries={true}
      canSearch={true}
      pagination={{ variant: "gradient", color: "info" }}
      tableProps={{ size: 'small' }}
      noEndBorder
    />
  );
}

export default SodTable;