import './style.css'

// Gallery data (loaded dynamically)
let galleryData = []

// Track current image index
let currentImageIndex = -1

// Touch/Swipe tracking
let touchStartX = 0
let touchEndX = 0
let touchStartY = 0
let touchEndY = 0

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid')
const imageCount = document.getElementById('image-count')
const loaderOverlay = document.getElementById('loader-overlay')
const lightbox = document.getElementById('lightbox')
const lightboxImage = document.getElementById('lightbox-image')
const lightboxClose = document.getElementById('lightbox-close')
const lightboxBackdrop = document.getElementById('lightbox-backdrop')
const lightboxPrev = document.getElementById('lightbox-prev')
const lightboxNext = document.getElementById('lightbox-next')
const metadataPrompt = document.getElementById('metadata-prompt')
const metadataTimestamp = document.getElementById('metadata-timestamp')
const lightboxMetadata = document.getElementById('lightbox-metadata')
const metadataToggle = document.getElementById('metadata-toggle')

/**
 * Load gallery data from JSON manifest
 */
async function loadGalleryData() {
    try {
        const response = await fetch('/gallery-data.json')
        if (!response.ok) throw new Error(`Failed to load gallery data: ${response.statusText}`)
        galleryData = await response.json()

        imageCount.textContent = `${galleryData.length} images generated`
        renderGallery()

        // Hide loader with fade-out animation
        loaderOverlay.classList.add('hidden')
    } catch (error) {
        console.error('Error loading gallery data:', error)
        galleryGrid.innerHTML = '<p style="color: red;">Failed to load gallery data</p>'

        // Hide loader even on error
        loaderOverlay.classList.add('hidden')
    }
}

/**
 * Render gallery grid with image cards
 */
function renderGallery() {
    galleryGrid.innerHTML = ''

    galleryData.forEach((item, index) => {
        const card = document.createElement('div')
        card.className = 'gallery-item loading'
        card.setAttribute('data-index', index)

        // Use picture element for WebP with JPG fallback
        const picture = document.createElement('picture')

        // WebP source (if available)
        const webpPath = item.image.replace(/\.(jpg|jpeg)$/i, '.webp')
        const sourceWebp = document.createElement('source')
        sourceWebp.setAttribute('data-srcset', webpPath)
        sourceWebp.type = 'image/webp'

        // Fallback img element
        const img = document.createElement('img')
        img.setAttribute('data-src', item.image)
        img.loading = 'lazy'
        img.alt = item.prompt || 'Gallery image'

        picture.appendChild(sourceWebp)
        picture.appendChild(img)
        card.appendChild(picture)
        card.addEventListener('click', () => openLightbox(index))

        galleryGrid.appendChild(card)
    })

    // Initialize lazy loading
    initLazyLoading()
}

/**
 * Initialize Intersection Observer for lazy loading
 */
function initLazyLoading() {
    const imageElements = document.querySelectorAll('.gallery-item picture')

    const imageLoadHandler = (picture) => {
        // Load WebP source
        const sourceWebp = picture.querySelector('source[type="image/webp"]')
        if (sourceWebp && sourceWebp.dataset.srcset) {
            sourceWebp.srcset = sourceWebp.dataset.srcset
        }

        // Load fallback img
        const img = picture.querySelector('img')
        if (img && img.dataset.src) {
            img.src = img.dataset.src
            img.onload = () => {
                picture.parentElement.classList.remove('loading')
            }
            img.onerror = () => {
                picture.parentElement.classList.remove('loading')
                img.alt = 'Failed to load image'
            }
        }
    }

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const picture = entry.target
                    imageLoadHandler(picture)
                    observer.unobserve(picture)
                }
            })
        }, {
            rootMargin: '200px'
        })

        imageElements.forEach(picture => imageObserver.observe(picture))
    } else {
        // Fallback for browsers without IntersectionObserver
        imageElements.forEach(imageLoadHandler)
    }
}

/**
 * Open lightbox with specified image index
 */
function openLightbox(index) {
    currentImageIndex = index
    updateLightbox()
    lightbox.classList.add('active')
    lightbox.setAttribute('role', 'dialog')
    lightbox.setAttribute('aria-modal', 'true')
    lightbox.setAttribute('aria-label', 'Image viewer')
    document.body.style.overflow = 'hidden'
    // Focus the close button for accessibility
    lightboxClose.focus()
}

/**
 * Close lightbox
 */
