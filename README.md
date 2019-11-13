# @6uild/grafain

[![npm version](https://img.shields.io/npm/v/@6uild/grafain.svg)](https://www.npmjs.com/package/@6uild/grafain)

This package is the [Grafain](https://grafain.org) implementation of the `BlockchainConnection` interface.
It contains the codec and types to interact with the blockchain backend.


The main entry point is the
[GrafainConnection](src/grafainConnection.ts),
which creates a Tendermint client (from `iov-tendermint-rpc`) and a codec to
parse transactions. The Grafain codec for reading and writing transactions is exported as top-level
[GrafainCodec](src/grafainCodec.ts).


## Disclaimer
This project is based on [iov-core](https://github.com/iov-one/iov-core) and contains contains many code lines copied from their repository.
A big thank you goes therefore to all the contributors, especially:
* @webmaster128
* @willclarktech
* @ethanfrey  

## License
TBD
