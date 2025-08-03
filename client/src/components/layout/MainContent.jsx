import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import NoBookSelected from './NoBookSelected';

const MainContent = ({ currentBook }) => {
  if (!currentBook) {
    return <NoBookSelected />;
  }

  return (
    <>
      <Navigation currentBook={currentBook} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </>
  );
};

export default MainContent; 