var FathomToken = artifacts.require("./FathomToken.sol");

module.exports = function(deployer) {
    var accounts = web3.eth.accounts;
    deployer.then(function() {
        return FathomToken.deployed();
    }).then(function(instance) {
        for(var i = 1; i < accounts.length; i++) {
            instance.transfer(accounts[i], 10000000000, {from: accounts[0]});
        }
    })
}
