import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Initiates a file download in the browser without navigating away from the page.
 * This is useful for cross-origin downloads where the 'download' attribute on an 'a' tag is not honored.
 * @param url The direct URL of the file to download.
 * @param filename The desired name for the downloaded file.
 * @returns A promise that resolves when the download has been initiated, or rejects on error.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const objectUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    
    // Append to the body, click, and then remove
    document.body.appendChild(a);
    a.click();
    
    // Clean up by removing the element and revoking the object URL
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
    
  } catch (error) {
    console.error("Download failed:", error);
    // Re-throw the error so the caller can handle it, e.g., by showing a toast notification.
    throw new Error("Could not download the file. Please check the console for more details.");
  }
}
