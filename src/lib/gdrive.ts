// Google Drive Integration Library
// File: /src/lib/gdrive.ts
// Uses Service Account for server-side access

import { google } from 'googleapis'
import { Readable } from 'stream'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

// Target folder ID from the shared Google Drive folder
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID || '1-3_ZVnntHCYC1SJVGjBxC51woawYB5kM'

function getAuth() {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!credentials) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set')
    }

    let parsed
    try {
        parsed = JSON.parse(credentials)
    } catch {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON')
    }

    return new google.auth.GoogleAuth({
        credentials: parsed,
        scopes: SCOPES,
    })
}

function getDriveClient() {
    const auth = getAuth()
    return google.drive({ version: 'v3', auth })
}

/**
 * Create a subfolder in the target GDrive folder
 */
export async function createGDriveFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const drive = getDriveClient()

    const response = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId || GDRIVE_FOLDER_ID],
        },
        fields: 'id',
    })

    if (!response.data.id) {
        throw new Error('Failed to create folder in Google Drive')
    }

    // Make folder accessible via link
    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    })

    return response.data.id
}

/**
 * Find a subfolder by name in the target GDrive folder
 */
export async function findGDriveFolderByName(folderName: string, parentFolderId?: string): Promise<string | null> {
    const drive = getDriveClient()
    const parent = parentFolderId || GDRIVE_FOLDER_ID

    // Prevent SQL injection-style string breaks in Google Drive query by escaping single quotes
    const safeFolderName = folderName.replace(/'/g, "\\'")

    const response = await drive.files.list({
        q: `'${parent}' in parents and name = '${safeFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        spaces: 'drive',
    })

    if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id || null
    }

    return null
}

/**
 * Upload a file buffer to Google Drive
 */
export async function uploadToGDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const drive = getDriveClient()

    console.log(`GDrive: Uploading file "${fileName}" (${fileBuffer.length} bytes) to folder ${folderId || GDRIVE_FOLDER_ID} using native fetch`)

    const auth = getAuth()
    const token = await auth.getAccessToken()
    if (!token) throw new Error("Could not get Google Drive access token")

    const boundary = "-------314159265358979323846"
    const delimiter = "\r\n--" + boundary + "\r\n"
    const closeDelimiter = "\r\n--" + boundary + "--"

    const metadata = JSON.stringify({
        name: fileName,
        parents: [folderId || GDRIVE_FOLDER_ID]
    })

    const bodyChunks = []
    bodyChunks.push(Buffer.from(delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + metadata + "\r\n"))
    bodyChunks.push(Buffer.from("--" + boundary + "\r\nContent-Type: " + mimeType + "\r\n\r\n"))
    bodyChunks.push(fileBuffer)
    bodyChunks.push(Buffer.from(closeDelimiter))

    const body = Buffer.concat(bodyChunks)

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'multipart/related; boundary=' + boundary,
            'Content-Length': body.length.toString()
        },
        body: body,
        cache: 'no-store'
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error("GDrive upload failed with status", res.status, errorText)
        throw new Error('Failed to upload file to Google Drive: ' + errorText)
    }

    const uploadData = await res.json()
    if (!uploadData.id) {
        throw new Error('Failed to get file ID from upload response')
    }

    const response = {
        data: {
            id: uploadData.id
        }
    }

    // Make file accessible via link
    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    })

    // Fetch updated links after permission change
    const fileInfo = await drive.files.get({
        fileId: response.data.id,
        fields: 'webViewLink,webContentLink',
    })

    return {
        fileId: response.data.id,
        webViewLink: fileInfo.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
        webContentLink: fileInfo.data.webContentLink || `https://drive.google.com/uc?export=download&id=${response.data.id}`,
    }
}

/**
 * Get shareable link for a file
 */
export async function getShareableLink(fileId: string): Promise<string> {
    const drive = getDriveClient()

    const response = await drive.files.get({
        fileId,
        fields: 'webViewLink',
    })

    return response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGDrive(fileId: string): Promise<boolean> {
    try {
        const drive = getDriveClient()
        await drive.files.delete({ fileId })
        return true
    } catch (error) {
        console.error('Error deleting file from GDrive:', error)
        return false
    }
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
    const drive = getDriveClient()

    const response = await drive.files.list({
        q: `'${folderId || GDRIVE_FOLDER_ID}' in parents and trashed = false`,
        fields: 'files(id,name,mimeType,webViewLink)',
        orderBy: 'createdTime desc',
    })

    return (response.data.files || []).map(f => ({
        id: f.id || '',
        name: f.name || '',
        mimeType: f.mimeType || '',
        webViewLink: f.webViewLink || '',
    }))
}
