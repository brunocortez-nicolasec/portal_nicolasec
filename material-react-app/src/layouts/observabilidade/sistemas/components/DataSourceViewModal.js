// material-react-app/src/layouts/observabilidade/sistemas/components/DataSourceViewModal.js

import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";

// @mui material components
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

// Componente helper para replicar o layout do seu modal de exemplo
function DetailItem({ icon, label, value, children, darkMode }) {
  const valueColor = darkMode ? "white" : "text.secondary";

  return (
    <MDBox display="flex" alignItems="center" mb={1.5} lineHeight={1}>
      <Icon color="secondary" fontSize="small" sx={{ mr: 1.5 }}>
        {icon}
      </Icon>
      <MDTypography variant="button" fontWeight="bold" color="text">
        {label}:&nbsp;
      </MDTypography>

      {/* Lógica modificada para exibir N/A se o valor for nulo/vazio, 
          mas apenas se 'children' não estiver sendo usado (como no Status) */}
      {value !== null && value !== undefined && value !== "" && (
        <MDTypography variant="button" fontWeight="regular" color={valueColor}>
          {value}
        </MDTypography>
      )}
      {(value === null || value === undefined || value === "") && !children && (
        <MDTypography variant="button" fontWeight="regular" fontStyle="italic" color={valueColor}>
          N/A
        </MDTypography>
      )}
      {children}
    </MDBox>
  );
}

DetailItem.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  children: PropTypes.node,
  darkMode: PropTypes.bool,
};

