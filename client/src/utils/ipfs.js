import { create } from 'ipfs-http-client';

// 连接到本地 IPFS 节点
// 注意: 浏览器中直接连接 IPFS API 可能会遇到 CORS 问题
// 需要配置 IPFS 节点允许 CORS
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
