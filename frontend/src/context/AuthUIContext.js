import React from 'react';

// Simple UI context to allow pages/components to open the Login/Signup modal from anywhere
export const AuthUIContext = React.createContext({
  openLoginModal: () => {},
  closeLoginModal: () => {},
});

export default AuthUIContext;
