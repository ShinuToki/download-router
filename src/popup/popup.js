/**
 * Download Router - Popup Script
 * Handles category management UI
 */

// ============================================================================
// Internationalization (i18n)
// ============================================================================

/**
 * Apply translations to elements with data-i18n attributes
 */
function applyI18n() {
  // Translate text content
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n')
    const message = browser.i18n.getMessage(messageKey)
    if (message) {
      element.textContent = message
    }
  })

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n-placeholder')
    const message = browser.i18n.getMessage(messageKey)
    if (message) {
      element.placeholder = message
    }
  })

  // Translate title attributes
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const messageKey = element.getAttribute('data-i18n-title')
    const message = browser.i18n.getMessage(messageKey)
    if (message) {
      element.title = message
    }
  })
}

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  categoryForm: document.getElementById('category-form'),
  categoryName: document.getElementById('category-name'),
  categoryFolder: document.getElementById('category-folder'),
  categoryExtensions: document.getElementById('category-extensions'),
  categoryList: document.getElementById('category-list'),
  categoryFilter: document.getElementById('category-filter'),
  emptyMessage: document.getElementById('empty-message'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  toastContainer: document.getElementById('toast-container'),
  toggleFormBtn: document.getElementById('toggle-form-btn'),
  cancelFormBtn: document.getElementById('cancel-form-btn'),
  infoBtn: document.getElementById('info-btn'),
  modalOverlay: document.getElementById('modal-overlay'),
  // Dialog modal elements
  dialogOverlay: document.getElementById('dialog-overlay'),
  dialogTitle: document.getElementById('dialog-title'),
  dialogMessage: document.getElementById('dialog-message'),
  dialogInput: document.getElementById('dialog-input'),
  dialogConfirmBtn: document.getElementById('dialog-confirm-btn'),
  dialogCancelBtn: document.getElementById('dialog-cancel-btn'),
}

// ============================================================================
// Form Toggle (Modal)
// ============================================================================

/**
 * Show the add category modal
 */
function showAddForm() {
  elements.modalOverlay.hidden = false
  elements.categoryName.focus()
}

/**
 * Hide the add category modal with animation
 */
function hideAddForm() {
  elements.modalOverlay.classList.add('closing')
  setTimeout(() => {
    elements.modalOverlay.hidden = true
    elements.modalOverlay.classList.remove('closing')
    elements.categoryForm.reset()
  }, 150) // Match the animation duration
}

/**
 * Handle click on overlay background to close modal
 */
function handleOverlayClick(event) {
  // Only close if clicking on the overlay itself, not the modal content
  if (event.target === elements.modalOverlay) {
    hideAddForm()
  }
}

/**
 * Handle ESC key to close modals
 */
function handleEscKey(event) {
  if (event.key === 'Escape') {
    if (!elements.modalOverlay.hidden) {
      hideAddForm()
    }
    if (!elements.dialogOverlay.hidden) {
      closeDialog(false)
    }
  }
}

// ============================================================================
// Custom Dialog Modals
// ============================================================================

let dialogResolve = null

/**
 * Show a confirmation dialog (replaces confirm())
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Text for confirm button
 * @param {boolean} isDanger - If true, use red button for destructive action
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmDialog(title, message, confirmText, isDanger = false) {
  return new Promise((resolve) => {
    dialogResolve = resolve

    elements.dialogTitle.textContent = title
    elements.dialogMessage.textContent = message
    elements.dialogConfirmBtn.textContent = confirmText
    elements.dialogCancelBtn.style.display = ''

    // Set button style based on action type
    const dialogContent = elements.dialogOverlay.querySelector('.modal-dialog')
    dialogContent.classList.remove('info')

    if (isDanger) {
      elements.dialogConfirmBtn.className = 'btn-danger-solid'
    } else {
      elements.dialogConfirmBtn.className = 'btn-primary'
    }

    elements.dialogOverlay.hidden = false
  })
}

/**
 * Show an info dialog (replaces alert())
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} buttonText - Text for the OK button
 * @returns {Promise<void>} - Resolves when closed
 */
function showInfoDialog(title, message, buttonText = 'OK') {
  return new Promise((resolve) => {
    dialogResolve = () => resolve()

    elements.dialogTitle.textContent = title
    elements.dialogMessage.textContent = message
    elements.dialogConfirmBtn.textContent = buttonText
    elements.dialogConfirmBtn.className = 'btn-primary'

    // Hide cancel button and add info class
    const dialogContent = elements.dialogOverlay.querySelector('.modal-dialog')
    dialogContent.classList.add('info')

    elements.dialogOverlay.hidden = false
  })
}

