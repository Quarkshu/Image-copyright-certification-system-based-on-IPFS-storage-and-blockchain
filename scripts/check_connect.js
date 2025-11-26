module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    console.log("Successfully connected to Ganache!");
    console.log("Accounts count:", accounts.length);
    console.log("First account:", accounts[0]);
    callback();
  } catch (error) {
    console.error("Connection failed:", error.message);
    callback(error);
  }
};
