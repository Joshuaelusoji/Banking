
'use server';

import { ID, Query } from 'node-appwrite';
import { createAdminClient, createSessionClient } from '../appwrite';
import { cookies } from 'next/headers';
import { parseStringify } from '../utils';

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

const DEV_BYPASS_AUTH =
  process.env.NODE_ENV === 'development' &&
  process.env.DEV_BYPASS_AUTH === 'true';

if (
  process.env.NODE_ENV === 'production' &&
  process.env.DEV_BYPASS_AUTH === 'true'
) {
  throw new Error(
    "Can't run in production! DEV_BYPASS_AUTH is still active."
  );
}

const DEV_USER = {
  $id: 'dev-user',
  userId: 'dev-user',
  firstName: 'John',
  lastName: 'Doe',
  email: 'example@gmail.com',
  avatar: '/images/.png',
  address1: '1 Test Street',
  city: 'Test City',
  state: 'Lagos',
  postalCode: '100001',
  dateOfBirth: '1990-01-01',
};

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );

    return user.documents[0]
      ? parseStringify(user.documents[0])
      : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession(
      email,
      password
    );

    cookies().set('appwrite-session', session.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    const user = await getUserInfo({ userId: session.userId });

    return user ? parseStringify(user) : null;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const signUp = async ({
  password,
  ...userData
}: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  try {
    const { account, database } = await createAdminClient();

    // 1. Create the Appwrite authentication account.
    const newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    );

    if (!newUserAccount) {
      throw new Error('Error creating user account');
    }

    // 2. Save the user's profile in Appwrite.
    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
      }
    );

    // 3. Create a session for the newly registered user.
    const session = await account.createEmailPasswordSession(
      email,
      password
    );

    // 4. Save the session cookie.
    cookies().set('appwrite-session', session.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return parseStringify(newUser);
  } catch (error) {
    console.error('Sign-up error:', error);
    throw error;
  }
};

export async function getLoggedInUser() {
  // Development only: use a mock user when explicitly enabled.
  if (DEV_BYPASS_AUTH) return DEV_USER;

  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id });

    return user ? parseStringify(user) : null;
  } catch {
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    await account.deleteSession('current');
    cookies().delete('appwrite-session');

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return null;
  }
};

// Bank document storage and retrieval remain in Appwrite.
// These functions no longer connect to Plaid or Dwolla.

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    );

    return parseStringify(bankAccount);
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw error;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  if (DEV_BYPASS_AUTH && userId === DEV_USER.userId) {
    return [];
  }

  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );

    return parseStringify(banks.documents);
  } catch (error) {
    console.error('Error getting banks:', error);
    return [];
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', [documentId])]
    );

    return bank.documents[0]
      ? parseStringify(bank.documents[0])
      : null;
  } catch (error) {
    console.error('Error getting bank:', error);
    return null;
  }
};

export const getBankByAccountId = async ({
  accountId,
}: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    );

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.error('Error getting bank by account ID:', error);
    return null;
  }
};