/**
 * Show a prompt dialog with input field (replaces prompt())
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Text for confirm button
 * @param {string} defaultValue - Default value for input
 * @param {boolean} readonly - If true, the input is readonly (for export)
 * @returns {Promise<string|null>} - Resolves to input value if confirmed, null if cancelled
 */
function showPromptDialog(
  title,
  message,
  confirmText,
  defaultValue = '',
  readonly = false
) {
  return new Promise((resolve) => {
    // dialogResolve will receive the input value or null from closeDialog
    dialogResolve = resolve

    elements.dialogTitle.textContent = title
    elements.dialogMessage.textContent = message
    elements.dialogConfirmBtn.textContent = confirmText
    elements.dialogConfirmBtn.className = 'btn-primary'
    elements.dialogCancelBtn.style.display = ''

    // Setup input
    elements.dialogInput.hidden = false
    elements.dialogInput.value = defaultValue
    elements.dialogInput.readOnly = readonly

    const dialogContent = elements.dialogOverlay.querySelector('.modal-dialog')
    dialogContent.classList.remove('info')

    elements.dialogOverlay.hidden = false

    // Focus and select input
    setTimeout(() => {
      elements.dialogInput.focus()
      if (readonly) {
        elements.dialogInput.select()
      }
    }, 50)
  })
}

/**
 * Close the dialog modal with animation
 * @param {boolean} result - The result to resolve the promise with
 */
function closeDialog(result) {
  // Save input value and visibility BEFORE clearing
  const inputValue = elements.dialogInput.value
  const inputWasVisible = !elements.dialogInput.hidden

  elements.dialogOverlay.classList.add('closing')
  setTimeout(() => {
    elements.dialogOverlay.hidden = true
    elements.dialogOverlay.classList.remove('closing')

    // Call dialogResolve BEFORE resetting input state
    if (dialogResolve) {
      // If input was visible (prompt), return the value or null
      // If input was hidden (confirm/info), return the boolean
      if (inputWasVisible) {
        dialogResolve(result ? inputValue : null)
      } else {
        dialogResolve(result)
      }
      dialogResolve = null
    }

    // Reset input state AFTER resolving
    elements.dialogInput.hidden = true
    elements.dialogInput.value = ''
    elements.dialogInput.readOnly = false
  }, 150)
}

// ============================================================================
// State
// ============================================================================

let categories = []
let filterTerm = ''

// ============================================================================
// Toast Notifications
// ============================================================================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', or 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message

  elements.toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// ============================================================================
// API Communication
// ============================================================================

/**
 * Send message to background script
 */
async function sendMessage(action, data = {}) {
  return await browser.runtime.sendMessage({ action, ...data })
}

/**
 * Load settings from background script
 */
async function loadSettings() {
  const settings = await sendMessage('getSettings')
  categories = settings.categories || []
  renderCategories()
}

// ============================================================================
// Category CRUD
// ============================================================================

/**
 * Generate unique ID for category
 */
function generateId() {
  return (
    'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  )
}

/**
 * Parse extensions string to array
 */
function parseExtensions(extensionsStr) {
  if (!extensionsStr.trim()) return []

  return extensionsStr
    .split(',')
    .map((ext) => ext.trim().toLowerCase())
    .filter((ext) => ext)
    .map((ext) => (ext.startsWith('.') ? ext : '.' + ext))
}

/**
 * Check if any extensions are already used by another category
 * @param {Array} extensions - Extensions to check
 * @param {string|null} excludeCategoryId - Category ID to exclude from check (for edits)
 * @returns {Array} List of duplicate extensions with their category names
 */
function findDuplicateExtensions(extensions, excludeCategoryId = null) {
  const duplicates = []

  for (const ext of extensions) {
    for (const cat of categories) {
      if (excludeCategoryId && cat.id === excludeCategoryId) continue

      if (cat.extensions && cat.extensions.includes(ext)) {
        duplicates.push({ extension: ext, categoryName: cat.name })
        break
      }
    }
  }

  return duplicates
}

/**
 * Add new category
 */
async function addCategory(event) {
  event.preventDefault()

  const name = elements.categoryName.value.trim()
  const folder = elements.categoryFolder.value.trim()
  const extensions = parseExtensions(elements.categoryExtensions.value)

  if (!name || !folder) return

  // Check for duplicate names
  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    alert(
      browser.i18n.getMessage('categoryExists') ||
        'A category with this name already exists'
    )
    return
  }

  // Check for duplicate extensions
  const duplicateExts = findDuplicateExtensions(extensions)
  if (duplicateExts.length > 0) {
    const extList = duplicateExts
      .map((d) => `${d.extension} → ${d.categoryName}`)
      .join('\n')
    const baseMsg =
      browser.i18n.getMessage('extensionExists') ||
      'These extensions are already used:'
    alert(`${baseMsg}\n\n${extList}`)
    return
  }

  const category = {
    id: generateId(),
    name,
    folder,
    extensions,
  }

  await sendMessage('saveCategory', { category })

  // Hide form and clear it
  hideAddForm()

  // Reload categories
  await loadSettings()

  showToast(
    browser.i18n.getMessage('categoryAdded') || 'Category added',
    'success'
  )
}

