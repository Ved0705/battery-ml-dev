import React, { useState } from 'react';
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';

export default function AuthNavigator() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  
  // A simple conditional renderer acting as our auth stack navigator
  if (mode === 'login') {
    return <LoginScreen setMode={setMode} />;
  }
  
  return <SignupScreen setMode={setMode} />;
}
