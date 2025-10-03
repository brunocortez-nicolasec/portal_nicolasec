// material-react-app/src/context/index.js

import { createContext, useContext, useReducer, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const MaterialUI = createContext();
MaterialUI.displayName = "MaterialUIContext";

function reducer(state, action) {
  switch (action.type) {
    // Ações de Autenticação
    case "SET_AUTH": {
      const { token, user } = action.value;
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
      return { ...state, token, user };
    }
    case "LOGOUT": {
      localStorage.removeItem("token");
      return { ...state, token: null, user: null };
    }

    // Ações de UI
    case "MINI_SIDENAV":
      return { ...state, miniSidenav: action.value };
    case "TRANSPARENT_SIDENAV":
      return { ...state, transparentSidenav: action.value };
    case "WHITE_SIDENAV":
      return { ...state, whiteSidenav: action.value };
    case "SIDENAV_COLOR":
      return { ...state, sidenavColor: action.value };
    case "TRANSPARENT_NAVBAR":
      return { ...state, transparentNavbar: action.value };
    case "FIXED_NAVBAR":
      return { ...state, fixedNavbar: action.value };
    case "OPEN_CONFIGURATOR":
      return { ...state, openConfigurator: action.value };
    case "DIRECTION":
      return { ...state, direction: action.value };
    case "LAYOUT":
      return { ...state, layout: action.value };
    case "DARKMODE":
      return { ...state, darkMode: action.value };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function MaterialUIControllerProvider({ children }) {
  const initialState = {
    // Estado de UI
    miniSidenav: false,
    transparentSidenav: false,
    whiteSidenav: false,
    sidenavColor: "info",
    transparentNavbar: true,
    fixedNavbar: true,
    openConfigurator: false,
    direction: "ltr",
    layout: "dashboard",
    darkMode: false,
    // Estado de Autenticação
    token: null,
    user: null,
  };

  const [controller, dispatch] = useReducer(reducer, initialState);

  // Efeito para carregar o token e o usuário do localStorage ao iniciar
  useEffect(() => {
    const initialize = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const response = await axios.get("/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          dispatch({ type: "SET_AUTH", value: { token: storedToken, user: response.data } });
        } catch (error) {
          console.error("Sessão inválida. Deslogando.", error);
          dispatch({ type: "LOGOUT" });
        }
      }
    };
    initialize();
  }, []);

  const value = useMemo(() => [controller, dispatch], [controller, dispatch]);

  return <MaterialUI.Provider value={value}>{children}</MaterialUI.Provider>;
}

function useMaterialUIController() {
  const context = useContext(MaterialUI);
  if (!context) {
    throw new Error("useMaterialUIController should be used inside the MaterialUIControllerProvider.");
  }
  return context;
}

MaterialUIControllerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Funções de Ação (Actions)
const setAuth = (dispatch, { token, user }) => dispatch({ type: "SET_AUTH", value: { token, user } });
const logout = (dispatch) => dispatch({ type: "LOGOUT" });

const setMiniSidenav = (dispatch, value) => dispatch({ type: "MINI_SIDENAV", value });
const setTransparentSidenav = (dispatch, value) => dispatch({ type: "TRANSPARENT_SIDENAV", value });
const setWhiteSidenav = (dispatch, value) => dispatch({ type: "WHITE_SIDENAV", value });
const setSidenavColor = (dispatch, value) => dispatch({ type: "SIDENAV_COLOR", value });
const setTransparentNavbar = (dispatch, value) => dispatch({ type: "TRANSPARENT_NAVBAR", value });
const setFixedNavbar = (dispatch, value) => dispatch({ type: "FIXED_NAVBAR", value });
const setOpenConfigurator = (dispatch, value) => dispatch({ type: "OPEN_CONFIGURATOR", value });
const setDirection = (dispatch, value) => dispatch({ type: "DIRECTION", value });
const setLayout = (dispatch, value) => dispatch({ type: "LAYOUT", value });
const setDarkMode = (dispatch, value) => dispatch({ type: "DARKMODE", value });

export {
  MaterialUIControllerProvider,
  useMaterialUIController,
  setAuth,
  logout,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
  setSidenavColor,
  setTransparentNavbar,
  setFixedNavbar,
  setOpenConfigurator,
  setDirection,
  setLayout,
  setDarkMode,
};