/**
 * Update existing category
 */
async function updateCategory(categoryId, updates) {
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return

  const updatedCategory = { ...category, ...updates }
  await sendMessage('saveCategory', { category: updatedCategory })
  await loadSettings()
}

/**
 * Delete category
 */
async function deleteCategory(categoryId) {
  const title = browser.i18n.getMessage('deleteCategory') || 'Delete category'
  const message =
    browser.i18n.getMessage('confirmDelete') ||
    'Are you sure you want to delete this category?'
  const deleteText = browser.i18n.getMessage('delete') || 'Delete'

  const confirmed = await showConfirmDialog(title, message, deleteText, true)
  if (!confirmed) return

  await sendMessage('deleteCategory', { categoryId })
  await loadSettings()
}

// ============================================================================
// Rendering
// ============================================================================

/**
 * Render the list of categories
 */
function renderCategories() {
  elements.categoryList.innerHTML = ''

  // Filter categories if there's a filter term
  const isFiltering = filterTerm.length > 0
  const filteredCategories = isFiltering
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
          c.folder.toLowerCase().includes(filterTerm.toLowerCase()) ||
          c.extensions.some((ext) =>
            ext.toLowerCase().includes(filterTerm.toLowerCase())
          )
      )
    : categories

  if (categories.length === 0) {
    elements.emptyMessage.hidden = false
    return
  }

  elements.emptyMessage.hidden = true

  if (filteredCategories.length === 0 && isFiltering) {
    // Show "no results" when filtering but nothing matches
    const noResults = document.createElement('p')
    noResults.className = 'empty-message'
    noResults.textContent =
      browser.i18n.getMessage('noFilterResults') ||
      'No categories match your filter.'
    elements.categoryList.appendChild(noResults)
    return
  }

  filteredCategories.forEach((category, index) => {
    const li = createCategoryElement(
      category,
      index,
      filteredCategories.length,
      isFiltering
    )
    elements.categoryList.appendChild(li)
  })
}

/**
 * Create DOM element for a category
 */
