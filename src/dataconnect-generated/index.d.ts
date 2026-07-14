import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface ClassificationSystem_Key {
  id: UUIDString;
  __typename?: 'ClassificationSystem_Key';
}

export interface FieldEntry_Key {
  id: UUIDString;
  __typename?: 'FieldEntry_Key';
}

export interface GetUsersData {
  users: ({
    id: UUIDString;
    email: string;
    firstName: string;
    lastName: string;
  } & User_Key)[];
}

export interface QuizQuestion_Key {
  id: UUIDString;
  __typename?: 'QuizQuestion_Key';
}

export interface Quiz_Key {
  id: UUIDString;
  __typename?: 'Quiz_Key';
}

export interface SeedUsersData {
  user_insert: User_Key;
  user2: User_Key;
  user3: User_Key;
}

export interface SoilHorizon_Key {
  id: UUIDString;
  __typename?: 'SoilHorizon_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface GetUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUsersData, undefined>;
  operationName: string;
}
export const getUsersRef: GetUsersRef;

export function getUsers(options?: ExecuteQueryOptions): QueryPromise<GetUsersData, undefined>;
export function getUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUsersData, undefined>;

interface SeedUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<SeedUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<SeedUsersData, undefined>;
  operationName: string;
}
export const seedUsersRef: SeedUsersRef;

export function seedUsers(): MutationPromise<SeedUsersData, undefined>;
export function seedUsers(dc: DataConnect): MutationPromise<SeedUsersData, undefined>;

