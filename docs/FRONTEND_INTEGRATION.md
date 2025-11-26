# 前端集成指南

本文档说明如何在前端应用中集成图片版权存证智能合约。

## 技术选型建议

### 推荐技术栈

- **Web3 库**: Ethers.js v6
- **前端框架**: React 
- **UI 框架**: TailwindCSS + shadcn/ui
- **IPFS 客户端**: ipfs-http-client
- **钱包连接**: MetaMask

## 第一步：安装依赖

```bash
npm install ethers ipfs-http-client
# 或使用 Web3.js
npm install web3 ipfs-http-client
```

## 第二步：配置合约连接

### 2.1 获取合约 ABI 和地址

部署合约后，从 `build/contracts/ImageCopyright.json` 复制 ABI。

创建配置文件 `src/config/contract.js`:

```javascript
// 合约地址（从部署输出中获取）
export const CONTRACT_ADDRESS = "0x...你的合约地址";

// 合约 ABI（从 build/contracts/ImageCopyright.json 复制）
export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_ipfsHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "uploadImage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... 其他 ABI 定义
];

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 5777, // Ganache 默认
  chainName: "Ganache Local",
  rpcUrl: "http://127.0.0.1:7545",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  }
};
```

### 2.2 创建合约实例（使用 Ethers.js）

`src/utils/contract.js`:

```javascript
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

/**
 * 获取合约实例
 * @param {boolean} needSigner - 是否需要签名者（写操作需要）
 */
export async function getContract(needSigner = false) {
  // 连接到 Ganache
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
  
  if (needSigner) {
    // 请求用户授权（MetaMask）
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  } else {
    // 只读操作
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }
}

/**
 * 连接 MetaMask
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask!');
  }
  
  try {
    // 请求账户访问
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    return accounts[0];
  } catch (error) {
    console.error('连接钱包失败:', error);
    throw error;
  }
}

/**
 * 检查并切换到正确的网络
 */
export async function checkNetwork() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  const ganacheChainId = '0x' + (5777).toString(16); // 0x1691
  
  if (chainId !== ganacheChainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ganacheChainId }],
      });
    } catch (switchError) {
      // 网络不存在，添加网络
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: ganacheChainId,
            chainName: 'Ganache Local',
            rpcUrls: ['http://127.0.0.1:7545'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            }
          }]
        });
      }
    }
  }
}
```

## 第三步：IPFS 集成

`src/utils/ipfs.js`:

```javascript
import { create } from 'ipfs-http-client';

// 连接到本地 IPFS 节点
const ipfs = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http'
});

/**
 * 上传文件到 IPFS
 * @param {File} file - 文件对象
 * @returns {string} IPFS CID
 */
export async function uploadToIPFS(file) {
  try {
    const added = await ipfs.add(file);
    console.log('IPFS CID:', added.path);
    return added.path;
  } catch (error) {
    console.error('IPFS 上传失败:', error);
    throw error;
  }
}

/**
 * 获取 IPFS 文件 URL
 * @param {string} cid - IPFS CID
 * @returns {string} URL
 */
export function getIPFSUrl(cid) {
  return `http://localhost:8080/ipfs/${cid}`;
  // 或使用公共网关
  // return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * 使用 Pinata 上传（可选，更可靠）
 */
export async function uploadToPinata(file, pinataApiKey, pinataSecretKey) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretKey
    },
    body: formData
  });
  
  const data = await response.json();
  return data.IpfsHash;
}
```

## 第四步：核心功能实现

`src/services/copyrightService.js`:

```javascript
import { getContract } from '../utils/contract';
import { uploadToIPFS, getIPFSUrl } from '../utils/ipfs';

/**
 * 上传图片并登记版权
 */
