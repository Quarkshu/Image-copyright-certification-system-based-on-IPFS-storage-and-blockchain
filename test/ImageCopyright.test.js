const ImageCopyright = artifacts.require("ImageCopyright");

contract("ImageCopyright", (accounts) => {
  let instance;
  const author1 = accounts[0];
  const author2 = accounts[1];
  
  // 测试数据
  const testImage1 = {
    ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    title: "我的第一张照片",
    description: "美丽的风景照"
  };
  
  const testImage2 = {
    ipfsHash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
    title: "城市夜景",
    description: "城市的夜晚"
  };

  beforeEach(async () => {
    instance = await ImageCopyright.new();
  });

  describe("图片上传功能", () => {
    it("应该成功上传图片", async () => {
      const result = await instance.uploadImage(
        testImage1.ipfsHash,
        testImage1.title,
        testImage1.description,
        { from: author1 }
      );
      
      // 验证事件
      assert.equal(result.logs.length, 1, "应该触发一个事件");
      assert.equal(result.logs[0].event, "ImageUploaded", "应该触发ImageUploaded事件");
      assert.equal(result.logs[0].args.ipfsHash, testImage1.ipfsHash, "IPFS哈希应该匹配");
      assert.equal(result.logs[0].args.title, testImage1.title, "标题应该匹配");
      assert.equal(result.logs[0].args.author, author1, "作者地址应该匹配");
      
      // 验证图片计数
      const count = await instance.imageCount();
      assert.equal(count.toNumber(), 1, "图片数量应该为1");
    });

    it("不应该允许空的IPFS哈希", async () => {
      try {
        await instance.uploadImage("", testImage1.title, testImage1.description, { from: author1 });
        assert.fail("应该抛出错误");
      } catch (error) {
        assert(error.message.includes("IPFS hash cannot be empty"), "错误消息应该正确");
      }
    });

    it("不应该允许空标题", async () => {
      try {
        await instance.uploadImage(testImage1.ipfsHash, "", testImage1.description, { from: author1 });
        assert.fail("应该抛出错误");
      } catch (error) {
        assert(error.message.includes("Title cannot be empty"), "错误消息应该正确");
      }
    });

    it("不应该允许重复的IPFS哈希", async () => {
      await instance.uploadImage(
        testImage1.ipfsHash,
        testImage1.title,
        testImage1.description,
        { from: author1 }
      );
      
      try {
        await instance.uploadImage(
          testImage1.ipfsHash,
          "另一个标题",
          "另一个描述",
          { from: author2 }
        );
        assert.fail("应该抛出错误");
      } catch (error) {
        assert(error.message.includes("This image hash already exists"), "错误消息应该正确");
      }
    });
  });

  describe("图片查询功能", () => {
    beforeEach(async () => {
      await instance.uploadImage(
        testImage1.ipfsHash,
        testImage1.title,
        testImage1.description,
        { from: author1 }
      );
      await instance.uploadImage(
        testImage2.ipfsHash,
        testImage2.title,
        testImage2.description,
        { from: author2 }
      );
    });

    it("应该能获取所有图片", async () => {
      const images = await instance.getAllImages();
      assert.equal(images.length, 2, "应该有2张图片");
      assert.equal(images[0].ipfsHash, testImage1.ipfsHash, "第一张图片哈希应该匹配");
      assert.equal(images[1].ipfsHash, testImage2.ipfsHash, "第二张图片哈希应该匹配");
    });

    it("应该能根据ID获取图片", async () => {
      const image = await instance.getImage(1);
      assert.equal(image.ipfsHash, testImage1.ipfsHash, "IPFS哈希应该匹配");
      assert.equal(image.title, testImage1.title, "标题应该匹配");
      assert.equal(image.author, author1, "作者应该匹配");
    });

    it("应该能根据作者获取图片", async () => {
      const images = await instance.getImagesByAuthor(author1);
      assert.equal(images.length, 1, "作者1应该有1张图片");
      assert.equal(images[0].ipfsHash, testImage1.ipfsHash, "图片哈希应该匹配");
    });

    it("应该能验证IPFS哈希是否存在", async () => {
      const exists = await instance.verifyImageHash(testImage1.ipfsHash);
      assert.equal(exists, true, "图片哈希应该存在");
      
      const notExists = await instance.verifyImageHash("QmNotExist");
      assert.equal(notExists, false, "不存在的哈希应该返回false");
    });

    it("应该能根据哈希获取图片信息", async () => {
      const image = await instance.getImageByHash(testImage1.ipfsHash);
      assert.equal(image.title, testImage1.title, "标题应该匹配");
      assert.equal(image.author, author1, "作者应该匹配");
    });
  });

  describe("图片更新功能", () => {
    beforeEach(async () => {
      await instance.uploadImage(
        testImage1.ipfsHash,
        testImage1.title,
        testImage1.description,
        { from: author1 }
      );
    });

    it("作者应该能更新图片信息", async () => {
      const newTitle = "更新后的标题";
      const newDescription = "更新后的描述";
      
      const result = await instance.updateImageInfo(1, newTitle, newDescription, { from: author1 });
      
      assert.equal(result.logs[0].event, "ImageUpdated", "应该触发ImageUpdated事件");
      
      const image = await instance.getImage(1);
      assert.equal(image.title, newTitle, "标题应该已更新");
      assert.equal(image.description, newDescription, "描述应该已更新");
    });

    it("非作者不应该能更新图片信息", async () => {
      try {
        await instance.updateImageInfo(1, "新标题", "新描述", { from: author2 });
        assert.fail("应该抛出错误");
      } catch (error) {
        assert(error.message.includes("Only author can update"), "错误消息应该正确");
      }
    });
  });

  describe("统计功能", () => {
    it("应该能获取正确的统计信息", async () => {
      await instance.uploadImage(
        testImage1.ipfsHash,
        testImage1.title,
        testImage1.description,
        { from: author1 }
      );
      await instance.uploadImage(
        testImage2.ipfsHash,
        testImage2.title,
        testImage2.description,
        { from: author1 }
      );
      
      const stats = await instance.getStats({ from: author1 });
      assert.equal(stats.totalImages.toNumber(), 2, "总图片数应该为2");
      assert.equal(stats.userImages.toNumber(), 2, "用户图片数应该为2");
    });
  });
});
