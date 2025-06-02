import { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Box, Button,
    Drawer, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { GitHub, Menu as MenuIcon } from "@mui/icons-material";
import { NavLink, Link } from "react-router-dom";

const navItems = [
    { to: "/basic",       label: "Basic Map" },
    { to: "/choropleth",  label: "Choropleth" },
    { to: "/heatmap",     label: "Heatmap" },
    { to: "/advanced",    label: "Advanced Map" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const toggle = () => setOpen(o => !o);

    return (
        <>
            <AppBar 
                position="sticky"
                elevation={1}
                sx={{
                    position: 'sticky',        
                    background: 'url(/tartu-cell-towers-viz/image.png) center/cover no-repeat',
                    backgroundColor: 'transparent',   
                    '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 0,
                    },
                }}>
                <Toolbar sx={{ position: 'relative', zIndex: 1 }}>
                    <IconButton
                        onClick={toggle}
                        edge="start"
                        sx={{ 
                            mr: 2, 
                            display: { md: "none" },
                            color: 'white'
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* title */}
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/basic"
                        sx={{ 
                            flexGrow: 1, 
                            textDecoration: "none", 
                            color: "white",
                            fontWeight: 'bold',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}
                    >
                        SDW - Tartu
                    </Typography>

                    {/* desktop links */}
                    <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                        {navItems.map(({ to, label }) => (
                            <Button
                                key={to}
                                component={NavLink}
                                to={to}
                                sx={{
                                    color: 'white',
                                    "&.active": { 
                                        color: "primary.light",
                                        fontWeight: 'bold',
                                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                    },
                                    textTransform: "none",
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                {label}
                            </Button>
                        ))}
                    </Box>

                    {/* GitHub */}
                    <IconButton
                        component="a"
                        href="https://github.com/mohnark"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                            ml: 1,
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        <GitHub />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* mobile drawer */}
            <Drawer anchor="left" open={open} onClose={toggle} sx={{ display: { md: "none" } }}>
                <Box sx={{ width: 250 }} role="presentation" onClick={toggle} onKeyDown={toggle}>
                    <List>
                        {navItems.map(({ to, label }) => (
                            <ListItem key={to} disablePadding>
                                <ListItemButton
                                    component={NavLink}
                                    to={to}
                                    sx={{ 
                                        "&.active .MuiListItemText-root": { 
                                            color: "primary.main",
                                            fontWeight: 'bold'
                                        } 
                                    }}
                                >
                                    <ListItemText primary={label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    );
}
