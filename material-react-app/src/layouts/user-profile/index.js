import { useState, useEffect } from "react";

// Componentes Material Dashboard
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// O Header do caminho VERDADEIRO E DEFINITIVO
import Header from "layouts/user-profile/Header"; 

// Nosso serviço de API
import AuthService from "../../services/auth-service";

const UserProfile = () => {
  const [notification, setNotification] = useState({ show: false, message: "", color: "info" });
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await AuthService.getProfile();
        // A API com Prisma retorna os dados diretamente em response.data
        if (response.data) {
          setUser((prevUser) => ({
            ...prevUser,
            name: response.data.name || "", // Se for undefined, usa string vazia
            email: response.data.email || "", // Se for undefined, usa string vazia
            role: response.data.role || "", // Se for undefined, usa string vazia
            // ...
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setNotification({ show: true, message: "Erro ao carregar perfil.", color: "error" });
      }
    };
    getUserData();
  }, []); // O array vazio [] garante que a busca só acontece uma vez

  const changeHandler = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    let dataToUpdate = { name: user.name, email: user.email };

    if (user.newPassword) {
      if (user.newPassword.length < 8 || user.newPassword !== user.confirmPassword) {
        setNotification({ show: true, message: "As senhas devem ter no mínimo 8 caracteres e ser iguais.", color: "error" });
        return;
      }
      dataToUpdate.newPassword = user.newPassword;
      dataToUpdate.confirmPassword = user.confirmPassword;
    }

    try {
      await AuthService.updateProfile(dataToUpdate);
      setNotification({ show: true, message: "Perfil atualizado com sucesso!", color: "success" });
      setUser((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    } catch (error) {
      console.error("Failed to update profile:", error);
      setNotification({ show: true, message: "Erro ao atualizar o perfil.", color: "error" });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      {/* O UserProfile (pai) passa os dados 'name' e 'role' para o Header (filho) */}
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
              <MDInput type="password" fullWidth name="newPassword" value={user.newPassword} onChange={changeHandler} />
            </MDBox>
            <MDBox flex="1" ml={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Confirmação de Senha
              </MDTypography>
              <MDInput type="password" fullWidth name="confirmPassword" value={user.confirmPassword} onChange={changeHandler} />
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