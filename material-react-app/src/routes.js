
// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import Notifications from "layouts/notifications";
import Profile from "layouts/profile";


import UserProfile from "layouts/user-profile";
import UserManagement from "layouts/user-management";

import Login from "auth/login";
import Register from "auth/register";
import ForgotPassword from "auth/forgot-password";
import ResetPassword from "auth/reset-password";
import Plataformas from "layouts/plataformas";
import GerenciarUsuarios from "layouts/administrar/usuarios";
import GerenciarGrupos from "layouts/administrar/grupos";
import GerenciarFuncoes from "layouts/administrar/funcoes";

// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  {
    type: "collapse",
    name: "Página Inicial",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Tabelas",
    key: "tables",
    icon: <Icon fontSize="small">table_view</Icon>,
    route: "/tables",
    component: <Tables />,
  },
  {
    type: "collapse",
    name: "Faturamento",
    key: "billing",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/billing",
    component: <Billing />,
  },
  {
    type: "collapse",
    name: "Notificações",
    key: "notifications",
    icon: <Icon fontSize="small">notifications</Icon>,
    route: "/notifications",
    component: <Notifications />,
  },
  {
    type: "collapse",
    name: "Perfil",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
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
    type: "examples",
    name: "Gerenciamento de perfis",
    key: "user-management",
    icon: <Icon fontSize="small">list</Icon>,
    route: "/user-management",
    component: <UserManagement />,
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
  name: "Plataformas",
  key: "plataformas",
  icon: <Icon fontSize="small">device_hub</Icon>, // Ícone de exemplo
  route: "/plataformas",
  component: <Plataformas />,
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
      // --- ÍCONE ADICIONADO ---
      icon: <Icon fontSize="small">group</Icon>, 
    },
    {
      name: "Grupos",
      key: "grupos",
      route: "/administrar/grupos",
      component: <GerenciarGrupos />,
      // --- ÍCONE ADICIONADO ---
      icon: <Icon fontSize="small">groups</Icon>,
    },
    {
      name: "Funções",
      key: "funcoes",
      route: "/administrar/funcoes",
      component: <GerenciarFuncoes />,
      // --- ÍCONE ADICIONADO ---
      icon: <Icon fontSize="small">security</Icon>,
    },
  ],
},

];

export default routes;
