// Application Constants
export const APP_TITLE = "Travel Guide CMS";

// Storage and Local Storage Keys
export const LOCALE_STORAGE_KEY = "cms_active_locale";

// Firestore Collection Names
export const CMS_COLLECTIONS_PATH = "cms_collections";

// Data Types
export const DATE_TIME_DATA_TYPE = "date_time";
export const STRING_DATA_TYPE = "string";
export const DATE_DATA_TYPE = "date";
export const REFERENCE_DATA_TYPE = "reference";
export const ARRAY_DATA_TYPE = "array";
export const MAP_DATA_TYPE = "map";
export const NUMBER_DATA_TYPE = "number";
export const BOOLEAN_DATA_TYPE = "boolean";

// Mode Types
export const MODE_DATE = "date";
export const MODE_DATE_TIME = "date_time";

// Auto Value Options
export const AUTO_VALUE_ON_CREATE = "on_create";
export const AUTO_VALUE_ON_UPDATE = "on_update";
export const AUTO_VALUE_ON_CREATE_UPDATE = "on_create_update";

// Property Configuration Values
export const PROPERTY_EXPANDED = true;
export const PROPERTY_MULTILINE = true;
export const PROPERTY_MARKDOWN = true;
export const PROPERTY_REQUIRED = true;
export const VALIDATION_REQUIRED = "required";

// Numeric Constants
export const ZERO_LENGTH = 0;
export const EMPTY_STRING = "";
export const BYTES_IN_KB = 1024;
export const BYTES_IN_MB = 1024 * 1024;
export const FILE_SIZE_DECIMAL_PRECISION = 1;
export const DEFAULT_SNACKBAR_MAX_COUNT = 3;
export const DEFAULT_SNACKBAR_AUTO_HIDE_DURATION = 3500;
export const DEFAULT_SUCCESS_SNACKBAR_DURATION = 4000;
export const DEFAULT_ERROR_SNACKBAR_DURATION = 4500;
export const EXTENDED_ERROR_SNACKBAR_DURATION = 5000;
export const DEFAULT_MIN_ROWS = 2;
export const FORM_MIN_ROWS_3 = 3;
export const UPLOAD_PROGRESS_DECIMAL_PLACES = 0;

// UI Text and Messages
export const ERROR_MESSAGE_CMS_COLLECTIONS = "Error loading CMS collections";
export const ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS = "Failed to load CMS collections";
export const ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS_DOT = "Failed to load CMS collections.";
export const ERROR_MESSAGE_UNEXPECTED_ERROR = "Unexpected error saving the collection.";
export const ERROR_MESSAGE_FLANDERS = "Stupid Flanders!";
export const SUCCESS_MESSAGE_SAVED = "saved";
export const SUCCESS_MESSAGE_CREATED = "created";
export const SUCCESS_MESSAGE_CREATED_SUCCESSFULLY = "created successfully.";
export const SUCCESS_MESSAGE_UPDATED_SUCCESSFULLY = "updated successfully.";
export const LOADING_TEXT_SAVING = "Saving...";
export const LOADING_TEXT_CREATING = "Creating...";
export const LOADING_TEXT_CREATING_FOLDER = "Creating...";
export const BUTTON_TEXT_SAVE_CHANGES = "Save changes";
export const BUTTON_TEXT_CREATE_COLLECTION = "Create collection";
export const BUTTON_TEXT_CREATE = "Create";
export const BUTTON_TEXT_CANCEL = "Cancel";
export const BUTTON_TEXT_CLOSE = "Close";
export const BUTTON_TEXT_RESET_FORM = "Reset form";
export const BUTTON_TEXT_MANAGE_COLLECTIONS = "Manage collections";
export const BUTTON_TEXT_NEW_COLLECTION = "New collection";
export const BUTTON_TEXT_ADD_PROPERTY = "Add property";
export const BUTTON_TEXT_REMOVE = "Remove";
export const BUTTON_TEXT_BROWSE_STORAGE = "Browse storage";
export const BUTTON_TEXT_CLEAR = "Clear";
export const BUTTON_TEXT_SELECT_FILE = "Select file";
export const BUTTON_TEXT_EDIT = "Edit";
export const BUTTON_TEXT_DELETE = "Delete";
export const BUTTON_TEXT_DOWNLOAD = "Download";
export const BUTTON_TEXT_PREVIEW = "Preview";
export const BUTTON_TEXT_SELECT = "Select";
export const BUTTON_TEXT_SELECT_THIS_FOLDER = "Select this folder";
export const BUTTON_TEXT_NEW_FOLDER = "New folder";
export const BUTTON_TEXT_UPLOAD_FILES = "Upload files";

