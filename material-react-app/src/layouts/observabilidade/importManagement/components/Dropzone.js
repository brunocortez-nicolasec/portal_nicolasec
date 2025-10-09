// material-react-app/src/layouts/observabilidade/importManagement/components/Dropzone.js

import React from "react";
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function Dropzone({ file, onFileSelect, system, disabled = false, disabledText }) {
  const handleLocalDragOver = (e) => {
    e.preventDefault();
  };

  const handleLocalDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        onFileSelect(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  let message = disabledText;
  if (!disabled) {
    message = file ? file.name : "Arraste e solte o arquivo ou clique aqui";
  }

  const inputId = `file-input-${system || 'default'}`;

  return (
    <MDBox
      sx={{
        border: "2px dashed",
        borderColor: "lightgray",
        borderRadius: "10px",
        textAlign: "center",
        padding: "24px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.3s ease-in-out",
        backgroundColor: disabled ? "#fafafa" : "transparent"
      }}
      onClick={() => {
        if (!disabled) {
          document.getElementById(inputId).click();
        }
      }}
      onDragOver={handleLocalDragOver}
      onDrop={handleLocalDrop}
    >
      <Icon fontSize="large" color={disabled ? "disabled" : "secondary"}>upload_file</Icon>
      <MDTypography variant="h6" mt={1} fontSize="1rem">
        {message}
      </MDTypography>
      <input
        id={inputId}
        type="file"
        accept=".csv"
        hidden
        disabled={disabled}
        onChange={handleFileChange}
        // Adiciona um key para forçar a remontagem e permitir selecionar o mesmo arquivo novamente
        key={file ? file.name : 'empty-input'}
      />
    </MDBox>
  );
}

Dropzone.propTypes = {
  file: PropTypes.object,
  onFileSelect: PropTypes.func.isRequired,
  system: PropTypes.string,
  disabled: PropTypes.bool,
  disabledText: PropTypes.string.isRequired,
};

Dropzone.defaultProps = {
  file: null,
  system: 'default',
  disabled: false,
};

export default Dropzone;