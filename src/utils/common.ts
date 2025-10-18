import {
    FILE_SIZE_UNITS,
    FILE_SIZE_THRESHOLD,
    FILE_SIZE_DECIMAL_PRECISION,
    SIZE_PLACEHOLDER_DASH,
    LAST_DOT_INDEX,
    EMPTY_STRING,
    PROPERTY_ID_PREFIX,
    PROPERTY_ID_BASE_36,
    PROPERTY_ID_SLICE_START,
    PROPERTY_ID_RANDOM_LENGTH
} from "../constants";

/**
 * Utility functions for file operations
 */
export class FileUtils {
    /**
     * Convert bytes to human-readable file size
     */
    static humanFileSize(bytes?: number): string {
        if (bytes === undefined) return SIZE_PLACEHOLDER_DASH;

        const thresh = FILE_SIZE_THRESHOLD;
        if (Math.abs(bytes) < thresh) {
            return bytes + " B";
        }

        const units = FILE_SIZE_UNITS;
        let u = LAST_DOT_INDEX;
        let value = bytes;

        do {
            value /= thresh;
            ++u;
        } while (Math.abs(value) >= thresh && u < units.length + LAST_DOT_INDEX);

        return value.toFixed(FILE_SIZE_DECIMAL_PRECISION) + " " + units[u];
    }

    /**
     * Get file extension from filename
     */
    static getFileExtension(name: string): string {
        const index = name.lastIndexOf(".");
        if (index === LAST_DOT_INDEX) return EMPTY_STRING;
        return name.substring(index + 1).toLowerCase();
    }

    /**
     * Check if file can be previewed (image files)
     */
    static canPreview(filename: string, previewExtensions: string[]): boolean {
        const ext = this.getFileExtension(filename);
        return previewExtensions.includes(ext);
    }
}

/**
 * Utility functions for ID generation
 */
export class IdUtils {
    /**
     * Generate unique property ID
     */
    static generatePropertyId(): string {
        const globalThis = (window as unknown) as { crypto?: { randomUUID?: () => string } };
        const randomUUID = globalThis?.crypto?.randomUUID?.();

        if (randomUUID) return randomUUID;

        return `${PROPERTY_ID_PREFIX}${Math.random()
            .toString(PROPERTY_ID_BASE_36)
            .slice(PROPERTY_ID_SLICE_START, PROPERTY_ID_RANDOM_LENGTH)}_${Date.now()}`;
    }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
    /**
     * Extract error message from unknown error
     */
    static getErrorMessage(error: unknown, fallback: string = "Unknown error"): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return fallback;
    }

    /**
     * Check if error has message property
     */
    static hasMessage(error: unknown): error is { message: string } {
        return typeof error === "object" && error !== null && "message" in error;
    }
}

/**
 * Utility functions for array operations
 */
export class ArrayUtils {
    /**
     * Check if array is empty
     */
    static isEmpty<T>(array: T[]): boolean {
        return array.length === 0;
    }

    /**
     * Check if array has items
     */
    static hasItems<T>(array: T[]): boolean {
        return array.length > 0;
    }

    /**
     * Remove item at index
     */
    static removeAt<T>(array: T[], index: number): T[] {
        return array.filter((_, i) => i !== index);
    }

    /**
     * Move item from one index to another
     */
    static moveItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
        const result = [...array];
        const [movedItem] = result.splice(fromIndex, 1);
        if (movedItem !== undefined) {
            result.splice(toIndex, 0, movedItem);
        }
        return result;
    }
}

/**
 * Utility functions for object operations
 */
export class ObjectUtils {
    /**
     * Deep clone an object
     */
    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
        if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as unknown as T;

        const cloned = {} as T;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Check if object has keys
     */
    static hasKeys(obj: Record<string, unknown>): boolean {
        return Object.keys(obj).length > 0;
    }

    /**
     * Pick specific keys from object
     */
    static pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        const result = {} as Pick<T, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    }
}

/**
 * Utility functions for string operations
 */
export class StringUtils {
    /**
     * Capitalize first letter
     */
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Convert camelCase to kebab-case
     */
    static kebabCase(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Truncate string with ellipsis
     */
    static truncate(str: string, maxLength: number): string {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
    }

    /**
     * Check if string is empty or whitespace only
     */
    static isBlank(str: string): boolean {
        return !str || str.trim().length === 0;
    }
}