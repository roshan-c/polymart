/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as apiKeys from "../apiKeys.js";
import type * as bets from "../bets.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as polls from "../polls.js";
import type * as thirdPartyAuth from "../thirdPartyAuth.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  apiKeys: typeof apiKeys;
  bets: typeof bets;
  healthCheck: typeof healthCheck;
  http: typeof http;
  migrations: typeof migrations;
  polls: typeof polls;
  thirdPartyAuth: typeof thirdPartyAuth;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
