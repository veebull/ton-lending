import { Address, beginCell, Cell, Contract, ContractProvider, Sender, SendMode } from '@ton/core';

export default class SwapContract implements Contract {
  constructor(readonly address: Address) {}

  static createForDeploy(code: Cell, initialData: Cell): SwapContract {
    const workchain = 0;
    const address = contractAddress(workchain, { code, data: initialData });
    return new SwapContract(address);
  }

  async sendSwap(
    provider: ContractProvider,
    via: Sender,
    params: {
      fromToken: string;
      toToken: string;
      amount: string;
      minReceived: string;
    }
  ) {
    const messageBody = beginCell()
      .storeUint(0x123456, 32) // op code for swap
      .storeUint(0, 64) // query id
      .storeString(params.fromToken)
      .storeString(params.toToken)
      .storeCoins(params.amount)
      .storeCoins(params.minReceived)
      .endCell();

    await provider.internal(via, {
      value: params.fromToken === 'TON' ? params.amount : '0.05', // If swapping TON, send amount, otherwise just gas
      body: messageBody,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
    });
  }
} 