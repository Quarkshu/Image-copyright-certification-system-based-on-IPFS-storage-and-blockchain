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
    let imageId = null;
    for (const log of receipt.logs) {
        try {
            const parsedLog = contract.interface.parseLog(log);
            if (parsedLog.name === 'ImageUploaded') {
                imageId = parsedLog.args.id;
                break;
            }
        } catch (e) {
            continue;
        }
    }
    
    return {
      success: true,
      imageId: imageId ? imageId.toString() : 'Unknown',
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
 * 更新图片信息
 */
export async function updateImageInfo(id, title, description) {
  try {
    const contract = await getContract(true); // 需要签名
    console.log('正在更新图片信息...', id, title, description);
    const tx = await contract.updateImageInfo(id, title, description);
    
    console.log('等待确认...');
    await tx.wait();
    console.log('更新成功');
    
    return { success: true };
  } catch (error) {
    console.error('更新失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 根据ID获取图片
 */
export async function getImageById(id) {
  try {
    const contract = await getContract(false);
    const img = await contract.getImage(id);
    
    return {
      id: img.id.toString(),
      ipfsHash: img.ipfsHash,
      title: img.title,
      description: img.description,
      author: img.author,
      timestamp: new Date(Number(img.timestamp) * 1000),
      imageUrl: getIPFSUrl(img.ipfsHash)
    };
  } catch (error) {
    console.error('获取图片详情失败:', error);
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
