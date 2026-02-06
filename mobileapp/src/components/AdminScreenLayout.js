import React from 'react';
import ScreenLayout from './ScreenLayout';
import UserHeader from './UserHeader';

export default function AdminScreenLayout({ children }) {
  return (
    <ScreenLayout>
      <UserHeader />
      {children}
    </ScreenLayout>
  );
}
