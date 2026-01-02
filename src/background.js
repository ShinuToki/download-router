/**
 * Download Router - Background Script
 * Handles download interception and routing to categorized folders
 */

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SETTINGS = {
  categories: [],
  defaultFolder: 'Downloads',
}

// Pending downloads waiting for category selection
const pendingDownloads = new Map()

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Load settings from storage
 * @returns {Promise<Object>} Settings object with categories and defaultFolder
 */
async function loadSettings() {
  try {
    const data = await browser.storage.sync.get(['categories', 'defaultFolder'])
    return {
      categories: Array.isArray(data.categories)
        ? data.categories
        : DEFAULT_SETTINGS.categories,
      defaultFolder: data.defaultFolder || DEFAULT_SETTINGS.defaultFolder,
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Save settings to storage
 * @param {Object} settings - Settings object to save
 */
async function saveSettings(settings) {
  try {
    await browser.storage.sync.set(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// ============================================================================
// File Extension Utilities
// ============================================================================

/**
 * Extract file extension from URL or filename
 * @param {string} url - URL or filename
 * @returns {string} File extension including the dot (e.g., ".mp4")
 */
function getFileExtension(url) {
  if (!url) return ''

  // Remove query parameters and hash
  const cleanUrl = url.split('?')[0].split('#')[0]

  // Get the filename from the URL
  const filename = cleanUrl.split('/').pop()

  // Extract extension
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return ''
  }

  return filename.substring(lastDot).toLowerCase()
}

/**
 * Extract clean filename from URL or path
 * @param {string} urlOrPath - URL or file path to extract filename from
 * @returns {string} Clean filename safe for all operating systems
 */
function getCleanFilename(urlOrPath) {
  if (!urlOrPath) return 'download'

  // Remove query parameters and hash (for URLs)
  let cleanPath = urlOrPath.split('?')[0].split('#')[0]

  // Handle both URL paths (/) and Windows paths (\)
  // Split by both separators and get the last part
  const parts = cleanPath.split(/[/\\]/)
  let filename = parts[parts.length - 1] || 'download'

  // Decode URI components if it's a URL
  try {
    filename = decodeURIComponent(filename)
  } catch {
    // Keep as-is if decoding fails
  }

  // Sanitize: remove characters illegal in Windows filenames
  // Illegal chars: < > : " / \ | ? *
  filename = filename.replace(/[<>:"/\\|?*]/g, '_')

  // Also remove any control characters
  filename = filename.replace(/[\x00-\x1f\x80-\x9f]/g, '')

  // Trim whitespace and dots from start/end (Windows doesn't like these)
  filename = filename.replace(/^[\s.]+|[\s.]+$/g, '')

  // If filename is empty after sanitization, use default
  if (!filename) {
    filename = 'download'
  }

  return filename
}

// ============================================================================
// Category Matching
// ============================================================================

/**
 * Find category that matches the file extension
 * @param {string} extension - File extension to match
 * @param {Array} categories - List of categories
 * @returns {Object|null} Matching category or null
 */
function findCategoryByExtension(extension, categories) {
  if (!extension || !categories || categories.length === 0) {
    return null
  }

  const normalizedExt = extension.toLowerCase()

  for (const category of categories) {
    if (category.extensions && Array.isArray(category.extensions)) {
      const hasMatch = category.extensions.some(
        (ext) => ext.toLowerCase() === normalizedExt
      )
      if (hasMatch) {
        return category
      }
    }
  }

  return null
}

// ============================================================================
// Download Handling
// ============================================================================

/**
 * Download a file to a specific category folder
 * @param {string} url - URL to download
 * @param {string} folder - Target folder path
 * @param {string} filename - Optional custom filename
 */
async function downloadToFolder(url, folder, filename = null) {
  const cleanFilename = filename || getCleanFilename(url)
  const relativePath = folder ? `${folder}/${cleanFilename}` : cleanFilename

  try {
    const downloadId = await browser.downloads.download({
      url: url,
      filename: relativePath,
      conflictAction: 'uniquify',
      saveAs: false,
    })
    return downloadId
  } catch (error) {
    throw error
  }
}

/**
 * Open the category selector popup for a download
 * @param {string} url - URL to download
 * @param {string} filename - Filename of the download
 */
function openCategorySelector(url, filename) {
  const downloadId = Date.now().toString()

  // Store pending download info
  pendingDownloads.set(downloadId, {
    url: url,
    filename: filename,
    timestamp: Date.now(),
  })

  // Open selector page
  const selectorUrl = browser.runtime.getURL(
    `selector/selector.html?id=${downloadId}&filename=${encodeURIComponent(
      filename
    )}`
  )

  browser.windows.create({
    url: selectorUrl,
    type: 'popup',
    width: 400,
    height: 500,
  })
}

// ============================================================================
// Context Menu
// ============================================================================

/**
 * Create context menu items for each category
 */
async function createContextMenus() {
  // Remove existing menus
  await browser.contextMenus.removeAll()

  const settings = await loadSettings()

  // Create parent menu
  browser.contextMenus.create({
    id: 'download-router-parent',
    title: 'Download to...',
    contexts: ['link', 'image', 'video', 'audio'],
  })

  // Add category submenus
  for (const category of settings.categories) {
    browser.contextMenus.create({
      id: `download-router-${category.id}`,
      parentId: 'download-router-parent',
      title: category.name,
      contexts: ['link', 'image', 'video', 'audio'],
    })
  }

  // Add separator and default option
  if (settings.categories.length > 0) {
    browser.contextMenus.create({
      id: 'download-router-separator',
      parentId: 'download-router-parent',
      type: 'separator',
      contexts: ['link', 'image', 'video', 'audio'],
    })
  }

  browser.contextMenus.create({
    id: 'download-router-default',
    parentId: 'download-router-parent',
    title: `Default (${settings.defaultFolder})`,
    contexts: ['link', 'image', 'video', 'audio'],
  })

  browser.contextMenus.create({
    id: 'download-router-choose',
    parentId: 'download-router-parent',
    title: 'Choose category...',
    contexts: ['link', 'image', 'video', 'audio'],
  })
}

/**
 * Handle context menu clicks
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId.startsWith('download-router-')) {
    return
  }

  const url = info.linkUrl || info.srcUrl
  if (!url) {
    return
  }

  const filename = getCleanFilename(url)
  const settings = await loadSettings()

  if (info.menuItemId === 'download-router-default') {
    await downloadToFolder(url, settings.defaultFolder)
  } else if (info.menuItemId === 'download-router-choose') {
    openCategorySelector(url, filename)
  } else {
    const categoryId = info.menuItemId.replace('download-router-', '')
    const category = settings.categories.find((c) => c.id === categoryId)

    if (category) {
      await downloadToFolder(url, category.folder)
    }
  }
})

// ============================================================================
// Message Handling (Communication with popup and selector)
// ============================================================================

browser.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case 'getSettings':
      return await loadSettings()

    case 'saveCategory': {
      const settings = await loadSettings()
      const existingIndex = settings.categories.findIndex(
        (c) => c.id === message.category.id
      )

      if (existingIndex >= 0) {
        settings.categories[existingIndex] = message.category
      } else {
        settings.categories.push(message.category)
      }

      await saveSettings(settings)
      await createContextMenus()
      return { success: true }
    }

    case 'deleteCategory': {
      const settings = await loadSettings()
      settings.categories = settings.categories.filter(
        (c) => c.id !== message.categoryId
      )
      await saveSettings(settings)
      await createContextMenus()
      return { success: true }
    }

    case 'setDefaultFolder': {
      await saveSettings({ defaultFolder: message.folder })
      await createContextMenus()
      return { success: true }
    }

    case 'getPendingDownload': {
      const pending = pendingDownloads.get(message.downloadId)
      return pending || null
    }

    case 'downloadWithCategory': {
      const pending = pendingDownloads.get(message.downloadId)
      if (!pending) {
        return { success: false, error: 'Download not found' }
      }

      const settings = await loadSettings()
      let folder = settings.defaultFolder

      if (message.categoryId) {
        const category = settings.categories.find(
          (c) => c.id === message.categoryId
        )
        if (category) {
          folder = category.folder
        }
      }

      await downloadToFolder(pending.url, folder, pending.filename)
      pendingDownloads.delete(message.downloadId)
      return { success: true }
    }

    case 'cancelDownload': {
      pendingDownloads.delete(message.downloadId)
      return { success: true }
    }

    case 'refreshContextMenus':
      await createContextMenus()
      return { success: true }

    case 'importSettings': {
      const newSettings = message.settings
      // Merge with existing settings, replacing categories
      const currentSettings = await loadSettings()
      currentSettings.categories = newSettings.categories || []
      if (newSettings.defaultFolder) {
        currentSettings.defaultFolder = newSettings.defaultFolder
      }
      await saveSettings(currentSettings)
      await createContextMenus()
      return { success: true }
    }

    case 'reorderCategories': {
      const settings = await loadSettings()
      settings.categories = message.categories
      await saveSettings(settings)
      await createContextMenus()
      return { success: true }
    }

    default:
      return null
  }
})

// ============================================================================
// Download Interception (for auto-categorization)
// ============================================================================

browser.downloads.onCreated.addListener(async (downloadItem) => {
  // Skip if this was initiated by our extension
  if (downloadItem.byExtensionId === browser.runtime.id) {
    return
  }

  // Skip blob: and data: URLs - extensions cannot re-download these
  const url = downloadItem.url
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
    return
  }

  const settings = await loadSettings()
  const extension = getFileExtension(downloadItem.filename || downloadItem.url)
  const matchedCategory = findCategoryByExtension(
    extension,
    settings.categories
  )

  if (matchedCategory) {
    // Cancel the original download
    await browser.downloads.cancel(downloadItem.id)
    await browser.downloads.erase({ id: downloadItem.id })

    // Start new download in the correct folder
    const filename = getCleanFilename(downloadItem.filename || downloadItem.url)
    await downloadToFolder(downloadItem.url, matchedCategory.folder, filename)
  }
})

// ============================================================================
// Initialization
// ============================================================================

// Create context menus on startup
createContextMenus()

// Listen for storage changes to update menus
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && (changes.categories || changes.defaultFolder)) {
    createContextMenus()
  }
})

// Clean up old pending downloads periodically (older than 5 minutes)
setInterval(() => {
  const now = Date.now()
  const timeout = 5 * 60 * 1000 // 5 minutes

  for (const [id, pending] of pendingDownloads) {
    if (now - pending.timestamp > timeout) {
      pendingDownloads.delete(id)
    }
  }
}, 60000) // Check every minute
