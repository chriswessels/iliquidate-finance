import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import {
  Card,
  Typography,
  Button,
  InputAdornment,
  TextField
} from '@material-ui/core';

import Loader from '../../loader'
import Snackbar from '../../snackbar'

import {
  ERROR,
  GET_COLLATERAL_BALANCES,
  COLLATERAL_BALANCES_RETURNED,
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  DEPOSIT_COLLATERAL,
  DEPOSIT_COLLATERAL_RETURNED,
  GET_DEPOSIT_PRICE,
  DEPOSIT_PRICE_RETURNED
} from '../../../constants'

import { withNamespaces } from 'react-i18next';
import Store from "../../../stores";
const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1200px',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  intro: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '400px'
  },
  introCenter: {
    minWidth: '100%',
    textAlign: 'center',
    padding: '48px 0px'
  },
  investedContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    minWidth: '100%',
    [theme.breakpoints.up('md')]: {
      minWidth: '800px',
    }
  },
  connectContainer: {
    padding: '12px',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '450px',
    [theme.breakpoints.up('md')]: {
      width: '450',
    }
  },
  actionButton: {
    '&:hover': {
      backgroundColor: "#2F80ED",
    },
    padding: '12px',
    backgroundColor: "#2F80ED",
    borderRadius: '1rem',
    border: '1px solid #E1E1E1',
    fontWeight: 500,
    [theme.breakpoints.up('md')]: {
      padding: '15px',
    }
  },
  buttonText: {
    fontWeight: '700',
    color: 'white',
  },
  disaclaimer: {
    padding: '12px',
    border: '1px solid rgb(174, 174, 174)',
    borderRadius: '0.75rem',
    marginBottom: '24px',
  },
  addressContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '100px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontSize: '0.83rem',
    textOverflow:'ellipsis',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '0.75rem',
    height: 'max-content',
    [theme.breakpoints.up('md')]: {
      maxWidth: '130px',
      width: '100%'
    }
  },
  card: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: '400px',
    justifyContent: 'center',
    padding: '12px',
    flexDirection: 'column',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    padding: '12px',
    borderRadius: '1.25em',
    justifyContent: 'center',
    [theme.breakpoints.up('md')]: {
      padding: '24px',
    }
  },
  actionInput: {
    padding: '0px 0px 12px 0px',
    fontSize: '0.5rem'
  },
  inputAdornment: {
    fontWeight: '600',
    fontSize: '1.5rem'
  },
  assetIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: '25px',
    background: '#dedede',
    height: '30px',
    width: '30px',
    textAlign: 'center',
    marginRight: '16px'
  },
  balances: {
    marginTop: '9px',
    marginBottom: '-23px',
    marginRight: '30px',
    paddingRight: '14px',
    zIndex: '900',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between'
  },
  title: {
    paddingRight: '24px'
  },
  value: {
    cursor: 'pointer'
  },
  valContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  inputCardHeading: {
    width: '100%',
    padding: '12px 0px 12px 20px'
  },
  placceholder: {
    marginBottom: '12px'
  }
});

class Deposit extends Component {

