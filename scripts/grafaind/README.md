# Starting a local BNS blockchain

This starts a local [grafain](https://github.com/iov-one/weave) application.

## Requirements

- docker

## Start

From repo root:

```
./scripts/grafain/start.sh
export GRAFAIN_ENABLED=1
```

## Stop

From repo root:

```
./scripts/grafain/stop.sh
unset GRAFAIN_ENABLED
```

## Genesis accounts

IOV HD derivation used for IOV-Core tests and
[Faucet HD wallet](https://github.com/iov-one/iov-faucet/#faucet-hd-wallet) used
for the token holder account of iov-faucet.

```
mnemonic: degree tackle suggest window test behind mesh extra cover prepare oak script

path: m/44'/234'/0'
pubkey: 418f88ff4876d33a3d6e2a17d0fe0e78dc3cb5e4b42c6c156ed1b8bfce5d46d1
IOV address: A4F97447E7DF55B6EF0D6209EBEF2A7B22625376

path: m/1229936198'/1'/0'/0'
pubkey: e05f47e7639b47625c23738e2e46d092819abd6039c5fc550d9aa37f1a2556a1
IOV address: tiov1q5lyl7asgr2dcweqrhlfyexqpkgcuzrm4e0cku
```

### The Alice account in atomic swap tests with CASH balance

```
mnemonic: host century wave huge seed boost success right brave general orphan lion

path: m/44'/234'/0'
pubkey: f5ef5fbafa490296eb8465d08efc018caf35e709bf695b43de58334743b84f7b
IOV address: 33993E9BB716202B33768E95BF326D9585CDB0FC
hex address: 33993e9bb716202b33768e95bf326d9585cdb0fc
```

### The Bob account in atomic swap tests with BASH balance

```
mnemonic: dad kiss slogan offer outer bomb usual dream awkward jeans enlist mansion

path: m/44'/234'/0'
pubkey: 1e93dfd6b1d897fb5037f389e8ebfb14dc08b50c151b0a335ac9eeeb56f8b752
IOV address: 00DC5A048A3792293954CF380FCB4D0696F976F9
hex address: 00dc5a048a3792293954cf380fcb4d0696f976f9
```