export async function registerCopyright(file, title, description) {
  try {
    // 1. 上传文件到 IPFS
    console.log('正在上传到 IPFS...');
    const ipfsHash = await uploadToIPFS(file);
    console.log('IPFS 哈希:', ipfsHash);
    
    // 2. 将 IPFS 哈希写入区块链
    console.log('正在上链...');
    const contract = await getContract(true); // 需要签名
    const tx = await contract.uploadImage(ipfsHash, title, description);
    
    // 3. 等待交易确认
    console.log('等待确认...');
    const receipt = await tx.wait();
    console.log('交易成功:', receipt.hash);
    
    // 4. 从事件中获取图片 ID
    const event = receipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'ImageUploaded';
      } catch {
        return false;
      }
    });
    
    const imageId = event ? contract.interface.parseLog(event).args.id : null;
    
    return {
      success: true,
      imageId: imageId.toString(),
      ipfsHash,
      txHash: receipt.hash,
      imageUrl: getIPFSUrl(ipfsHash)
    };
  } catch (error) {
    console.error('上传失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取所有图片
 */
export async function getAllImages() {
  try {
    const contract = await getContract(false); // 只读
    const images = await contract.getAllImages();
    
    return images.map(img => ({
      id: img.id.toString(),
      ipfsHash: img.ipfsHash,
      title: img.title,
      description: img.description,
      author: img.author,
      timestamp: new Date(Number(img.timestamp) * 1000),
      imageUrl: getIPFSUrl(img.ipfsHash)
    }));
  } catch (error) {
    console.error('获取图片失败:', error);
    throw error;
  }
}

/**
 * 获取我的图片
 */
export async function getMyImages(address) {
  try {
    const contract = await getContract(false);
    const images = await contract.getImagesByAuthor(address);
    
    return images.map(img => ({
      id: img.id.toString(),
      ipfsHash: img.ipfsHash,
      title: img.title,
      description: img.description,
      author: img.author,
      timestamp: new Date(Number(img.timestamp) * 1000),
      imageUrl: getIPFSUrl(img.ipfsHash)
    }));
  } catch (error) {
    console.error('获取我的图片失败:', error);
    throw error;
  }
}

/**
 * 验证图片版权
 */
export async function verifyCopyright(ipfsHash) {
  try {
    const contract = await getContract(false);
    const exists = await contract.verifyImageHash(ipfsHash);
    
    if (exists) {
      const image = await contract.getImageByHash(ipfsHash);
      return {
        verified: true,
        owner: image.author,
        title: image.title,
        timestamp: new Date(Number(image.timestamp) * 1000)
      };
    }
    
    return { verified: false };
  } catch (error) {
    console.error('验证失败:', error);
    throw error;
  }
}

/**
 * 监听上传事件
 */
export function watchUploadEvents(callback) {
  getContract(false).then(contract => {
    contract.on('ImageUploaded', (id, ipfsHash, title, author, timestamp) => {
      callback({
        id: id.toString(),
        ipfsHash,
        title,
        author,
        timestamp: new Date(Number(timestamp) * 1000)
      });
    });
  });
}
```

## 第五步：React 组件示例

### 5.1 上传组件

`src/components/UploadImage.jsx`:

```jsx
import React, { useState } from 'react';
import { registerCopyright } from '../services/copyrightService';
import { connectWallet } from '../utils/contract';

export default function UploadImage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !title) {
      alert('请选择文件并填写标题');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 连接钱包
      await connectWallet();
      
      // 上传并登记
      const result = await registerCopyright(file, title, description);
      setResult(result);
      
      if (result.success) {
        // 重置表单
        setFile(null);
        setTitle('');
        setDescription('');
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">上传图片并登记版权</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            选择图片
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
          />
          {file && (
            <img
              src={URL.createObjectURL(file)}
              alt="预览"
              className="mt-2 max-w-xs rounded"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            图片标题 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            图片描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '上传中...' : '上传并登记版权'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {result.success ? (
            <div>
              <h3 className="text-green-800 font-bold">✓ 上传成功！</h3>
              <p className="mt-2 text-sm">
                图片 ID: {result.imageId}<br />
                IPFS 哈希: {result.ipfsHash}<br />
                交易哈希: {result.txHash}
              </p>
              <a
                href={result.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2 inline-block"
              >
                查看图片
              </a>
            </div>
          ) : (
            <div>
              <h3 className="text-red-800 font-bold">✗ 上传失败</h3>
              <p className="mt-2 text-sm">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 5.2 图片列表组件

`src/components/ImageGallery.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { getAllImages } from '../services/copyrightService';

export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const data = await getAllImages();
      setImages(data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">所有图片 ({images.length})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} className="border rounded-lg overflow-hidden shadow">
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg">{image.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{image.description}</p>
              <div className="mt-3 text-xs text-gray-500">
                <p>作者: {image.author.slice(0, 10)}...</p>
                <p>时间: {image.timestamp.toLocaleString('zh-CN')}</p>
                <p>IPFS: {image.ipfsHash.slice(0, 15)}...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 版权验证组件

`src/components/VerifyCopyright.jsx`:

```jsx
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
          </div>
        )}
      </div>
    </div>
  );
}
```

## 第六步：主应用

`src/App.jsx`:

```jsx
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
          <h1 className="text-2xl font-bold">图片版权存证系统</h1>
          {account ? (
            <div className="text-sm">
              已连接: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                className={`py-4 px-2 border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600'
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
        {activeTab === 'gallery' && <ImageGallery />}
        {activeTab === 'verify' && <VerifyCopyright />}
      </main>
    </div>
  );
}
```

## 总结

这个集成方案提供了：

✅ **完整的区块链交互**：连接钱包、发送交易、读取数据  
✅ **IPFS 集成**：上传文件、获取 URL  
✅ **核心功能**：上传、查询、验证版权  
✅ **用户友好的界面**：React 组件示例  

你可以基于这些代码快速搭建完整的前端应用！
