import React, { useEffect, useState } from 'react';
import { AdminAPI, DriverAPI, getToken, setToken } from '../../lib/api';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [tokenInput, setTokenInput] = useState(getToken() || '');

  const load = async () => {
    try { const res = await AdminAPI.users(); setUsers(res.data); } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (u: any) => {
    try { await AdminAPI.updateUser(u._id, { isActive: !u.isActive }); await load(); } catch (e: any) { setError(e.message); }
  };

  const setVerification = async (u: any, status: 'pending'|'approved'|'rejected') => {
    try { await DriverAPI.setVerification(u._id, status); await load(); } catch (e: any) { setError(e.message); }
  };

  const saveToken = () => setToken(tokenInput);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Admin JWT token" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="border rounded px-3 py-2 w-96" />
          <button onClick={saveToken} className="bg-blue-600 text-white px-4 py-2 rounded">Set Token</button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="bg-white border rounded">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Active</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">{u.isActive ? 'Yes' : 'No'}</td>
                <td className="p-3">{u.role==='driver' ? (u.driver?.verificationStatus || 'pending') : '-'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={()=>toggleActive(u)} className="px-3 py-1 rounded border">{u.isActive?'Disable':'Enable'}</button>
                  {u.role==='driver' && (
                    <>
                      <button onClick={()=>setVerification(u,'approved')} className="px-3 py-1 rounded border">Approve</button>
                      <button onClick={()=>setVerification(u,'rejected')} className="px-3 py-1 rounded border">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;