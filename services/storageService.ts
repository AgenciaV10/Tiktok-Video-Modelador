import type { TikTokData, HistoryItem } from '../types';

const PINNED_CHARACTER_KEY = 'pinnedCharacter';
const TIKTOK_HISTORY_KEY = 'tiktokVideoHistory';

/**
 * Saves the character's image dataURL to localStorage directly as a string.
 * @param dataUrl The base64 data URL of the image.
 */
export const savePinnedCharacter = (dataUrl: string): void => {
    localStorage.setItem(PINNED_CHARACTER_KEY, dataUrl);
};

/**
 * Retrieves the pinned character dataURL string from localStorage.
 * @returns The dataURL string or null if not found.
 */
export const getPinnedCharacter = (): string | null => {
    return localStorage.getItem(PINNED_CHARACTER_KEY);
};

/**
 * Removes the pinned character from localStorage.
 */
export const removePinnedCharacter = (): void => {
    localStorage.removeItem(PINNED_CHARACTER_KEY);
};

/**
 * Converts a dataURL string into a File object.
 * @param dataUrl The base64 data URL.
 * @param filename The desired filename for the new File.
 * @returns A Promise that resolves to a File object.
 */
export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * Converts a File object into a dataURL string.
 * @param file The File to convert.
 * @returns A Promise that resolves to a dataURL string.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to read file as data URL."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


// --- TikTok History Functions ---

/**
 * Retrieves the video history from localStorage.
 * @returns An array of HistoryItem objects.
 */
export const getHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(TIKTOK_HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        return [];
    }
};

/**
 * Saves a new video to the history. If the video already exists, it moves it to the top.
 * @param data The TikTokData object to save.
 * @returns The updated history array.
 */
export const saveVideoToHistory = (data: TikTokData): HistoryItem[] => {
    const currentHistory = getHistory();
    // Remove existing entry if it exists to move it to the top
    const filteredHistory = currentHistory.filter(item => item.data.id !== data.id);
    
    const newHistoryItem: HistoryItem = {
        data,
        addedAt: new Date().toISOString(),
    };
    
    // Add new item to the beginning of the array
    const newHistory = [newHistoryItem, ...filteredHistory];
    
    try {
        localStorage.setItem(TIKTOK_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
    
    return newHistory;
};

/**
 * Removes a video from the history by its ID.
 * @param videoId The ID of the video to remove.
 * @returns The updated history array.
 */
export const removeVideoFromHistory = (videoId: string): HistoryItem[] => {
    const currentHistory = getHistory();
    const newHistory = currentHistory.filter(item => item.data.id !== videoId);
    
    try {
        localStorage.setItem(TIKTOK_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }

    return newHistory;
};