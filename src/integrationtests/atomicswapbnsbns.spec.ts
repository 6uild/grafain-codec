import {
  Address,
  Amount,
  AtomicSwap,
  AtomicSwapConnection,
  AtomicSwapHelpers,
  createTimestampTimeout,
  Identity,
  isBlockInfoPending,
  isBlockInfoSucceeded,
  isClaimedSwap,
  PostTxResponse,
  Preimage,
  SendTransaction,
  SwapClaimTransaction,
  SwapId,
  SwapIdBytes,
  SwapOfferTransaction,
  SwapProcessState,
  TokenTicker,
  UnsignedTransaction,
  WithCreator,
} from "@iov/bcp";
import { Slip10RawIndex } from "@iov/crypto";
import { Ed25519HdWallet, HdPaths, UserProfile } from "@iov/keycontrol";
import BN from "bn.js";

import { grafainCodec } from "../grafainCodec";
import { GrafainConnection } from "../grafainConnection";

const CASH = "CASH" as TokenTicker;
const BASH = "BASH" as TokenTicker;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tendermintSearchIndexUpdated(): Promise<void> {
  // Tendermint needs some time before a committed transaction is found in search
  return sleep(50);
}

function pendingWithoutBnsd(): void {
  if (!process.env.GRAFAIND_ENABLED) {
    pending("Set GRAFAIND_ENABLED to enable grafaind-based tests");
  }
}

interface ActorData {
  readonly profile: UserProfile;
  readonly grafainConnection: AtomicSwapConnection;
  readonly grafainIdentity: Identity;
}

class Actor {
  public static async create(mnemonic: string, hdPath: readonly Slip10RawIndex[]): Promise<Actor> {
    const profile = new UserProfile();
    const wallet = profile.addWallet(Ed25519HdWallet.fromMnemonic(mnemonic));

    const grafainConnection = await GrafainConnection.establish("ws://localhost:23456");

    const grafainIdentity = await profile.createIdentity(wallet.id, grafainConnection.chainId(), hdPath);

    return new Actor({
      profile: profile,
      grafainConnection: grafainConnection as AtomicSwapConnection,
      grafainIdentity: grafainIdentity,
    });
  }

  public readonly grafainIdentity: Identity;
  public get grafainAddress(): Address {
    return grafainCodec.identityToAddress(this.grafainIdentity);
  }

  private readonly profile: UserProfile;
  private readonly grafainConnection: AtomicSwapConnection;
  // tslint:disable-next-line:readonly-keyword
  private preimage: Preimage | undefined;

  public constructor(data: ActorData) {
    this.profile = data.profile;
    this.grafainConnection = data.grafainConnection;
    this.grafainIdentity = data.grafainIdentity;
  }

  // CASH is a token on BNS
  public async getCashBalance(): Promise<BN> {
    const account = await this.grafainConnection.getAccount({ pubkey: this.grafainIdentity.pubkey });
    const balance = account ? account.balance : [];
    const amount = balance.find(row => row.tokenTicker === CASH);
    return new BN(amount ? amount.quantity : 0);
  }

  // BASH is a token on BNS
  public async getBashBalance(): Promise<BN> {
    const account = await this.grafainConnection.getAccount({ pubkey: this.grafainIdentity.pubkey });
    const balance = account ? account.balance : [];
    const amount = balance.find(row => row.tokenTicker === BASH);
    return new BN(amount ? amount.quantity : 0);
  }

  public async getBnsSwap(id: SwapId): Promise<AtomicSwap> {
    const swaps = await this.grafainConnection.getSwaps({ id: id });
    return swaps[swaps.length - 1];
  }

  public async generatePreimage(): Promise<void> {
    // tslint:disable-next-line:no-object-mutation
    this.preimage = await AtomicSwapHelpers.createPreimage();
  }

  public async signAndPost(transaction: UnsignedTransaction): Promise<PostTxResponse> {
    const nonce = await this.grafainConnection.getNonce({ pubkey: transaction.creator.pubkey });

    const signed = await this.profile.signTransaction(transaction, grafainCodec, nonce);
    const txBytes = grafainCodec.bytesToPost(signed);
    const post = await this.grafainConnection.postTx(txBytes);
    return post;
  }

