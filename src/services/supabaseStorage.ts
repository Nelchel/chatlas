const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

let isConfigured = false;
if (supabaseUrl && supabaseAnonKey) {
  isConfigured = true;
}

async function uploadFile(
  localUri: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!isConfigured) return null;

  try {
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    const formData = new FormData();

    formData.append("file", {
      uri: localUri,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn("Supabase upload status:", response.status, text);
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  } catch (e) {
    console.warn("Upload Supabase Storage échoué:", e);
    return null;
  }
}

export async function uploadCatPhoto(
  localUri: string,
  userId: string,
  catId: string
): Promise<string | null> {
  return uploadFile(localUri, "cat-photos", `cats/${userId}/${catId}/main.jpg`);
}

export async function uploadCatPhotoById(
  localUri: string,
  userId: string,
  catId: string,
  photoId: string
): Promise<string | null> {
  return uploadFile(localUri, "cat-photos", `cats/${userId}/${catId}/${photoId}.jpg`);
}

export async function uploadSightingPhoto(
  localUri: string,
  userId: string,
  sightingId: string
): Promise<string | null> {
  return uploadFile(localUri, "cat-photos", `sightings/${userId}/${sightingId}.jpg`);
}

export async function uploadBugReportScreenshot(
  localUri: string,
  userId: string,
  bugReportId: string
): Promise<string | null> {
  return uploadFile(localUri, "cat-photos", `bug-reports/${userId}/${bugReportId}.jpg`);
}
