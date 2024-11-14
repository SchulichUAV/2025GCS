import React from 'react';

const NavBar = () => (
  <nav className="w-full flex items-center justify-between px-3 py-4 bg-gray-950 text-white fixed top-0">
    <div className="space-x-5 flex items-center">
      {/* <a href="https://schulichuav.ca/"> */} {/* Uncomment this line to make the logo a link */}
      <img src="/SUAVIcon.png" alt="Logo" className="h-10 w-10" />
      {/* </a> */}
      <label className="font-bold text-xl">Ground Control Station</label>
    </div>
    <div className="space-x-8 mr-6">
      <a className="group transition-all ease-in-out hover:text-lg duration-300" href="home">
        <span class="bg-left-bottom bg-gradient-to-r from-gray-100 to-gray-200 bg-[length:0%_2px] bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500 ease-out">
          Home
        </span>
      </a>
      <a className="group transition-all ease-in-out hover:text-lg duration-300" href="data">
        <span class="bg-left-bottom bg-gradient-to-r from-gray-100 to-gray-200 bg-[length:0%_2px] bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500 ease-out">
          Data
        </span>
      </a>
    </div>
  </nav >
);

export default NavBar;
