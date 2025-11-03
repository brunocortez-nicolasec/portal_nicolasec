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
  isDisabled, // <<< 1. Recebe a nova prop
}) {
  switch (conditionType?.id) {
    case "BY_PROFILE":
      return (
        <Grid item xs={12}>
          <Autocomplete
            options={profiles} // Recebe os perfis JÁ FILTRADOS
            getOptionLabel={(option) => option.name || ""}
            value={values.requiredProfile}
            onChange={(event, newValue) => onChange(event, "requiredProfile", newValue)}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => <TextField {...params} label="Perfil Requerido *" required />}
            disabled={isDisabled} // <<< 2. Aplica a prop
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
              renderInput={(params) => (
                <TextField {...params} label="Atributo Requerido *" required />
              )}
              disabled={isDisabled} // <<< 2. Aplica a prop
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={comparisonOperators}
              getOptionLabel={(option) => option.label || ""}
              value={values.singleAttributeCondition.operator}
              onChange={(event, newValue) => onSingleAttrChange("operator", newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Operador *" required />}
              disableClearable
              disabled={isDisabled} // <<< 2. Aplica a prop
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Valor do Atributo *"
              value={values.singleAttributeCondition.value}
              onChange={(e) => onSingleAttrChange("value", e.target.value)}
              fullWidth
              required
              disabled={isDisabled} // <<< 2. Aplica a prop
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
              disabled={isDisabled} // <<< 2. Aplica a prop
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
                  renderInput={(params) => (
                    <TextField {...params} label={`Atributo ${index + 1} *`} required />
                  )}
                  sx={{ width: { xs: "100%", sm: "calc(35% - 8px)" } }}
                  disabled={isDisabled} // <<< 2. Aplica a prop
                />

                <Autocomplete
                  options={comparisonOperators}
                  getOptionLabel={(option) => option.label || ""}
                  value={condition.operator}
                  onChange={(event, newValue) => onListChange(index, "operator", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => <TextField {...params} label="Operador *" required />}
                  disableClearable
                  sx={{ width: { xs: "100%", sm: "calc(25% - 8px)" } }}
                  disabled={isDisabled} // <<< 2. Aplica a prop
                />

                <TextField
                  label={`Valor ${index + 1} *`}
                  value={condition.value}
                  onChange={(e) => onListChange(index, "value", e.target.value)}
                  required
                  sx={{ width: { xs: "calc(100% - 40px)", sm: "calc(40% - 12px)" } }}
                  disabled={isDisabled} // <<< 2. Aplica a prop
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
  profiles: PropTypes.arrayOf(PropTypes.object).isRequired,
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