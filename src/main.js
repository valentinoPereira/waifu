import './style.css'

// Gallery data (loaded dynamically)
let galleryData = []

// Track current image index
let currentImageIndex = -1

// Touch/Swipe tracking
let touchStartX = 0
let touchEndX = 0

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
        img.alt = item.prompt || 'Gallery image'

        picture.appendChild(sourceWebp)
        picture.appendChild(img)
        card.appendChild(picture)

        // Create overlay
        const overlay = document.createElement('div')
        overlay.className = 'gallery-item-overlay'

        const title = document.createElement('div')
        title.className = 'overlay-title'
        title.textContent = item.prompt ? item.prompt.substring(0, 60) + (item.prompt.length > 60 ? '...' : '') : 'Untitled'

        const iconContainer = document.createElement('div')
        iconContainer.className = 'overlay-icons'

        // Heart icon
        const heartBtn = document.createElement('button')
        heartBtn.className = 'icon-btn'
        heartBtn.innerHTML = '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
        heartBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            heartBtn.classList.toggle('liked')
        })

        // Download icon
        const downloadBtn = document.createElement('button')
        downloadBtn.className = 'icon-btn'
        downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation()
        })

        // Info icon
        const infoBtn = document.createElement('button')
        infoBtn.className = 'icon-btn'
        infoBtn.innerHTML = '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation()
        })

        iconContainer.appendChild(heartBtn)
        iconContainer.appendChild(downloadBtn)
        iconContainer.appendChild(infoBtn)

        overlay.appendChild(title)
        overlay.appendChild(iconContainer)
        card.appendChild(overlay)

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
    document.body.style.overflow = 'hidden'
}

/**
 * Close lightbox
 */
function closeLightbox() {
    lightbox.classList.remove('active')
    document.body.style.overflow = 'auto'
    currentImageIndex = -1
}

/**
 * Update lightbox content
 */
function updateLightbox() {
    if (currentImageIndex < 0 || currentImageIndex >= galleryData.length) return

    const item = galleryData[currentImageIndex]
    // Replace .webp with .jpg for modal display
    const jpgImage = item.image.replace(/\.webp$/i, '.jpg')
    lightboxImage.src = jpgImage
    lightboxImage.alt = item.prompt || 'Gallery image'

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
    }
}

/**
 * Handle touch start event
 */
function handleTouchStart(event) {
    if (!lightbox.classList.contains('active')) return
    touchStartX = event.changedTouches[0].screenX
}

/**
 * Handle touch end event and detect swipe direction
 */
function handleTouchEnd(event) {
    if (!lightbox.classList.contains('active')) return
    touchEndX = event.changedTouches[0].screenX
    handleSwipe()
}

/**
 * Detect swipe direction and navigate accordingly
 * Swipe right = previous image, Swipe left = next image
 */
function handleSwipe() {
    const swipeThreshold = 50 // Minimum distance for a swipe
    const difference = touchStartX - touchEndX

    if (Math.abs(difference) < swipeThreshold) return // Not a significant swipe

    if (difference > 0) {
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
