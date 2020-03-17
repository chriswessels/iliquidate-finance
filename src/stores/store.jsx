import config from "../config";
import async from 'async';
import {
  ERROR,
  LIQUIDATE,
  LIQUIDATE_RETURNED,
  GET_LIQUIDATION_CANDIDATES,
  LIQUIDATION_CANDIDATES_RETURNED,
  GET_LIQUIDATION_DATA,
  LIQUIDATION_DATA_RETURNED
} from '../constants';
import Web3 from 'web3';

import {
  injected,
  walletconnect,
  walletlink,
  ledger,
  trezor,
  frame,
  fortmatic,
  portis,
  squarelink,
  torus,
  authereum
} from "./connectors";

const axios = require('axios');

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      account: {},
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        WalletConnect: walletconnect,
        WalletLink: walletlink,
        Ledger: ledger,
        Trezor: trezor,
        Frame: frame,
        Fortmatic: fortmatic,
        Portis: portis,
        Squarelink: squarelink,
        Torus: torus,
        Authereum: authereum
      },
      web3context: null,
      languages: [
        {
          language: 'English',
          code: 'en'
        },
        {
          language: 'Japanese',
          code: 'ja'
        },
        {
          language: 'Chinese',
          code: 'zh'
        }
      ],
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case LIQUIDATE:
            this.liquidate(payload)
            break;
          case GET_LIQUIDATION_CANDIDATES:
            this.getLiquidationCandidates(payload)
            break;
          case GET_LIQUIDATION_DATA:
            this.getLiquidationData(payload)
            break;
          default: {

          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated');
  };

  liquidate = (payload) => {
    const account = store.getStore('account')
    const { address } = payload.content

    this._callLiquidate(account, address, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(LIQUIDATE_RETURNED, res)
    })
  }

  _callLiquidate = async (account, address, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const aaveLiquidationContract = new web3.eth.Contract(config.aaveLiquidationABI, config.aaveLiquidationAddress)
    aaveLiquidationContract.methods.liquidate(address).send({ from: account.address, gasPrice: web3.utils.toWei('6', 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  getLiquidationData = (payload) => {
    const account = store.getStore('account')
    const { address } = payload.content
    const web3 = new Web3(store.getStore('web3context').library.provider);

    async.parallel([
      (callback) => { this._getHealthFactor(web3, account, address, callback) },
      (callback) => { this._getMaxCollateral(web3, account, address, callback) },
      (callback) => { this._getMaxDebt(web3, account, address, callback) },
    ], (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      console.log(data)

      const res = {
        healthFactor: data[0],
        maxCollateral: data[1],
        maxDebt: data[2]
      }

      return emitter.emit(LIQUIDATION_DATA_RETURNED, res)
    })
  }

  _getHealthFactor = async (web3, account, address, callback) => {
    const lendingContract = new web3.eth.Contract(config.lendingContractABI, config.lendingContractAddress)
    let healthFactor = await lendingContract.methods.getUserAccountData(address).call({ from: account.address })
    healthFactor.healthFactorDisplay = web3.utils.fromWei(healthFactor.healthFactor, "ether");
    callback(null, healthFactor)
  }

  _getMaxCollateral = async (web3, account, address, callback) => {
    const liquidationContract = new web3.eth.Contract(config.liquidationContractABI, config.liquidationContractAddress)
    const maxCollateral = await liquidationContract.methods.getMaxCollateral(address).call({ from: account.address })
    callback(null, maxCollateral)
  }

  _getMaxDebt = async (web3, account, address, callback) => {
    const liquidationContract = new web3.eth.Contract(config.liquidationContractABI, config.liquidationContractAddress)
    const maxDebt = await liquidationContract.methods.getMaxDebt(address).call({ from: account.address })
    callback(null, maxDebt)
  }

  getLiquidationCandidates = (payload) => {
    const url = 'https://protocol-api.aave.com/data/users/liquidations';

    axios.get(url)
    .then(function (response) {
      // handle success
      const filteredData = response.data.data
      .filter(x => {
        return parseFloat(x.user.totalLiquidityETH) != 0
      })
      .filter(x => {
        return x.reserve.symbol != 'ETH'
      })
      .filter(x => {
        return x.user.reservesData.length == 2
      })
      .filter(x => {
        return x.user.reservesData[0].reserve.symbol != 'ETH'&&x.user.reservesData[1].reserve.symbol != 'ETH'
      })
      .filter(x => {
        return parseFloat(x.principalBorrows) >= 100
      })
      .sort((a,b) => {
        if (parseFloat(a.user.maxAmountToWithdrawInEth) > parseFloat(b.user.maxAmountToWithdrawInEth)) {
          return -1;
        }
        if (parseFloat(a.user.maxAmountToWithdrawInEth) < parseFloat(b.user.maxAmountToWithdrawInEth)) {
          return 1;
        }
        return 0;
      })
      .map(x => {
        console.log(x);
        return x
      })

      return emitter.emit(LIQUIDATION_CANDIDATES_RETURNED, filteredData)
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
  }
}

var store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};