// Form Labels and Placeholders
export const LABEL_COLLECTION_ID = "Collection ID";
export const LABEL_DISPLAY_NAME = "Display name";
export const LABEL_FIRESTORE_PATH = "Firestore path";
export const LABEL_GROUP_OPTIONAL = "Group (optional)";
export const LABEL_ICON_OPTIONAL = "Icon (optional)";
export const LABEL_DESCRIPTION_OPTIONAL = "Description (optional)";
export const LABEL_FIELD_KEY = "Field key";
export const LABEL_DISPLAY_NAME_OPTIONAL = "Display name (optional)";
export const LABEL_DATA_TYPE = "Data type";
export const LABEL_DESCRIPTION_OPTIONAL_FIELD = "Description (optional)";
export const LABEL_STORAGE_FOLDER = "Storage folder";
export const LABEL_ACCEPTED_FILE_TYPES = "Accepted file types (comma separated)";
export const LABEL_MAX_FILE_SIZE_MB = "Max file size (MB)";
export const LABEL_DEFAULT_VALUE_FILE_PATH = "Default value (file path)";
export const LABEL_ENUM_VALUES_OPTIONAL = "Enum values (optional)";
export const LABEL_REFERENCE_PATH = "Reference path";
export const LABEL_ARRAY_ITEM_TYPE = "Array item type";
export const LABEL_FOLDER_NAME = "Folder name";
export const LABEL_NAME = "Name";
export const LABEL_GROUP = "Group";
export const LABEL_DESCRIPTION = "Description";

export const PLACEHOLDER_LOCATIONS = "e.g. locations";
export const PLACEHOLDER_LOCATIONS_DISPLAY = "Locations";
export const PLACEHOLDER_LOCATIONS_PATH = "locations";
export const PLACEHOLDER_TRAVEL = "Travel";
export const PLACEHOLDER_TITLE = "title";
export const PLACEHOLDER_TITLE_DISPLAY = "Title";
export const PLACEHOLDER_IMAGES = "images";
export const PLACEHOLDER_IMAGE_PDF_TYPES = "image/*,application/pdf";
export const PLACEHOLDER_FILE_SIZE_10 = "10";
export const PLACEHOLDER_OPTIONAL_FILE_PATH = "Optional path to an existing file";
export const PLACEHOLDER_ADD_ONE_VALUE_PER_LINE = "Add one value per line";
export const PLACEHOLDER_PRODUCTS_REFERENCE = "e.g. products";
export const PLACEHOLDER_ASSETS_FOLDER = "assets";
export const PLACEHOLDER_LOCALIZED_NAME = "Localized name";
export const PLACEHOLDER_LOCALIZED_GROUP = "Localized group";
export const PLACEHOLDER_LOCALIZED_DESCRIPTION = "Localized description";
export const PLACEHOLDER_HELP_OTHER_EDITORS = "Help other editors understand this field.";
export const PLACEHOLDER_EXPLAIN_PURPOSE = "Explain the purpose of this collection for other editors.";

// Section Titles and Headers
export const SECTION_LOCALIZED_CONTENT = "Localized content";
export const SECTION_PERMISSIONS = "Permissions";
export const SECTION_PROPERTIES = "Properties";
export const SECTION_DISPLAY_OPTIONS = "Display options";
export const HEADER_CMS_COLLECTIONS = "CMS Collections";
export const HEADER_CREATE_CMS_COLLECTION = "Create CMS Collection";
export const HEADER_EDIT_CMS_COLLECTION = "Edit CMS Collection";
export const HEADER_CREATE_FOLDER = "Create folder";
export const HEADER_STORAGE = "Storage";
export const HEADER_FIELD_NUMBER = "Field";

// Descriptions and Help Text
export const DESCRIPTION_CREATE_COLLECTION = "Configure the metadata for a FireCMS collection stored under cms_collections.";
export const DESCRIPTION_EDIT_COLLECTION = "Update the metadata used to render this collection inside FireCMS.";
export const DESCRIPTION_MANAGE_COLLECTIONS = "Manage the dynamic collections stored in the";
export const DESCRIPTION_NO_COLLECTIONS = "No dynamic collections found yet. Create your first one to get started.";
export const DESCRIPTION_EMPTY_FOLDER = "This folder is empty.";

