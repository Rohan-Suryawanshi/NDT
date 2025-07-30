// src/pages/NotFound.jsx

import React from 'react';

const NotFound = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 text-lg">
        You don’t have any content here. When something is available, you’ll see it here.
      </p>
    </div>
  );
};

export default NotFound;