function closeLightbox() {
    lightbox.classList.remove('active')
    lightbox.removeAttribute('role')
    lightbox.removeAttribute('aria-modal')
    lightbox.removeAttribute('aria-label')
    document.body.style.overflow = 'auto'
    currentImageIndex = -1
}

/**
 * Update lightbox content
 */
function updateLightbox() {
    if (currentImageIndex < 0 || currentImageIndex >= galleryData.length) return

    const item = galleryData[currentImageIndex]
    lightboxImage.src = item.image
    lightboxImage.loading = 'lazy'
    lightboxImage.alt = item.prompt || 'Gallery image'
    lightboxImage.onerror = () => {
        lightboxImage.alt = 'Failed to load image'
    }

    metadataPrompt.textContent = item.prompt || 'No prompt available'

    if (item.timestamp) {
        const date = new Date(item.timestamp)
        const formattedDate = date.toLocaleString()
        metadataTimestamp.textContent = `Generated: ${formattedDate}`
    } else {
        metadataTimestamp.textContent = ''
    }
}

/**
 * Navigate to next image in lightbox
 */
function nextImage() {
    if (galleryData.length === 0) return
    currentImageIndex = (currentImageIndex + 1) % galleryData.length
    updateLightbox()
}

/**
 * Navigate to previous image in lightbox
 */
function prevImage() {
    if (galleryData.length === 0) return
    currentImageIndex = (currentImageIndex - 1 + galleryData.length) % galleryData.length
    updateLightbox()
}

/**
 * Toggle metadata panel between collapsed and expanded
 */
function toggleMetadata() {
    const toggleLabel = metadataToggle.querySelector('.toggle-label')
    if (lightboxMetadata.classList.contains('collapsed')) {
        lightboxMetadata.classList.remove('collapsed')
        lightboxMetadata.classList.add('expanded')
        toggleLabel.textContent = 'Hide Details'
    } else {
        lightboxMetadata.classList.remove('expanded')
        lightboxMetadata.classList.add('collapsed')
        toggleLabel.textContent = 'Show Details'
    }
}

/**
 * Handle keyboard events
 */
function handleKeydown(event) {
    if (!lightbox.classList.contains('active')) return

    switch(event.key) {
        case 'Escape':
            closeLightbox()
            break
        case 'ArrowRight':
            nextImage()
            event.preventDefault()
            break
        case 'ArrowLeft':
            prevImage()
            event.preventDefault()
            break
        case 'Tab':
            // Trap focus inside lightbox
            const focusable = lightbox.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            if (focusable.length === 0) break
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                last.focus()
                event.preventDefault()
            } else if (!event.shiftKey && document.activeElement === last) {
                first.focus()
                event.preventDefault()
            }
            break
    }
}

/**
 * Handle touch start event
 */
function handleTouchStart(event) {
    if (!lightbox.classList.contains('active')) return
    touchStartX = event.changedTouches[0].screenX
    touchStartY = event.changedTouches[0].screenY
}

/**
 * Handle touch end event and detect swipe direction
 */
function handleTouchEnd(event) {
    if (!lightbox.classList.contains('active')) return
    touchEndX = event.changedTouches[0].screenX
    touchEndY = event.changedTouches[0].screenY
    handleSwipe()
}

/**
 * Detect swipe direction and navigate accordingly
 * Swipe right = previous image, Swipe left = next image
 */
function handleSwipe() {
    const swipeThreshold = 50 // Minimum distance for a swipe
    const diffX = touchStartX - touchEndX
    const diffY = touchStartY - touchEndY

    // Vertical swipe down to close
    if (diffY < -swipeThreshold && Math.abs(diffY) > Math.abs(diffX) * 2) {
        closeLightbox()
        return
    }

    if (Math.abs(diffX) < swipeThreshold) return // Not a significant swipe

    if (diffX > 0) {
        // Swiped left - go to next image
        nextImage()
    } else {
        // Swiped right - go to previous image
        prevImage()
    }
}

// Event Listeners
lightboxClose.addEventListener('click', closeLightbox)
lightboxBackdrop.addEventListener('click', closeLightbox)
lightboxPrev.addEventListener('click', prevImage)
lightboxNext.addEventListener('click', nextImage)
metadataToggle.addEventListener('click', toggleMetadata)
document.addEventListener('keydown', handleKeydown)

// Touch/Swipe listeners for mobile navigation
lightbox.addEventListener('touchstart', handleTouchStart, false)
lightbox.addEventListener('touchend', handleTouchEnd, false)

// Initialize
document.addEventListener('DOMContentLoaded', loadGalleryData)
