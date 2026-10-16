"use server";

import {
  ACHClass,
  CountryCode,
  TransferAuthorizationCreateRequest,
  TransferCreateRequest,
  TransferNetwork,
  TransferType,
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

const DEV_BYPASS_AUTH =
    process.env.NODE_ENV === "development" && process.env.DEV_BYPASS_AUTH === "true";

// DEV ONLY: fake bank accounts, used only for the fake dev user
const daysAgo = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const MOCK_ACCOUNTS = [
  {
    id: "dev-account-1",
    availableBalance: 450,
    currentBalance: 500,
    institutionId: "dev-institution-1",
    name: "Plaid Checking",
    officialName: "Plaid Gold Standard 0% Interest Checking",
    mask: "2348",
    type: "depository",
    subtype: "checking",
    appwriteItemId: "dev-bank-1",
    sharaebleId: "dev-shareable-1",
  },
  {
    id: "dev-account-2",
    availableBalance: 780,
    currentBalance: 800,
    institutionId: "dev-institution-2",
    name: "Plaid Saving",
    officialName: "Plaid Silver Standard 0.1% Interest Saving",
    mask: "4597",
    type: "depository",
    subtype: "savings",
    appwriteItemId: "dev-bank-2",
    sharaebleId: "dev-shareable-2",
  },
  {
    id: "dev-account-3",
    availableBalance: 620165.35,
    currentBalance: 625483.42,
    institutionId: "dev-institution-3",
    name: "Plaid Credit Card",
    officialName: "Plaid Diamond 12.5% APR Interest Credit Card",
    mask: "3895",
    type: "credit",
    subtype: "credit card",
    appwriteItemId: "dev-bank-3",
    sharaebleId: "dev-shareable-3",
  },
];

// DEV ONLY: fake transactions
const MOCK_TRANSACTIONS = [
  { id: "dev-t1", name: "Uber", paymentChannel: "online", type: "debit", accountId: "dev-account-1", amount: 12.5, pending: false, category: "Travel", date: daysAgo(1), image: "" },
  { id: "dev-t2", name: "Chicken Palace", paymentChannel: "in store", type: "debit", accountId: "dev-account-1", amount: 24.9, pending: false, category: "Food and Drink", date: daysAgo(2), image: "" },
  { id: "dev-t3", name: "Salary Deposit", paymentChannel: "other", type: "credit", accountId: "dev-account-1", amount: 1500, pending: false, category: "Transfer", date: daysAgo(4), image: "" },
  { id: "dev-t4", name: "Netflix", paymentChannel: "online", type: "debit", accountId: "dev-account-1", amount: 15.99, pending: true, category: "Payment", date: daysAgo(5), image: "" },
  { id: "dev-t5", name: "Shoprite", paymentChannel: "in store", type: "debit", accountId: "dev-account-2", amount: 63.2, pending: false, category: "Food and Drink", date: daysAgo(8), image: "" },
  { id: "dev-t6", name: "Airline Ticket", paymentChannel: "online", type: "debit", accountId: "dev-account-3", amount: 320, pending: false, category: "Travel", date: daysAgo(12), image: "" },
];

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  // DEV ONLY: return fake accounts for the fake dev user instead of calling Plaid
  if (DEV_BYPASS_AUTH && userId === "dev-user") {
    const totalCurrentBalance = MOCK_ACCOUNTS.reduce(
        (total, account) => total + account.currentBalance,
        0
    );

    return parseStringify({
      data: MOCK_ACCOUNTS,
      totalBanks: MOCK_ACCOUNTS.length,
      totalCurrentBalance,
    });
  }

  try {
    // get banks from db
    const banks = await getBanks({ userId });

    const accounts = await Promise.all(
        banks?.map(async (bank: Bank) => {
          // get each account info from plaid
          const accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });
          const accountData = accountsResponse.data.accounts[0];

          // get institution info from plaid
          const institution = await getInstitution({
            institutionId: accountsResponse.data.item.institution_id!,
          });

          const account = {
            id: accountData.account_id,
            availableBalance: accountData.balances.available!,
            currentBalance: accountData.balances.current!,
            institutionId: institution.institution_id,
            name: accountData.name,
            officialName: accountData.official_name,
            mask: accountData.mask!,
            type: accountData.type as string,
            subtype: accountData.subtype! as string,
            appwriteItemId: bank.$id,
            sharaebleId: bank.shareableId,
          };

          return account;
        })
    );

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  // DEV ONLY: return a fake account and fake transactions for the dev banks
  if (DEV_BYPASS_AUTH && appwriteItemId?.startsWith("dev-bank")) {
    const mockAccount =
        MOCK_ACCOUNTS.find((a) => a.appwriteItemId === appwriteItemId) ||
        MOCK_ACCOUNTS[0];

    const mockTransactions = MOCK_TRANSACTIONS.filter(
        (t) => t.accountId === mockAccount.id
    );

    return parseStringify({
      data: mockAccount,
      transactions: mockTransactions,
    });
  }

  try {
    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });

    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });
    const accountData = accountsResponse.data.accounts[0];

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferTransactions = transferTransactionsData.documents.map(
        (transferData: Transaction) => ({
          id: transferData.$id,
          name: transferData.name!,
          amount: transferData.amount!,
          date: transferData.$createdAt,
          paymentChannel: transferData.channel,
          category: transferData.category,
          type: transferData.senderBankId === bank.$id ? "debit" : "credit",
        })
    );

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const transactions = await getTransactions({
      accessToken: bank?.accessToken,
    });

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
    };

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...transactions, ...transferTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
  }
};

// Get bank info
export const getInstitution = async ({
                                       institutionId,
                                     }: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get transactions
export const getTransactions = async ({
                                        accessToken,
                                      }: getTransactionsProps) => {
  let hasMore = true;
  let transactions: any = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      transactions = response.data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : "",
        date: transaction.date,
        image: transaction.logo_url,
      }));

      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};