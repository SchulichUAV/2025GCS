import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation();

  const getNavLinkClass = (path) =>
    `group transition-all ease-in-out duration-300 ${
      location.pathname === path ? 'text-gray-300 font-semibold' : ''
    }`;

  const getUnderlineClass = (path) =>
    `bg-left-bottom bg-gradient-to-r from-gray-100 to-gray-200 bg-no-repeat transition-all duration-500 ease-out ${
      location.pathname === path ? 'bg-[length:100%_2px]' : 'bg-[length:0%_2px]'
    } group-hover:bg-[length:100%_2px]`;

  return (
    <nav className="z-10 w-full flex items-center justify-between px-3 py-4 bg-gray-950 text-white fixed top-0">
      <div className="space-x-5 flex items-center">
        <img src="/SUAVIcon.png" alt="Logo" className="h-10 w-10" />
        <label className="font-bold text-xl">Ground Control Station</label>
      </div>
      <div className="space-x-8 mr-6">
        <Link className={getNavLinkClass('/')} to="/">
          <span className={getUnderlineClass('/')}>Home</span>
        </Link>
        <Link className={getNavLinkClass('/data')} to="/data">
          <span className={getUnderlineClass('/data')}>Data</span>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
