import {
  Address,
  ChainId,
  ConfirmedTransaction,
  Hash,
  Identity,
  Nonce,
  PubkeyBundle,
  SignableBytes,
  SwapAbortTransaction,
  SwapClaimTransaction,
  SwapOfferTransaction,
  TransactionQuery,
  UnsignedTransaction,
  WithCreator,
} from "@iov/bcp";
import { QueryString } from "@iov/tendermint-rpc";
import { As } from "type-tagger";
/** Encodes raw bytes into a hex address */
export declare function encodeGrafainAddress(bytes: Uint8Array): Address;
/** Decodes a printable address */
export declare function decodeGrafainAddress(address: Address): Uint8Array;
/**
 * Creates an IOV address from a given Ed25519 pubkey and
 * a prefix that represents the network kind (i.e. mainnet or testnet)
 */
export declare function pubkeyToAddress(pubkey: PubkeyBundle): Address;
export declare function identityToAddress(identity: Identity): Address;
export declare function isValidAddress(address: string): boolean;
export declare function appendSignBytes(bz: Uint8Array, chainId: ChainId, nonce: Nonce): SignableBytes;
export declare function arraysEqual(a: Uint8Array, b: Uint8Array): boolean;
/** Type to differentiate between a raw hash of the data and the id used internally in weave */
export declare type HashId = Uint8Array & As<"hashid">;
export declare function hashIdentifier(hash: Hash): HashId;
export declare function isHashIdentifier(ident: Uint8Array): ident is HashId;
export declare function hashFromIdentifier(ident: HashId): Hash;
export declare function bucketKey(bucket: string): Uint8Array;
export declare function indexKey(bucket: string, index: string): Uint8Array;
export declare function isConfirmedWithSwapOfferTransaction(
  tx: ConfirmedTransaction<UnsignedTransaction>,
): tx is ConfirmedTransaction<SwapOfferTransaction & WithCreator>;
export declare function isConfirmedWithSwapClaimOrAbortTransaction(
  tx: ConfirmedTransaction<UnsignedTransaction>,
): tx is ConfirmedTransaction<(SwapClaimTransaction | SwapAbortTransaction) & WithCreator>;
export declare function buildQueryString(query: TransactionQuery): QueryString;
