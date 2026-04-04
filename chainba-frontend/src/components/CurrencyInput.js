import { useState, useEffect } from "react";
import "./CurrencyInput.css";

const RATES = {
  ETH: 1,
  ZMW: 27000,   // 1 ETH = 27,000 ZMW (demo rate)
  USD: 3200,    // 1 ETH = $3,200 USD (demo rate)
};

export default function CurrencyInput({ value, onChange, label, hint, placeholder }) {
  const [currency, setCurrency] = useState("ZMW");
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    // Convert ETH value to display currency when value prop changes
    if (value && value !== "") {
      const ethNum = parseFloat(value);
      if (!isNaN(ethNum)) {
        setDisplayValue((ethNum * RATES[currency]).toFixed(2));
      }
    } else {
      setDisplayValue("");
    }
  }, [value, currency]);

  const toETH = (amount, curr) => {
    if (!amount || amount === "") return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return "";
    return (num / RATES[curr]).toFixed(6);
  };

  const fromETH = (ethAmount, curr) => {
    if (!ethAmount || ethAmount === "") return "";
    const ethNum = parseFloat(ethAmount);
    if (isNaN(ethNum)) return "";
    return (ethNum * RATES[curr]).toFixed(2);
  };

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Convert to ETH and call onChange
    const ethValue = toETH(inputValue, currency);
    onChange(ethValue);
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    
    // Convert current display value to new currency
    if (displayValue && displayValue !== "") {
      const ethValue = toETH(displayValue, currency);
      const newDisplayValue = fromETH(ethValue, newCurrency);
      setDisplayValue(newDisplayValue);
    }
    
    setCurrency(newCurrency);
  };

  const getConversionText = () => {
    if (!displayValue || displayValue === "") return "";
    
    const ethValue = toETH(displayValue, currency);
    if (!ethValue || ethValue === "") return "";
    
    if (currency === "ETH") {
      const zmwValue = fromETH(ethValue, "ZMW");
      return `= K${parseFloat(zmwValue).toLocaleString()} ZMW`;
    } else if (currency === "ZMW") {
      return `= ${ethValue} ETH`;
    } else if (currency === "USD") {
      return `= ${ethValue} ETH`;
    }
    return "";
  };

  return (
    <div className="currency-input-wrapper">
      {label && (
        <label style={{ color: "#94a3b8", fontSize: "14px", display: "block", marginBottom: "6px" }}>
          {label}
        </label>
      )}
      
      <div className="currency-input-container">
        <input
          type="number"
          step="0.01"
          className="currency-input-field"
          value={displayValue}
          onChange={handleAmountChange}
          placeholder={placeholder || "0.00"}
        />
        
        <select
          className="currency-selector"
          value={currency}
          onChange={handleCurrencyChange}
        >
          <option value="ETH">ETH</option>
          <option value="ZMW">ZMW</option>
          <option value="USD">USD</option>
        </select>
      </div>
      
      {getConversionText() && (
        <div className="currency-conversion">
          {getConversionText()}
        </div>
      )}
      
      {hint && (
        <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
          {hint}
        </div>
      )}
    </div>
  );
}
