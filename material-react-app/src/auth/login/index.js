import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayoutLanding from "layouts/authentication/components/BasicLayoutLanding";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import AuthService from "services/auth-service";
import { AuthContext } from "context";

function Login() {
  const authContext = useContext(AuthContext);
  const [credentialsErros, setCredentialsError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [inputs, setInputs] = useState({
    email: "admin@jsonapi.com",
    password: "secret1234",
  });
  const [errors, setErrors] = useState({
    emailError: false,
    passwordError: false,
  });

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const changeHandler = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  // --- FUNÇÃO submitHandler CORRIGIDA ---
  const submitHandler = async (e) => {
    e.preventDefault();
    setCredentialsError(null);

    const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!inputs.email.trim().match(mailFormat) || inputs.password.trim().length < 6) {
      setErrors({ emailError: true, passwordError: true });
      return;
    }

    // 1. Prepara os dados no formato JSON simples
    const credentials = {
      email: inputs.email,
      password: inputs.password,
    };

    try {
      // 2. Envia os dados simples para o serviço de autenticação
      const response = await AuthService.login(credentials);
      
      // 3. O AuthContext agora espera um objeto { token: "..." }
      authContext.login(response.token);
    } catch (error) {
      // 4. Trata a resposta de erro simples que o backend envia
      const message = error.response?.data?.message || "Ocorreu um erro. Tente novamente.";
      setCredentialsError(message);
    }
  };

  return (
    <BasicLayoutLanding image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Conecte-se
          </MDTypography>
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <FacebookIcon color="inherit" />
              </MDTypography>
            </Grid>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <GitHubIcon color="inherit" />
              </MDTypography>
            </Grid>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <GoogleIcon color="inherit" />
              </MDTypography>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" method="POST" onSubmit={submitHandler}>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                fullWidth
                value={inputs.email}
                name="email"
                onChange={changeHandler}
                error={errors.emailError}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Password"
                fullWidth
                name="password"
                value={inputs.password}
                onChange={changeHandler}
                error={errors.passwordError}
              />
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Lembrar de mim
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit">
                Conecte-se
              </MDButton>
            </MDBox>
            {credentialsErros && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                {credentialsErros}
              </MDTypography>
            )}
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Esqueceu da sua senha?{" "}
                <MDTypography
                  component={Link}
                  to="/auth/forgot-password"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Clique para redefinir
                </MDTypography>
              </MDTypography>
            </MDBox>
            <MDBox mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Não possui uma conta?{" "}
                <MDTypography
                  component={Link}
                  to="/auth/register"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Inscreva-se
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayoutLanding>
  );
}

export default Login;