import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
 
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
 
  if (!user || !user.isLoggedIn) {
    // Redirect to unauthorized page, but save the current location they were trying to go to
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
 
  return children;
};
 
export default ProtectedRoute;