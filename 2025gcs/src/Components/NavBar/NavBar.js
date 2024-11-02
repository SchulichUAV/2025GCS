import React from 'react';

const NavBar = () => (
  <nav className="w-full flex items-center justify-between px-8 py-4 bg-gray-800 text-white fixed top-0">
    <div className="space-x-5 flex items-center">
      <img src="SUAVIcon.jpg" alt="Logo" className="h-12 w-12 px-1 py-1" /> {/* need transparent logo, ask on saturday */}
      <label className="font-bold">Ground Control Station</label>
    </div>
    <div className="space-x-4">
      <a href="#home" className="hover:underline">Home</a>
      <a href="#data" className="hover:underline">Data</a>
    </div>
  </nav>
);

export default NavBar;
