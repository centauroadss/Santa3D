import axios from 'axios';
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
export interface InstagramMedia {
    id: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url?: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    username?: string;
}
export const InstagramService = {
    getTaggedMedia: async (): Promise<InstagramMedia[]> => {
        if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
            throw new Error('CONFIG_MISSING: Instagram Credentials missing');
        }
        try {
            const response = await axios.get(`${GRAPH_API_URL}/${IG_USER_ID}/tags`, {
                params: {
                    access_token: IG_ACCESS_TOKEN,
                    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,username',
                    limit: 50
                }
            });
            return response.data.data || [];
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || error.message;
            console.error('Error fetching Instagram Tagged Media:', msg);
            throw new Error(`INSTAGRAM_API_ERROR: ${msg}`);
        }
    },
    getMediaMetrics: async (mediaId: string) => {
        if (!IG_ACCESS_TOKEN) return null;
        try {
            const response = await axios.get(`${GRAPH_API_URL}/${mediaId}`, {
                params: {
                    access_token: IG_ACCESS_TOKEN,
                    fields: 'like_count,comments_count'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching metrics for media ${mediaId}:`, error);
            return null;
        }
    }
};
