// src/layouts/observabilidade/politicas/components/sod/DynamicRuleFields.js

import React from "react";
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
  onChange // Handler unificado vindo do Modal
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
        />
      </Grid>
    </>
  );

  // Função interna para renderizar campo de Perfil
  const renderProfileField = (valueField, label = "Perfil *") => (
    <Grid item xs={12} sm={6}>
      <Autocomplete
        options={profiles}
        getOptionLabel={(option) => option.name || ""}
        value={values[valueField]} // Ex: values.valueASelection
        onChange={(event, newValue) => onChange(valueField, newValue)}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderInput={(params) => <TextField {...params} label={label} required />}
      />
    </Grid>
  );

   // Função interna para renderizar campo de Sistema
   const renderSystemField = (valueField, label = "Sistema *") => (
    <Grid item xs={12} sm={6}>
      <Autocomplete
        options={systems}
        getOptionLabel={(option) => option.name || ""}
        value={values[valueField]} // Ex: values.valueBSelection
        onChange={(event, newValue) => onChange(valueField, newValue)}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderInput={(params) => <TextField {...params} label={label} required />}
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
                  Selecione um Tipo de Regra para ver os campos de comparação.
              </MDTypography>
          </Grid>
      );
  }
}

export default DynamicRuleFields;