/**
 * Generates a random alphanumeric share code
 * @param length - Length of the code (default 8)
 * @returns Alphanumeric string of specified length
 */
export function generateShareCode(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

/**
 * Validates a share code format
 * @param code - Code to validate
 * @returns true if valid format
 */
export function isValidShareCode(code: string): boolean {
    return /^[a-zA-Z0-9]{8}$/.test(code);
}
