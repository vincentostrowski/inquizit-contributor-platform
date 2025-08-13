import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CardsPage from './pages/CardsPage';
import SourcesPage from './pages/SourcesPage';
import OrganizePage from './pages/OrganizePage';
import PublishPage from './pages/PublishPage';
import { BookProvider } from './context/BookContext';

function App() {
  return (
    <BrowserRouter>
      <BookProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/sources" replace />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="organize" element={<OrganizePage />} />
            <Route path="publish" element={<PublishPage />} />
          </Route>
        </Routes>
      </BookProvider>
    </BrowserRouter>
  );
}

export default App;
