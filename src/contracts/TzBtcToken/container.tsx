import React, { Fragment, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { lighten } from 'polished';
import { useTranslation } from 'react-i18next';

import Button from '../../components/Button';
import BalanceBanner from '../../components/BalanceBanner';
import EmptyState from '../../components/EmptyState';
import PageNumbers from '../../components/PageNumbers';

import Loader from '../../components/Loader';

import Transactions from './TransactionContainer';
import Send from './Send';

import { TRANSACTIONS, SEND, BURN, MINT } from '../../constants/TabConstants';
import { ms } from '../../styles/helpers';
import transactionsEmptyState from '../../../resources/transactionsEmptyState.svg';

import { RootState } from '../../types/store';

import { updateActiveTabThunk } from '../../reduxContent/wallet/thunks';
import { getTokenSelector } from '../duck/selectors';

const Container = styled.section`
    flex-grow: 1;
`;

const Tab = styled(Button)<{ isActive: boolean; ready: boolean }>`
    background: ${({ isActive, theme: { colors } }) => (isActive ? colors.white : colors.accent)};
    color: ${({ isActive, theme: { colors } }) => (isActive ? colors.primary : lighten(0.4, colors.accent))};
    cursor: ${({ ready }) => (ready ? 'pointer' : 'initial')};
    text-align: center;
    font-weight: 500;
    padding: ${ms(-1)} ${ms(1)};
    border-radius: 0;
`;

const TabList = styled.div<{ count: number }>`
    background-color: ${({ theme: { colors } }) => colors.accent};
    display: grid;
    grid-template-columns: ${({ count }) => (count > 4 ? `repeat(${count}, 1fr)` : 'repeat(4, 1fr)')};
    grid-column-gap: 50px;
`;

const TabText = styled.span<{ ready: boolean }>`
    opacity: ${({ ready }) => (ready ? '1' : '0.5')};
`;

const SectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    padding: ${ms(2)};
    min-height: 400px;
`;

function ActionPanel() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const selectedToken = useSelector(getTokenSelector);

    const { isLoading, selectedParentHash, selectedAccountHash } = useSelector((rootState: RootState) => rootState.app, shallowEqual);

    const { balance, activeTab, symbol, displayName, administrator, transactions } = selectedToken;

    const isAdmin = selectedParentHash === administrator;
    const tabs = isAdmin ? [TRANSACTIONS, SEND, MINT, BURN] : [TRANSACTIONS, SEND];

    function onChangeTab(newTab: string) {
        dispatch(updateActiveTabThunk(newTab, true));
    }

    function renderSection() {
        switch (activeTab) {
            case SEND:
                return <Send isReady={true} balance={balance} symbol={symbol} />;
            case TRANSACTIONS:
            default: {
                if (!transactions || transactions.length === 0) {
                    return <EmptyState imageSrc={transactionsEmptyState} title={t('components.actionPanel.empty-title')} description={null} />;
                }

                // TODO: move this inside TransactionContainer
                const processedTransactions = transactions.filter(e => e).sort((a, b) => b.timestamp - a.timestamp);
                const itemsCount = 5;
                const pageCount = Math.ceil(processedTransactions.length / itemsCount);

                const firstNumber = (currentPage - 1) * itemsCount;
                const lastNumber = Math.min(currentPage * itemsCount, processedTransactions.length);

                const transactionSlice = processedTransactions.slice(firstNumber, lastNumber);

                return (
                    <Fragment>
                        <Transactions transactions={transactionSlice} selectedParentHash={selectedParentHash} symbol={symbol} />
                        {pageCount > 1 && (
                            <PageNumbers
                                currentPage={currentPage}
                                totalNumber={processedTransactions.length}
                                firstNumber={firstNumber}
                                lastNumber={lastNumber}
                                onClick={val => setCurrentPage(val)}
                            />
                        )}
                        {isLoading && <Loader />}
                    </Fragment>
                );
            }
        }
    }
    return (
        <Container>
            <BalanceBanner
                isReady={true}
                balance={balance / 10 ** 8 || 0 /* TODO */}
                privateKey={''}
                publicKeyHash={selectedAccountHash || 'Inactive'}
                delegatedAddress={''}
                displayName={displayName}
                symbol={symbol}
            />

            <TabList count={tabs.length}>
                {tabs.map(tab => (
                    <Tab isActive={activeTab === tab} key={tab} ready={true} buttonTheme="plain" onClick={() => onChangeTab(tab)}>
                        <TabText ready={true}>{t(tab)}</TabText>
                    </Tab>
                ))}
            </TabList>
            <SectionContainer>{renderSection()}</SectionContainer>
        </Container>
    );
}

export default ActionPanel;
