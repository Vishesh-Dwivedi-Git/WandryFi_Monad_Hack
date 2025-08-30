# Wanderify - Travel to Earn [(Deployed link)](https://wandry-fi-monad-hack.vercel.app/)

Wanderify is a decentralized application (dApp) that gamifies travel by allowing users to stake tokens and earn rewards upon successful journey completion. The project integrates blockchain technology, smart contracts, and a modern web stack to deliver a seamless and engaging user experience.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Smart Contracts](#smart-contracts)
6. [Backend](#backend)
7. [Frontend](#frontend)
8. [Deployment](#deployment)
9. [Contributing](#contributing)
10. [License](#license)

---

## Features

- **Travel-to-Earn Mechanism**: Stake tokens to prove on-ground arrival and earn rewards.
- **NFT Rewards**: Users receive NFTs for completing journeys.
- **Blockchain Integration**: Built on Ethereum-compatible networks.
- **Responsive Frontend**: Developed with Next.js and Tailwind CSS.
- **Secure Backend**: Express.js server for API handling and wallet management.
- **Smart Contracts**: ERC721-based NFT implementation using OpenZeppelin libraries.

---

## Project Structure

The project is divided into three main components:

```
├── backend/          # Backend server (Express.js)
├── client/           # Frontend application (Next.js)
├── smart_Contract/   # Solidity smart contracts
```

### Key Directories and Files

- **Backend**:
  - `index.js`: Main server file.
  - `.gitignore`: Ignored files for the backend.
- **Client**:
  - `app/`: Contains Next.js pages and layouts.
  - `components/`: Reusable React components.
  - `contracts/`: ABI and contract-related files.
  - `lib/`: Utility functions and configurations.
  - `public/`: Static assets.
  - `styles/`: Global CSS files.
- **Smart Contracts**:
  - `src/WandryFi.sol`: Main smart contract.
  - `script/`: Deployment and setup scripts.
  - `test/`: Contract tests.

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v16+)
- npm, yarn, or pnpm
- Foundry (for smart contract development)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/wanderify.git
   cd wanderify
   ```

2. Install dependencies for each component:

   - **Backend**:
     ```bash
     cd backend
     npm install
     ```

   - **Client**:
     ```bash
     cd client
     npm install
     ```

   - **Smart Contracts**:
     ```bash
     cd smart_Contract
     forge install
     ```

---

## Environment Variables

Create `.env` files in the respective directories and populate them with the following variables:

### Backend (`backend/.env`)

```env
VERIFIER_PRIVATE_KEY=<your-private-key>
API_KEY=<your-api-key>
```

### Client (`client/.env`)

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://rpc.monad.testnet.example
```

### Smart Contracts (`smart_Contract/.env`)

```env
PRIVATE_KEY=<your-private-key>
RPC_URL=<your-rpc-url>
```

---

## Smart Contracts

The smart contracts are located in the `smart_Contract` directory. The main contract is `src/WandryFi.sol`, which implements the ERC721 standard for NFTs.

### Compile Contracts

```bash
forge build
```

### Test Contracts

```bash
forge test
```

### Deploy Contracts

Deployment scripts are located in the `script/` directory. Use Foundry to deploy:

```bash
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
```

---

## Backend

The backend is built with Express.js and handles API requests, wallet management, and communication with the blockchain.

### Start the Backend

```bash
cd backend
npm start
```

The server will run on `http://localhost:5000`.

---

## Frontend

The frontend is a Next.js application styled with Tailwind CSS. It provides a responsive and interactive user interface.

### Start the Frontend

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Deployment

### Backend

Deploy the backend to a cloud provider like AWS, Heroku, or Vercel.

### Frontend

Deploy the frontend using Vercel:

1. Connect your GitHub repository to Vercel.
2. Set the environment variables in the Vercel dashboard.
3. Deploy the application.

### Smart Contracts

Deploy the contracts to your desired Ethereum-compatible network using Foundry.

---

## Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
This was made as a part of Monad Hackathon @ IIIT Dharwad
