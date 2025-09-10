import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import backgroundImage from "assets/images/bg-profile.jpeg";
import defaultAvatar from "../../../assets/images/default-avatar.jpg"; // Corrigido o caminho para .png se necessário

// --- MUDANÇA 1: Adicionada a prop "onAvatarClick" ---
function Header({ name, role, profileImage, onAvatarClick, children }) {
  return (
    <MDBox position="relative" mb={5}>
      <MDBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "50%",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          position: "relative",
          mt: -8,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            {/* --- MUDANÇA 2: Adicionado onClick e o estilo do cursor --- */}
            <MDAvatar
              src={profileImage || defaultAvatar}
              alt="profile-image"
              size="xl"
              shadow="sm"
              onClick={onAvatarClick}
              sx={{ cursor: "pointer" }}
            />
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {name || "Carregando..."}
              </MDTypography>
              {role && (
                <MDTypography variant="button" color="text" fontWeight="regular">
                  {role}
                </MDTypography>
              )}
            </MDBox>
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  );
}

// --- MUDANÇA 3: Adicionada a nova prop aos defaultProps e propTypes ---
Header.defaultProps = {
  children: "",
  name: "",
  role: "",
  profileImage: null,
  onAvatarClick: () => {}, // Valor padrão para a função de clique
};

Header.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string,
  role: PropTypes.string,
  profileImage: PropTypes.string,
  onAvatarClick: PropTypes.func, // Tipo da nova prop
};

export default Header;