/**
 * Preload an image and return a promise that resolves when the image is loaded
 * @param {string} src - URL of the image to preload
 * @returns {Promise<HTMLImageElement>} - Promise resolving to the loaded image element
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    // Set a timeout for loading
    const timeout = setTimeout(() => {
      console.warn(`Image loading timed out: ${src}`);
      reject(new Error('Image loading timeout'));
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      console.log(`Image preloaded successfully: ${src} (${img.naturalWidth}x${img.naturalHeight})`);
      resolve(img);
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error(`Error preloading image: ${src}`, error);
      reject(error);
    };

    img.src = src;
  });
}

/**
 * Check if an image URL exists without fully loading it
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Promise resolving to true if URL exists, false otherwise
 */
export function checkImageExists(url) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const { signal } = controller;

    // We don't need the full image, just a HEAD request to check if it exists
    fetch(url, {
      method: 'HEAD',
      signal,
      // Permissive mode needed for some URLs
      mode: 'no-cors'
    })
    .then(response => {
      resolve(response.ok);
    })
    .catch(() => {
      resolve(false);
    })
    .finally(() => {
      // Abort after 2 seconds regardless
      setTimeout(() => controller.abort(), 2000);
    });

    // Abort after 2 seconds anyway
    setTimeout(() => {
      controller.abort();
      resolve(false);
    }, 2000);
  });
}
