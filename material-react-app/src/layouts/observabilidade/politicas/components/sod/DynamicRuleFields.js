import React from "react";
import PropTypes from 'prop-types'; // <<< Adicionado
// @mui material components
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDTypography from "components/MDTypography";

// Config (para operadores)
import { comparisonOperators } from "./sodConfig";

// Componente ATUALIZADO para renderizar campos dinâmicos com operador/valor
function DynamicRuleFields({
  ruleType,
  profiles,
  systems,
  attributes,
  values, // Espera { valueASelection, valueAOperator, valueAValue, valueBSelection }
  onChange, // Handler unificado vindo do Modal
  isDisabled, // <<< 1. Recebe a nova prop
}) {

  // Função interna para renderizar os campos de Atributo (Seleção, Operador, Valor)
  const renderAttributeFields = (valueField, operatorField, valueValueField) => (
    <>
      <Grid item xs={12} sm={4}> {/* Ajuste de tamanho */}
        <Autocomplete
          options={attributes}
          getOptionLabel={(option) => option.name || ""}
          value={values[valueField]} // Ex: values.valueASelection
          onChange={(event, newValue) => onChange(valueField, newValue)}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderInput={(params) => <TextField {...params} label="Atributo *" required />}
          disabled={isDisabled} // <<< 2. Aplica a prop
        />
      </Grid>
      <Grid item xs={12} sm={3}> {/* Ajuste de tamanho */}
        <Autocomplete
          options={comparisonOperators}
          getOptionLabel={(option) => option.label || ""}
          value={values[operatorField]} // Ex: values.valueAOperator
          onChange={(event, newValue) => onChange(operatorField, newValue)}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderInput={(params) => <TextField {...params} label="Operador *" required />}
          disableClearable
          disabled={isDisabled} // <<< 2. Aplica a prop
        />
      </Grid>
      <Grid item xs={12} sm={5}> {/* Ajuste de tamanho */}
        <TextField
          label="Valor do Atributo *"
          name={valueValueField} // Ex: valueAValue
          value={values[valueValueField]} // Ex: values.valueAValue
          onChange={(e) => onChange(e.target.name, e.target.value)} // Passa nome e valor
          fullWidth
          required
          disabled={isDisabled} // <<< 2. Aplica a prop
        />
      </Grid>
    </>
  );

  // Função interna para renderizar campo de Perfil
  const renderProfileField = (valueField, label = "Perfil *") => (
    <Grid item xs={12} sm={6}>
      <Autocomplete
        options={profiles} // Recebe os perfis JÁ FILTRADOS
        getOptionLabel={(option) => option.name || ""}
        value={values[valueField]} // Ex: values.valueASelection
        onChange={(event, newValue) => onChange(valueField, newValue)}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderInput={(params) => <TextField {...params} label={label} required />}
        disabled={isDisabled} // <<< 2. Aplica a prop
      />
    </Grid>
  );

   // Função interna para renderizar campo de Sistema
   const renderSystemField = (valueField, label = "Sistema *") => (
    <Grid item xs={12} sm={6}>
      <Autocomplete
        options={systems} // Recebe os sistemas JÁ FILTRADOS
        getOptionLabel={(option) => option.name || ""}
        value={values[valueField]} // Ex: values.valueBSelection
        onChange={(event, newValue) => onChange(valueField, newValue)}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderInput={(params) => <TextField {...params} label={label} required />}
        disabled={isDisabled} // <<< 2. Aplica a prop
      />
    </Grid>
  );


  // Renderização principal baseada no ruleType
  switch (ruleType?.id) {
    case "ROLE_X_ROLE":
      return (
        <>
          {renderProfileField("valueASelection", "Perfil Conflitante A *")}
          {renderProfileField("valueBSelection", "Perfil Conflitante B *")}
        </>
      );
    case "ATTR_X_ROLE":
      return (
        <>
          {/* Campos para Atributo A (com operador e valor) */}
          {renderAttributeFields("valueASelection", "valueAOperator", "valueAValue")}
          {/* Campo para Perfil B */}
          {renderProfileField("valueBSelection", "Perfil Conflitante *")}
        </>
      );
    case "ATTR_X_SYSTEM":
      return (
        <>
          {/* Campos para Atributo A (com operador e valor) */}
          {renderAttributeFields("valueASelection", "valueAOperator", "valueAValue")}
           {/* Campo para Sistema B */}
          {renderSystemField("valueBSelection", "Sistema Conflitante *")}
        </>
      );
    // Adicionar outros cases se houver mais ruleTypes
    default:
      return (
          <Grid item xs={12}>
              <MDTypography variant="caption" color="text">
                  {/* Mensagem atualizada */}
                  Selecione um Sistema Alvo e um Tipo de Regra...
              </MDTypography>
          </Grid>
      );
  }
}

// --- 3. Adicionar PropTypes ---
DynamicRuleFields.propTypes = {
  ruleType: PropTypes.object,
  profiles: PropTypes.arrayOf(PropTypes.object).isRequired,
  systems: PropTypes.arrayOf(PropTypes.object).isRequired,
  attributes: PropTypes.arrayOf(PropTypes.object).isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool, // Nova prop
};

DynamicRuleFields.defaultProps = {
  isDisabled: false, // Valor padrão
  ruleType: null,
};
// --- Fim da Adição ---

export default DynamicRuleFields;