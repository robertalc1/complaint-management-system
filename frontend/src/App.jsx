import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Layout from './Layout';
import Login from './Login';
import Dashboard from './Dashboard';
import LocationPreselectionForm from './LocationPreselectionForm'; // Noul component
import ComplaintForm from './ComplaintForm';
import FilterComplaintFormFixed from './FilterComplaintFormFixed';
import EditComplaintForm from './EditComplaintForm';
import ReportGenerator from './ReportGenerator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contestatii" element={<LocationPreselectionForm />} /> {/* Actualizat */}
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
