// Google Drive Integration Library
// File: /src/lib/gdrive.ts
// Uses Service Account for server-side access
//
// IMPORTANT: This lib is designed to work with a Shared Drive (Team Drive).
// Service Accounts have NO personal storage quota, so files must be uploaded
// into a Shared Drive where quota belongs to the organization.
//
// Setup:
// 1. Create a Shared Drive in Google Drive
// 2. Add the service account email as a Manager of the Shared Drive
// 3. Set GDRIVE_FOLDER_ID to the Shared Drive ID (or a subfolder within it)
// 4. All API calls use supportsAllDrives: true + includeItemsFromAllDrives: true

import { google } from 'googleapis'
import { Readable } from 'stream'

const SCOPES = ['https://www.googleapis.com/auth/drive']

// Strip any URL query params in case folder ID was copied from a Drive URL
const GDRIVE_FOLDER_ID = (process.env.GDRIVE_FOLDER_ID || '').split('?')[0].trim()

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
 * Create a subfolder in the target GDrive folder.
 * Supports Shared Drives via supportsAllDrives: true
 */
export async function createGDriveFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const drive = getDriveClient()
    const parent = parentFolderId || GDRIVE_FOLDER_ID
    console.log(`[GDrive] Creating folder "${folderName}" under parent: ${parent.slice(0, 12)}...`)
    const response = await drive.files.create({
        supportsAllDrives: true,
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parent],
        },
        fields: 'id',
    })

    if (!response.data.id) {
        throw new Error('Failed to create folder in Google Drive')
    }

    return response.data.id
}

/**
 * Find a subfolder by name in the target GDrive folder.
 * Supports Shared Drives via includeItemsFromAllDrives: true
 */
export async function findGDriveFolderByName(folderName: string, parentFolderId?: string): Promise<string | null> {
    const drive = getDriveClient()
    const parent = parentFolderId || GDRIVE_FOLDER_ID

    // Escape single quotes in folder name for Drive query
    const safeFolderName = folderName.replace(/'/g, "\\'")

    try {
        const response = await drive.files.list({
            q: `'${parent}' in parents and name = '${safeFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)',
            spaces: 'drive',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        })

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id || null
        }

        return null
    } catch (err: any) {
        if (err?.code === 404 || err?.status === 404) {
            console.warn(`[GDrive] findGDriveFolderByName: parent folder '${parent.slice(0, 8)}...' returned 404 — folder may not be shared with service account. Returning null.`)
            return null
        }
        throw err
    }
}

/**
 * Upload a file buffer to Google Drive (Shared Drive compatible).
 * supportsAllDrives: true is required for Shared Drives.
 */
export async function uploadToGDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const drive = getDriveClient()
    const targetFolder = folderId || GDRIVE_FOLDER_ID

    console.log(`GDrive: Uploading file "${fileName}" (${fileBuffer.length} bytes) to folder ${targetFolder}`)

    const fileMetadata = {
        name: fileName,
        parents: [targetFolder]
    }

    const media = {
        mimeType: mimeType,
        body: Readable.from(fileBuffer)
    }

    try {
        const response = await drive.files.create({
            supportsAllDrives: true,
            requestBody: fileMetadata,
            media: media,
            fields: 'id,webViewLink,webContentLink',
        })

        if (!response.data.id) {
            throw new Error('Failed to get file ID from upload response')
        }

        const fileId = response.data.id

        // For Shared Drives, files are accessible to Drive members automatically.
        // We still try to set public read permission, but silently ignore errors
        // (Shared Drive admins may restrict sharing permissions).
        try {
            await drive.permissions.create({
                fileId: fileId,
                supportsAllDrives: true,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            })
        } catch (permErr: any) {
            console.warn(`[GDrive] Could not set public read permission on file ${fileId}:`, permErr?.message)
        }

        return {
            fileId: fileId,
            webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
            webContentLink: response.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`,
        }
    } catch (error: any) {
        console.error("GDrive upload failed with error", error)
        throw new Error('Failed to upload file to Google Drive: ' + error.message)
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
        supportsAllDrives: true,
    })

    return response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGDrive(fileId: string): Promise<boolean> {
    try {
        const drive = getDriveClient()
        await drive.files.delete({ fileId, supportsAllDrives: true })
        return true
    } catch (error) {
        console.error('Error deleting file from GDrive:', error)
        return false
    }
}

/**
 * List files in a folder (Shared Drive compatible)
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
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    })

    return (response.data.files || []).map(f => ({
        id: f.id || '',
        name: f.name || '',
        mimeType: f.mimeType || '',
        webViewLink: f.webViewLink || '',
    }))
}
