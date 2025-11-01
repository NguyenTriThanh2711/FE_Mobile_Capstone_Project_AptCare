import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Nén + (tuỳ chọn) resize ảnh giữ tỉ lệ bằng manipuateAsync (API ổn định trên SDK cũ).
 * @param {string} uri
 * @param {{maxWidth?: number, maxHeight?: number, quality?: number, format?: 'jpeg'|'png'|'webp'}} opts
 * @returns {Promise<{ uri: string, width: number, height: number }>}
 */
export async function compressAndResizeImage(uri, opts = {}) {
  const { maxWidth = 1280, maxHeight = 1280, quality = 0.7, format = 'jpeg' } = opts;

  const actions = [{ resize: { width: maxWidth } }];

  const saveFormat =
    format === 'png'
      ? ImageManipulator.SaveFormat.PNG
      : format === 'webp'
        ? ImageManipulator.SaveFormat.WEBP
        : ImageManipulator.SaveFormat.JPEG;

  // API cũ, nhưng chạy ổn trên SDK hiện tại của bạn
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality, // 0..1
    format: saveFormat,
  });

  return result; // { uri, width, height }
}

/**
 * Nén nhiều ảnh (dùng với ImagePickerStrip)
 * @param {Array<{ uri: string, name?: string, type?: string }>} assets
 * @param {object} opts
 * @returns {Promise<Array<{ uri: string, name: string, type: string }>>}
 */
export async function compressMany(assets = [], opts = {}) {
  const out = [];
  for (const a of assets) {
    const r = await compressAndResizeImage(a.uri, opts);

    // Suy đoán mime theo format lưu
    let type = 'image/jpeg';
    if (r.uri.endsWith('.png')) type = 'image/png';
    else if (r.uri.endsWith('.webp')) type = 'image/webp';

    out.push({
      uri: r.uri,
      name: a.name || r.uri.split('/').pop() || `image_${Date.now()}.jpg`,
      type,
    });
  }
  return out;
}