  public async sendTransaction(transaction: UnsignedTransaction): Promise<Uint8Array | undefined> {
    const post = await this.signAndPost(transaction);
    const blockInfo = await post.blockInfo.waitFor(info => !isBlockInfoPending(info));
    if (!isBlockInfoSucceeded(blockInfo)) {
      throw new Error("Transaction failed");
    }
    await tendermintSearchIndexUpdated();
    return blockInfo.result;
  }

  public async sendBnsTokens(recipient: Address, amount: Amount): Promise<Uint8Array | undefined> {
    const transaction = await this.grafainConnection.withDefaultFee<SendTransaction & WithCreator>({
      kind: "bcp/send",
      creator: this.grafainIdentity,
      sender: this.grafainAddress,
      recipient: recipient,
      amount: amount,
    });
    return this.sendTransaction(transaction);
  }

  public async sendSwapOfferOnBns(recipient: Address, amount: Amount): Promise<Uint8Array | undefined> {
    const transaction = await this.grafainConnection.withDefaultFee<SwapOfferTransaction & WithCreator>({
      kind: "bcp/swap_offer",
      creator: this.grafainIdentity,
      memo: "Take this cash",
      recipient: recipient,
      // Reset to something small after https://github.com/iov-one/weave/issues/718
      timeout: createTimestampTimeout(72 * 3600),
      hash: AtomicSwapHelpers.hashPreimage(this.preimage!),
      amounts: [amount],
    });
    return this.sendTransaction(transaction);
  }

  public async sendSwapCounterOnBns(
    offer: AtomicSwap,
    recipient: Address,
    amount: Amount,
  ): Promise<Uint8Array | undefined> {
    const transaction = await this.grafainConnection.withDefaultFee<SwapOfferTransaction & WithCreator>({
      kind: "bcp/swap_offer",
      creator: this.grafainIdentity,
      amounts: [amount],
      recipient: recipient,
      // Reset to something small after https://github.com/iov-one/weave/issues/718
      timeout: createTimestampTimeout(36 * 3600),
      hash: offer.data.hash,
    });
    return this.sendTransaction(transaction);
  }

  public async claimFromKnownPreimageOnBns(offer: AtomicSwap): Promise<Uint8Array | undefined> {
    const transaction = await this.grafainConnection.withDefaultFee<SwapClaimTransaction & WithCreator>({
      kind: "bcp/swap_claim",
      creator: this.grafainIdentity,
      swapId: offer.data.id,
      preimage: this.preimage!,
    });
    return this.sendTransaction(transaction);
  }

  public async claimFromRevealedPreimageOnBns(
    claim: AtomicSwap,
    unclaimedId: SwapId,
  ): Promise<Uint8Array | undefined> {
    if (!isClaimedSwap(claim)) {
      throw new Error("Expected swap to be claimed");
    }
    const transaction = await this.grafainConnection.withDefaultFee<SwapClaimTransaction & WithCreator>({
      kind: "bcp/swap_claim",
      creator: this.grafainIdentity,
      swapId: unclaimedId,
      preimage: claim.preimage, // public data now!
    });
    return this.sendTransaction(transaction);
  }
}

