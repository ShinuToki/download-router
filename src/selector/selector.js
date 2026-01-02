/**
 * Download Router - Category Selector Script
 * Handles category selection for downloads without auto-matched extensions
 */

// ============================================================================
// Internationalization (i18n)
// ============================================================================

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n')
    const message = browser.i18n.getMessage(messageKey)
    if (message) {
      element.textContent = message
    }
  })
}

// ============================================================================
// URL Parameters
// ============================================================================

const urlParams = new URLSearchParams(window.location.search)
const downloadId = urlParams.get('id')
const filename = urlParams.get('filename') || 'Unknown file'

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  filename: document.getElementById('filename'),
  categoryList: document.getElementById('category-list'),
  downloadDefaultBtn: document.getElementById('download-default'),
  cancelBtn: document.getElementById('cancel'),
}

// ============================================================================
// API Communication
// ============================================================================

async function sendMessage(action, data = {}) {
  return await browser.runtime.sendMessage({ action, ...data })
}

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  applyI18n()

  // Display filename
  elements.filename.textContent = decodeURIComponent(filename)

  // Load categories
  const settings = await sendMessage('getSettings')
  renderCategories(settings.categories || [])

  // Setup event listeners
  elements.downloadDefaultBtn.addEventListener('click', downloadToDefault)
  elements.cancelBtn.addEventListener('click', cancelDownload)
}

// ============================================================================
// Rendering
// ============================================================================

/**
 * Render category options
 */
function renderCategories(categories) {
  elements.categoryList.innerHTML = ''

  if (categories.length === 0) {
    elements.categoryList.innerHTML = `
            <li class="empty-message">
                <p>No categories configured.</p>
                <p>Add categories in the extension popup.</p>
            </li>
        `
    return
  }

  categories.forEach((category) => {
    const li = document.createElement('li')
    li.className = 'category-option'
    li.dataset.id = category.id

    li.innerHTML = `
            <span class="category-icon">📁</span>
            <div class="category-info">
                <div class="category-name">${escapeHtml(category.name)}</div>
                <div class="category-folder">${escapeHtml(
                  category.folder
                )}</div>
            </div>
        `

    li.addEventListener('click', () => downloadToCategory(category.id))

    elements.categoryList.appendChild(li)
  })
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Download to specific category
 */
async function downloadToCategory(categoryId) {
  const result = await sendMessage('downloadWithCategory', {
    downloadId: downloadId,
    categoryId: categoryId,
  })

  if (result.success) {
    window.close()
  } else {
    console.error('Download failed:', result.error)
    alert('Download failed: ' + (result.error || 'Unknown error'))
  }
}

/**
 * Download to default folder
 */
async function downloadToDefault() {
  const result = await sendMessage('downloadWithCategory', {
    downloadId: downloadId,
    categoryId: null, // null means use default folder
  })

  if (result.success) {
    window.close()
  } else {
    console.error('Download failed:', result.error)
  }
}

/**
 * Cancel download
 */
async function cancelDownload() {
  await sendMessage('cancelDownload', { downloadId: downloadId })
  window.close()
}

// ============================================================================
// Start
// ============================================================================

document.addEventListener('DOMContentLoaded', init)
