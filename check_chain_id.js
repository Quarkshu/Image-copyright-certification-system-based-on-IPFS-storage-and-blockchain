const ethers = require('ethers');

async function checkChainId() {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const network = await provider.getNetwork();
    console.log('Chain ID:', network.chainId.toString());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkChainId();
