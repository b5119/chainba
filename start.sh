#!/bin/bash
pkill -f "hardhat node" 2>/dev/null
pkill -f "node index.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

gnome-terminal --title="Hardhat" -- bash -c "cd ~/chainba && npx hardhat node; exec bash" &
sleep 5

cd ~/chainba && npx hardhat run scripts/deploy.js --network localhost
cd ~/chainba && npx hardhat run scripts/seed.js --network localhost

gnome-terminal --title="Backend" -- bash -c "cd ~/chainba/chainba-backend && node index.js; exec bash" &
gnome-terminal --title="Frontend" -- bash -c "cd ~/chainba/chainba-frontend && npm start; exec bash" &

echo "✅ Done — clear MetaMask nonce data then refresh browser"
