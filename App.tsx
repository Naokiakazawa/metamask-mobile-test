import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  Linking,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import BackgroundTimer from 'react-native-background-timer';
import * as ethers from 'ethers';
import MetaMaskSDK from '@metamask/sdk';

const sdk = new MetaMaskSDK({
  openDeeplink: link => {
    Linking.openURL(link);
  },
  timer: BackgroundTimer,
  dappMetadata: {
    name: 'React Native Test Dapp',
    url: 'https://example.com',
  },
});

const ethereum = sdk.getProvider();
const provider = new ethers.providers.Web3Provider(ethereum);

const App: () => ReactNode = () => {
  const [response, setResponse] = useState<any>();
  const [account, setAccount] = useState<string>();
  const [chain, setChain] = useState<string>();
  const [balance, setBalance] = useState<string>();

  const isDarkMode: boolean = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const textStyle = {
    color: isDarkMode? Colors.lighter : Colors.darker,
    margin: 10,
    fontSize: 16,
  };

  const getBalance = async () => {
    if (!ethereum.selectedAddress) {
      return;
    }
    const bal: ethers.BigNumber = await provider.getBalance(ethereum.selectedAddress);
    setBalance(ethers.utils.formatEther(bal))
  };

  useEffect(() => {
    ethereum.on('chainChanged', (chain: string) => {
      console.log(chain);
      setChain(chain);
    });
    ethereum.on('accountsChanged', (accounts: string) => {
      console.log(accounts);
      setAccount(accounts);
      getBalance();
    })
  })

  const connect = async () => {
    try {
      const result = await ethereum.request({method: 'eth_requestAccounts'});
      setAccount(result?.[0])
      getBalance();
    } catch (e) {
      console.log('ERROR', e);
    }
  };
  
  const exampleRequest = async () => {
    try {
      const result = await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x89',
            chainName: 'Polygon',
            blockExplorerUrls: ['https://polygonscan.com'],
            nativeCurrency: {symbol: 'MATIC', decimals: 18},
            rpcUrls: ['https://polygon-rpc.com/'],          }
        ]
      });
      console.log('RESULT', result);
      setResponse(result);
    } catch (e) {
      console.log('ERROR', e);
    }
  };

  const sign = async () => {
    const msgParams: string = JSON.stringify({
      domain: {
        chainId: parseInt(ethereum.chainId, 16),
        name: 'Ether Mail',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      },
      message: {
        contents: 'Hello, Bob!',
        attachedMoneyInEth: 4.2,
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000',
            ],
          },
        ],
      },
      primaryType: 'Mail',
      types: {
        // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
        EIP712Domain: [
          {name: 'name', type: 'string'},
          {name: 'version', type: 'string'},
          {name: 'chainId', type: 'uint256'},
          {name: 'verifyingContract', type: 'address'},
        ],
        Group: [
          {name: 'name', type: 'string'},
          {name: 'members', type: 'Person[]'},
        ],
        Mail: [
          {name: 'from', type: 'Person'},
          {name: 'to', type: 'Person[]'},
          {name: 'contents', type: 'string'},
        ],
        Person: [
          {name: 'name', type: 'string'},
          {name: 'wallets', type: 'address[]'},
        ],
      },
    })
    let from = ethereum.selectedAddress;
    let params = [from, msgParams];
    let method: string = 'eth_signTypedData_v4';

    const resp = await ethereum.request({method, params});
    setResponse(resp);
  }

  const sendTransaction = async () => {
    const to = '0x0000000000000000000000000000000000000000';
    const txParams = {
      to,
      from: ethereum.selectedAddress,
      value: '0x5AF3107A4000'
    };
    try {
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      console.log(txHash);
      setResponse(txHash)
    } catch (e) {
      console.log(e);
  }
}

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior='automatic' style={backgroundStyle}>
        <Button title={account ? 'Connected' : 'Connect'} onPress={connect} />
        <Button title='Sign' onPress={sign} />
        <Button title='Send tx' onPress={sendTransaction} />
        <Button title='Add chain' onPress={exampleRequest} />

        <Text style={textStyle}>
          {chain && `Connected chain: ${chain}`}
        </Text>
        <Text style={textStyle}>
          {' '}
          {account && `Connected account: ${account}\n\n`}
          {account && balance && `Balance ${balance} ETH`}
        </Text>
        <Text style={textStyle}>
          {' '}
          {response && `Last request response: ${response}`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
};

export default App;
