// material-react-app/src/layouts/user-profile/index.js - CORRIGIDO

import { useState, useEffect } from "react";

// --- MUDANÇA 1: Importar o hook useAuth do nosso contexto ---
import { useAuth } from "context";

// Componentes Material Dashboard
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Header from "layouts/user-profile/Header"; 
import AuthService from "../../services/auth-service";

const UserProfile = () => {
  // --- MUDANÇA 2: Pegar o usuário do nosso contexto de autenticação ---
  const { user: authUser } = useAuth(); // Renomeamos para 'authUser' para evitar conflito

  const [notification, setNotification] = useState({ show: false, message: "", color: "info" });
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    newPassword: "",
    confirmPassword: "",
  });

  // --- MUDANÇA 3: Substituir a chamada de API pela leitura do contexto ---
  useEffect(() => {
    // Só atualiza o estado local se o usuário do contexto existir
    if (authUser && authUser.data && authUser.data.attributes) {
      const { name, email, role } = authUser.data.attributes;
      setUser((prevUser) => ({
        ...prevUser,
        name: name || "",
        email: email || "",
        role: role || "",
      }));
    }
  }, [authUser]); // Este efeito roda sempre que o usuário do contexto carregar ou mudar

  const changeHandler = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    // Cria um objeto simples com os dados a serem atualizados
    let dataToUpdate = {
      name: user.name,
      email: user.email,
    };

    // Adiciona a senha apenas se o campo foi preenchido
    if (user.newPassword) {
      if (user.newPassword.length < 8 || user.newPassword !== user.confirmPassword) {
        setNotification({ show: true, message: "As senhas devem ter no mínimo 8 caracteres e ser iguais.", color: "error" });
        return;
      }
      dataToUpdate.newPassword = user.newPassword;
      dataToUpdate.confirmPassword = user.confirmPassword;
    }

    try {
      // Envia o objeto simples para o serviço
      await AuthService.updateProfile(dataToUpdate);
      setNotification({ show: true, message: "Perfil atualizado com sucesso!", color: "success" });
      setUser((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erro ao atualizar o perfil.";
      console.error("Failed to update profile:", error);
      setNotification({ show: true, message: errorMessage, color: "error" });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      {/* O Header receberá os dados corretos assim que o estado 'user' for preenchido */}
      <Header name={user.name} role={user.role}>
        {notification.show && (
          <MDAlert color={notification.color} mt="20px" dismissible>
            <MDTypography variant="body2" color="white">
              {notification.message}
            </MDTypography>
          </MDAlert>
        )}
        <MDBox component="form" role="form" onSubmit={submitHandler}>
          <MDBox display="flex" flexDirection="row" mt={5} mb={3}>
            <MDBox flex="1" mr={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Nome
              </MDTypography>
              <MDInput type="name" fullWidth name="name" value={user.name} onChange={changeHandler} />
            </MDBox>
            <MDBox flex="1" ml={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Email
              </MDTypography>
              <MDInput type="email" fullWidth name="email" value={user.email} onChange={changeHandler} />
            </MDBox>
          </MDBox>
          <MDBox display="flex" flexDirection="row" mb={3}>
            <MDBox flex="1" mr={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Nova Senha
              </MDTypography>
              <MDInput type="password" fullWidth name="newPassword" value={user.newPassword} onChange={changeHandler} autoComplete="new-password"/>
            </MDBox>
            <MDBox flex="1" ml={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Confirmação de Senha
              </MDTypography>
              <MDInput type="password" fullWidth name="confirmPassword" value={user.confirmPassword} onChange={changeHandler} autoComplete="new-password"/>
            </MDBox>
          </MDBox>
          <MDBox mt={4} display="flex" justifyContent="end">
            <MDButton variant="gradient" color="info" type="submit">
              Salvar Alterações
            </MDButton>
          </MDBox>
        </MDBox>
      </Header>
    </DashboardLayout>
  );
};

export default UserProfile;