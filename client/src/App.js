import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UniversityServices from './components/UniversityServices';
import JobOffers from './components/JobOffers';
import Chat from './components/Chat';
import Calendar from './components/Calendar';
import Classes from './components/Classes';
import ClaseDetail from './components/ClaseDetail';
import Exams from './components/Exams';
import ExamsDetail from './components/ExamsDetail';
import LayoutWithNavbar from './components/LayoutWithNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import RespuestasExam from './components/RespuestasExam';
import NotFound from './components/NotFound';


function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />


        {/* Rutas protegidas con layout y navbar */}
        <Route path="/university" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <UniversityServices />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/jobs" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <JobOffers />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/chat" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <Chat />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/calendar" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <Calendar />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/classes" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <Classes />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/classes/:id" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <ClaseDetail />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/exams" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <Exams />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/exams/:id" element={
          <ProtectedRoute>
            <LayoutWithNavbar>
              <ExamsDetail />
            </LayoutWithNavbar>
          </ProtectedRoute>
        }/>
        <Route path="/responder-examen/:id" element={
  <ProtectedRoute>
    <LayoutWithNavbar>
      <RespuestasExam />
    </LayoutWithNavbar>
  </ProtectedRoute>
}/>
      </Routes>
    </Router>
  );
}

export default App;
