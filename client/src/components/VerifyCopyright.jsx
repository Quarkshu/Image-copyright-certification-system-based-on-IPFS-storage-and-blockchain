import React, { useState } from 'react';
import { verifyCopyright } from '../services/copyrightService';

export default function VerifyCopyright() {
  const [ipfsHash, setIpfsHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!ipfsHash) return;
    
    setLoading(true);
    try {
      const data = await verifyCopyright(ipfsHash);
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">验证图片版权</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            输入 IPFS 哈希
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              placeholder="Qm..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? '验证中...' : '验证'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded ${result.verified ? 'bg-green-50' : 'bg-yellow-50'}`}>
            {result.verified ? (
              <div>
                <h3 className="text-green-800 font-bold text-lg">✓ 版权已登记</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>标题:</strong> {result.title}</p>
                  <p><strong>版权所有者:</strong> {result.owner}</p>
                  <p><strong>登记时间:</strong> {result.timestamp.toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-yellow-800 font-bold">⚠ 未找到版权登记</h3>
                <p className="mt-2 text-sm">该图片未在区块链上登记版权信息</p>
              </div>
            )}
            {result.error && (
                <div className="text-red-600">Error: {result.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
