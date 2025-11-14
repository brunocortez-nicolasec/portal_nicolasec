// material-react-app/src/layouts/observabilidade/politicas/components/sod/SodModal.js

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import PropTypes from 'prop-types';

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import FormHelperText from "@mui/material/FormHelperText"; 
import MDInput from "components/MDInput"; // Importar MDInput
import { useMaterialUIController } from "context"; // Importar Context

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

// Componentes Filhos e Configs ATUALIZADOS
import DynamicRuleFields from "./DynamicRuleFields";
import { initialState, ruleTypes, comparisonOperators } from "./sodConfig";

// Objeto especial para "Todos"
const ALL_SYSTEMS_OPTION = { id: null, name: "Global (Todos os Sistemas)" };

// Estado Inicial agora usa null como padrão para system
const newInitialState = {
  ...initialState,
  system: null,
};


function SodModal({ open, onClose, onRefresh, showSnackbar, token, ruleToEdit,
  resources: allResources, // Corrigido
  systems: allSystems,
  attributes: allAttributes
}) {
  
  const [controller] = useMaterialUIController(); 
  const { darkMode } = controller; 
  
  const [currentRule, setCurrentRule] = useState(newInitialState);
  const [isEditing, setIsEditing] = useState(false);
  const [filteredResources, setFilteredResources] = useState([]); // Corrigido

  const systemOptions = useMemo(() => [ALL_SYSTEMS_OPTION, ...allSystems], [allSystems]);

  // --- INÍCIO DA CORREÇÃO 1: Lógica do availableRuleTypes ---
  const availableRuleTypes = useMemo(() => {
    // Se system for "Global" (id é null), filtra regras que usam Perfil
    if (currentRule.system?.id === null) {
      return ruleTypes.filter(type => !type.id.includes('ROLE'));
    }
    // Se system for null (nenhum selecionado) ou um sistema específico, mostra todos os tipos
    // (O DynamicRuleFields ficará desabilitado se system for null)
    return ruleTypes;
  }, [currentRule.system]);
  // --- FIM DA CORREÇÃO 1 ---


  // --- INÍCIO DA CORREÇÃO 2: Dependências do useEffect ---
  useEffect(() => {
    if (open) {
      if (ruleToEdit) {
        setIsEditing(true);

        const system = ruleToEdit.systemId === null
          ? ALL_SYSTEMS_OPTION
          : allSystems.find(s => s.id === ruleToEdit.systemId) || null;

        // Filtra perfis ANTES de definir o estado
        const resourcesForThisSystem = (system && system.id !== null)
            ? allResources.filter(r => r.systemId === system.id) // Corrigido
            : [];
        setFilteredResources(resourcesForThisSystem); // Corrigido
        
        // Define os tipos de regra disponíveis para a regra carregada
        const currentAvailableRuleTypes = (system && system.id === null)
            ? ruleTypes.filter(type => !type.id.includes('ROLE'))
            : ruleTypes;

        let type = currentAvailableRuleTypes.find(t => t.id === ruleToEdit.ruleType);
        if (!type) {
            type = currentAvailableRuleTypes[0] || ruleTypes[0];
        }

        let loadedValueA = null;
        let loadedOperatorA = comparisonOperators[0];
        let loadedValueValueA = "";
        let loadedValueB = null;

        if (ruleToEdit.valueAType === 'PROFILE' && resourcesForThisSystem.length > 0) {
          loadedValueA = resourcesForThisSystem.find(p => p.id === parseInt(ruleToEdit.valueAId, 10)); // Corrigido
        } else if (ruleToEdit.valueAType === 'ATTRIBUTE') {
          loadedValueA = allAttributes.find(a => a.id === ruleToEdit.valueAId);
          loadedOperatorA = comparisonOperators.find(op => op.id === ruleToEdit.valueAOperator) || comparisonOperators[0];
          loadedValueValueA = ruleToEdit.valueAValue || "";
        }

        if (ruleToEdit.valueBType === 'PROFILE' && resourcesForThisSystem.length > 0) {
          loadedValueB = resourcesForThisSystem.find(p => p.id === parseInt(ruleToEdit.valueBId, 10)); // Corrigido
        } else if (ruleToEdit.valueBType === 'SYSTEM') {
          loadedValueB = allSystems.find(s => s.id === parseInt(ruleToEdit.valueBId, 10));
        }

        setCurrentRule({
          id: ruleToEdit.id,
          name: ruleToEdit.name,
          description: ruleToEdit.description || "",
          areaNegocio: ruleToEdit.areaNegocio || "",
          processoNegocio: ruleToEdit.processoNegocio || "",
          owner: ruleToEdit.owner || "",
          system: system,
          ruleType: type,
          valueASelection: loadedValueA || null,
          valueAOperator: loadedOperatorA,
          valueAValue: loadedValueValueA,
          valueBSelection: loadedValueB || null,
        });
      } else {
        setIsEditing(false);
        setCurrentRule(newInitialState);
        setFilteredResources([]); // Corrigido
      }
    }
  // Lista de dependências reduzida para evitar re-execução indesejada
  }, [open, ruleToEdit, allResources, allSystems, allAttributes]); // Corrigido
  // --- FIM DA CORREÇÃO 2 ---


  const handleClose = () => {
    setCurrentRule(newInitialState);
    setFilteredResources([]); // Corrigido
    onClose();
  };


  const handleFormChange = (fieldName, newValue) => {
    setCurrentRule((prev) => {
      const newState = { ...prev, [fieldName]: newValue };

      if (fieldName === 'system') {
        const isGlobal = newValue?.id === null; // True para "Todos"
        
        const resourcesForThisSystem = (newValue && !isGlobal)
          ? allResources.filter(p => p.systemId === newValue.id) // Corrigido
          : [];
        setFilteredResources(resourcesForThisSystem); // Corrigido
        
        // A lógica do 'availableRuleTypes' (useMemo) vai rodar no re-render,
        // mas precisamos definir o *novo* tipo de regra aqui.
        const newAvailableRuleTypes = isGlobal
          ? ruleTypes.filter(type => !type.id.includes('ROLE'))
          : ruleTypes; // Se newValue for null (limpo) ou um sistema, mostra todos
        
        newState.ruleType = newAvailableRuleTypes[0] || null;

        newState.valueASelection = null;
        newState.valueAOperator = comparisonOperators[0];
        newState.valueAValue = "";
        newState.valueBSelection = null;
      }

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

  const handleSubmit = async () => {
    const { id, name, description, areaNegocio, processoNegocio, owner,
            system,
            ruleType, valueASelection, valueAOperator, valueAValue, valueBSelection
          } = currentRule;

    if (!name || system === null || !ruleType || !valueASelection || !valueBSelection) {
      showSnackbar("warning", "Campos Obrigatórios", "Nome, Sistema, Tipo e os dois campos de comparação são obrigatórios.");
      return;
    }

    if (system.id === null && (ruleType.id.includes('ROLE'))) {
        showSnackbar("error", "Tipo de Regra Inválido", "Regras globais (Todos os Sistemas) não podem usar Perfil como critério. Use Atributos.");
        return;
    }

    let valueAType = '';
    if (ruleType.id.includes('ROLE')) valueAType = 'PROFILE';
    if (ruleType.id.startsWith('ATTR')) valueAType = 'ATTRIBUTE';

    if (valueAType === 'ATTRIBUTE' && (!valueAOperator || !valueAValue.trim())) {
        showSnackbar("warning", "Campos Obrigatórios", "Para regras com Atributo A, o Operador e o Valor do Atributo são obrigatórios.");
        return;
    }

    const payload = {
      name, description, areaNegocio, processoNegocio, owner,
      systemId: system.id, // Envia null se for a opção "Todos"
      ruleTypeId: ruleType.id,
      valueA: valueASelection,
      valueB: valueBSelection,
      valueAOperator: undefined,
      valueAValue: undefined,
    };

    if (valueAType === 'ATTRIBUTE') {
        payload.valueAOperator = valueAOperator?.id;
        payload.valueAValue = valueAValue;
    }

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
      const backendMessage = error.response?.data?.message;
      let displayMessage = "Ocorreu um erro inesperado.";
      if (backendMessage) {
        displayMessage = typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage);
      } else if (error.message) {
        displayMessage = error.message;
      }
      showSnackbar("error", "Erro ao Salvar", displayMessage);
    }
  };


  const availableSystemsForValueB = useMemo(() => {
     if (!currentRule.system || currentRule.system.id === null) {
         return allSystems; 
     }
     return allSystems.filter(s => s.id !== currentRule.system.id); 
  }, [currentRule.system, allSystems]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditing ? "Editar Regra de SOD" : "Criar Nova Regra de SOD"}</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" p={2}>
          <Grid container spacing={3}>
            {/* Campos Estáticos - SEM size="small" */}
            <Grid item xs={12}>
              <MDInput label="Nome da Regra *" name="name" value={currentRule.name} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth required variant="outlined" />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDInput label="Área de negócio" name="areaNegocio" value={currentRule.areaNegocio} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth variant="outlined" />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDInput label="Processo de negócio" name="processoNegocio" value={currentRule.processoNegocio} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth variant="outlined" />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDInput label="Owner" name="owner" value={currentRule.owner} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth variant="outlined" />
            </Grid>
            <Grid item xs={12}>
              <MDInput label="Descrição" name="description" value={currentRule.description} onChange={(e) => handleFormChange(e.target.name, e.target.value)} fullWidth multiline rows={2} variant="outlined" />
            </Grid>

            {/* Seletor de Sistema com "Todos" */}
            <Grid item xs={12}>
              <Autocomplete
                options={systemOptions}
                getOptionLabel={(option) => option.name || ""}
                value={currentRule.system}
// ======================= INÍCIO DA CORREÇÃO (onChange) =======================
                onChange={(event, newValue) => handleFormChange("system", newValue)}
// ======================== FIM DA CORREÇÃO (onChange) =========================
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={isEditing}
                ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                renderInput={(params) => <MDInput {...params} label="Sistema Alvo *" required variant="outlined" />}
              />
              {isEditing && currentRule.system && (
                  <FormHelperText>O sistema não pode ser alterado ao editar uma regra.</FormHelperText>
              )}
            </Grid>

            {/* Seletor de Tipo */}
            <Grid item xs={12}>
              <Autocomplete
                options={availableRuleTypes}
                getOptionLabel={(option) => option.label || ""}
                value={currentRule.ruleType}
// ======================= INÍCIO DA CORREÇÃO (onChange) =======================
                onChange={(event, newValue) => handleFormChange("ruleType", newValue)}
// ======================== FIM DA CORREÇÃO (onChange) =========================
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disableClearable
                disabled={!currentRule.system}
                ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                renderInput={(params) => <MDInput {...params} label="Tipo de Regra *" required variant="outlined" />}
              />
               {currentRule.system?.id === null && (
                  <FormHelperText>Regras globais não podem usar Perfil como critério.</FormHelperText>
               )}
            </Grid>

            {/* Campos Dinâmicos */}
            <DynamicRuleFields
              ruleType={currentRule.ruleType}
              resources={filteredResources} // 4. Passa a prop correta 'filteredResources'
              systems={availableSystemsForValueB} 
              attributes={allAttributes} 
              values={{
                valueASelection: currentRule.valueASelection,
                valueAOperator: currentRule.valueAOperator,
                valueAValue: currentRule.valueAValue,
                valueBSelection: currentRule.valueBSelection,
              }}
              onChange={handleFormChange}
              isDisabled={!currentRule.system || !currentRule.ruleType} 
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

SodModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  showSnackbar: PropTypes.func.isRequired,
  token: PropTypes.string,
  ruleToEdit: PropTypes.object,
  systems: PropTypes.arrayOf(PropTypes.object).isRequired,
  resources: PropTypes.arrayOf(PropTypes.object).isRequired, // 5. Corrigido
  attributes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

SodModal.defaultProps = {
  token: null,
  ruleToEdit: null,
  resources: [], // Corrigido
};

export default SodModal;