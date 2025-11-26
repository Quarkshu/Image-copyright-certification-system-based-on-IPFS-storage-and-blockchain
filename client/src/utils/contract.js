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
    if (!window.ethereum) throw new Error('请安装 MetaMask');
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
  if (!window.ethereum) return;
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  const ganacheChainId = '0x' + (1337).toString(16); // 0x539
  
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
