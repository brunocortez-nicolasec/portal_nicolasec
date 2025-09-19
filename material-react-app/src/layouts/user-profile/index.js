// material-react-app/src/layouts/user-profile/index.js

import { useState, useEffect, useRef } from "react";
import { useAuth } from "context";

// --- 1. IMPORTAÇÃO ADICIONADA ---
import Collapse from "@mui/material/Collapse";

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
  const { user: authUser, login } = useAuth();
  const fileInputRef = useRef(null);

  const [notification, setNotification] = useState({ show: false, message: "", color: "info" });
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    profile_image: null,
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (authUser?.data?.attributes) {
      const { name, email, role, profile_image } = authUser.data.attributes;
      setUser((prevUser) => ({
        ...prevUser,
        name: name || "",
        email: email || "",
        role: role || "",
        profile_image: profile_image || null,
      }));
    }
  }, [authUser]);

  // --- 2. useEffect DO TEMPORIZADOR ADICIONADO ---
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification((prevState) => ({ ...prevState, show: false }));
      }, 5000); // 5 segundos
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const changeHandler = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, profile_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    let dataToUpdate = {
      data: {
        type: "users",
        attributes: {
          name: user.name,
          email: user.email,
          profile_image: user.profile_image,
        },
      },
    };

    if (user.newPassword) {
      if (user.newPassword.length < 8 || user.newPassword !== user.confirmPassword) {
        setNotification({
          show: true,
          message: "As senhas devem ter no mínimo 8 caracteres e ser iguais.",
          color: "error",
        });
        return;
      }
      dataToUpdate.data.attributes.newPassword = user.newPassword;
      dataToUpdate.data.attributes.confirmPassword = user.confirmPassword;
    }

    try {
      await AuthService.updateProfile(dataToUpdate);
      setNotification({ show: true, message: "Perfil atualizado com sucesso!", color: "success" });
      setUser((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));

      const token = localStorage.getItem("token");
      if (token) {
        await login(token);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erro ao atualizar o perfil.";
      setNotification({ show: true, message: errorMessage, color: "error" });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header
        name={user.name}
        role={user.role}
        profileImage={user.profile_image}
        onAvatarClick={handleAvatarClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          style={{ display: "none" }}
        />

        {/* --- 3. JSX ATUALIZADO PARA USAR O COLLAPSE --- */}
        <Collapse in={notification.show}>
          <MDAlert color={notification.color} mt="20px">
            <MDTypography variant="body2" color="white">{notification.message}</MDTypography>
          </MDAlert>
        </Collapse>

        <MDBox component="form" role="form" onSubmit={submitHandler}>
          <MDBox display="flex" flexDirection="row" mt={5} mb={3}>
            <MDBox flex="1" mr={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Nome
              </MDTypography>
              <MDInput
                type="name"
                fullWidth
                name="name"
                value={user.name}
                onChange={changeHandler}
              />
            </MDBox>
            <MDBox flex="1" ml={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Email
              </MDTypography>
              <MDInput
                type="email"
                fullWidth
                name="email"
                value={user.email}
                onChange={changeHandler}
              />
            </MDBox>
          </MDBox>
          <MDBox display="flex" flexDirection="row" mb={3}>
            <MDBox flex="1" mr={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Nova Senha
              </MDTypography>
              <MDInput
                type="password"
                fullWidth
                name="newPassword"
                value={user.newPassword}
                onChange={changeHandler}
                autoComplete="new-password"
              />
            </MDBox>
            <MDBox flex="1" ml={1}>
              <MDTypography variant="body2" color="text" ml={1} fontWeight="regular">
                Confirmação de Senha
              </MDTypography>
              <MDInput
                type="password"
                fullWidth
                name="confirmPassword"
                value={user.confirmPassword}
                onChange={changeHandler}
                autoComplete="new-password"
              />
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