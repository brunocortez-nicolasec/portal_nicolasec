// material-react-app/src/layouts/authentication/components/CoverLayout/index.js

import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import PageLayout from "examples/LayoutContainers/PageLayout";
import Footer from "examples/Footer";

function CoverLayout({ coverHeight, image, children }) {
  // Define a altura do footer (ajuste se necessário)
  const footerHeight = "60px"; // Exemplo, ajuste conforme o seu footer

  return (
    // 1. PageLayout agora tem position: relative e flex column
    <PageLayout sx={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* 2. Container para o conteúdo principal */}
      {/* Adiciona padding-bottom igual (ou maior) que a altura do footer */}
      <MDBox sx={{ flexGrow: 1, paddingBottom: footerHeight /* Garante espaço para o footer */ }}>

        {/* Box da Imagem de Fundo */}
        <MDBox
          width="calc(100% - 2rem)"
          minHeight={coverHeight}
          borderRadius="xl"
          mx={2}
          my={2}
          pt={6}
          // Padding inferior pode ser menor agora, pois o espaço é garantido pelo container pai
          pb={15} 
          sx={{
            backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
              image &&
              `${linearGradient(
                rgba(gradients.dark.main, 0.4),
                rgba(gradients.dark.state, 0.4)
              )}, url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: 'relative', // Para o posicionamento do Card
          }}
        />

        {/* Box que centraliza o Formulário (Card) */}
        <MDBox
          mt={{ xs: -20, lg: -18 }} // Puxa para cima da imagem
          px={1}
          width="calc(100% - 2rem)"
          mx="auto"
          position="relative" 
          zIndex={2}
        >
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
              {children} {/* Renderiza o Card */}
            </Grid>
          </Grid>
        </MDBox>
      
      {/* Fim do container do conteúdo principal */}
      </MDBox>

      {/* 3. Footer posicionado absolutamente no final */}
      <MDBox 
        component="footer" // Boa prática usar a tag semântica
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '100%',
          // Adicione padding se o seu componente Footer não tiver
          // py: 2, 
          // px: 2,
        }}
      >
        <Footer />
      </MDBox>
      
    </PageLayout>
  );
}

CoverLayout.defaultProps = {
  coverHeight: "35vh",
};

CoverLayout.propTypes = {
  coverHeight: PropTypes.string,
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default CoverLayout;