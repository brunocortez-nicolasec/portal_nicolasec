// material-react-app/src/examples/Sidenav/SidenavCollapse.js - VERSÃO COM ÍCONES NOS SUB-ITENS

import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import Collapse from "@mui/material/Collapse";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import {
  collapseItem,
  collapseIconBox,
  collapseIcon,
  collapseText,
} from "examples/Sidenav/styles/sidenavCollapse";
import { useMaterialUIController } from "context";

function SidenavCollapse({ icon, name, active, collapse, ...rest }) {
  const [controller] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;
  const location = useLocation();
  const { pathname } = location;

  const [open, setOpen] = useState(active);

  useEffect(() => {
    // Abre o menu se a rota atual for uma das filhas
    if (collapse && collapse.find((item) => item.route === pathname)) {
      setOpen(true);
    }
  }, [pathname, collapse]);

  const handleClick = () => {
    if (collapse) {
      setOpen(!open);
    }
  };

  const renderCollapse = collapse ? (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {collapse.map(({ key, name: subName, route, icon: subIcon }) => { // 1. Lendo o ícone do sub-item
          const isSubActive = pathname === route;
          return (
            <NavLink key={key} to={route} style={{ textDecoration: "none" }}>
              <ListItem component="li" sx={{ my: 0.5 }}>
                <MDBox
                  sx={(theme) =>
                    collapseItem(theme, {
                      active: isSubActive,
                      transparentSidenav,
                      whiteSidenav,
                      darkMode,
                      sidenavColor,
                    })
                  }
                  // Adiciona um recuo menor, pois o ícone já cria espaço
                  style={{ paddingLeft: "2rem" }}
                >
                  <ListItemIcon
                    sx={(theme) =>
                      collapseIconBox(theme, {
                        transparentSidenav,
                        whiteSidenav,
                        darkMode,
                        active: isSubActive,
                      })
                    }
                  >
                    {/* 2. Renderizando o ícone do sub-item */}
                    {subIcon}
                  </ListItemIcon>

                  <ListItemText
                    primary={subName}
                    sx={(theme) =>
                      collapseText(theme, {
                        miniSidenav,
                        transparentSidenav,
                        whiteSidenav,
                        active: isSubActive,
                      })
                    }
                  />
                </MDBox>
              </ListItem>
            </NavLink>
          );
        })}
      </List>
    </Collapse>
  ) : null;

  return (
    <>
      <ListItem component="li">
        <MDBox
          {...rest}
          sx={(theme) =>
            collapseItem(theme, { active, transparentSidenav, whiteSidenav, darkMode, sidenavColor })
          }
          onClick={handleClick}
        >
          <ListItemIcon
            sx={(theme) => collapseIconBox(theme, { transparentSidenav, whiteSidenav, darkMode, active })}
          >
            {typeof icon === "string" ? <Icon sx={(theme) => collapseIcon(theme, { active })}>{icon}</Icon> : icon}
          </ListItemIcon>
          <ListItemText
            primary={name}
            sx={(theme) => collapseText(theme, { miniSidenav, transparentSidenav, whiteSidenav, active })}
          />
          {collapse && (
            <Icon
              sx={{
                color: active ? "inherit" : ({ palette: { white } }) => white.main,
                marginRight: "0.5rem",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease-in-out",
              }}
            >
              expand_more
            </Icon>
          )}
        </MDBox>
      </ListItem>
      {renderCollapse}
    </>
  );
}

SidenavCollapse.defaultProps = {
  active: false,
  collapse: null,
};

SidenavCollapse.propTypes = {
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool,
  collapse: PropTypes.arrayOf(PropTypes.object),
};

export default SidenavCollapse;