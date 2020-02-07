import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';
import { OperationKindType } from 'conseiljs';

import Button from '../../../components/Button';
import SendConfirmationModal from '../../../components/ConfirmModals/SendConfirmationModal';
import SendLedgerConfirmationModal from '../../../components/ConfirmModals/SendLedgerConfirmationModal';
import InputAddress from '../../../components/InputAddress';
import TezosNumericInput from '../../../components/TezosNumericInput';
import TezosAmount from '../../../components/TezosAmount';
import TezosIcon from '../../../components/TezosIcon';
import TextField from '../../../components/TextField';
import Tooltip from '../../../components/Tooltip';
import Fees from '../../../components/Fees';

import { ms } from '../../../styles/helpers';

import {
  depositThunk,
  sendTezThunk,
  sendDelegatedFundsThunk,
  getIsImplicitAndEmptyThunk
} from '../duck/thunks';

import { AVERAGEFEES } from '../../../constants/FeeValue';

import { setIsLoadingAction } from '../../../reduxContent/app/actions';
import { useFetchFees } from '../../../reduxContent/app/thunks';
import { RootState } from '../../../types/store';
import { AddressType } from '../../../types/general';

import {
  Container,
  FeeTooltipBtn,
  TooltipContainer,
  TooltipContent,
  TooltipTitle,
  BoldSpan,
  UseMax,
  ErrorContainer,
  BurnTooltipBtn,
  WarningIcon,
  AmountContainer
} from './style';

const SendTitle = styled.div`
  font-size: 24px;
  line-height: 34px;
  letter-spacing: 1px;
  font-weight: 300;
  color: ${({ theme: { colors } }) => colors.primary};
`;

const FeesBurnContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const BurnsContainer = styled.div`
  width: 45%;
  position: relative;
`;

const TezosIconInput = styled(TezosIcon)`
  position: absolute;
  left: 70px;
  top: 25px;
  display: block;
`;

const SendButton = styled(Button)`
  margin-left: auto;
  width: 194px;
  height: 50px;
`;

const FeeContainer = styled.div`
  width: 45%;
  display: flex;
  height: 64px;
`;

const BalanceContent = styled.div`
  margin-left: 40px;
`;

const BalanceTitle = styled.div`
  color: ${({ theme: { colors } }) => colors.gray5};
  font-size: 14px;
  font-weight: 300;
`;

const BottomContainer = styled.div`
  display: flex;
  align-items: center;
  height: 96px;
  width: 100%;
  margin-top: 15px;
`;

const utez = 1000000;

interface Props {
  isReady: boolean;
  addressBalance: number;
}

const initialState = {
  toAddress: '',
  amount: '',
  fee: AVERAGEFEES.medium,
  isBurn: false,
  total: AVERAGEFEES.medium,
  balance: 0
};

