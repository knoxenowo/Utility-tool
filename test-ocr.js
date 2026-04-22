const fs = require('fs');
async function test() {
  const formData = new FormData();
  formData.append('url', 'https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/testing/eurotext.tif');
  formData.append('apikey', 'helloworld');

  try {
    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