describe("Full atomic swap between two different tokens on BNS", () => {
  // TODO: handle different fees... right now with assumes 0.01 of the main token as fee
  it("works", async () => {
    pendingWithoutBnsd();

    const alice = await Actor.create(
      "host century wave huge seed boost success right brave general orphan lion",
      HdPaths.iov(0),
    );
    expect(alice.grafainAddress).toEqual("33993E9BB716202B33768E95BF326D9585CDB0FC");

    const bob = await Actor.create(
      "dad kiss slogan offer outer bomb usual dream awkward jeans enlist mansion",
      HdPaths.iov(0),
    );
    expect(bob.grafainAddress).toEqual("00DC5A048A3792293954CF380FCB4D0696F976F9");

    // TODO: let independent faucet send those tokens
    // We need to send some native fee tokens to Bob
    // 0.01 CASH send swap counter
    // 0.01 CASH claim
    await alice.sendBnsTokens(bob.grafainAddress, {
      quantity: "20000000",
      fractionalDigits: 9,
      tokenTicker: CASH,
    });

    // alice owns a lot of CASH on BNS
    const aliceInitialCash = await alice.getCashBalance();
    const aliceInitialBash = await alice.getBashBalance();
    expect(aliceInitialCash.gt(new BN(100_000000000))).toEqual(true);

    // bob owns a lot of BASH and some CASH (for fees) on BNS
    const bobInitialCash = await bob.getCashBalance();
    const bobInitialBash = await bob.getBashBalance();
    expect(bobInitialBash.gt(new BN(100_000000000))).toEqual(true);

    // A secret that only Alice knows
    await alice.generatePreimage();

    const aliceOfferId = {
      data: (await alice.sendSwapOfferOnBns(bob.grafainAddress, {
        quantity: "2000000000",
        fractionalDigits: 9,
        tokenTicker: CASH,
      })) as SwapIdBytes,
    };

    // Alice's 2 CASH are locked in the contract (also consider fee)
    expect(aliceInitialCash.sub(await alice.getCashBalance()).toString()).toEqual("2010000000");

    // check correct offer was sent on BNS
    const aliceOffer = await bob.getBnsSwap(aliceOfferId);
    expect(aliceOffer.kind).toEqual(SwapProcessState.Open);
    expect(aliceOffer.data.recipient).toEqual(bob.grafainAddress);
    expect(aliceOffer.data.amounts.length).toEqual(1);
    expect(aliceOffer.data.amounts[0]).toEqual({
      quantity: "2000000000",
      fractionalDigits: 9,
      tokenTicker: CASH,
    });

    const bobOfferId = {
      data: (await bob.sendSwapCounterOnBns(aliceOffer, alice.grafainAddress, {
        quantity: "5000000000",
        fractionalDigits: 9,
        tokenTicker: BASH,
      })) as SwapIdBytes,
    };

    // Bob's 5 BASH are locked in the contract
    expect(bobInitialBash.sub(await bob.getBashBalance()).toString()).toEqual("5000000000");

    // check correct counteroffer was made
    const bobOffer = await alice.getBnsSwap(bobOfferId);
    expect(bobOffer.kind).toEqual(SwapProcessState.Open);
    expect(bobOffer.data.recipient).toEqual(alice.grafainAddress);
    expect(bobOffer.data.amounts.length).toEqual(1);
    expect(bobOffer.data.amounts[0]).toEqual({
      quantity: "5000000000",
      fractionalDigits: 9,
      tokenTicker: BASH,
    });
    await alice.claimFromKnownPreimageOnBns(bobOffer);

    // Alice revealed her secret and should own 5 BASH now
    expect((await alice.getBashBalance()).sub(aliceInitialBash).toString()).toEqual("5000000000");

    // check claim was made
    const aliceClaim = await bob.getBnsSwap(bobOfferId);
    expect(aliceClaim.kind).toEqual(SwapProcessState.Claimed);

    await bob.claimFromRevealedPreimageOnBns(aliceClaim, aliceOfferId);

    // check claim was made on BNS
    const bobClaim = await alice.getBnsSwap(aliceOfferId);
    expect(bobClaim.kind).toEqual(SwapProcessState.Claimed);

    // Bob used Alice's preimage to claim his 2 CASH (minus fees)
    expect((await bob.getCashBalance()).sub(bobInitialCash).toString()).toEqual("1980000000");

    // Alice's CASH balance now down by 2 (plus fees)
    expect(aliceInitialCash.sub(await alice.getCashBalance()).toString()).toEqual("2020000000");

    // Bob's BASH balance now down by 5
    expect(bobInitialBash.sub(await bob.getBashBalance()).toString()).toEqual("5000000000");
  });
});
