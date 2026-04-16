import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(ScrollTrigger, Flip)

const reduceMotion = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

// Page enter animation
export function animatePageEnter(container: Element) {
  if (reduceMotion()) return
  return gsap.fromTo(container,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
  )
}

// Stagger card entrance
export function animateStagger(elements: Element[], delay = 0) {
  if (reduceMotion()) return
  return gsap.fromTo(elements,
    { opacity: 0, y: 30, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.07, delay, ease: 'power3.out' }
  )
}

// Hero parallax
export function animateHeroParallax(trigger: Element, image: Element) {
  if (reduceMotion()) return
  return gsap.to(image, {
    yPercent: -30,
    ease: 'none',
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  })
}

// Text reveal (character by character)
export function animateTextReveal(element: Element) {
  if (reduceMotion()) return
  const text = element.textContent || ''
  element.innerHTML = text.split('').map(c =>
    `<span style="display:inline-block;opacity:0;transform:translateY(20px)">${c === ' ' ? '&nbsp;' : c}</span>`
  ).join('')
  return gsap.to(element.querySelectorAll('span'), {
    opacity: 1, y: 0, duration: 0.04, stagger: 0.03, ease: 'power2.out'
  })
}

// Now playing: song change slide-in
export function animateSongChange(element: Element) {
  if (reduceMotion()) return
  return gsap.fromTo(element,
    { x: 40, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
  )
}

// Sidebar active indicator
export function animateSidebarIndicator(indicator: Element, target: Element) {
  if (reduceMotion()) return
  const state = Flip.getState(indicator)
  target.appendChild(indicator)
  return Flip.from(state, { duration: 0.4, ease: 'elastic.out(1, 0.6)' })
}

// Album art rotation (while playing)
export function startAlbumRotation(element: Element) {
  return gsap.to(element, {
    rotation: 360,
    duration: 12,
    ease: 'none',
    repeat: -1,
  })
}

// ScrollTrigger section reveal
export function animateSectionReveal(trigger: Element, target: Element) {
  if (reduceMotion()) return
  return gsap.fromTo(target,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger, start: 'top 85%', toggleActions: 'play none none reverse' }
    }
  )
}
