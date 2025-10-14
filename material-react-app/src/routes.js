// material-react-app/src/routes.js

// Material Dashboard 2 React layouts
import UserProfile from "layouts/user-profile";

import Login from "auth/login";
import Register from "auth/register";
import ForgotPassword from "auth/forgot-password";
import ResetPassword from "auth/reset-password";
import TruIM from "layouts/plataformas/TruIM";
import TruPAM from "layouts/plataformas/TruPAM";
import TruAM from "layouts/plataformas/TruAM";
import GerenciarUsuarios from "layouts/administrar/usuarios";
import GerenciarGrupos from "layouts/administrar/grupos";
import GerenciarFuncoes from "layouts/administrar/funcoes";
import GerenciarPacotes from "layouts/administrar/pacotes";
import DashboardTruIM from "layouts/observabilidade/truim";
import DashboardTruPAM from "layouts/observabilidade/trupam";
import DashboardTruAM from "layouts/observabilidade/truam";
import VisaoGeral from "layouts/observabilidade/geral";
import ImportManagement from "layouts/observabilidade/importManagement";
import GerenciarSistemas from "layouts/observabilidade/sistemas";
// --- 1. ADICIONAR IMPORT PARA O NOVO COMPONENTE ---
import GerenciarExcecoes from "layouts/observabilidade/excecoes";


// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  {
    type: "collapse",
    name: "Painel",
    key: "mind-the-gap",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/mind-the-gap",
    component: <VisaoGeral />,
  },
  {
    type: "examples",
    name: "Perfil de Usuário",
    key: "user-profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/user-profile",
    component: <UserProfile />,
  },
  {
    type: "auth",
    name: "Login",
    key: "login",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/auth/login",
    component: <Login />,
  },
  {
    type: "auth",
    name: "Register",
    key: "register",
    icon: <Icon fontSize="small">reigster</Icon>,
    route: "/auth/register",
    component: <Register />,
  },
  {
    type: "auth",
    name: "Forgot Password",
    key: "forgot-password",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/auth/forgot-password",
    component: <ForgotPassword />,
  },
  {
    type: "auth",
    name: "Reset Password",
    key: "reset-password",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/auth/reset-password",
    component: <ResetPassword />,
  },
  {
    type: "collapse",
    name: "Observabilidade",
    key: "observabilidade",
    icon: <Icon fontSize="small">monitoring</Icon>,
    collapse: [
      {
        name: "Importações",
        key: "gerenciar-importacoes",
        route: "/observabilidade/import-management",
        component: <ImportManagement />,
        icon: <Icon fontSize="small">upload_file</Icon>,
      },
      {
        name: "Sistemas",
        key: "sistemas",
        route: "/observabilidade/sistemas",
        component: <GerenciarSistemas />,
        icon: <Icon fontSize="small">storage</Icon>,
      },
      // --- 2. ADICIONAR O NOVO OBJETO DA ROTA AQUI ---
      {
        name: "Exceções",
        key: "gerenciar-excecoes",
        route: "/observabilidade/excecoes",
        component: <GerenciarExcecoes />,
        icon: <Icon fontSize="small">gavel</Icon>,
      },
      {
        name: "TruIM",
        key: "truim-obs",
        route: "/observabilidade/truim",
        component: <DashboardTruIM />,
        icon: <Icon fontSize="small">fact_check</Icon>,
      },
      {
        name: "TruPAM",
        key: "trupam-obs",
        route: "/observabilidade/trupam",
        component: <DashboardTruPAM />,
        icon: <Icon fontSize="small">shield</Icon>,
      },
      {
        name: "TruAM",
        key: "truam-obs",
        route: "/observabilidade/truam",
        component: <DashboardTruAM />,
        icon: <Icon fontSize="small">hub</Icon>,
      },
    ],
  },
  {
    type: "collapse",
    name: "Administrar",
    key: "administrar",
    icon: <Icon fontSize="small">admin_panel_settings</Icon>,
    role: "Admin",
    collapse: [
    {
      name: "Usuários",
      key: "usuarios",
      route: "/administrar/usuarios",
      component: <GerenciarUsuarios />,
      icon: <Icon fontSize="small">group</Icon>, 
    },
    {
      name: "Grupos",
      key: "grupos",
      route: "/administrar/grupos",
      component: <GerenciarGrupos />,
      icon: <Icon fontSize="small">groups</Icon>,
    },
    {
      name: "Funções",
      key: "funcoes",
      route: "/administrar/funcoes",
      component: <GerenciarFuncoes />,
      icon: <Icon fontSize="small">security</Icon>,
    },
    {
      name: "Pacotes",
      key: "pacotes",
      route: "/administrar/pacotes",
      component: <GerenciarPacotes />,
      icon: <Icon fontSize="small">inventory_2</Icon>,
    },
  ],
  },
{
  type: "collapse",
  name: "TAS",
  key: "tas",
  icon: <Icon fontSize="small">device_hub</Icon>,
  collapse: [
    {
      name: "TruIM",
      key: "truim",
      route: "/tas/truim",
      component: <TruIM />,
      icon: <Icon fontSize="small">fact_check</Icon>,
    },
    {
      name: "TruPAM",
      key: "trupam",
      route: "/tas/trupam",
      component: <TruPAM />,
      icon: <Icon fontSize="small">shield</Icon>,
    },
    {
      name: "TruAM",
      key: "truam",
      route: "/tas/truam",
      component: <TruAM />,
      icon: <Icon fontSize="small">hub</Icon>,
    },
  ],
},
];

export default routes;