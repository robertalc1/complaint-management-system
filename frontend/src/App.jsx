import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from "./pages/Register";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LocationPreselectionForm from "./forms/LocationPreselectionForm";
import ComplaintForm from "./forms/ComplaintForm";
import FilterComplaintFormFixed from "./forms/FilterComplaintFormFixed";
import EditComplaintForm from "./forms/EditComplaintForm";
import ReportGenerator from "./forms/ReportGenerator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contract" element={<LocationPreselectionForm />} />
          <Route path="contestatii-form" element={<ComplaintForm />} /> {/* Rută nouă */}
          <Route path="filter-contestatii" element={<FilterComplaintFormFixed />} />
          <Route path="edit-contestatie/:id" element={<EditComplaintForm />} />
          <Route path="generare-raport" element={<ReportGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
