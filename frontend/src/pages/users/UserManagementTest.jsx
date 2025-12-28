import { useState } from 'react';

const UserManagementTest = () => {
  const [test, setTest] = useState('Working!');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Management Test</h1>
      <p className="mt-4">{test}</p>
      <button 
        onClick={() => setTest('Button clicked!')}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Test Button
      </button>
    </div>
  );
};

export default UserManagementTest;
