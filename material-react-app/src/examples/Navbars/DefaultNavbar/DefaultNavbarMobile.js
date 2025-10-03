import PropTypes from "prop-types";
import Menu from "@mui/material/Menu";
import MDBox from "components/MDBox";
import DefaultNavbarLink from "examples/Navbars/DefaultNavbar/DefaultNavbarLink";

// 1. Imports do contexto corrigidos
import { useMaterialUIController } from "context";

function DefaultNavbarMobile({ open, close }) {
  // 2. Usando o novo hook e pegando o token
  const [controller] = useMaterialUIController();
  const { token } = controller;
  const isAuthenticated = !!token;

  const { width } = open && open.getBoundingClientRect();

  return (
    <Menu
      getContentAnchorEl={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      anchorEl={open}
      open={Boolean(open)}
      onClose={close}
      MenuListProps={{ style: { width: `calc(${width}px - 4rem)` } }}
    >
      {/* 3. Verificação de autenticação corrigida */}
      {!isAuthenticated && (
        <MDBox px={0.5}>
          <DefaultNavbarLink icon="account_circle" name="register" route="/auth/register" />
          <DefaultNavbarLink icon="key" name="login" route="/auth/login" />
        </MDBox>
      )}
      {/* 3. Verificação de autenticação corrigida */}
      {isAuthenticated && (
        <MDBox px={0.5}>
          <DefaultNavbarLink icon="donut_large" name="dashboard" route="/dashboard" />
          <DefaultNavbarLink icon="person" name="profile" route="/profile" />
          <DefaultNavbarLink icon="account_circle" name="sign up" route="/authentication/sign-up" />
          <DefaultNavbarLink icon="key" name="sign in" route="/authentication/sign-in" />
        </MDBox>
      )}
    </Menu>
  );
}

DefaultNavbarMobile.propTypes = {
  open: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]).isRequired,
  close: PropTypes.oneOfType([PropTypes.func, PropTypes.bool, PropTypes.object]).isRequired,
};

export default DefaultNavbarMobile;