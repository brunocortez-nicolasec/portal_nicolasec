// src/layouts/observabilidade/politicas/components/rbac/DynamicConditionFields.js

import React from "react";
// @mui material components
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete"; // <- O componente correto
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
// Removendo imports desnecessários
// import Select from "@mui/material/Select";
// import FormControl from "@mui/material/FormControl";
// import InputLabel from "@mui/material/InputLabel";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDTypography from "components/MDTypography";

// Importa as configs
import { comparisonOperators, logicalOperators } from "./rbacConfig";

// Componente para campos dinâmicos
function DynamicConditionFields({
  conditionType,
  profiles,
  attributes,
  values,
  onChange,
  onSingleAttrChange,
  onListChange,
  onAddCondition,
  onRemoveCondition,
}) {
  switch (conditionType?.id) {
    case "BY_PROFILE":
      return (
        <Grid item xs={12}>
          <Autocomplete
            options={profiles}
            getOptionLabel={(option) => option.name || ""}
            value={values.requiredProfile}
            onChange={(event, newValue) => onChange(event, "requiredProfile", newValue)}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => <TextField {...params} label="Perfil Requerido *" required />}
          />
        </Grid>
      );
    case "BY_SINGLE_ATTRIBUTE":
      return (
        <>
          <Grid item xs={12} sm={5}>
            <Autocomplete
              options={attributes}
              getOptionLabel={(option) => option.name || ""}
              value={values.singleAttributeCondition.attribute}
              onChange={(event, newValue) => onSingleAttrChange("attribute", newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => (
                <TextField {...params} label="Atributo Requerido *" required />
              )}
            />
          </Grid>

          {/* --- CORREÇÃO APLICADA AQUI --- */}
          {/* Trocado para Autocomplete para padronização visual */}
          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={comparisonOperators}
              getOptionLabel={(option) => option.label || ""}
              value={values.singleAttributeCondition.operator}
              onChange={(event, newValue) => onSingleAttrChange("operator", newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Operador *" required />}
              disableClearable // Garante que nunca fique vazio
            />
          </Grid>
          {/* --- FIM DA CORREÇÃO --- */}

          <Grid item xs={12} sm={4}>
            <TextField
              label="Valor do Atributo *"
              value={values.singleAttributeCondition.value}
              onChange={(e) => onSingleAttrChange("value", e.target.value)}
              fullWidth
              required
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
              renderInput={(params) => <TextField {...params} label="Lógica das Condições *" required />}
              disableClearable
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
                  options={attributes}
                  getOptionLabel={(option) => option.name || ""}
                  value={condition.attribute}
                  onChange={(event, newValue) => onListChange(index, "attribute", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => (
                    <TextField {...params} label={`Atributo ${index + 1} *`} required />
                  )}
                  sx={{ width: { xs: "100%", sm: "calc(35% - 8px)" } }}
                />

                {/* --- CORREÇÃO APLICADA AQUI --- */}
                {/* Trocado para Autocomplete para padronização visual */}
                <Autocomplete
                  options={comparisonOperators}
                  getOptionLabel={(option) => option.label || ""}
                  value={condition.operator}
                  onChange={(event, newValue) => onListChange(index, "operator", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => <TextField {...params} label="Operador *" required />}
                  disableClearable // Garante que nunca fique vazio
                  sx={{ width: { xs: "100%", sm: "calc(25% - 8px)" } }}
                />
                {/* --- FIM DA CORREÇÃO --- */}

                <TextField
                  label={`Valor ${index + 1} *`}
                  value={condition.value}
                  onChange={(e) => onListChange(index, "value", e.target.value)}
                  required
                  sx={{ width: { xs: "calc(100% - 40px)", sm: "calc(40% - 12px)" } }}
                />
                <Tooltip title="Remover Condição">
                  <IconButton
                    onClick={() => onRemoveCondition(index)}
                    color="error"
                    size="small"
                    disabled={values.attributeConditions.length <= 1}
                    sx={{ width: "40px" }}
                  >
                    <Icon>remove_circle_outline</Icon>
                  </IconButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<Icon>add</Icon>} onClick={onAddCondition} size="small">
            {" "}
            Adicionar Condição{" "}
          </Button>
        </Grid>
      );
    default:
      return (
        <Grid item xs={12}>
          <MDTypography variant="caption" color="text">
            {" "}
            Selecione um Tipo...
          </MDTypography>
        </Grid>
      );
  }
}

export default DynamicConditionFields;