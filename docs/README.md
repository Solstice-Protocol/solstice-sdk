# Solstice SDK Documentation

Welcome to the Solstice SDK documentation. This SDK provides zero-knowledge identity verification capabilities for Solana applications using India's Aadhaar infrastructure.

## 📖 Documentation Structure

- [**Quick Start Guide**](./quick-start.md) - Get started with the SDK in 5 minutes
- [**API Reference**](./api-reference.md) - Complete API documentation
- [**Examples**](./examples.md) - Code examples and use cases
- [**Architecture**](./architecture.md) - Technical architecture and design decisions
- [**Integration Guide**](./integration.md) - Step-by-step integration instructions

##  Quick Installation

```bash
npm install @solsticeprotocol/sdk
```

## 📝 Basic Usage

```javascript
import { EnhancedSolsticeSDK } from '@solsticeprotocol/sdk';

const sdk = new EnhancedSolsticeSDK({
  network: 'devnet',
  endpoint: 'https://api.devnet.solana.com'
});

await sdk.initialize();
```

## 🔗 Useful Links

- [NPM Package](https://www.npmjs.com/package/@solsticeprotocol/sdk)
- [GitHub Repository](https://github.com/Shaurya2k06/SolsticeProtocol)
- [Live Examples](../examples/)

## 🆘 Support

For questions and support, please open an issue on our [GitHub repository](https://github.com/Shaurya2k06/SolsticeProtocol/issues).