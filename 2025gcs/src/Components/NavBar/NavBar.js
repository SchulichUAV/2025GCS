import React from 'react';

const NavBar = () => (
  <nav className="w-full flex items-center justify-between px-8 py-4 bg-gray-800 text-white fixed top-0">
    <div className="text-xl font-bold">🚀</div>
    <div className="space-x-4">
      <a href="#home" className="hover:underline">Home</a>
      <a href="#data" className="hover:underline">Data</a>
    </div>
  </nav>
);

export default NavBar;
