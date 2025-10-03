// material-react-app/src/auth/register/index.js

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgImage from "assets/images/bg-sign-up-cover.jpeg";
import AuthService from "services/auth-service";
import { InputLabel } from "@mui/material";
import axios from "axios"; // 1. Adicionado axios

// 2. Imports do contexto corrigidos
import { useMaterialUIController, setAuth } from "context";

function Register() {
  // 3. Usando o novo hook e o useNavigate
  const [, dispatch] = useMaterialUIController();
  const navigate = useNavigate();

  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
    agree: false,
  });

  const [errors, setErrors] = useState({
    nameError: false,
    emailError: false,
    passwordError: false,
    agreeError: false,
    error: false,
    errorText: "",
  });

  const changeHandler = (e) => {
    // Ajuste para o Checkbox
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setInputs({
      ...inputs,
      [e.target.name]: value,
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    // Resetando erros
    setErrors({ nameError: false, emailError: false, passwordError: false, agreeError: false, error: false, errorText: "" });

    const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputs.name.trim().length === 0) {
      setErrors({ ...errors, nameError: true });
      return;
    }
    if (inputs.email.trim().length === 0 || !inputs.email.trim().match(mailFormat)) {
      setErrors({ ...errors, emailError: true });
      return;
    }
    if (inputs.password.trim().length < 8) {
      setErrors({ ...errors, passwordError: true });
      return;
    }
    if (!inputs.agree) {
      setErrors({ ...errors, agreeError: true });
      return;
    }

    // A lógica de formatação de 'myData' foi removida pois o backend foi ajustado
    const newUser = { name: inputs.name, email: inputs.email, password: inputs.password };

    try {
      // 4. Lógica de registro e login corrigida
      // A API de registro agora deve retornar o token e o usuário
      const response = await AuthService.register(newUser);
      
      const token = response.token; // Assumindo que a API retorna um token
      const userResponse = await axios.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = userResponse.data;

      // Salva o token e os dados do usuário no contexto global
      setAuth(dispatch, { token, user });

      navigate("/dashboard"); // Redireciona para o dashboard
    } catch (err) {
      const message = err.response?.data?.message || "Ocorreu um erro ao tentar registrar.";
      setErrors({ ...errors, error: true, errorText: message });
      console.error(err);
    }
  };

  return (
    <CoverLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="success"
          mx={2}
          mt={-3}
          p={3}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Junte-se a nós!
          </MDTypography>
          <MDTypography display="block" variant="button" color="white" my={1}>
            Digite seu nome, email e senha para se registrar
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" method="POST" onSubmit={submitHandler}>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Nome"
                variant="standard"
                fullWidth
                name="name"
                value={inputs.name}
                onChange={changeHandler}
                error={errors.nameError}
              />
              {errors.nameError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  O nome não pode estar vazio
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                variant="standard"
                fullWidth
                value={inputs.email}
                name="email"
                onChange={changeHandler}
                error={errors.emailError}
              />
              {errors.emailError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  O email deve ser válido
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Senha"
                variant="standard"
                fullWidth
                name="password"
                value={inputs.password}
                onChange={changeHandler}
                error={errors.passwordError}
              />
              {errors.passwordError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  A senha deve ter pelo menos 8 caracteres
                </MDTypography>
              )}
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Checkbox name="agree" checked={inputs.agree} onChange={changeHandler} />
              <InputLabel
                variant="standard"
                fontWeight="regular"
                color="text"
                sx={{ lineHeight: "1.5", cursor: "pointer" }}
                htmlFor="agree"
              >
                &nbsp;&nbsp;Eu concordo com os&nbsp;
              </InputLabel>
              <MDTypography
                component="a" // Alterado para 'a' para ser um link clicável
                href="#" // Adicione o link para seus termos aqui
                variant="button"
                fontWeight="bold"
                color="info"
                textGradient
              >
                Termos e Condições
              </MDTypography>
            </MDBox>
            {errors.agreeError && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                Você deve concordar com os termos e condições!
              </MDTypography>
            )}
            {errors.error && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                {errors.errorText}
              </MDTypography>
            )}
            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit">
                Registrar
              </MDButton>
            </MDBox>
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Já possui uma conta?{" "}
                <MDTypography
                  component={Link}
                  to="/auth/login"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Conecte-se
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </CoverLayout>
  );
}

export default Register;