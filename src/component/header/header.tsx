import React from 'react'

export const Header: React.FC = () => {
  return (
    <div className='navbar navbar-dark bg-dark shadow-sm fixed-top'>
      <div className='container d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none'>
        <span id='header-title'>SQL 產生器</span>
        <div className='offcanvas-body p-4 pt-0 p-lg-0'>
          <ul className='navbar-nav flex-row flex-wrap bd-navbar-nav px-5 justify-content-end'>
            <li className='nav-item col-6 col-lg-auto'>
              <button className='nav-link py-2 px-0 px-lg-2 header-bar' id='download-example-button'>Example</button>
            </li>
            <li className='nav-item col-6 col-lg-auto'></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