// File Browser Constants
export const FOLDER_PLACEHOLDER = ".keep";
export const FILE_EXTENSIONS_PREVIEW = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
export const FILE_SIZE_UNITS = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export const FILE_SIZE_THRESHOLD = 1024;
export const FOLDER_ICON = "📁";
export const FILE_ICON = "📄";
export const FOLDER_SIZE_PLACEHOLDER = "_";
export const SIZE_PLACEHOLDER_DASH = "-";
export const DATE_PLACEHOLDER_DASH = "-";

// Table Headers
export const TABLE_HEADER_NAME = "Name";
export const TABLE_HEADER_ID = "ID";
export const TABLE_HEADER_PATH = "Path";
export const TABLE_HEADER_GROUP = "Group";
export const TABLE_HEADER_ACTIONS = "Actions";
export const TABLE_HEADER_SIZE = "Size";
export const TABLE_HEADER_UPDATED = "Updated";

// Permission Types
export const PERMISSION_READ = "read";
export const PERMISSION_CREATE = "create";
export const PERMISSION_EDIT = "edit";
export const PERMISSION_DELETE = "delete";

// Icon Options
export const ICON_OPTIONS = [
    "place",
    "map",
    "photo",
    "star",
    "home",
    "flight",
    "hotel",
    "workspace_premium",
    "language",
    "local_library",
    "directions_car",
    "restaurant",
    "celebration",
    "local_activity"
] as const;

// Validation Messages
export const VALIDATION_COLLECTION_ID_REQUIRED = "Collection ID is required.";
export const VALIDATION_COLLECTION_ID_FORMAT = "Collection ID can only contain letters, numbers, dashes, and underscores.";
export const VALIDATION_COLLECTION_NAME_REQUIRED = "Collection name is required.";
export const VALIDATION_FIRESTORE_PATH_REQUIRED = "Firestore path is required.";
export const VALIDATION_ONE_PROPERTY_REQUIRED = "At least one property is required.";
export const VALIDATION_PROPERTY_KEY_REQUIRED = "All properties require a field key.";
export const VALIDATION_REFERENCE_PATH_REQUIRED = "requires a reference path.";
export const VALIDATION_ARRAY_REFERENCE_PATH_REQUIRED = "requires a reference path.";
export const VALIDATION_STORAGE_FOLDER_REQUIRED = "requires a storage folder.";
export const VALIDATION_INVALID_FILE_SIZE = "has an invalid max file size.";
export const VALIDATION_FOLDER_NAME_REQUIRED = "Folder name is required.";
export const VALIDATION_FOLDER_NAME_NO_SLASH = "Folder name cannot contain '/'.";
export const VALIDATION_FOLDER_NAME_LETTERS_NUMBERS = "Folder name must include letters, numbers, dashes or underscores.";

// Regex Patterns
export const COLLECTION_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
export const FOLDER_NAME_SANITIZE_REGEX = /(^[\\.]+)|[^a-zA-Z0-9-_]/g;

// Confirmation Messages
export const CONFIRM_DELETE_FOLDER = 'and all its contents';
export const CONFIRM_DELETE_ACTION = 'This action cannot be undone.';

// Default Values
export const DEFAULT_NONE_OPTION = "None";
export const DEFAULT_DASH_PLACEHOLDER = "—";
export const DEFAULT_STRING_OPTION = "String";
export const DEFAULT_NUMBER_OPTION = "Number";
export const DEFAULT_BOOLEAN_OPTION = "Boolean";
export const DEFAULT_DATE_OPTION = "Date";
export const DEFAULT_DATE_TIME_OPTION = "Date & time";
export const DEFAULT_REFERENCE_OPTION = "Reference";
export const DEFAULT_ARRAY_OPTION = "Array";
export const DEFAULT_MANUAL_ENTRY = "Manual entry (default)";
export const DEFAULT_AUTO_SET_ON_CREATION = "Auto set on creation";
export const DEFAULT_AUTO_SET_ON_UPDATE = "Auto set on update";
export const DEFAULT_AUTO_SET_ON_CREATE_UPDATE = "Auto set on create & update";

// Checkbox Labels
export const CHECKBOX_REQUIRED = "Required";
export const CHECKBOX_ENABLE_STORAGE_UPLOAD = "Enable storage upload field";
export const CHECKBOX_MULTILINE_INPUT = "Multiline input";
export const CHECKBOX_MARKDOWN_EDITOR = "Markdown editor";
export const CHECKBOX_LOCALIZED_CONTENT = "Localized content";

