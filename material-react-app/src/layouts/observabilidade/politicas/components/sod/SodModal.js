// src/layouts/observabilidade/politicas/components/sod/SodModal.js

import { useState, useEffect } from "react";
import axios from "axios";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

// Componentes Filhos e Configs ATUALIZADOS
import DynamicRuleFields from "./DynamicRuleFields";
import { initialState, ruleTypes, comparisonOperators } from "./sodConfig";

function SodModal({ open, onClose, onRefresh, showSnackbar, token, ruleToEdit, profiles, systems, attributes }) {
  const [currentRule, setCurrentRule] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);

  // useEffect (sem alterações aqui, já carrega os dados)
  useEffect(() => {
    if (open) {
      if (ruleToEdit) {
        setIsEditing(true);
        const type = ruleTypes.find(t => t.id === ruleToEdit.ruleType) || ruleTypes[0];
        let loadedValueA = null;
        let loadedOperatorA = comparisonOperators[0];
        let loadedValueValueA = "";
        let loadedValueB = null;

        if (ruleToEdit.valueAType === 'PROFILE' && profiles) {
          loadedValueA = profiles.find(p => p.id === parseInt(ruleToEdit.valueAId, 10));
        } else if (ruleToEdit.valueAType === 'ATTRIBUTE' && attributes) {
          loadedValueA = attributes.find(a => a.id === ruleToEdit.valueAId);
          loadedOperatorA = comparisonOperators.find(op => op.id === ruleToEdit.valueAOperator) || comparisonOperators[0];
          loadedValueValueA = ruleToEdit.valueAValue || "";
        }

        if (ruleToEdit.valueBType === 'PROFILE' && profiles) {
          loadedValueB = profiles.find(p => p.id === parseInt(ruleToEdit.valueBId, 10));
        } else if (ruleToEdit.valueBType === 'SYSTEM' && systems) {
          loadedValueB = systems.find(s => s.id === parseInt(ruleToEdit.valueBId, 10));
        } else if (ruleToEdit.valueBType === 'ATTRIBUTE' && attributes) {
          loadedValueB = attributes.find(a => a.id === ruleToEdit.valueBId);
        }

        setCurrentRule({
          id: ruleToEdit.id,
          name: ruleToEdit.name,
          description: ruleToEdit.description || "",
          areaNegocio: ruleToEdit.areaNegocio || "",
          processoNegocio: ruleToEdit.processoNegocio || "",
          owner: ruleToEdit.owner || "",
          ruleType: type,
          valueASelection: loadedValueA || null,
          valueAOperator: loadedOperatorA,
          valueAValue: loadedValueValueA,
          valueBSelection: loadedValueB || null,
        });
      } else {
        setIsEditing(false);
        setCurrentRule(initialState);
      }
    }
  }, [open, ruleToEdit, profiles, systems, attributes]);

  const handleClose = () => {
    setCurrentRule(initialState);
    onClose();
  };

  // Handler unificado (sem alterações)
  const handleFormChange = (fieldName, newValue) => {
    setCurrentRule((prev) => {
      const newState = { ...prev, [fieldName]: newValue };
      if (fieldName === 'ruleType') {
        newState.valueASelection = null;
        newState.valueAOperator = comparisonOperators[0];
        newState.valueAValue = "";
        newState.valueBSelection = null;
      }
      if (fieldName === 'valueASelection' && newState.ruleType?.id === 'ROLE_X_ROLE') {
         newState.valueAOperator = comparisonOperators[0];
         newState.valueAValue = "";
      }
      return newState;
    });
  };

  // --- Handler de Submit CORRIGIDO ---
  const handleSubmit = async () => {
    const { id, name, description, areaNegocio, processoNegocio, owner,
            ruleType, valueASelection, valueAOperator, valueAValue, valueBSelection
          } = currentRule;

    // Validação básica
    if (!name || !ruleType || !valueASelection || !valueBSelection) {
      showSnackbar("warning", "Campos Obrigatórios", "Nome, Tipo e as duas seleções principais são obrigatórios.");
      return;
    }

    // Determina o tipo de Valor A com base no Tipo de Regra selecionado
    let valueAType = '';
    if (ruleType.id === 'ROLE_X_ROLE') valueAType = 'PROFILE';
    else if (ruleType.id === 'ATTR_X_ROLE' || ruleType.id === 'ATTR_X_SYSTEM') valueAType = 'ATTRIBUTE';
    // Adicionar outros 'else if' se houver mais tipos de regra

    // Validação adicional se valueA for atributo
    if (valueAType === 'ATTRIBUTE' && (!valueAOperator || !valueAValue.trim())) {
        showSnackbar("warning", "Campos Obrigatórios", "Para regras com Atributo A, o Operador e o Valor do Atributo são obrigatórios.");
        return;
    }

    // --- PAYLOAD CORRIGIDO ---
    // Constrói o payload base
    const payload = {
      name, description, areaNegocio, processoNegocio, owner,
      ruleTypeId: ruleType.id,
      valueA: valueASelection, // Objeto {id, name}
      valueB: valueBSelection, // Objeto {id, name}
      // Inicializa os campos opcionais como null ou undefined (não serão enviados se não forem preenchidos)
      valueAOperator: undefined,
      valueAValue: undefined,
    };

    // Adiciona operador e valor SE valueAType for ATTRIBUTE
    if (valueAType === 'ATTRIBUTE') {
        payload.valueAOperator = valueAOperator?.id; // Envia o ID do operador
        payload.valueAValue = valueAValue;          // Envia o valor
    }
    // -------------------------

    try {
      if (isEditing) {
        await axios.patch(`/sod-rules/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("/sod-rules", payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      showSnackbar("success", "Sucesso", `Regra SOD ${isEditing ? 'atualizada' : 'criada'}.`);
      handleClose();
      onRefresh();

    } catch (error) {
      console.error("Erro ao salvar regra SOD:", error);
      // O tratamento de erro já deve mostrar a mensagem correta do backend
      const frontendErrorMessage = error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("Condição");
      let displayMessage = "Ocorreu um erro inesperado.";

      if (frontendErrorMessage) {
        displayMessage = error.message;
      } else if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        displayMessage = typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage);
      }

      showSnackbar("error", "Erro ao Salvar", displayMessage);
    }
  };

  // --- O RESTANTE DO MODAL (return) ---
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditing ? "Editar Regra de SOD" : "Criar Nova Regra de SOD"}</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" p={2}>
          <Grid container spacing={3}>
            {/* Campos Estáticos */}
            <Grid item xs={12}>
              <TextField label="Nome da Regra *" name="name" value={currentRule.name} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Área de negócio" name="areaNegocio" value={currentRule.areaNegocio} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Processo de negócio" name="processoNegocio" value={currentRule.processoNegocio} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Owner" name="owner" value={currentRule.owner} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descrição" name="description" value={currentRule.description} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth multiline rows={2} />
            </Grid>

            {/* Seletor de Tipo */}
            <Grid item xs={12}>
              <Autocomplete
                options={ruleTypes}
                getOptionLabel={(option) => option.label || ""}
                value={currentRule.ruleType}
                onChange={(event, newValue) => handleFormChange("ruleType", newValue)}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => <TextField {...params} label="Tipo de Regra *" required />}
                disableClearable
              />
            </Grid>

            {/* Campos Dinâmicos Renderizados */}
            <DynamicRuleFields
              ruleType={currentRule.ruleType}
              profiles={profiles}
              systems={systems}
              attributes={attributes}
              values={{
                  valueASelection: currentRule.valueASelection,
                  valueAOperator: currentRule.valueAOperator,
                  valueAValue: currentRule.valueAValue,
                  valueBSelection: currentRule.valueBSelection,
               }}
              onChange={handleFormChange}
            />

          </Grid>
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleClose} color="secondary"> Cancelar </MDButton>
        <MDButton onClick={handleSubmit} variant="gradient" color="info">
          {isEditing ? "Salvar Alterações" : "Criar Regra"}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default SodModal;