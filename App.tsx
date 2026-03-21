import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OrderForm from './pages/OrderForm';
import AdminDashboardPage from './pages/AdminDashboardPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<OrderForm />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Routes>
  );
};

export default App;