function createCategoryElement(category, index, total, isFiltering = false) {
  const li = document.createElement('li')
  li.className = 'category-item'
  li.dataset.id = category.id

  const isFirst = index === 0
  const isLast = index === total - 1

  // Hide move buttons when filtering (reordering doesn't make sense with filtered results)
  const moveButtonsHtml = isFiltering
    ? ''
    : `
                <button class="btn-icon-sm btn-move-up" data-i18n-title="moveUp" title="Move up" ${
                  isFirst ? 'disabled' : ''
                }>
                    <svg viewBox="0 0 24 24" width="32" height="32">
                        <path fill="currentColor" d="M7 14l5-5 5 5H7z"/>
                    </svg>
                </button>
                <button class="btn-icon-sm btn-move-down" data-i18n-title="moveDown" title="Move down" ${
                  isLast ? 'disabled' : ''
                }>
                    <svg viewBox="0 0 24 24" width="32" height="32">
                        <path fill="currentColor" d="M7 10l5 5 5-5H7z"/>
                    </svg>
                </button>`

  li.innerHTML = `
        <div class="category-header">
            <span class="category-name">${escapeHtml(category.name)}</span>
            <div class="category-actions">
                ${moveButtonsHtml}
                <button class="btn-icon-sm btn-icon-primary btn-edit" data-i18n-title="edit" title="Edit">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="btn-icon-sm btn-icon-danger btn-delete" data-i18n-title="delete" title="Delete">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="category-details">
            <span class="category-folder">${escapeHtml(category.folder)}</span>
            ${
              category.extensions.length > 0
                ? `<span class="category-extensions">${escapeHtml(
                    category.extensions.join(', ')
                  )}</span>`
                : ''
            }
        </div>
        <form class="category-edit-form">
            <div class="form-group">
                <label for="edit-name-${
                  category.id
                }" data-i18n="categoryName">Category Name</label>
                <input type="text" id="edit-name-${
                  category.id
                }" class="edit-name" value="${escapeHtml(
                  category.name
                )}" required>
            </div>
            <div class="form-group">
                <label for="edit-folder-${
                  category.id
                }" data-i18n="folderPath">Folder Path</label>
                <input type="text" id="edit-folder-${
                  category.id
                }" class="edit-folder" value="${escapeHtml(
                  category.folder
                )}" required>
            </div>
            <div class="form-group">
                <label for="edit-extensions-${
                  category.id
                }" data-i18n="extensions">Extensions</label>
                <input type="text" id="edit-extensions-${
                  category.id
                }" class="edit-extensions" value="${escapeHtml(
                  category.extensions.join(', ')
                )}">
            </div>
            <div class="edit-actions">
                <button type="button" class="btn-secondary btn-cancel" data-i18n="cancel">Cancel</button>
                <button type="submit" class="btn-primary btn-save" data-i18n="save">Save</button>
            </div>
        </form>
    `

  // Apply i18n to dynamically created elements
  li.querySelectorAll('[data-i18n]').forEach((el) => {
    const msg = browser.i18n.getMessage(el.getAttribute('data-i18n'))
    if (msg) el.textContent = msg
  })

  // Apply i18n to title attributes
  li.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const msg = browser.i18n.getMessage(el.getAttribute('data-i18n-title'))
    if (msg) el.title = msg
  })

  // Event listeners
  li.querySelector('.btn-edit').addEventListener('click', () => {
    li.classList.add('editing')
  })

  li.querySelector('.btn-delete').addEventListener('click', () => {
    deleteCategory(category.id)
  })

  li.querySelector('.btn-cancel').addEventListener('click', () => {
    li.classList.remove('editing')
    // Reset form values
    li.querySelector('.edit-name').value = category.name
    li.querySelector('.edit-folder').value = category.folder
    li.querySelector('.edit-extensions').value = category.extensions.join(', ')
  })

  li.querySelector('.category-edit-form').addEventListener(
    'submit',
    async (e) => {
      e.preventDefault()

      const newName = li.querySelector('.edit-name').value.trim()
      const newFolder = li.querySelector('.edit-folder').value.trim()
      const newExtensions = parseExtensions(
        li.querySelector('.edit-extensions').value
      )

      // Check for duplicate names (excluding current category)
      if (
        categories.some(
          (c) =>
            c.id !== category.id &&
            c.name.toLowerCase() === newName.toLowerCase()
        )
      ) {
        alert(
          browser.i18n.getMessage('categoryExists') ||
            'A category with this name already exists'
        )
        return
      }

      // Check for duplicate extensions (excluding current category)
      const duplicateExts = findDuplicateExtensions(newExtensions, category.id)
      if (duplicateExts.length > 0) {
        const extList = duplicateExts
          .map((d) => `${d.extension} → ${d.categoryName}`)
          .join('\n')
        const baseMsg =
          browser.i18n.getMessage('extensionExists') ||
          'These extensions are already used:'
        alert(`${baseMsg}\n\n${extList}`)
        return
      }

      await updateCategory(category.id, {
        name: newName,
        folder: newFolder,
        extensions: newExtensions,
      })

      showToast(
        browser.i18n.getMessage('categorySaved') || 'Category saved',
        'success'
      )
    }
  )

  // Move up/down button handlers
  const moveUpBtn = li.querySelector('.btn-move-up')
  const moveDownBtn = li.querySelector('.btn-move-down')

  if (moveUpBtn) {
    moveUpBtn.addEventListener('click', async () => {
      const index = categories.findIndex((c) => c.id === category.id)
      if (index > 0) {
        // Swap with previous
        ;[categories[index - 1], categories[index]] = [
          categories[index],
          categories[index - 1],
        ]
        await sendMessage('reorderCategories', { categories })
        renderCategories()
        showToast(
          browser.i18n.getMessage('categoryReordered') || 'Category moved',
          'success'
        )
      }
    })
  }

  if (moveDownBtn) {
    moveDownBtn.addEventListener('click', async () => {
      const index = categories.findIndex((c) => c.id === category.id)
      if (index < categories.length - 1) {
        // Swap with next
        ;[categories[index], categories[index + 1]] = [
          categories[index + 1],
          categories[index],
        ]
        await sendMessage('reorderCategories', { categories })
        renderCategories()
        showToast(
          browser.i18n.getMessage('categoryReordered') || 'Category moved',
          'success'
        )
      }
    })
  }

  return li
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
// Event Listeners
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  applyI18n()
  loadSettings()
})

