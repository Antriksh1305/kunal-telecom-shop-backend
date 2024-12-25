const imageKit = require('../config/imagekit');

/**
 * Upload a file to ImageKit
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The file name
 * @param {string} folder - The folder in ImageKit
 * @returns {Object} - ImageKit upload response
 */
const uploadToImageKit = async (fileBuffer, fileName, folder) => {
    try {
        const response = await imageKit.upload({
            file: fileBuffer, // Buffer
            fileName: fileName,
            folder: folder,
        });
        return response;
    } catch (error) {
        console.error('Error uploading to ImageKit:', error);
        throw error;
    }
};

/**
 * Delete a file in ImageKit by fileId
 * @param {string} fileId - The ImageKit file ID
 * @returns {Object} - ImageKit delete response
 */
const deleteFileFromImageKit = async (fileId) => {
    try {
        const response = await imageKit.deleteFile(fileId);
        return response;
    } catch (error) {
        console.error('Error deleting file from ImageKit:', error);
        throw error;
    }
};

/**
 * Delete all files in a folder from ImageKit
 * 
 * This function retrieves all files in the specified folder, divides them into chunks of up to 100 file IDs, 
 * and deletes them in batches using ImageKit's `bulkDeleteFiles` method.
 * 
 * @param {string} folderPath - The folder path in ImageKit.
 * @returns {Promise<Object[]>} - Array of responses from ImageKit for each batch of deleted files.
 * 
 * @throws {Error} - Throws an error if the file retrieval or deletion fails.
 */
const deleteAllFilesInFolder = async (folderPath) => {
    try {
        const fileListResponse = await imageKit.listFiles({
            path: folderPath,
            perPage: 1000,
        });

        if (!fileListResponse || fileListResponse.length === 0) {
            console.log('No files found in the folder.');
            return [];
        }

        const fileIds = fileListResponse.map((file) => file.fileId);

        const chunkedFileIds = [];
        for (let i = 0; i < fileIds.length; i += 100) {
            chunkedFileIds.push(fileIds.slice(i, i + 100));
        }

        const deleteResponses = [];
        for (const chunk of chunkedFileIds) {
            const response = await imageKit.bulkDeleteFiles(chunk);
            deleteResponses.push(response);
        }

        console.log('All files deleted successfully.');
        return deleteResponses;
    } catch (error) {
        console.error('Error deleting files from ImageKit:', error);
        throw error;
    }
};

module.exports = {
    uploadToImageKit,
    deleteFileFromImageKit,
    deleteAllFilesInFolder,
};