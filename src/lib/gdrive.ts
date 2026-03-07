// Google Drive Integration Library (OAuth 2.0 Version)
// File: /src/lib/gdrive.ts
//
// Uses OAuth 2.0 with Refresh Token to bypass the Service Account 0-byte quota.
// This allows uploading files using the full storage capacity of the authenticated Gmail account.

async function getAccessToken(): Promise<string> {
    const clientId = process.env.GDRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google OAuth2 credentials belum dikonfigurasi. Pastikan GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, dan GOOGLE_REFRESH_TOKEN sudah ada.');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error('[GDrive] Token Refresh Error:', errBody);
        throw new Error(`Gagal refresh access token Google: ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
}

// Strip any URL query params in case folder ID was copied from a Drive URL
const GDRIVE_FOLDER_ID = (process.env.GDRIVE_FOLDER_ID || '').split('?')[0].trim();

/**
 * Create a subfolder in the target GDrive folder.
 */
export async function createGDriveFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const accessToken = await getAccessToken();
    const parent = parentFolderId || GDRIVE_FOLDER_ID;

    // Use query parameter to support shared drives
    const url = 'https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true';

    const createRes = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parent],
        }),
    });

    if (!createRes.ok) {
        const errBody = await createRes.text();
        throw new Error(`Failed to create folder in Google Drive: ${errBody}`);
    }

    const folderData = await createRes.json();
    return folderData.id;
}

/**
 * Find a subfolder by name in the target GDrive folder.
 */
export async function findGDriveFolderByName(folderName: string, parentFolderId?: string): Promise<string | null> {
    const accessToken = await getAccessToken();
    const parent = parentFolderId || GDRIVE_FOLDER_ID;
    const safeFolderName = folderName.replace(/'/g, "\\'");

    const query = `name='${safeFolderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    // Add supportsAllDrives=true and includeItemsFromAllDrives=true for shared drive compatibility
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const searchRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
            return searchData.files[0].id;
        }
    }
    return null;
}

/**
 * Initiate a resumable upload to Google Drive.
 * Returns the resumable session URI.
 */
export async function initiateResumableUpload(
    fileName: string,
    mimeType: string,
    folderId?: string
): Promise<string> {
    const accessToken = await getAccessToken();
    const targetFolder = folderId || GDRIVE_FOLDER_ID;

    // Use supportsAllDrives for shared drives. Include fields so the client receives them after doing the PUT
    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink,webContentLink&supportsAllDrives=true';

    const metadata = {
        name: fileName,
        parents: [targetFolder],
    };

    const initRes = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType,
        },
        body: JSON.stringify(metadata),
    });

    if (!initRes.ok) {
        const errBody = await initRes.text();
        throw new Error(`Failed to initiate resumable upload: ${errBody}`);
    }

    const sessionUri = initRes.headers.get('Location');
    if (!sessionUri) {
        throw new Error('No Location header returned from Google Drive session initialization.');
    }

    return sessionUri;
}

/**
 * Sets permission of a Google Drive file to anyone with the link.
 */
export async function setGDriveFilePermissions(fileId: string): Promise<void> {
    const accessToken = await getAccessToken();
    try {
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone',
                }),
            }
        );
    } catch (permErr) {
        console.error('Failed to set permissions on GDrive file:', permErr);
    }
}

/**
 * Upload a file buffer to Google Drive.
 */
export async function uploadToGDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const accessToken = await getAccessToken();
    const targetFolder = folderId || GDRIVE_FOLDER_ID;

    const metadata = JSON.stringify({
        name: fileName,
        parents: [targetFolder],
    });

    const boundary = 'upload_boundary_' + Date.now();
    const encoder = new TextEncoder();

    const metadataHeaders = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`;
    const fileHeaders = `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const closingBoundary = `\r\n--${boundary}--`;

    const part1 = encoder.encode(metadataHeaders + metadata + fileHeaders);
    const part2 = new Uint8Array(fileBuffer);
    const part3 = encoder.encode(closingBoundary);

    const body = new Uint8Array(part1.length + part2.length + part3.length);
    body.set(part1, 0);
    body.set(part2, part1.length);
    body.set(part3, part1.length + part2.length);

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink&supportsAllDrives=true';

    const uploadRes = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
    });

    if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        throw new Error(`Failed to upload file to Google Drive: ${errBody}`);
    }

    const fileData = await uploadRes.json();
    const fileId = fileData.id;

    // Set permission to anyone with link can view
    try {
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone',
                }),
            }
        );
    } catch (permErr) {
        // Silently ignore permission errors
    }

    return {
        fileId: fileId,
        webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        webContentLink: fileData.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
}

/**
 * Get shareable link for a file
 */
export async function getShareableLink(fileId: string): Promise<string> {
    const accessToken = await getAccessToken();
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    return data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGDrive(fileId: string): Promise<boolean> {
    const accessToken = await getAccessToken();
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
        {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );
    return response.ok;
}

/**
 * List files in a folder
 */
export async function listGDriveFiles(folderId?: string): Promise<Array<{
    id: string
    name: string
    mimeType: string
    webViewLink: string
}>> {
    const accessToken = await getAccessToken();
    const parent = folderId || GDRIVE_FOLDER_ID;
    const query = `'${parent}' in parents and trashed = false`;

    // URI encode the entire query string properly
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink)&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.files || []).map((f: any) => ({
        id: f.id || '',
        name: f.name || '',
        mimeType: f.mimeType || '',
        webViewLink: f.webViewLink || '',
    }));
}
