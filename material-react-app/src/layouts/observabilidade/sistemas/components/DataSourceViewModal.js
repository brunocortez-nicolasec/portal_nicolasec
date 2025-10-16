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
      {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
      <Icon color="secondary" fontSize="small" sx={{ mr: 1.5 }}>
      {/* ======================== FIM DA ALTERAÇÃO ========================= */}
        {icon}
      </Icon>
      <MDTypography variant="button" fontWeight="bold" color="text">
        {label}:&nbsp;
      </MDTypography>
      
      {value && (
        <MDTypography variant="button" fontWeight="regular" color={valueColor}>
          {value}
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

  // Filtra os campos de conexão que têm valor
  const connectionFields = [
    { label: "Username", value: dataSource.username, icon: "person" },
    { label: "Server Name", value: dataSource.serverName, icon: "dns" },
    { label: "Port", value: dataSource.port, icon: "network_check" },
    { label: "Database", value: dataSource.database, icon: "storage" },
    { label: "Service Name/SID", value: dataSource.serviceName, icon: "settings_ethernet" },
    { label: "Native", value: typeof dataSource.isNative === 'boolean' ? (dataSource.isNative ? "Sim" : "Não") : null, icon: "toggle_on" },
    { label: "JDBC URL", value: dataSource.jdbcUrl, icon: "http" },
  ].filter(field => field.value !== null && field.value !== undefined && field.value !== "");

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
              <DetailItem icon="label" label="Nome da Fonte" value={dataSource.name} darkMode={darkMode} />
              <DetailItem icon="hub" label="Tipo" value={dataSource.type} darkMode={darkMode} />
              <DetailItem icon="description" label="Descrição" value={dataSource.description || "N/A"} darkMode={darkMode} />
            </Grid>
            {/* Coluna da Direita */}
            <Grid item xs={12} md={6}>
              <DetailItem icon="check_circle_outline" label="Status" darkMode={darkMode}>
                <MDBadge badgeContent={dataSource.status || "Ativo"} color={dataSource.status === "Inativo" ? "error" : "success"} variant="gradient" size="sm" sx={{ ml: 1 }} />
              </DetailItem>
              <DetailItem icon="event" label="Data de Criação" value={new Date(dataSource.createdAt).toLocaleString('pt-BR')} darkMode={darkMode} />
              <DetailItem icon="update" label="Última Atualização" value={new Date(dataSource.updatedAt).toLocaleString('pt-BR')} darkMode={darkMode} />
            </Grid>
          </Grid>
          
          {/* Detalhes da Conexão (se houver) */}
          {dataSource.type !== "CSV" && connectionFields.length > 0 && (
            <MDBox mt={2}>
              <Divider />
              <MDTypography variant="h6" fontWeight="medium" sx={{ mt: 2, mb: 2 }}>
                Detalhes da Conexão
              </MDTypography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* Renderiza a primeira metade dos campos de conexão */}
                  {connectionFields.slice(0, Math.ceil(connectionFields.length / 2)).map(field => (
                     <DetailItem key={field.label} icon={field.icon} label={field.label} value={field.value} darkMode={darkMode} />
                  ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Renderiza a segunda metade */}
                  {connectionFields.slice(Math.ceil(connectionFields.length / 2)).map(field => (
                     <DetailItem key={field.label} icon={field.icon} label={field.label} value={field.value} darkMode={darkMode} />
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