import React from 'react'
import { NavLink } from 'react-router-dom'

const Navigation: React.FC = () => {
  return (
    <nav className="nav">
      <NavLink to="/" className="nav-item">
        首页
      </NavLink>
      <NavLink to="/settings" className="nav-item">
        设置
      </NavLink>
      <NavLink to="/about" className="nav-item">
        关于
      </NavLink>
    </nav>
  )
}

export default Navigation