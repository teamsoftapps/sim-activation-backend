/** @format */
const generateTransactionId = () => {
  const timestamp = Date.now(); // 13 digits
  const randomOffset = Math.floor(Math.random() * 100000); // 0–99999 (5 digits)
  const rawId = timestamp * 100000 + randomOffset;
  const idStr = rawId.toString();
  return idStr.slice(-12).padStart(12, '0');
};

export default generateTransactionId;
