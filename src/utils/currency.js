export const RATES = {
  ETH: 1,
  ZMW: 27000,   // 1 ETH = 27,000 ZMW (demo rate)
  USD: 3200,    // 1 ETH = $3,200 USD (demo rate)
};

export const formatDualCurrency = (ethAmount, showBoth = true) => {
  if (!ethAmount) return "0 ETH";
  
  const eth = parseFloat(ethAmount);
  if (isNaN(eth)) return "0 ETH";
  
  const zmw = (eth * RATES.ZMW).toLocaleString();
  
  if (showBoth) {
    return `${eth.toFixed(2)} ETH (≈ K${zmw})`;
  }
  return `${eth.toFixed(2)} ETH`;
};

export const formatShortDualCurrency = (ethAmount) => {
  if (!ethAmount) return "0 ETH · K0";
  
  const eth = parseFloat(ethAmount);
  if (isNaN(eth)) return "0 ETH · K0";
  
  const zmw = (eth * RATES.ZMW).toLocaleString();
  return `${eth.toFixed(2)} ETH · K${zmw}`;
};
