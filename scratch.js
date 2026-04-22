const CryptoJS = require('crypto-js');
try {
  const enc = CryptoJS.AES.encrypt("hello", "key").toString();
  console.log("Encrypted:", enc);
} catch(e) {
  console.error("Error:", e.message);
}
