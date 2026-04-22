import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface GeneratePassportPdfParams {
  imageUri: string;
  photoWidthMm: number;
  photoHeightMm: number;
  paperSize: 'A4' | 'Letter';
  copies: number;
}

export const generatePassportPdf = async ({
  imageUri,
  photoWidthMm,
  photoHeightMm,
  paperSize,
  copies,
}: GeneratePassportPdfParams) => {
  let dataUri = imageUri;

  // Web doesn't support FileSystem.readAsStringAsync and handles local blob URIs directly in HTML.
  if (Platform.OS !== 'web') {
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    dataUri = `data:image/jpeg;base64,${base64Image}`;
  }

  // Convert mm to pixels at ~96 DPI for the HTML rendering
  const mmToPx = (mm: number) => Math.round(mm * 3.779527559);

  const widthPx = mmToPx(photoWidthMm);
  const heightPx = mmToPx(photoHeightMm);

  // Define grid columns based on paper size
  const cols = paperSize === 'A4' ? 4 : 4;

  let imageTags = '';
  for (let i = 0; i < copies; i++) {
    imageTags += `<div class="photo-cell"><img src="${dataUri}" width="${widthPx}px" height="${heightPx}px" /></div>`;
  }

  const html = `
    <html>
      <head>
        <style>
          @page { size: ${paperSize === 'A4' ? 'A4' : 'letter'}; margin: 10mm; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            display: flex;
            justify-content: center;
          }
          .grid {
            display: flex;
            flex-wrap: wrap;
            gap: 5mm;
            justify-content: flex-start;
            align-content: flex-start;
            width: 100%;
          }
          .photo-cell {
            width: ${widthPx}px;
            height: ${heightPx}px;
            border: 1px dashed #ccc; /* Cut lines */
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${imageTags}
        </div>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return null;
    } else {
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      return uri;
    }
  } catch (error) {
    console.error('Error generating PDF', error);
    throw error;
  }
};
