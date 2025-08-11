import React, { useState } from 'react';
import { PaymentsAPI, getToken, setToken } from '../../lib/api';

const PaymentsPage: React.FC = () => {
  const [provider, setProvider] = useState<'razorpay'|'stripe'>('razorpay');
  const [amount, setAmount] = useState(10000);
  const [currency, setCurrency] = useState('INR');
  const [rideId, setRideId] = useState('');
  const [providerRef, setProviderRef] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [tokenInput, setTokenInput] = useState(getToken() || '');
  const [msg, setMsg] = useState('');

  const saveToken = () => setToken(tokenInput);

  const startIntent = async () => {
    setMsg('');
    const res = await PaymentsAPI.intent({ provider, amount, currency, rideId });
    setMsg(JSON.stringify(res.data));
    if (provider === 'razorpay') setProviderRef(res.data.order.id);
    setPaymentId(res.data.paymentId || '');
  };

  const authPay = async () => {
    setMsg('');
    const res = await PaymentsAPI.authorize({ provider, providerRef });
    setMsg(JSON.stringify(res.data));
  };

  const capturePay = async () => {
    setMsg('');
    const res = await PaymentsAPI.capture({ provider, providerRef, amount, currency });
    setMsg(JSON.stringify(res.data));
  };

  const refundPay = async () => {
    setMsg('');
    const res = await PaymentsAPI.refund({ provider, providerRef, amount });
    setMsg(JSON.stringify(res.data));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Admin JWT token" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="border rounded px-3 py-2 w-96" />
          <button onClick={saveToken} className="bg-blue-600 text-white px-4 py-2 rounded">Set Token</button>
        </div>
      </div>

      <div className="bg-white border rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={provider} onChange={e=>setProvider(e.target.value as any)} className="border rounded px-3 py-2">
          <option value="razorpay">Razorpay</option>
          <option value="stripe">Stripe</option>
        </select>
        <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} className="border rounded px-3 py-2" placeholder="Amount (paise)" />
        <input type="text" value={currency} onChange={e=>setCurrency(e.target.value)} className="border rounded px-3 py-2" placeholder="Currency" />
        <input type="text" value={rideId} onChange={e=>setRideId(e.target.value)} className="border rounded px-3 py-2" placeholder="Ride ID (optional)" />
        <input type="text" value={providerRef} onChange={e=>setProviderRef(e.target.value)} className="border rounded px-3 py-2 md:col-span-2" placeholder="Provider Ref (intent id / order id / payment id)" />
        <div className="md:col-span-2 flex gap-2">
          <button onClick={startIntent} className="px-4 py-2 bg-emerald-600 text-white rounded">Start Intent</button>
          <button onClick={authPay} className="px-4 py-2 border rounded">Authorize</button>
          <button onClick={capturePay} className="px-4 py-2 border rounded">Capture</button>
          <button onClick={refundPay} className="px-4 py-2 border rounded">Refund</button>
          {paymentId && <a href={PaymentsAPI.receiptUrl(paymentId)} target="_blank" className="px-4 py-2 border rounded">Receipt PDF</a>}
        </div>
      </div>

      <pre className="bg-gray-50 border rounded p-4 text-sm whitespace-pre-wrap">{msg}</pre>
    </div>
  );
};

export default PaymentsPage;