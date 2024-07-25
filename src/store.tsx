import { GardenJS } from '@gardenfi/core';
import { create } from 'zustand';

type GardenStore = {
  garden: GardenJS | null;
  bitcoin: BitcoinOTA | null;
  setGarden: (garden: GardenJS, bitcoin: BitcoinOTA) => void;
};

const gardenStore = create<GardenStore>((set) => ({
  garden: null,
  bitcoin: null,
  setGarden: (garden: GardenJS, bitcoin: BitcoinOTA) => {
    set(() => ({
      garden,
      bitcoin,
    }));
  },
}));

const useGarden = () => ({
  garden: gardenStore((state) => state.garden),
  bitcoin: gardenStore((state) => state.bitcoin),
});


// `useGardenSetup` has to be called at the root level only once
const useGardenSetup = () => {
    // this could also be useWeb3React (a type of browserProvider from ethers)
    const { evmProvider } = useMetaMaskStore();
    const { setGarden } = gardenStore();
  
    useEffect(() => {
      (async () => {
        if (!evmProvider) return;
        const signer = await evmProvider.getSigner();
  
        const bitcoinProvider = new BitcoinProvider(
          BitcoinNetwork.Regtest,
          'http://localhost:30000'
        );
  
        const orderbook = await Orderbook.init({
          url: 'http://localhost:8080',
          signer: signer,
          opts: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            domain: (window as any).location.host,
            store: localStorage,
          },
        });
  
        const wallets = {
          [Chains.bitcoin_regtest]: new BitcoinOTA(bitcoinProvider, signer),
          [Chains.ethereum_localnet]: new EVMWallet(signer),
        };
  
        const garden = new GardenJS(orderbook, wallets);
  
        setGarden(garden, wallets[Chains.bitcoin_regtest]);
      })();
    }, [evmProvider, setGarden]);
  };


  import { BrowserProvider } from 'ethers';

type EvmWalletState = {
  metaMaskIsConnected: boolean;
  evmProvider: BrowserProvider | null;
};

type EvmWalletAction = {
  connectMetaMask: () => Promise<void>;
};

const networkConfig = {
  chainId: '0x7A69',
  chainName: 'ethereum localnet',
  rpcUrls: ['http://localhost:8545'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

const useMetaMaskStore = create<EvmWalletState & EvmWalletAction>((set) => ({
  metaMaskIsConnected: false,
  evmProvider: null,
  connectMetaMask: async () => {
    if (window.ethereum !== null) {
      let provider = new BrowserProvider(window.ethereum);
      let network = await provider.getNetwork();

      if (network.chainId !== 31337n) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
        provider = new BrowserProvider(window.ethereum);
      }

      set(() => ({
        evmProvider: provider,
        metaMaskIsConnected: true,
      }));
    } else {
      throw new Error('MetaMask not Found');
    }
  },
}));


