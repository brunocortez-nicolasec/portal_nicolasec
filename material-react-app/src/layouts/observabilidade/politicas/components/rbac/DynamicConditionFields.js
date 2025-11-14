// material-react-app/src/layouts/observabilidade/politicas/components/rbac/DynamicConditionFields.js

import React from "react";
import PropTypes from 'prop-types'; // <<< Adicionado
// @mui material components
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
// import MenuItem from "@mui/material/MenuItem"; // Não é mais usado
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput"; // <-- ADICIONADO
import { useMaterialUIController } from "context"; // <-- ADICIONADO

// Importa as configs
import { comparisonOperators, logicalOperators } from "./rbacConfig";

// Componente para campos dinâmicos
function DynamicConditionFields({
  conditionType,
// ======================= INÍCIO DA CORREÇÃO (Props) =======================
  resources, // <-- Corrigido de 'profiles'
// ======================== FIM DA CORREÇÃO (Props) =========================
  attributes,
  values,
  onChange,
  onSingleAttrChange,
  onListChange,
  onAddCondition,
  onRemoveCondition,
  isDisabled, // <<< 1. Recebe a nova prop
}) {
// ======================= INÍCIO DA CORREÇÃO (Modo Escuro) =======================
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
// ======================== FIM DA CORREÇÃO (Modo Escuro) =========================

  switch (conditionType?.id) {
    case "BY_PROFILE":
      return (
        <Grid item xs={12}>
          <Autocomplete
// ======================= INÍCIO DA CORREÇÃO (Props) =======================
            options={resources} // Recebe os perfis JÁ FILTRADOS (Corrigido)
            // 3. Lê o nome do recurso e o sistema
            getOptionLabel={(option) => `${option.name_resource} (${option.system?.name_system || 'Global'})` || ""}
// ======================== FIM DA CORREÇÃO (Props) =========================
            value={values.requiredProfile}
            onChange={(event, newValue) => onChange(event, "requiredProfile", newValue)}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            disabled={isDisabled} // <<< 2. Aplica a prop
            ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
            renderInput={(params) => <MDInput {...params} label="Recurso Requerido *" required variant="outlined" />}
          />
        </Grid>
      );
    case "BY_SINGLE_ATTRIBUTE":
      return (
        <>
          <Grid item xs={12} sm={5}>
            <Autocomplete
              options={attributes} // Atributos da Identity (não filtrados por sistema)
              getOptionLabel={(option) => option.name || ""}
              value={values.singleAttributeCondition.attribute}
              onChange={(event, newValue) => onSingleAttrChange("attribute", newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              disabled={isDisabled} // <<< 2. Aplica a prop
              ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
              renderInput={(params) => (
                <MDInput {...params} label="Atributo Requerido *" required variant="outlined" />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={comparisonOperators}
              getOptionLabel={(option) => option.label || ""}
              value={values.singleAttributeCondition.operator}
              onChange={(event, newValue) => onSingleAttrChange("operator", newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              disableClearable
              disabled={isDisabled} // <<< 2. Aplica a prop
              ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
              renderInput={(params) => <MDInput {...params} label="Operador *" required variant="outlined" />}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <MDInput
              label="Valor do Atributo *"
              value={values.singleAttributeCondition.value}
              onChange={(e) => onSingleAttrChange("value", e.target.value)}
              fullWidth
              required
              disabled={isDisabled} // <<< 2. Aplica a prop
              variant="outlined"
            />
          </Grid>
        </>
      );
    case "BY_MULTIPLE_ATTRIBUTES":
      return (
        <Grid item xs={12}>
          <Grid item xs={12} md={6} sx={{ mb: 2 }}>
            <Autocomplete
              options={logicalOperators}
              getOptionLabel={(option) => option.label || ""}
              value={values.logicalOperator}
              onChange={(event, newValue) => onChange(event, "logicalOperator", newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              disableClearable
              disabled={isDisabled} // <<< 2. Aplica a prop
              ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
              renderInput={(params) => <MDInput {...params} label="Lógica das Condições *" required variant="outlined" />}
            />
          </Grid>
          <MDTypography variant="subtitle2" gutterBottom>
            Condições de Atributo
          </MDTypography>
          <List dense sx={{ width: "100%" }}>
            {values.attributeConditions.map((condition, index) => (
              <ListItem
                key={index}
                disableGutters
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}
              >
                <Autocomplete
                  options={attributes} // Atributos da Identity
                  getOptionLabel={(option) => option.name || ""}
                  value={condition.attribute}
                  onChange={(event, newValue) => onListChange(index, "attribute", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  disabled={isDisabled} // <<< 2. Aplica a prop
                  ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                  renderInput={(params) => (
                    <MDInput {...params} label={`Atributo ${index + 1} *`} required variant="outlined" />
                  )}
                  sx={{ width: { xs: "100%", sm: "calc(35% - 8px)" } }}
                />

                <Autocomplete
                  options={comparisonOperators}
                  getOptionLabel={(option) => option.label || ""}
                  value={condition.operator}
                  onChange={(event, newValue) => onListChange(index, "operator", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  disableClearable
                  disabled={isDisabled} // <<< 2. Aplica a prop
                  ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                  renderInput={(params) => <MDInput {...params} label="Operador *" required variant="outlined" />}
                  sx={{ width: { xs: "100%", sm: "calc(25% - 8px)" } }}
                />

                <MDInput
                  label={`Valor ${index + 1} *`}
                  value={condition.value}
                  onChange={(e) => onListChange(index, "value", e.target.value)}
                  required
                  disabled={isDisabled} // <<< 2. Aplica a prop
                  variant="outlined"
                  sx={{ width: { xs: "calc(100% - 40px)", sm: "calc(40% - 12px)" } }}
                />
                <Tooltip title="Remover Condição">
                  <IconButton
                    onClick={() => onRemoveCondition(index)}
                    color="error"
                    size="small"
                    disabled={values.attributeConditions.length <= 1 || isDisabled} // <<< 2. Aplica a prop
                    sx={{ width: "40px" }}
                  >
                    <Icon>remove_circle_outline</Icon>
                  </IconButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<Icon>add</Icon>} onClick={onAddCondition} size="small" disabled={isDisabled}> {/* <<< 2. Aplica a prop */}
            Adicionar Condição
          </Button>
        </Grid>
      );
    default:
      return (
        <Grid item xs={12}>
          <MDTypography variant="caption" color="text">
            {/* Mensagem atualizada para refletir a necessidade do sistema */}
            Selecione um Sistema e um Tipo de Condição...
          </MDTypography>
        </Grid>
      );
  }
}

// --- 3. Adicionar PropTypes ---
DynamicConditionFields.propTypes = {
  conditionType: PropTypes.object,
// ======================= INÍCIO DA CORREÇÃO (PropTypes) =======================
  resources: PropTypes.arrayOf(PropTypes.object).isRequired, // 4. Corrigido
// ======================== FIM DA CORREÇÃO (PropTypes) =========================
  attributes: PropTypes.arrayOf(PropTypes.object).isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSingleAttrChange: PropTypes.func.isRequired,
  onListChange: PropTypes.func.isRequired,
  onAddCondition: PropTypes.func.isRequired,
  onRemoveCondition: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool, // Nova prop
};

DynamicConditionFields.defaultProps = {
  isDisabled: false, // Valor padrão
  conditionType: null,
};
// --- Fim da Adição ---

export default DynamicConditionFields;