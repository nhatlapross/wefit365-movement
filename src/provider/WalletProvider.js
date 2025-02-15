import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const WalletProvider = ({ children }) => {
  const wallets = [
    // add plugins for non AIP 62 compliant wallets here
  ];
  const config = new AptosConfig({
    network: Network.TESTNET,
    fullnode: 'https://api.testnet.staging.aptoslabs.com/v1',
    faucet: 'https://fund.testnet.porto.movementlabs.xyz/'
  })

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={config}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};