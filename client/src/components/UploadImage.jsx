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
              <p className="mt-2 text-sm break-all">
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
