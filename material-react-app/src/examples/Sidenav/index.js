// material-react-app/src/examples/Sidenav/index.js

import { useEffect, useMemo } from "react";
import { useLocation, NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";
import SidenavRoot from "examples/Sidenav/SidenavRoot";
// O estilo que precisamos já está importado aqui
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav"; 
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "context";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, user } = controller;
  const location = useLocation();
  const collapseName = location.pathname.replace("/", "");

  const { userRole, userPackage, userPlatformKeys } = useMemo(() => {
    // (Lógica de role/package inalterada)
    const attributes = user?.data?.attributes;
    if (!attributes) {
      return { userRole: null, userPackage: null, userPlatformKeys: [] };
    }
    const userRole = attributes.role;
    const userPackage = attributes.package;
    const userPlatformKeys = userPackage?.platforms?.map((p) => p.key) || [];
    return { userRole, userPackage, userPlatformKeys };
  }, [user]);

  let textColor = "white";
  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    // Função para fechar o sidenav em telas pequenas ao mudar de rota
    function handleCloseSidenavOnRoute() {
      if (window.innerWidth < 1200) {
        setMiniSidenav(dispatch, true);
      }
    }
    
    // Adiciona o listener para fechar ao mudar de rota (em mobile)
    window.addEventListener("resize", handleCloseSidenavOnRoute);
    handleCloseSidenavOnRoute(); // Executa uma vez
    
    // Remove o listener ao desmontar
    return () => window.removeEventListener("resize", handleCloseSidenavOnRoute);
  }, [dispatch, location]); // Depende apenas do dispatch e da localização


  // ======================= INÍCIO DA CORREÇÃO (Lógica de Resize) =======================
  // Esta lógica agora fica separada e reage ao 'miniSidenav'
  useEffect(() => {
    // Ajusta a transparência baseado no estado 'miniSidenav' e no tamanho da tela
    function handleTransparentSidenav() {
      setTransparentSidenav(dispatch, window.innerWidth < 1200 ? false : transparentSidenav);
      setWhiteSidenav(dispatch, window.innerWidth < 1200 ? false : whiteSidenav);
    }

    // Adiciona o listener para transparência
    window.addEventListener("resize", handleTransparentSidenav);
    handleTransparentSidenav(); // Executa uma vez

    // Remove o listener ao desmontar
    return () => window.removeEventListener("resize", handleTransparentSidenav);
  }, [dispatch, transparentSidenav, whiteSidenav]);
  // ======================== FIM DA CORREÇÃO (Lógica de Resize) =========================


  const renderRoutes = routes.map(
    ({ type, name, icon, title, noCollapse, key, href, route, collapse, role }) => {
      let returnValue;

      if (role && role !== userRole) {
        return null;
      }

      if (key === "tas") {
        const isAdmin = userRole === "Admin";
        if (!isAdmin && !userPackage) {
          return null;
        }
        let platformsToShow = collapse;
        if (!isAdmin && userPackage) {
          platformsToShow = collapse.filter((platform) => userPlatformKeys.includes(platform.key));
        }
        if (platformsToShow.length === 0) {
          return null;
        }

        returnValue = (
          <SidenavCollapse
            key={key}
            name={name}
            icon={icon}
            active={location.pathname.startsWith(`/${key}`)}
            collapse={platformsToShow}
          />
        );
      } else if (type === "collapse") {
        if (collapse) {
          returnValue = (
            <SidenavCollapse
              key={key}
              name={name}
              icon={icon}
              active={location.pathname.startsWith(`/${key}`)}
              collapse={collapse}
            />
          );
        } else if (href) {
          returnValue = (
            <Link
              href={href}
              key={key}
              target="_blank"
              rel="noreferrer"
              sx={{ textDecoration: "none" }}
            >
              <SidenavCollapse
                name={name}
                icon={icon}
                active={key === collapseName}
                noCollapse={noCollapse}
              />
            </Link>
          );
        } else {
          returnValue = (
            <NavLink key={key} to={route}>
              <SidenavCollapse name={name} icon={icon} active={key === collapseName} />
            </NavLink>
          );
        }
      } else if (type === "title") {
        returnValue = (
          <MDTypography
            key={key}
            color={textColor}
            display="block"
            variant="caption"
            fontWeight="bold"
            textTransform="uppercase"
            pl={3}
            mt={2}
            mb={1}
            ml={1}
          >
            {title}
          </MDTypography>
        );
      } else if (type === "divider") {
        returnValue = (
          <Divider
            key={key}
            light={
              (!darkMode && !whiteSidenav && !transparentSidenav) ||
              (darkMode && !transparentSidenav && whiteSidenav)
            }
          />
        );
      }
      return returnValue;
    }
  );

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox pt={3} pb={1} px={4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav} // Este 'closeSidenav' é para o X em telas mobile
          sx={{ cursor: "pointer" }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>
        <MDBox component={NavLink} to="/" display="flex" alignItems="center" justifyContent="center">
          {brand && <MDBox component="img" src={brand} alt="Brand" width="2rem" />}
          {brandName && (
            <MDBox
              width={!brandName && "100%"}
              sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })} // <<< O estilo que funciona
            >
              <MDTypography component="h6" variant="button" fontWeight="medium" color={textColor}>
                {brandName}
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </MDBox>

      <List sx={{ mb: 2 }}> {/* Adicionado um margin-bottom na lista para espaço */}
        <Divider
          light={
            (!darkMode && !whiteSidenav && !transparentSidenav) ||
            (darkMode && !transparentSidenav && whiteSidenav)
          }
        />
        {renderRoutes}
      </List>

      {/* --- INÍCIO DA CORREÇÃO --- */}
      {/* Este Box será empurrado para o final pelo 'marginTop: auto' */}
      <MDBox
        sx={(theme) => ({
          // 1. Usa 'margin-top: auto' para empurrá-lo para o final do flex-container
          marginTop: "auto",
          
          // 2. Usa o estilo 'sidenavLogoLabel' para desaparecer quando 'miniSidenav' for true
          ...sidenavLogoLabel(theme, { miniSidenav }), 
          
          // 3. Estilos de posicionamento e espaçamento
          paddingTop: "1rem", // Espaço acima
          paddingBottom: "1rem", // Espaço abaixo
          textAlign: "center",
        })}
      >
        <MDTypography variant="caption" color={textColor}>
          Versão 2.0.0
        </MDTypography>
      </MDBox>
      {/* --- FIM DA CORREÇÃO --- */}
    </SidenavRoot>
  );
}

Sidenav.defaultProps = {
  color: "info",
  brand: "",
  brandName: "",
};

Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;