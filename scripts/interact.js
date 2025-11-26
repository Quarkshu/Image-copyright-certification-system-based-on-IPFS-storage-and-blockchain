/**
 * 智能合约交互示例脚本
 * 使用方法: truffle exec scripts/interact.js --network development
 */

const ImageCopyright = artifacts.require("ImageCopyright");

module.exports = async function(callback) {
  try {
    console.log("========================================");
    console.log("图片版权存证系统 - 交互示例");
    console.log("========================================\n");

    // 获取合约实例
    const instance = await ImageCopyright.deployed();
    console.log("✓ 合约地址:", instance.address);

    // 获取账户
    const accounts = await web3.eth.getAccounts();
    console.log("✓ 当前账户:", accounts[0]);
    console.log("");

    // 示例1: 上传图片
    console.log("--- 示例1: 上传图片 ---");
    const testImages = [
      {
        ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        title: "夕阳下的海滩",
        description: "傍晚时分，金色的阳光洒在海面上"
      },
      {
        ipfsHash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
        title: "城市霓虹",
        description: "繁华都市的夜晚，霓虹灯闪烁"
      },
      {
        ipfsHash: "QmTzQ1JRkWErjk39mryYw2WVaphAZNAREyMchXzYywZZaR",
        title: "山间云雾",
        description: "清晨的山间，云雾缭绕如仙境"
      }
    ];

    for (let i = 0; i < testImages.length; i++) {
      const img = testImages[i];
      
      // 检查是否已存在
      const exists = await instance.verifyImageHash(img.ipfsHash);
      
      if (!exists) {
        const result = await instance.uploadImage(
          img.ipfsHash,
          img.title,
          img.description,
          { from: accounts[0] }
        );
        
        console.log(`✓ 图片 ${i + 1} 上传成功`);
        console.log(`  - 标题: ${img.title}`);
        console.log(`  - IPFS: ${img.ipfsHash}`);
        console.log(`  - 交易哈希: ${result.tx}`);
      } else {
        console.log(`⊙ 图片 ${i + 1} 已存在: ${img.title}`);
      }
    }
    console.log("");

    // 示例2: 查询所有图片
    console.log("--- 示例2: 查询所有图片 ---");
    const allImages = await instance.getAllImages();
    console.log(`共有 ${allImages.length} 张图片上链:`);
    
    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i];
      console.log(`\n图片 #${img.id}:`);
      console.log(`  标题: ${img.title}`);
      console.log(`  描述: ${img.description}`);
      console.log(`  IPFS: ${img.ipfsHash}`);
      console.log(`  作者: ${img.author}`);
      console.log(`  时间: ${new Date(img.timestamp * 1000).toLocaleString('zh-CN')}`);
    }
    console.log("");

    // 示例3: 版权验证
    console.log("--- 示例3: 版权验证 ---");
    const hashToVerify = testImages[0].ipfsHash;
    const isRegistered = await instance.verifyImageHash(hashToVerify);
    
    if (isRegistered) {
      const imageInfo = await instance.getImageByHash(hashToVerify);
      console.log("✓ 该图片已在区块链上登记版权!");
      console.log(`  标题: ${imageInfo.title}`);
      console.log(`  版权所有者: ${imageInfo.author}`);
      console.log(`  登记时间: ${new Date(imageInfo.timestamp * 1000).toLocaleString('zh-CN')}`);
    } else {
      console.log("✗ 该图片未找到版权登记记录");
    }
    console.log("");

    // 示例4: 查询当前用户的图片
    console.log("--- 示例4: 查询当前用户的图片 ---");
    const myImages = await instance.getImagesByAuthor(accounts[0]);
    console.log(`当前账户共有 ${myImages.length} 张图片:`);
    myImages.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.title} (ID: ${img.id})`);
    });
    console.log("");

    // 示例5: 获取统计信息
    console.log("--- 示例5: 统计信息 ---");
    const stats = await instance.getStats({ from: accounts[0] });
    console.log(`系统总图片数: ${stats.totalImages}`);
    console.log(`我的图片数: ${stats.userImages}`);
    console.log("");

    // 示例6: 更新图片信息
    console.log("--- 示例6: 更新图片信息 ---");
    if (allImages.length > 0) {
      const imageId = allImages[0].id;
      const newTitle = allImages[0].title + " (已更新)";
      const newDescription = "这是更新后的描述信息";
      
      const updateResult = await instance.updateImageInfo(
        imageId,
        newTitle,
        newDescription,
        { from: accounts[0] }
      );
      
      console.log(`✓ 成功更新图片 #${imageId}`);
      console.log(`  新标题: ${newTitle}`);
      console.log(`  交易哈希: ${updateResult.tx}`);
      
      // 验证更新
      const updatedImage = await instance.getImage(imageId);
      console.log(`  验证: ${updatedImage.title === newTitle ? '✓' : '✗'} 更新成功`);
    }
    console.log("");

    console.log("========================================");
    console.log("交互示例执行完成!");
    console.log("========================================");

    callback();
  } catch (error) {
    console.error("发生错误:", error);
    callback(error);
  }
};
