// app/dashboard/settings/layout.tsx
import React from 'react';

const SettingsLayout = ({ children }) => {
  return (
    <div>
      <h2>Layout Header</h2>
      <main>{children}</main>
    </div>
  );
};

export default SettingsLayout;