// material-react-app/src/layouts/observabilidade/geral/components/Painel.js

import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import PieChart from "examples/Charts/PieChart";

// --- Sub-componentes (não alterados) ---

function PillKpi({ label, count, color }) {
  return (
    <MDBox textAlign="center" lineHeight={1}>
      <MDTypography variant="button" fontWeight="medium" color={color} sx={{ textTransform: "capitalize" }}>
        {label}
      </MDTypography>
      <MDTypography variant="h4" fontWeight="bold" mt={1}>
        {count}
      </MDTypography>
    </MDBox>
  );
}

function DetailList({ title, items }) {
  return (
    <Card sx={{ height: "100%", p: 2 }}>
      <MDTypography variant="overline" color="secondary" fontWeight="medium">
        {title}
      </MDTypography>
      {items.map((item) => (
        <MDBox key={item.label} display="flex" justifyContent="space-between" alignItems="center" pt={1.5}>
          <MDTypography variant="button" fontWeight="regular" color="text">{item.label}</MDTypography>
          <MDTypography variant="h6" fontWeight="bold" color={item.color || "dark"}>{item.value}</MDTypography>
        </MDBox>
      ))}
    </Card>
  );
}

function MiniMetricCard({ title, count, color = "dark" }) {
  return (
    <MDBox p={1} textAlign="center">
      <MDTypography variant="button" color="text" fontWeight="regular" sx={{ whiteSpace: "normal" }}>
        {title}
      </MDTypography>
      <MDTypography variant="h2" fontWeight="bold" color={color} mt={1}>
        {count}
      </MDTypography>
    </MDBox>
  );
}

function Painel({ imDisplay, onPieChartClick, onPlatformChange, selectedPlatform }) {
  const navigate = useNavigate();

  const systems = ["Geral", "SAP", "Salesforce", "ServiceNow", "IDM", "Cofre", "TruAm", "TruIM", "TruPAM", "VPN", "Acesso Internet"];
  const titleText = selectedPlatform === "Geral" ? "Painel Geral" : `Painel de ${selectedPlatform}`;
  
  // ======================= INÍCIO DA ALTERAÇÃO =======================
  // Cria um rótulo dinâmico para o card
  const appLabel = selectedPlatform === "Geral" ? "App" : selectedPlatform;
  // ======================== FIM DA ALTERAÇÃO =======================

  const handleSystemSelect = (event, newValue) => {
    if (newValue) {
      onPlatformChange(newValue);
    }
  };
  
  const handleRedirectToImportPage = () => {
    navigate("/observabilidade/import-management");
  };
  
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={2} px={2} display="flex" alignItems="center" justifyContent="space-between">
        <MDBox sx={{ flex: 1, display: 'flex' }} />
        <MDBox sx={{ flex: '0 1 auto', textAlign: 'center' }}>
          <MDTypography variant="h6">{titleText}</MDTypography>
        </MDBox>
        <MDBox sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Autocomplete
            disableClearable
            options={systems}
            value={selectedPlatform}
            onChange={handleSystemSelect}
            size="small"
            sx={{ width: 180 }}
            renderInput={(params) => <TextField {...params} label="Sistemas" />}
          />
          <MDButton variant="outlined" color="info" size="small" onClick={handleRedirectToImportPage}>
            <Icon sx={{ mr: 0.5 }}>upload</Icon>
            Importar CSV
          </MDButton>
        </MDBox>
      </MDBox>
      
      <MDBox p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={2}>
                <Grid container spacing={2} justifyContent="space-around">
                  <Grid item xs={6} sm={3}><PillKpi label="Usuários" count={imDisplay.pills.total} color="info"/></Grid>
                  <Grid item xs={6} sm={3}><PillKpi label="Ativos" count={imDisplay.pills.ativos} color="success" /></Grid>
                  <Grid item xs={6} sm={3}><PillKpi label="Inativos" count={imDisplay.pills.inativos} color="error" /></Grid>
                  <Grid item xs={6} sm={3}><PillKpi label="Desconhecido" count={imDisplay.pills.desconhecido} color="secondary" /></Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}><DetailList title="Tipos de Usuários" items={imDisplay.tiposList || []} /></Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <MDBox p={2} sx={{ height: "100%" }}>
                <PieChart chart={imDisplay.tiposChart} onClick={onPieChartClick} />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ height: "100%", p: 1 }}>
                  <Grid container spacing={1} sx={{height: '100%'}}>
                    {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
                    <Grid item xs={6}><MiniMetricCard title={`Ativos não encontrados no ${appLabel}`} count={imDisplay.divergencias.acessoPrevistoNaoConcedido} color="error"/></Grid>
                    <Grid item xs={6}><MiniMetricCard title="Ativos não encontrados no RH" count={imDisplay.divergencias.ativosNaoEncontradosRH} color="warning"/></Grid>
                    {/* ======================== FIM DA ALTERAÇÃO ======================= */}
                  </Grid>
                </Card>
              </Grid>
              <Grid item xs={12}> 
                <Card sx={{ height: "100%", p: 1 }}>
                  <Grid container spacing={1} sx={{height: '100%'}}>
                    <Grid item xs={6}><MiniMetricCard title="Contas Dormentes" count={imDisplay.kpisAdicionais.contasDormentes} color="warning"/></Grid>
                    <Grid item xs={6}><MiniMetricCard title="Acesso Privilegiado" count={imDisplay.kpisAdicionais.acessoPrivilegiado} color="info"/></Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
}

Painel.propTypes = {
  imDisplay: PropTypes.object.isRequired,
  onPieChartClick: PropTypes.func.isRequired,
  onPlatformChange: PropTypes.func.isRequired,
  selectedPlatform: PropTypes.string.isRequired,
};

export default Painel;