import { GoogleLogin } from '@react-oauth/google';
import React from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'expo-router';

export default function Login() {
  const { setUser } = useAuth();
  const router = useRouter();
  return (
    <div>
      <GoogleLogin
        onSuccess={res => {
          setUser(res);
          router.replace('/'); // Redirect to main app after login
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </div>
  );
}
