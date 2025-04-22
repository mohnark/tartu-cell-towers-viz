import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer";
import BasicMap from "./components/BasicMap";
import ChoroplethMap from "./components/ChoroplethMap";
import Heatmap from "./components/HeatMap";

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Navigate to="/basic" replace />} />
                    <Route path="/basic" element={<BasicMap />} />
                    <Route path="/choropleth" element={<ChoroplethMap />} />
                    <Route path="/heatmap" element={<Heatmap />} />
                </Routes>
                <Footer />
            </Router>
        </ThemeProvider>
    );
}
