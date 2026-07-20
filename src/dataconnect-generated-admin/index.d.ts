import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

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

/** Generated Node Admin SDK operation action function for the 'GetUsers' Query. Allow users to execute without passing in DataConnect. */
export function getUsers(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUsersData>>;
/** Generated Node Admin SDK operation action function for the 'GetUsers' Query. Allow users to pass in custom DataConnect instances. */
export function getUsers(options?: OperationOptions): Promise<ExecuteOperationResponse<GetUsersData>>;

/** Generated Node Admin SDK operation action function for the 'SeedUsers' Mutation. Allow users to execute without passing in DataConnect. */
export function seedUsers(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<SeedUsersData>>;
/** Generated Node Admin SDK operation action function for the 'SeedUsers' Mutation. Allow users to pass in custom DataConnect instances. */
export function seedUsers(options?: OperationOptions): Promise<ExecuteOperationResponse<SeedUsersData>>;

