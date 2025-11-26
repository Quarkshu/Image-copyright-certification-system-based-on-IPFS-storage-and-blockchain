// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @title ImageCopyright
 * @dev 图片版权存证智能合约
 * @notice 用于将图片IPFS哈希上链，实现版权保护
 */
contract ImageCopyright {
    
    // 图片信息结构体
    struct Image {
        uint256 id;              // 图片唯一ID
        string ipfsHash;         // IPFS哈希值(CID)
        string title;            // 图片标题
        string description;      // 图片描述（可选）
        address author;          // 作者钱包地址
        uint256 timestamp;       // 上链时间戳
        bool exists;             // 是否存在（用于验证）
    }
    
    // 状态变量
    uint256 public imageCount;                          // 图片总数
    mapping(uint256 => Image) public images;            // ID到图片的映射
    mapping(string => bool) public ipfsHashExists;      // IPFS哈希是否已存在
    mapping(address => uint256[]) public authorImages;  // 作者到图片ID列表的映射
    
    // 事件定义
    event ImageUploaded(
        uint256 indexed id,
        string ipfsHash,
        string title,
        address indexed author,
        uint256 timestamp
    );
    
    event ImageUpdated(
        uint256 indexed id,
        string newTitle,
        string newDescription,
        uint256 timestamp
    );
    
    /**
     * @dev 上传图片版权信息
     * @param _ipfsHash IPFS哈希值
     * @param _title 图片标题
     * @param _description 图片描述
     */
    function uploadImage(
        string memory _ipfsHash,
        string memory _title,
        string memory _description
    ) public returns (uint256) {
        // 输入验证
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(!ipfsHashExists[_ipfsHash], "This image hash already exists");
        
        // 创建新图片记录
        imageCount++;
        uint256 newImageId = imageCount;
        
        images[newImageId] = Image({
            id: newImageId,
            ipfsHash: _ipfsHash,
            title: _title,
            description: _description,
            author: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // 标记哈希已存在
        ipfsHashExists[_ipfsHash] = true;
        
        // 添加到作者的图片列表
        authorImages[msg.sender].push(newImageId);
        
        // 触发事件
        emit ImageUploaded(
            newImageId,
            _ipfsHash,
            _title,
            msg.sender,
            block.timestamp
        );
        
        return newImageId;
    }
    
    /**
     * @dev 获取所有图片信息
     * @return 所有图片的数组
     */
    function getAllImages() public view returns (Image[] memory) {
        Image[] memory allImages = new Image[](imageCount);
        
        for (uint256 i = 1; i <= imageCount; i++) {
            allImages[i - 1] = images[i];
        }
        
        return allImages;
    }
    
    /**
     * @dev 根据ID获取单个图片信息
     * @param _id 图片ID
     * @return 图片信息
     */
    function getImage(uint256 _id) public view returns (Image memory) {
        require(_id > 0 && _id <= imageCount, "Invalid image ID");
        require(images[_id].exists, "Image does not exist");
        return images[_id];
    }
    
    /**
     * @dev 获取指定作者的所有图片
     * @param _author 作者地址
     * @return 图片数组
     */
    function getImagesByAuthor(address _author) public view returns (Image[] memory) {
        uint256[] memory imageIds = authorImages[_author];
        Image[] memory authorImageList = new Image[](imageIds.length);
        
        for (uint256 i = 0; i < imageIds.length; i++) {
            authorImageList[i] = images[imageIds[i]];
        }
        
        return authorImageList;
    }
    
    /**
     * @dev 验证IPFS哈希是否已上链
     * @param _ipfsHash IPFS哈希值
     * @return 是否存在
     */
    function verifyImageHash(string memory _ipfsHash) public view returns (bool) {
        return ipfsHashExists[_ipfsHash];
    }
    
    /**
     * @dev 根据IPFS哈希获取图片信息（用于版权验证）
     * @param _ipfsHash IPFS哈希值
     * @return 图片信息
     */
    function getImageByHash(string memory _ipfsHash) public view returns (Image memory) {
        require(ipfsHashExists[_ipfsHash], "Image hash not found");
        
        // 遍历查找对应的图片
        for (uint256 i = 1; i <= imageCount; i++) {
            if (keccak256(bytes(images[i].ipfsHash)) == keccak256(bytes(_ipfsHash))) {
                return images[i];
            }
        }
        
        revert("Image not found");
    }
    
    /**
     * @dev 更新图片信息（仅作者可更新）
     * @param _id 图片ID
     * @param _newTitle 新标题
     * @param _newDescription 新描述
     */
    function updateImageInfo(
        uint256 _id,
        string memory _newTitle,
        string memory _newDescription
    ) public {
        require(_id > 0 && _id <= imageCount, "Invalid image ID");
        require(images[_id].exists, "Image does not exist");
        require(images[_id].author == msg.sender, "Only author can update");
        require(bytes(_newTitle).length > 0, "Title cannot be empty");
        
        images[_id].title = _newTitle;
        images[_id].description = _newDescription;
        
        emit ImageUpdated(_id, _newTitle, _newDescription, block.timestamp);
    }
    
    /**
     * @dev 获取合约统计信息
     * @return totalImages 总图片数
     * @return userImages 当前用户的图片数
     */
    function getStats() public view returns (uint256 totalImages, uint256 userImages) {
        totalImages = imageCount;
        userImages = authorImages[msg.sender].length;
    }
}
