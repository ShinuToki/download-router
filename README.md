# Download Router

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange.svg)](https://addons.mozilla.org/firefox/)

A Firefox extension that automatically routes your downloads to categorized folders based on file extensions.

## Screenshots

<!-- Add your screenshots here -->
<!-- ![Popup Interface](screenshots/popup.png) -->

## Features

- **Auto-categorization** - Downloads are automatically saved to folders based on file extension (e.g., `.` → `Videos/`)
- **Manual selection** - When no category matches, a dialog lets you choose where to save
- **Easy category management** - Add, edit, delete, and reorder categories from the popup
- **Filter categories** - Quickly find categories when you have many
- **Export/Import** - Backup and restore your configuration with a simple string
- **Multilingual** - Available in English, Spanish, French, Italian, Chinese and Catalan
- **Dark mode** - Automatically adapts to your system theme

## How It Works

1. **Create categories** - Define categories with a name, folder path, and file extensions
2. **Download files** - When you download a file, the extension checks its extension
3. **Auto-route or select** - If a category matches, the file goes there automatically. Otherwise, you choose.

All folder paths are relative to your browser's default download location. For example, if your default is `C:\Users\You\Downloads` and you set a category folder to `Videos`, files will go to `C:\Users\You\Downloads\Videos`.

## Installation

### From Firefox Add-ons (Recommended)

1. Visit the [Firefox Add-ons page](https://addons.mozilla.org/es-ES/firefox/addon/smart-download-router/)
2. Click "Add to Firefox"

### From GitHub Releases

1. Go to the [Releases](./releases) page
2. Download the latest `.xpi` file
3. Open the file with Firefox to install

### Manual Installation (Development)

1. Clone this repository
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select the `manifest.json` file

## Usage

### Adding a Category

1. Click the extension icon in your toolbar
2. Fill in the category name, folder path, and extensions (comma-separated)
3. Click "Add Category"

### Editing Categories

- Use ▲▼ arrows to reorder categories
- Click ✏️ to edit a category
- Click 🗑️ to delete a category

### Export/Import Configuration

- **Export**: Click "Export" and copy the generated string
- **Import**: Click "Import", paste the string, and confirm

## Permissions

This extension requires the following permissions:

| Permission     | Reason                              |
| -------------- | ----------------------------------- |
| `downloads`    | To intercept and redirect downloads |
| `storage`      | To save your category configuration |
| `contextMenus` | To add right-click download options |

## Known Limitations

- **blob: URLs** - Downloads from blob URLs (used by some websites) cannot be redirected and will go to the default folder
- **data: URLs** - Same limitation as blob URLs

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
