import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { Outlet } from "react-router-dom";

const CustomerTemplate = () => {
  return (
    <div className="cine-atmosphere min-h-screen">
      <div className="cine-blob cine-blob-a" aria-hidden="true" />
      <div className="cine-blob cine-blob-b" aria-hidden="true" />
      <div className="cine-blob cine-blob-c" aria-hidden="true" />
      <div className="relative z-10">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
};

export default CustomerTemplate;