// Snackbar Position
export const SNACKBAR_ANCHOR_ORIGIN_VERTICAL = "top";
export const SNACKBAR_ANCHOR_ORIGIN_HORIZONTAL = "right";
export const SNACKBAR_CSS_CLASS = "notistack-anchor-top-right";

// Firebase Authentication
export const FIREBASE_SIGN_IN_PROVIDERS = ["google.com", "password"] as const;
export const ADMIN_EMAIL_DOMAIN = "@firecms.co";
export const ADMIN_CLAIM = "admin";
export const FLANDERS_EMAIL_FILTER = "flanders";

// Route Paths
export const ROUTE_CMS_COLLECTIONS = "/cms/collections";
export const ROUTE_CMS_COLLECTIONS_NEW = "/cms/collections/new";
export const ROUTE_CMS_COLLECTIONS_EDIT = "/cms/collections/:collectionId/edit";
export const ROUTE_STORAGE = "/storage";

// CSS Classes
export const CSS_CLASS_FLEX_GAP_2 = "flex gap-2";
export const CSS_CLASS_BORDER_SURFACE = "border border-surface-300 dark:border-surface-700 rounded-md px-2 py-1 text-sm bg-white dark:bg-surface-900";
export const CSS_CLASS_BUTTON_PERMISSION_ACTIVE = "bg-primary text-white border-primary";
export const CSS_CLASS_BUTTON_PERMISSION_INACTIVE = "bg-surface-100 dark:bg-surface-800 text-text-secondary border-surface-300 dark:border-surface-600";
export const CSS_CLASS_HIDDEN = "hidden";

// Default CMS Collection Permissions
export const DEFAULT_CMS_COLLECTION_PERMISSIONS = {
    read: true,
    create: true,
    edit: true,
    delete: false
} as const;

// File Upload Constants
export const BYTES_SUFFIX = " B";
export const DEFAULT_FILE_INPUT_MULTIPLE = true;

// Navigation Constants
export const BREADCRUMB_ROOT_LABEL = "root";
export const BREADCRUMB_SEPARATOR = "/";

// Dialog Titles
export const DIALOG_TITLE_SELECT_STORAGE_FOLDER = "Select storage folder";
export const DIALOG_TITLE_SELECT_FILE = "Select file";
export const DIALOG_TITLE_STORAGE_BROWSER = "Storage browser";

// Array Index Constants
export const FIRST_LOCALE_INDEX = 0;
export const LAST_DOT_INDEX = -1;

// HTTP and Network
export const WINDOW_TARGET_BLANK = "_blank";

// Property ID Generation
export const PROPERTY_ID_PREFIX = "prop_";
export const PROPERTY_ID_RANDOM_LENGTH = 11;
export const PROPERTY_ID_BASE_36 = 36;
export const PROPERTY_ID_SLICE_START = 2;

// Console Messages
export const CONSOLE_LOG_ALLOWING_ACCESS = "Allowing access to";
export const CONSOLE_ERROR_UPLOAD_ERROR = "Upload error";
export const CONSOLE_ERROR_FAILED_METADATA = "Failed to fetch metadata for";
export const CONSOLE_ERROR_LISTING_STORAGE = "Error listing storage contents";
export const CONSOLE_ERROR_FAILED_CREATE_FOLDER = "Failed to create folder";
export const CONSOLE_ERROR_FAILED_DELETE_STORAGE = "Failed to delete storage item";
export const CONSOLE_ERROR_FAILED_DOWNLOAD_STORAGE = "Failed to download storage item";
export const CONSOLE_ERROR_FAILED_PREVIEW_STORAGE = "Failed to preview storage item";
export const CONSOLE_ERROR_SAVING_COLLECTION = "Error saving collection";

// Alert Messages
export const ALERT_FAILED_DELETE = "Failed to delete: ";
export const ALERT_FAILED_DOWNLOAD = "Failed to download: ";
export const ALERT_FAILED_PREVIEW = "Failed to preview: ";
export const ALERT_UNKNOWN_ERROR = "Unknown error";
export const ALERT_ERROR_LOADING_STORAGE = "Error loading storage contents.";

// Progress and Status
export const PROGRESS_COMPLETE_PERCENT = 100;
export const MATH_ABS_THRESHOLD = 1024;

// Replacement Characters
export const FOLDER_NAME_REPLACEMENT_CHAR = "_";

// Function Parameter Names
export const FIRESTORE_PARAMETER_NAME = "cms_collections";
export const CODE_TAG = "code";