// src/layouts/observabilidade/politicas/index.js

import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// --- Importação dos novos componentes de Aba ---
import RbacTab from "./components/RbacTab";
import SodTab from "./components/SodTab";

// Componente interno para renderizar o conteúdo da aba
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`politicas-tabpanel-${index}`}
      aria-labelledby={`politicas-tab-${index}`}
      {...other}
    >
      {/* Não renderiza o conteúdo da aba se ela não estiver ativa.
        Isso garante que o useEffect() do SodTab/RbacTab só 
        será disparado quando o usuário clicar na aba.
      */}
      {value === index && <MDBox sx={{ p: 3 }}>{children}</MDBox>}
    </div>
  );
}

function GerenciarPoliticas() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              {/* Cabeçalho com o Título e o Seletor de Abas */}
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white" mb={2}>
                  Gerenciamento de Políticas
                </MDTypography>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  textColor="inherit"
                  indicatorColor="secondary"
                  aria-label="Abas de Políticas"
                >
                  <Tab
                    label="RBAC (Regras de Concessão)"
                    icon={<Icon fontSize="small">verified_user</Icon>}
                    iconPosition="start"
                  />
                  <Tab
                    label="SOD (Segregação de Funções)"
                    icon={<Icon fontSize="small">gpp_bad</Icon>}
                    iconPosition="start"
                  />
                </Tabs>
              </MDBox>

              {/* Conteúdo da Aba Selecionada */}
              <MDBox>
                {/* Painel RBAC */}
                <TabPanel value={activeTab} index={0}>
                  <RbacTab />
                </TabPanel>

                {/* Painel SOD */}
                <TabPanel value={activeTab} index={1}>
                  <SodTab />
                </TabPanel>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default GerenciarPoliticas;