function Send(props: Props) {
  const { isReady, addressBalance } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [state, setState] = useState(() => {
    return {
      ...initialState,
      balance: addressBalance
    };
  });
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);
  const [addressType, setAddressType] = useState<AddressType>(AddressType.None);
  const [isAddressIssue, setIsAddressIssue] = useState(false);
  const { newFees, miniFee, isFeeLoaded, isRevealed } = useFetchFees(
    OperationKindType.Transaction,
    true
  );
  const { toAddress, amount, fee, isBurn, total, balance } = state;
  const { isLoading, isLedger, selectedAccountHash, selectedParentHash } = useSelector(
    (rootState: RootState) => rootState.app,
    shallowEqual
  );
  const { selectedNode, nodesList } = useSelector(
    (rootState: RootState) => rootState.settings,
    shallowEqual
  );

  useEffect(() => {
    setState(prevState => {
      return {
        ...prevState,
        fee: newFees.medium,
        total: newFees.medium
      };
    });
  }, [isFeeLoaded]);

  function onUseMax() {
    const burnFee = isBurn ? 257000 : 0;
    const max = addressBalance - fee - burnFee;
    let newAmount = '0';
    let newTotal = fee;
    let newBalance = addressBalance - newTotal;
    if (max > 0) {
      newAmount = (max / utez).toFixed(6);
      newTotal = addressBalance;
      newBalance = 0;
    }
    setState(prevState => {
      return {
        ...prevState,
        amount: newAmount,
        total: newTotal,
        balance: newBalance
      };
    });
  }

  function onEnterPress(keyVal) {
    if (keyVal === 'Enter') {
      onSend();
    }
  }

  async function handleToAddressChange(newAddress: string) {
    const isDisplayedBurn = await getIsImplicitAndEmptyThunk(newAddress, nodesList, selectedNode);
    const burnFee = isDisplayedBurn ? 257000 : 0;
    const newAmount = amount || '0';
    const numAmount = parseFloat(newAmount) * utez;
    const newTotal = numAmount + fee + burnFee;
    const newBalance = addressBalance - newTotal;
    setState(prevState => {
      return {
        ...prevState,
        toAddress: newAddress,
        total: newTotal,
        balance: newBalance,
        isBurn: isDisplayedBurn
      };
    });
  }

  function handleAmountChange(newAmount: string) {
    const burnFee = isBurn ? 257000 : 0;
    const commaReplacedAmount = newAmount ? newAmount.replace(',', '.') : '0';
    const numAmount = parseFloat(commaReplacedAmount) * utez;
    const newTotal = numAmount + fee + burnFee;
    const newBalance = addressBalance - newTotal;
    setState(prevState => {
      return {
        ...prevState,
        total: newTotal,
        balance: newBalance,
        amount: newAmount
      };
    });
  }

  function handleFeeChange(newFee) {
    const burnFee = isBurn ? 257000 : 0;
    const newAmount = amount || '0';
    const numAmount = parseFloat(newAmount) * utez;
    const newTotal = numAmount + newFee + burnFee;
    const newBalance = addressBalance - newTotal;
    setState(prevState => {
      return {
        ...prevState,
        total: newTotal,
        balance: newBalance,
        fee: newFee
      };
    });
  }

  async function onValidateAmount() {
    setOpen(true);
    if (isLedger) {
      onSend();
    }
  }

  async function onSend() {
    dispatch(setIsLoadingAction(true));
    if (selectedAccountHash.startsWith('KT1') && selectedParentHash !== toAddress) {
      await dispatch(sendDelegatedFundsThunk(password, toAddress, amount, Math.floor(fee)));
    } else if (selectedAccountHash.startsWith('KT1')) {
      await dispatch(depositThunk(fee, amount, password, toAddress));
    } else if (addressType === AddressType.Smart) {
      await dispatch(depositThunk(fee, amount, password, toAddress));
    } else {
      await dispatch(sendTezThunk(password, toAddress, amount, Math.floor(fee)));
    }

    setOpen(false);
    dispatch(setIsLoadingAction(false));
  }

  function getBalanceState() {
    const realAmount = !amount ? Number(amount) : 0;
    if (balance <= 0 || balance < realAmount) {
      return {
        isIssue: true,
        warningMessage: t('components.send.warnings.total_exceeds'),
        balanceColor: 'error1'
      };
    }
    return {
      isIssue: false,
      warningMessage: '',
      balanceColor: 'gray8'
    };
  }

  function renderBurnToolTip() {
    return (
      <TooltipContainer>
        <TooltipTitle>{t('components.send.burn_tooltip_title')}</TooltipTitle>
        <TooltipContent>
          <Trans i18nKey="components.send.burn_tooltip_content">
            The recepient address you entered has a zero balance. Sending funds to an empty Manager
            address (tz1,2,3) requires a one-time
            <BoldSpan>0.257</BoldSpan> XTZ burn fee.
          </Trans>
        </TooltipContent>
      </TooltipContainer>
    );
  }

  function renderError(msg: string) {
    return (
      <ErrorContainer>
        <WarningIcon iconName="warning" size={ms(-1)} color="error1" />
        {msg}
      </ErrorContainer>
    );
  }

  function renderFeeToolTip() {
    return (
      <TooltipContainer>
        <TooltipTitle>{t('components.send.fee_tooltip_title')}</TooltipTitle>
        <TooltipContent>
          <Trans i18nKey="components.send.fee_tooltip_content">
            This address is not revealed on the blockchain. We have added
            <BoldSpan>0.001420 XTZ</BoldSpan> for Public Key Reveal to your regular send operation
            fee.
          </Trans>
        </TooltipContent>
      </TooltipContainer>
    );
  }

  const { isIssue, warningMessage, balanceColor } = getBalanceState();
  const error = isIssue ? renderError(warningMessage) : '';
  const isDisabled =
    amount === '0' || !amount || !toAddress || !isReady || isIssue || isLoading || isAddressIssue;

  const buttonTitle =
    addressType === AddressType.Manager ? t('general.verbs.send') : t('general.verbs.deposit');

  return (
    <Container>
      <SendTitle>{t('components.send.send_xtz')}</SendTitle>
      <InputAddress
        label={t('components.send.recipient_address')}
        address={selectedAccountHash}
        operationType="send"
        onChange={handleToAddressChange}
        onIssue={err => setIsAddressIssue(err)}
        onAddressType={type => setAddressType(type)}
      />
      <AmountContainer>
        <TezosNumericInput
          decimalSeparator={t('general.decimal_separator')}
          label={t('general.nouns.amount')}
          amount={amount}
          onChange={handleAmountChange}
          errorText={error}
        />
        <UseMax onClick={() => onUseMax}>{t('general.verbs.use_max')}</UseMax>
      </AmountContainer>
      <FeesBurnContainer>
        <FeeContainer>
          <Fees
            low={newFees.low}
            medium={newFees.medium}
            high={newFees.high}
            fee={fee}
            miniFee={miniFee}
            onChange={handleFeeChange}
            tooltip={
              !isRevealed && (
                <Tooltip position="bottom" content={renderFeeToolTip()}>
                  <FeeTooltipBtn size="small">
                    <TezosIcon iconName="help" size={ms(1)} color="gray5" />
                  </FeeTooltipBtn>
                </Tooltip>
              )
            }
          />
        </FeeContainer>
        {isBurn && (
          <BurnsContainer>
            <TextField
              disabled={true}
              label={t('components.transaction.burn')}
              defaultValue="0.257000"
            />
            <TezosIconInput color="gray5" iconName="tezos" />
            <Tooltip position="bottom" content={renderBurnToolTip()}>
              <BurnTooltipBtn size="small">
                <TezosIcon iconName="help" size={ms(1)} color="gray5" />
              </BurnTooltipBtn>
            </Tooltip>
          </BurnsContainer>
        )}
      </FeesBurnContainer>

      <BottomContainer>
        <div>
          <BalanceTitle>{t('general.nouns.total')}</BalanceTitle>
          <TezosAmount
            weight="500"
            color={amount ? 'gray3' : 'gray8'}
            size={ms(0.65)}
            amount={total}
          />
        </div>
        <BalanceContent>
          <BalanceTitle>{t('general.nouns.remaining_balance')}</BalanceTitle>
          <TezosAmount weight="500" color={balanceColor} size={ms(0.65)} amount={balance} />
        </BalanceContent>
        <SendButton disabled={isDisabled} onClick={() => onValidateAmount()} buttonTheme="primary">
          {buttonTitle}
        </SendButton>
      </BottomContainer>

      {!isLedger ? (
        <SendConfirmationModal
          onEnterPress={event => onEnterPress(event.key)}
          amount={amount}
          fee={fee}
          source={selectedAccountHash}
          password={password}
          address={toAddress}
          open={open}
          onClose={() => setOpen(false)}
          onPasswordChange={val => setPassword(val)}
          onSend={() => onSend()}
          isLoading={isLoading}
          isBurn={isBurn}
        />
      ) : (
        <SendLedgerConfirmationModal
          amount={amount}
          fee={fee}
          address={toAddress}
          source={selectedAccountHash}
          open={open}
          onClose={() => setOpen(false)}
          isLoading={isLoading}
        />
      )}
    </Container>
  );
}

export default Send;
