# @6uild/grafain

[![npm version](https://img.shields.io/npm/v/@iov/bns.svg)](https://www.npmjs.com/package/@iov/bns)

This package is the [Grafain](https://grafain.org) implementation of the BlockchainConnection interface.
It contains the codec and types to interact with the blockchain.


The main entry point is the
[GrafainConnection](src/grafainConnection.ts),
which creates a Tendermint client (from `iov-tendermint-rpc`) and a codec to
parse transactions. The Grafain codec for reading and writing transactions is exported as top-level
[GrafainCodec](src/grafainCodec.ts).


## Disclaimer
This project is based on [iov-core](https://github.com/iov-one/iov-core) and contains contains code copied from their repository.
@webmaster128
@willclarktech  

## License
TBD
