const API_CONFIG = {
    // PocketBase Configuration
    // Update POCKETBASE_URL when configuring Cloudflare Tunnel or changing network
    POCKETBASE_URL: "http://192.168.6.103:8090",
    COLLECTION_NAME: "fotos",
    FILE_FIELD_NAME: "imagen"
};

export const getPocketBaseFileUrl = (record) => {
    if (!record || !record.id || !record[API_CONFIG.FILE_FIELD_NAME]) return null;
    return `${API_CONFIG.POCKETBASE_URL}/api/files/${record.collectionId || record.collectionName}/${record.id}/${record[API_CONFIG.FILE_FIELD_NAME]}`;
};

export default API_CONFIG;