function DataSourceViewModal({ open, onClose, dataSource, darkMode }) {
  const theme = useTheme();
  if (!dataSource) return null;

  // 1. Unificar os detalhes de conexão (Lógica de conexão)
  let connectionDetails = {};
  
  if (dataSource.origem_datasource === "RH" && dataSource.hrConfig) {
    connectionDetails = {
      "Diretório (Servidor)": dataSource.hrConfig.diretorio_hr,
    };
  } else if (dataSource.origem_datasource === "IDM" && dataSource.idmConfig) {
    connectionDetails = {
      "API URL": dataSource.idmConfig.api_url,
      "API User": dataSource.idmConfig.api_user,
    };
  // ======================= INÍCIO DA CORREÇÃO =======================
  // Corrigido para ler de 'systemConfig' e os novos nomes de diretório
  } else if (dataSource.origem_datasource === "SISTEMA" && dataSource.systemConfig) {
    const config = dataSource.systemConfig;
    connectionDetails = {
      "Diretório Contas": config.diretorio_contas, 
      "Diretório Recursos": config.diretorio_recursos,
      // (Aqui entrarão os campos de DB (host, user) quando os adicionarmos)
    };
  }
  // ======================== FIM DA CORREÇÃO =========================

  // Mapeia os ícones
  const iconMap = {
    "Diretório (Servidor)": "folder_open",
    "Diretório Contas": "folder_shared",
    "Diretório Recursos": "folder_special",
    "API URL": "http",
    "API User": "person_search",
    // (Ícones de DB futuros)
  };

  // 2. Filtrar os campos de conexão que têm valor
  const connectionFields = Object.entries(connectionDetails)
    .map(([label, value]) => ({
      label,
      value,
      icon: iconMap[label] || "info", 
    }))
    .filter((field) => field.value !== null && field.value !== undefined && field.value !== "");

  // ======================= INÍCIO DA CORREÇÃO =======================
  // 3. Lógica para o Status do Mapeamento (Corrigida para usar nomes sem prefixo)
  const { origem_datasource, mappingRH, mappingIDM, mappingSystem } = dataSource;
  
  let isMapped = false; // Para RH/IDM
  let contasMapeadas = false;
  let recursosMapeados = false;

  if (origem_datasource === "RH") {
    // Verifica os campos obrigatórios do RH
    isMapped = mappingRH && 
               mappingRH.identity_id_hr && 
               mappingRH.email_hr && 
               mappingRH.status_hr;
               
  } else if (origem_datasource === "IDM") {
    // Verifica os campos obrigatórios do IDM
    isMapped = mappingIDM && 
               mappingIDM.identity_id_idm && 
               mappingIDM.email_idm && 
               mappingIDM.status_idm;
               
  } else if (origem_datasource === "SISTEMA") {
    const map = mappingSystem || {}; // Garante que 'map' seja um objeto
    
    // Verifica os campos obrigatórios de CONTAS (nomes corrigidos)
    contasMapeadas = map.accounts_id_in_system && 
                     map.accounts_identity_id;
    
    // Verifica os campos obrigatórios de RECURSOS (nomes corrigidos)
    recursosMapeados = map.resources_name;
    
    isMapped = contasMapeadas && recursosMapeados; 
  }
  // ======================== FIM DA CORREÇÃO =========================


  return (
    <Modal open={open} onClose={onClose} sx={{ display: "grid", placeItems: "center" }}>
      <Card sx={{ width: "90%", maxWidth: "700px", overflowY: "auto", maxHeight: "90vh" }}>
        <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Detalhes da Fonte de Dados</MDTypography>
          <Icon
            sx={({ typography: { size }, palette: { dark, white } }) => ({
              fontSize: `${size.lg} !important`,
              color: darkMode ? white.main : dark.main,
              stroke: "currentColor",
              strokeWidth: "2px",
              cursor: "pointer",
            })}
            onClick={onClose}
          >
            close
          </Icon>
        </MDBox>

        <MDBox p={3} pt={1}>
          <Grid container spacing={3}>
            {/* Coluna da Esquerda */}
            <Grid item xs={12} md={6}>
              <DetailItem
                icon="label"
                label="Nome da Fonte"
                value={dataSource.name_datasource}
                darkMode={darkMode}
              />
              <DetailItem
                icon="device_hub"
                label="Origem"
                value={dataSource.origem_datasource}
                darkMode={darkMode}
              />
              <DetailItem
                icon="storage" 
                label="Tipo"
                value={dataSource.type_datasource}
                darkMode={darkMode}
              />
              <DetailItem
                icon="description"
                label="Descrição"
                value={dataSource.description_datasource}
                darkMode={darkMode}
              />
            </Grid>
            {/* Coluna da Direita */}
            <Grid item xs={12} md={6}>
              <DetailItem icon="check_circle_outline" label="Status" darkMode={darkMode}>
                <MDBadge
                  badgeContent={dataSource.status?.toUpperCase() || "ATIVO"}
                  color={dataSource.status === "INATIVO" ? "error" : "success"}
                  variant="gradient"
                  size="sm"
                  sx={{ ml: 1 }}
                />
              </DetailItem>
              
              {/* Renderização Condicional do Mapeamento */}
              
              {/* 1. Mostra para RH/IDM */}
              {origem_datasource !== "SISTEMA" && (
                <DetailItem icon="rule" label="Mapeamento" darkMode={darkMode}>
                  <MDBadge
                    badgeContent={isMapped ? "Mapeado" : "Pendente"}
                    color={isMapped ? "success" : "warning"}
                    variant="gradient"
                    size="sm"
                    sx={{ ml: 1 }}
                  />
                </DetailItem>
              )}
              
              {/* 2. Mostra para SISTEMA (nova lógica) */}
              {origem_datasource === "SISTEMA" && (
                <>
                  <DetailItem icon="rule" label="Mapeamento Contas" darkMode={darkMode}>
                    <MDBadge
                      badgeContent={contasMapeadas ? "Mapeado" : "Pendente"}
                      color={contasMapeadas ? "success" : "warning"}
                      variant="gradient"
                      size="sm"
                      sx={{ ml: 1 }}
                    />
                  </DetailItem>
                  <DetailItem icon="category" label="Mapeamento Recursos" darkMode={darkMode}>
                    <MDBadge
                      badgeContent={recursosMapeados ? "Mapeado" : "Pendente"}
                      color={recursosMapeados ? "success" : "warning"}
                      variant="gradient"
                      size="sm"
                      sx={{ ml: 1 }}
                    />
                  </DetailItem>
                </>
              )}

              <DetailItem
                icon="event"
                label="Data de Criação"
                value={
                  dataSource.createdAt ? new Date(dataSource.createdAt).toLocaleString("pt-BR") : "N/A"
                }
                darkMode={darkMode}
              />
              <DetailItem
                icon="update"
                label="Última Atualização"
                value={
                  dataSource.updatedAt ? new Date(dataSource.updatedAt).toLocaleString("pt-BR") : "N/A"
                }
                darkMode={darkMode}
              />
            </Grid>
          </Grid>

          {/* Detalhes da Conexão (se houver) */}
          {connectionFields.length > 0 && (
            <MDBox mt={2}>
              <Divider />
              <MDTypography variant="h6" fontWeight="medium" sx={{ mt: 2, mb: 2 }}>
                Detalhes da Conexão
              </MDTypography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* Renderiza a primeira metade dos campos de conexão */}
                  {connectionFields
                    .slice(0, Math.ceil(connectionFields.length / 2))
                    .map((field) => (
                      <DetailItem
                        key={field.label}
                        icon={field.icon}
                        label={field.label}
                        value={field.value}
                        darkMode={darkMode}
                      />
                    ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Renderiza a segunda metade */}
                  {connectionFields
                    .slice(Math.ceil(connectionFields.length / 2))
                    .map((field) => (
                      <DetailItem
                        key={field.label}
                        icon={field.icon}
                        label={field.label}
                        value={field.value}
                        darkMode={darkMode}
                      />
                    ))}
                </Grid>
              </Grid>
            </MDBox>
          )}
        </MDBox>
      </Card>
    </Modal>
  );
}

DataSourceViewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dataSource: PropTypes.object,
  darkMode: PropTypes.bool,
};

DataSourceViewModal.defaultProps = {
  dataSource: null,
  darkMode: false,
};

export default DataSourceViewModal;