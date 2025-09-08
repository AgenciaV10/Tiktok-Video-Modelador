
interface FrameExtractionResult {
    dataUrl: string;
    timestamp: number;
}

/**
 * Extracts a specified number of frames from a video file.
 * @param videoFile The video file to process.
 * @param frameCount The number of frames to extract.
 * @returns A promise that resolves to an array of objects, each containing a frame's data URL and timestamp.
 */
export const extractFramesFromVideo = (
    videoFile: File,
    frameCount: number = 20
): Promise<FrameExtractionResult[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return reject(new Error('Canvas 2D context is not available.'));
        }

        const frames: FrameExtractionResult[] = [];
        let processedFrames = 0;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const duration = video.duration;
            // Avoid extracting a frame from the very end to prevent black frames
            const effectiveDuration = duration > 0.5 ? duration - 0.25 : duration;
            const interval = effectiveDuration / (frameCount - 1);

            const captureFrame = (frameIndex: number) => {
                const timestamp = frameIndex * interval;
                video.currentTime = Math.min(timestamp, duration);
            };

            video.onseeked = () => {
                if (processedFrames < frameCount) {
                    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                    frames.push({
                        dataUrl: canvas.toDataURL('image/jpeg', 0.8), // Use JPEG for smaller thumbnail size
                        timestamp: video.currentTime
                    });
                    
                    processedFrames++;
                    if (processedFrames < frameCount) {
                        captureFrame(processedFrames);
                    } else {
                        URL.revokeObjectURL(video.src);
                        resolve(frames);
                    }
                }
            };

            // Start the process
            captureFrame(0);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video file for frame extraction.'));
        };

        video.src = URL.createObjectURL(videoFile);
    });
};
