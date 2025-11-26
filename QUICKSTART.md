# 快速入门指南

## 第一步：启动 Ganache

1. 打开 Ganache 应用程序
2. 点击 "QUICKSTART" 或创建新工作区
3. 确认设置：
   - RPC SERVER: `HTTP://127.0.0.1:7545`
   - NETWORK ID: `5777` (或任意)
4. 记下第一个账户地址和私钥（用于 MetaMask）

## 第二步：编译和部署合约

打开终端，进入项目目录：

```bash
# 1. 安装依赖（如果还没安装）
npm install

# 2. 编译智能合约
truffle compile

# 3. 部署到 Ganache
truffle migrate --network development

# 4. 运行测试（可选）
truffle test
```

成功部署后，你会看到类似输出：
```
Deploying 'ImageCopyright'
---------------------------
> transaction hash:    0x...
> contract address:    0x... <-- 记下这个地址！
> block number:        1
> account:             0x...
> balance:             99.99...
> gas used:            ...
```

## 第三步：测试合约功能

### 方法 A：使用交互脚本（推荐）

```bash
truffle exec scripts/interact.js --network development
```

这个脚本会自动演示所有功能：
- 上传图片
- 查询图片
- 验证版权
- 更新信息
- 查看统计

### 方法 B：使用 Truffle Console

```bash
truffle console --network development
```

在控制台中输入：

```javascript
// 1. 获取合约实例
let contract = await ImageCopyright.deployed()

// 2. 获取账户
let accounts = await web3.eth.getAccounts()
let myAccount = accounts[0]

// 3. 上传第一张图片
await contract.uploadImage(
  "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
  "我的第一张照片",
  "这是测试图片",
  { from: myAccount }
)

// 4. 查看所有图片
let images = await contract.getAllImages()
console.log(images)

// 5. 查看图片数量
let count = await contract.imageCount()
console.log("图片总数:", count.toString())

// 6. 验证图片哈希
let exists = await contract.verifyImageHash("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG")
console.log("图片是否存在:", exists)
```

## 第四步：使用 IPFS 上传真实图片

### 启动 IPFS Desktop

1. 打开 IPFS Desktop
2. 等待节点启动完成（状态显示为绿色）

### 上传图片

1. 点击左侧菜单的 "Files"
2. 点击右上角的 "Import" 按钮
3. 选择 "File" 上传你的图片
4. 上传成功后，点击图片右侧的 "..." 菜单
5. 选择 "Copy CID" 复制 IPFS 哈希

### 将 IPFS 哈希上链

```javascript
// 在 truffle console 中
await contract.uploadImage(
  "你复制的IPFS哈希",
  "图片标题",
  "图片描述",
  { from: myAccount }
)
```

### 访问你的图片

在浏览器中打开：
- 本地: `http://localhost:8080/ipfs/你的IPFS哈希`
- 公共网关: `https://ipfs.io/ipfs/你的IPFS哈希`

## 第五步：版权验证演示

### 场景：验证图片版权归属

```javascript
// 假设有人声称某张图片是他的，我们来验证
let suspiciousHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"

// 1. 检查是否已登记
let isRegistered = await contract.verifyImageHash(suspiciousHash)

if (isRegistered) {
  // 2. 获取版权信息
  let imageInfo = await contract.getImageByHash(suspiciousHash)
  
  console.log("版权所有者:", imageInfo.author)
  console.log("登记时间:", new Date(imageInfo.timestamp * 1000))
  console.log("图片标题:", imageInfo.title)
  
  // 3. 对比地址
  if (imageInfo.author.toLowerCase() === myAccount.toLowerCase()) {
    console.log("✓ 这是你的作品！")
  } else {
    console.log("✗ 版权属于其他人")
  }
} else {
  console.log("该图片未登记版权")
}
```

## 常见问题

### Q1: 部署失败，提示 "network not found"

**A:** 确保 Ganache 正在运行，且端口为 7545

### Q2: 交易失败，提示 "out of gas"

**A:** 这通常不会发生，但如果遇到，可以在 `truffle-config.js` 中增加 gas limit

### Q3: IPFS 图片无法访问

**A:** 
- 确保 IPFS Desktop 正在运行
- 如果使用公共网关，第一次访问可能需要等待几分钟
- 可以尝试其他公共网关：
  - `https://cloudflare-ipfs.com/ipfs/CID`
  - `https://gateway.pinata.cloud/ipfs/CID`

### Q4: 如何重新部署合约？

**A:** 
```bash
truffle migrate --reset --network development
```

### Q5: 如何查看合约的 ABI？

**A:** 
编译后的 ABI 在 `build/contracts/ImageCopyright.json` 文件中

## 下一步

1. **集成 MetaMask**
   - 在 MetaMask 中导入 Ganache 账户
   - 连接到本地网络（RPC: http://127.0.0.1:7545）

2. **开发前端界面**
   - 使用 Web3.js 或 Ethers.js
   - React/Vue/Angular 框架
   - 参考 `build/contracts/ImageCopyright.json` 中的 ABI

3. **添加更多功能**
   - 图片分类标签
   - 多文件批量上传
   - 版权转让功能
   - 评论和点赞系统

## 需要帮助？

- Truffle 文档: https://archive.trufflesuite.com/docs/truffle/
- Solidity 文档: https://docs.soliditylang.org/
- IPFS 文档: https://docs.ipfs.tech/
- Web3.js 文档: https://web3js.readthedocs.io/

## 项目结构总览

```
Image-copyright-on-chain/
├── contracts/
│   └── ImageCopyright.sol      # 核心智能合约
├── migrations/
│   └── 1_deploy_contracts.js   # 部署脚本
├── scripts/
│   └── interact.js             # 交互示例脚本
├── test/
│   └── ImageCopyright.test.js  # 测试用例
├── truffle-config.js           # Truffle配置
├── README.md                   # 详细文档
├── QUICKSTART.md              # 本文件
└── package.json               # 项目依赖
```

祝你开发顺利！🎉
