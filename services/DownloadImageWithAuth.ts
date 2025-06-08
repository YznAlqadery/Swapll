import * as FileSystem from "expo-file-system";

export async function downloadImageWithAuth(
  imagePath: string,
  token: string,
  filename: string
) {
  if (!imagePath || !token) return null;

  try {
    const imageUrl = process.env.EXPO_PUBLIC_API_URL + imagePath;
    const localUri = `${FileSystem.cacheDirectory}${filename}`;

    const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return downloadRes.uri;
  } catch (error) {
    console.error(`Failed to download image ${filename}:`, error);
    return null;
  }
}
