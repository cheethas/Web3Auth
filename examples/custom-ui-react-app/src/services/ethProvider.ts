import { SafeEventEmitterProvider } from "@web3auth/base";
import Web3 from "web3";
import { IWalletProvider } from "./walletProvider";

const ethProvider = (provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {
  const getAccounts = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      uiConsole("Eth accounts", accounts);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getBalance = async () => {
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      const balance = await web3.eth.getBalance(accounts[0]);
      uiConsole("Eth balance", balance);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signMessage = async () => {
    try {
      const pubKey = (await provider.request({ method: "eth_accounts" })) as string[];
      const web3 = new Web3(provider as any);
      const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
      (web3.currentProvider as any)?.send(
        {
          method: "eth_sign",
          params: [pubKey[0], message],
          from: pubKey[0],
        },
        (err: Error, result: any) => {
          if (err) {
            return uiConsole(err);
          }
          uiConsole("Eth sign message => true", result);
        }
      );
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const signTypedMessage = async () => {

    const contractAddress = "0x0123456789012345678901234567890123456789";

    const pubKey = (await provider.request({ method: "eth_accounts" })) as string[];
    const web3 = new Web3(provider as any);

    const domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
    ];
    const metaTransactionType = [
        { name: "nonce", type: "uint256" },
        { name: "from", type: "address" },
        { name: "functionSignature", type: "bytes" }
    ];
    // replace the chainId 42 if network is not kovan
    let domainData = {
        name: "TestContract",
        version: "1",
        verifyingContract: contractAddress,
        // converts Number to bytes32. pass your chainId instead of 42 if network is not Kovan
        salt : '0x' + (137).toString(16).padStart(64, '0')
    };

    let userAddress = pubKey[0];
    let contract = new web3.eth.Contract(
      [{
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "send",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }],
      contractAddress
    );

    let nonce = "0";
    // Create your target method signature.. here we are calling setQuote() method of our contract
    let functionSignature = contract.methods.send("1").encodeABI();
    let message = {
      nonce: parseInt(nonce),
      from: userAddress,
      functionSignature
    };

    const dataToSign = JSON.stringify({
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message
    });

    try{
      return await (web3.currentProvider as any)?.sendAsync(
        {
          jsonrpc: "2.0",
          id: 999999999999,
          method: "eth_signTypedData_v4",
          params: [pubKey[0], JSON.stringify(dataToSign)]
        },
        (err: Error, result: any) => {
          if (err) {
            console.log("error", err);
            return uiConsole(err);
          }
          uiConsole("Eth sign message => true", result);
        }
      );
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  return { getAccounts, getBalance, signMessage, signTypedMessage};
};

export default ethProvider;