  constructor() {
    super()

    const account = store.getStore('account')

    this.state = {
      account: account,
      assets: store.getStore('collateralAssets'),
      amount: ''
    }

    if(account && account.address) {
      dispatcher.dispatch({ type: GET_COLLATERAL_BALANCES, content: {} })
    }
  }

  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(COLLATERAL_BALANCES_RETURNED, this.balancesReturned);
    emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    emitter.on(DEPOSIT_COLLATERAL_RETURNED, this.depositCollateralReturned);
    emitter.on(DEPOSIT_PRICE_RETURNED, this.depositPriceReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(COLLATERAL_BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.removeListener(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    emitter.removeListener(DEPOSIT_COLLATERAL_RETURNED, this.depositCollateralReturned);
    emitter.removeListener(DEPOSIT_PRICE_RETURNED, this.depositPriceReturned);
  };

  depositPriceReturned = (price) => {
    this.setState({ amount: price ? parseFloat(price).toFixed(4) : '0.0000' })
  };

  depositCollateralReturned  = (txHash) => {
    this.setState({ snackbarMessage: null, snackbarType: null, loading: false })
    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: txHash, snackbarType: 'Hash' }
      that.setState(snackbarObj)
    })
  };

  balancesReturned = (balances) => {
    const collateralAssets = store.getStore('collateralAssets')
    this.setState({ assets: collateralAssets })
    this.setDefaultValues(collateralAssets)
  };

  setDefaultValues = (assets) => {
    let that = this

    let daiAmount = 0
    let usdcAmount = 0
    let usdtAmount = 0
    let tusdAmount = 0
    let susdAmount = 0

    assets.map((asset) => {
      const bal = (Math.floor(asset.balance*10000)/10000).toFixed(4)
      switch (asset.id) {
        case 'DAI':
          that.setState({ daiAmount: bal })
          daiAmount = bal
          break;
        case 'USDC':
          that.setState({ usdcAmount: bal })
          usdcAmount = bal
          break;
        case 'USDT':
          that.setState({ usdtAmount: bal })
          usdtAmount = bal
          break;
        case 'TUSD':
          that.setState({ tusdAmount: bal })
          tusdAmount = bal
          break;
        case 'SUSD':
          that.setState({ susdAmount: bal })
          susdAmount = bal
          break;
        default:
      }
    })

    dispatcher.dispatch({ type: GET_DEPOSIT_PRICE, content: { daiAmount, usdcAmount, usdtAmount, tusdAmount, susdAmount }})
  }

  refresh() {
    dispatcher.dispatch({ type: GET_COLLATERAL_BALANCES, content: {} })
  }

  connectionConnected = () => {
    const { t } = this.props

    this.setState({ account: store.getStore('account') })

    dispatcher.dispatch({ type: GET_COLLATERAL_BALANCES, content: {} })

    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: t("Unlock.WalletConnected"), snackbarType: 'Info' }
      that.setState(snackbarObj)
    })
  };

  connectionDisconnected = () => {
    this.setState({ account: store.getStore('account') })
  }

  errorReturned = (error) => {
    const snackbarObj = { snackbarMessage: null, snackbarType: null }
    this.setState(snackbarObj)
    this.setState({ loading: false })
    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: error.toString(), snackbarType: 'Error' }
      that.setState(snackbarObj)
    })
  };

  render() {
    const { classes, t } = this.props;
    const {
      account,
      loading,
      snackbarMessage,
      daiAmount,
      usdcAmount,
      usdtAmount,
      tusdAmount,
      susdAmount,
      amount
    } = this.state

    var address = null;
    if (account.address) {
      address = account.address.substring(0,6)+'...'+account.address.substring(account.address.length-4,account.address.length)
    }


    return (
      <div className={ classes.root }>
        <div className={ classes.card }>
          <Card className={ classes.inputContainer }>
            <Typography variant='h3' className={ classes.inputCardHeading }>{ t("CollateralDeposit.Deposit") }</Typography>
            { this.renderAmountInput('daiAmount', daiAmount, false, 'DAI', '0.00', 'DAI') }
            { this.renderAmountInput('usdcAmount', usdcAmount, false, 'USDC', '0.00', 'USDC') }
            { this.renderAmountInput('usdtAmount', usdtAmount, false, 'USDT', '0.00', 'USDT') }
            { this.renderAmountInput('tusdAmount', tusdAmount, false, 'TUSD', '0.00', 'TUSD') }
            { this.renderAmountInput('susdAmount', susdAmount, false, 'SUSD', '0.00', 'SUSD') }
            <Typography variant='h3' className={ classes.inputCardHeading }>{ t("CollateralDeposit.IWillReceive") }</Typography>
            { this.renderAmountInput('amount', amount, false, 'CRV', '0.00', 'CRV', true, true) }
            <Button
              className={ classes.actionButton }
              variant="outlined"
              color="primary"
              disabled={ loading }
              onClick={ this.onDeposit }
              fullWidth
              >
              <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>{ t('CollateralDeposit.Deposit') }</Typography>
            </Button>
          </Card>
        </div>
        { snackbarMessage && this.renderSnackbar() }
        { loading && <Loader /> }
      </div>
    )
  };

  onDeposit = () => {
    this.setState({ amountError: false })

    const { daiAmount, usdcAmount, usdtAmount, tusdAmount, susdAmount } = this.state

    daiAmount = daiAmount === '' ? '0' : daiAmount
    usdcAmount = usdcAmount === '' ? '0' : usdcAmount
    usdtAmount = usdtAmount === '' ? '0' : usdtAmount
    tusdAmount = tusdAmount === '' ? '0' : tusdAmount
    susdAmount = susdAmount === '' ? '0' : susdAmount

    this.setState({ loading: true })
    dispatcher.dispatch({ type: DEPOSIT_COLLATERAL, content: { daiAmount: daiAmount, usdcAmount: usdcAmount, usdtAmount: usdtAmount, tusdAmount: tusdAmount, susdAmount: susdAmount } })
  }

  renderSnackbar = () => {
    var {
      snackbarType,
      snackbarMessage
    } = this.state
    return <Snackbar type={ snackbarType } message={ snackbarMessage } open={true}/>
  };

  onChange = (event) => {
    if(event.target.value !== '' && (!event.target.value || isNaN(event.target.value) || event.target.value < 0)) {
      return false
    }

    let val = []
    val[event.target.name] = event.target.value
    this.setState(val)

    let { daiAmount, usdcAmount, usdtAmount, tusdAmount, susdAmount } = this.state

    const bal = event.target.value === '' ? '0' : event.target.value

    daiAmount = daiAmount === '' ? '0' : daiAmount
    usdcAmount = usdcAmount === '' ? '0' : usdcAmount
    usdtAmount = usdtAmount === '' ? '0' : usdtAmount
    tusdAmount = tusdAmount === '' ? '0' : tusdAmount
    susdAmount = susdAmount === '' ? '0' : susdAmount

    if(event.target.name === 'daiAmount') {
      daiAmount = bal
    }
    if(event.target.name === 'usdcAmount') {
      usdcAmount = bal
    }
    if(event.target.name === 'usdtAmount') {
      usdtAmount = bal
    }
    if(event.target.name === 'tusdAmount') {
      tusdAmount = bal
    }
    if(event.target.name === 'susdAmount') {
      susdAmount = bal
    }

    dispatcher.dispatch({ type: GET_DEPOSIT_PRICE, content: { daiAmount, usdcAmount, usdtAmount, tusdAmount, susdAmount }})
  };

  renderAmountInput = (id, value, error, label, placeholder, inputAdornment, disabled, hideBalance) => {
    const { classes, loading } = this.props
    const { assets } =  this.state

    const sendAsset = assets.filter((asset) => { return asset.id === inputAdornment })[0]

    return (
      <div className={ classes.valContainer }>
        <div className={ classes.balances }>
          <Typography variant='h3' className={ classes.title }></Typography>
          <Typography variant='h4' onClick={ () => { if(hideBalance) { return; } this.setAmount(id, (sendAsset ? sendAsset.balance : 0)) } } className={ classes.value } noWrap>{ !hideBalance ? ('Balance: '+ ( sendAsset && sendAsset.balance ? (Math.floor(sendAsset.balance*10000)/10000).toFixed(4) : '0.0000')) : '' } { !hideBalance ? (sendAsset ? sendAsset.symbol : '') : '' }</Typography>
          { hideBalance && <div className={ classes.placceholder }></div> }
        </div>
        <div>
          <TextField
            fullWidth
            className={ classes.actionInput }
            id={ id }
            name={ id }
            value={ value }
            error={ error }
            onChange={ this.onChange }
            disabled={ loading || disabled }
            placeholder={ placeholder }
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3'>{ inputAdornment }</Typography></InputAdornment>,
              startAdornment: <InputAdornment position="end" className={ classes.inputAdornment }>
                <div className={ classes.assetIcon }>
                  <img
                    alt=""
                    src={ require('../../../assets/'+inputAdornment+'-logo.png') }
                    height="30px"
                  />
                </div>
              </InputAdornment>,
            }}
          />
        </div>
      </div>
    )
  }

  setAmount(id, balance) {
    const bal = (Math.floor((balance === '' ? '0' : balance)*10000)/10000).toFixed(4)
    let val = []
    val[id] = bal
    this.setState(val)
  }

}

export default withNamespaces()(withRouter(withStyles(styles)(Deposit)));
