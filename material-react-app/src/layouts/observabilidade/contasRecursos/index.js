// material-react-app/src/layouts/observabilidade/contasRecursos/index.js

import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// ======================= INÍCIO DA ALTERAÇÃO =======================
// 1. Importa os componentes das DUAS abas
import RecursosTab from "./components/RecursosTab";
import ContasTab from "./components/ContasTab";
// ======================== FIM DA ALTERAÇÃO =========================


// Componentes das Abas
// 2. Ambas as funções placeholder 'TabContentRecursos' e 'TabContentContas' foram REMOVIDAS


function GerenciarContasRecursos() { 
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2} mt={-3} py={3} px={2}
                variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Gerenciamento de Contas e Recursos
                </MDTypography>
              </MDBox>
              
              <MDBox>
                {/* O Controlador de Abas */}
                <AppBar position="static">
                  <Tabs value={selectedTab} onChange={handleTabChange} sx={{ backgroundColor: "transparent" }}>
                    <Tab
                      label="Contas"
                      icon={<Icon fontSize="small" sx={{ mr: 1 }}>people</Icon>}
                    />
                    <Tab
                      label="Recursos (Acessos)"
                      icon={<Icon fontSize="small" sx={{ mr: 1 }}>category</Icon>}
                    />
                  </Tabs>
                </AppBar>

                {/* Conteúdo das Abas */}
                <MDBox>
                  {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
                  {/* 3. Lógica de renderização agora usa os componentes reais */}
                  {selectedTab === 0 && <ContasTab />}
                  {selectedTab === 1 && <RecursosTab />}
                  {/* ======================== FIM DA ALTERAÇÃO ========================= */}
                </MDBox>
              </MDBox>

            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default GerenciarContasRecursos;