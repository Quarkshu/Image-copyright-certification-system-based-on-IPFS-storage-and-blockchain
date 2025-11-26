import React, { useState, useEffect } from 'react';
import { connectWallet, checkNetwork } from './utils/contract';
import UploadImage from './components/UploadImage';
import ImageGallery from './components/ImageGallery';
import VerifyCopyright from './components/VerifyCopyright';

export default function App() {
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    // 监听账户变化
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
      });
      
      // 尝试获取当前连接的账户
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        });
    }
  }, []);

  const handleConnect = async () => {
    try {
      await checkNetwork();
      const address = await connectWallet();
      setAccount(address);
    } catch (error) {
      alert('连接失败: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">图片版权存证系统</h1>
          {account ? (
            <div className="text-sm text-green-600 font-medium">
              已连接: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              连接钱包
            </button>
          )}
        </div>
      </header>

      {/* 导航 */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['upload', 'gallery', 'verify'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'upload' && '上传图片'}
                {tab === 'gallery' && '图片库'}
                {tab === 'verify' && '版权验证'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 内容区 */}
      <main className="py-8">
        {activeTab === 'upload' && <UploadImage />}
        {activeTab === 'gallery' && <ImageGallery account={account} />}
        {activeTab === 'verify' && <VerifyCopyright />}
      </main>
    </div>
  );
}