elements.categoryForm.addEventListener('submit', addCategory)

// Toggle form visibility (modal)
elements.toggleFormBtn.addEventListener('click', showAddForm)
elements.cancelFormBtn.addEventListener('click', hideAddForm)
elements.modalOverlay.addEventListener('click', handleOverlayClick)
document.addEventListener('keydown', handleEscKey)

// Dialog modal buttons
elements.dialogConfirmBtn.addEventListener('click', () => closeDialog(true))
elements.dialogCancelBtn.addEventListener('click', () => closeDialog(false))
elements.dialogOverlay.addEventListener('click', (e) => {
  if (e.target === elements.dialogOverlay) {
    closeDialog(false)
  }
})

// Info button - show info dialog
elements.infoBtn.addEventListener('click', () => {
  const title = browser.i18n.getMessage('information') || 'Information'
  const msg =
    browser.i18n.getMessage('downloadPathInfo') ||
    "All folder paths are relative to your browser's default download location."
  const okText = browser.i18n.getMessage('understood') || 'OK'
  showInfoDialog(title, msg, okText)
})

// Filter categories
elements.categoryFilter.addEventListener('input', (e) => {
  filterTerm = e.target.value
  renderCategories()
})

// Export configuration - encode to Base64 string
elements.exportBtn.addEventListener('click', async () => {
  const settings = await sendMessage('getSettings')
  const jsonStr = JSON.stringify(settings)
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)))

  const title = browser.i18n.getMessage('exportConfig') || 'Export'
  const message =
    browser.i18n.getMessage('exportString') || 'Copy this configuration string:'
  const copyText = browser.i18n.getMessage('copy') || 'Copy'

  const result = await showPromptDialog(title, message, copyText, base64, true)

  if (result !== null) {
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(result)
      showToast(
        browser.i18n.getMessage('copiedToClipboard') || 'Copied to clipboard',
        'success'
      )
    } catch {
      showToast(
        browser.i18n.getMessage('exportSuccess') ||
          'Configuration string generated',
        'success'
      )
    }
  }
})

// Import configuration - decode Base64 string
elements.importBtn.addEventListener('click', async () => {
  const title = browser.i18n.getMessage('importConfig') || 'Import'
  const message =
    browser.i18n.getMessage('importPrompt') ||
    'Paste the configuration string here:'
  const importText = browser.i18n.getMessage('import') || 'Import'

  const base64 = await showPromptDialog(title, message, importText, '', false)

  if (!base64 || !base64.trim()) {
    return
  }

  try {
    // Decode Base64 to JSON
    const jsonStr = decodeURIComponent(escape(atob(base64.trim())))
    const data = JSON.parse(jsonStr)

    // Validate the imported data
    if (!data.categories || !Array.isArray(data.categories)) {
      throw new Error('Invalid configuration')
    }

    // Confirm before overwriting
    const confirmTitle =
      browser.i18n.getMessage('importConfig') || 'Import Configuration'
    const confirmMsg =
      browser.i18n.getMessage('importConfirm') ||
      'This will overwrite your current configuration. Continue?'
    const continueText = browser.i18n.getMessage('continue') || 'Continue'

    const confirmed = await showConfirmDialog(
      confirmTitle,
      confirmMsg,
      continueText,
      false
    )
    if (!confirmed) {
      return
    }

    // Save the imported configuration
    await sendMessage('importSettings', { settings: data })
    await loadSettings()

    showToast(
      browser.i18n.getMessage('importSuccess') || 'Configuration imported',
      'success'
    )
  } catch (error) {
    showToast(
      browser.i18n.getMessage('importError') || 'Invalid configuration string',
      'error'
    )
  }
})
