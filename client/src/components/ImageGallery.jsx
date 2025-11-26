import React, { useState, useEffect } from 'react';
import { getAllImages, updateImageInfo } from '../services/copyrightService';
import { Search, X, Edit2, Save } from 'lucide-react';

export default function ImageGallery({ account }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [filteredImages, setFilteredImages] = useState([]);
  
  // Modal state
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (searchId.trim() === '') {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(img => img.id === searchId.trim());
      setFilteredImages(filtered);
    }
  }, [searchId, images]);

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

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsEditing(false);
    setEditForm({ title: image.title, description: image.description });
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!selectedImage) return;
    
    try {
      setUpdating(true);
      const result = await updateImageInfo(
        selectedImage.id,
        editForm.title,
        editForm.description
      );
      
      if (result.success) {
        // Refresh images
        await loadImages();
        // Update selected image locally to reflect changes immediately in modal
        setSelectedImage({
          ...selectedImage,
          title: editForm.title,
          description: editForm.description
        });
        setIsEditing(false);
        alert('更新成功！');
      } else {
        alert('更新失败: ' + result.error);
      }
    } catch (error) {
      console.error('更新出错:', error);
      alert('更新出错');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">所有图片 ({images.length})</h2>
        
        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            placeholder="输入ID查询图片..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>
      
      {filteredImages.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchId ? `未找到 ID 为 ${searchId} 的图片` : '暂无图片'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div 
              key={image.id} 
              className="border rounded-lg overflow-hidden shadow cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://via.placeholder.com/150?text=IPFS+Error';
                }}
              />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg truncate flex-1">{image.title}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {image.id}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{image.description}</p>
                <div className="mt-3 text-xs text-gray-500">
                  <p>作者: {image.author.slice(0, 10)}...</p>
                  <p>时间: {image.timestamp.toLocaleString('zh-CN')}</p>
                  <p>IPFS: {image.ipfsHash.slice(0, 15)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">
                {isEditing ? '编辑图片信息' : '图片详情'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full max-h-96 object-contain rounded bg-gray-100"
              />
              
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-24"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="font-bold text-lg">{selectedImage.title}</h4>
                      <p className="text-gray-600 mt-2">{selectedImage.description}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm break-all">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500 font-medium">图片 ID:</span>
                        <span className="col-span-2">{selectedImage.id}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500 font-medium">作者地址:</span>
                        <span className="col-span-2 font-mono">{selectedImage.author}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500 font-medium">IPFS 哈希:</span>
                        <span className="col-span-2 font-mono">{selectedImage.ipfsHash}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500 font-medium">上传时间:</span>
                        <span className="col-span-2">{selectedImage.timestamp.toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 sticky bottom-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                    disabled={updating}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    {updating ? '保存中...' : <><Save className="w-4 h-4 mr-2" /> 保存</>}
                  </button>
                </>
              ) : (
                <>
                  {account && selectedImage.author.toLowerCase() === account.toLowerCase() && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 flex items-center"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> 编辑信息
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                  >
                    关闭
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
