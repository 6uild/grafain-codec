import { ChainId, Hash, SwapIdBytes } from "@iov/bcp";
import { Encoding } from "@iov/encoding";

import {
  buildCondition,
  buildEscrowCondition,
  conditionToWeaveAddress,
  electionRuleIdToAddress,
  escrowIdToAddress,
  multisignatureIdToAddress,
  swapToAddress,
} from "./conditions";

const { fromHex, toAscii } = Encoding;

describe("conditions", () => {
  describe("buildCondition", () => {
    it("works", () => {
      const condition = buildCondition("foo", "bar", toAscii("123!"));
      expect(condition).toEqual(toAscii("foo/bar/123!"));
    });
  });

  // TODO: test buildMultisignatureCondition

  describe("buildEscrowCondition", () => {
    it("leads to known address", () => {
      const condition = buildEscrowCondition(1);
      expect(conditionToWeaveAddress(condition)).toEqual(fromHex("f3c0c76deb86274d8bb166fb91d840ffd8ec46c4"));
    });
  });

  describe("swapToAddress", () => {
    it("leads to known address", () => {
      const swap = {
        id: {
          data: fromHex("0000000000000001") as SwapIdBytes,
        },
        hash: fromHex("09d638982fbb9d30e8cb984a6fe65a003851f2cee9e28aacf578d242fc776df4") as Hash,
      };
      const address = swapToAddress("local-devnet" as ChainId, swap);
      expect(address).toEqual("B7BA6FFC782FB6B1626F9DAEB41A43CA90966E3C");
    });
  });

  describe("multisignatureIdToAddress", () => {
    it("leads to known address", () => {
      const address = multisignatureIdToAddress("local-devnet" as ChainId, 2);
      expect(address).toEqual("1369E8BBB1384C964CBB3303696F5D3B179033A3");
    });
  });

  describe("escrowIdToAddress", () => {
    it("leads to known address", () => {
      const address = escrowIdToAddress("local-devnet" as ChainId, 1);
      expect(address).toEqual("F3C0C76DEB86274D8BB166FB91D840FFD8EC46C4");
    });
  });

  describe("electionRuleIdToAddress", () => {
    it("leads to known address", () => {
      const address = electionRuleIdToAddress("local-devnet" as ChainId, 2);
      expect(address).toEqual("B3DA15276DE4E18E3A52E400BB6B6B59A9C4DA22");
    });
  });
});
