import anime from 'animejs'

// Heart like button burst
export function animateLike(button: Element, isLiked: boolean) {
  anime({
    targets: button,
    scale: [1, 1.4, 0.9, 1.1, 1],
    duration: 500,
    easing: 'easeOutElastic(1, .5)',
  })
  if (isLiked) {
    anime({
      targets: button.querySelector('svg'),
      fill: ['#fff', '#ef4444'],
      duration: 300,
      easing: 'easeOutQuad',
    })
  } else {
    anime({
      targets: button.querySelector('svg'),
      fill: ['#ef4444', 'transparent'], // assuming it goes transparent
      duration: 300,
      easing: 'easeOutQuad',
    })
  }
}

// Play button morph
export function animatePlayPause(button: Element) {
  anime({
    targets: button,
    scale: [1, 0.88, 1],
    duration: 200,
    easing: 'easeOutBack',
  })
}

// Genre pill select sweep
export function animatePillSelect(pill: Element, selected: boolean) {
  anime({
    targets: pill,
    scale: selected ? [1, 1.08, 1] : [1, 0.95, 1],
    duration: 300,
    easing: 'easeOutElastic(1, .6)',
  })
}

// Add to queue slide in
export function animateQueueAdd(element: Element) {
  anime({
    targets: element,
    translateX: [60, 0],
    opacity: [0, 1],
    duration: 380,
    easing: 'easeOutBack',
  })
}

// Shuffle toggle spin
export function animateShuffle(icon: Element) {
  anime({
    targets: icon,
    rotate: '1turn',
    duration: 400,
    easing: 'easeOutCubic',
  })
}

// Skeleton pulse
export function animateSkeleton(elements: NodeListOf<Element>) {
  anime({
    targets: elements,
    opacity: [0.4, 0.8, 0.4],
    duration: 1500,
    easing: 'easeInOutSine',
    loop: true,
    delay: anime.stagger(100),
  })
}

// Ripple effect on click
export function animateRipple(container: Element, x: number, y: number) {
  const ripple = document.createElement('div')
  ripple.style.cssText = `
    position:absolute;left:${x}px;top:${y}px;
    width:0;height:0;border-radius:50%;
    background:rgba(255,255,255,0.15);
    transform:translate(-50%,-50%);pointer-events:none;
  `
  container.appendChild(ripple)
  anime({
    targets: ripple,
    width: [0, 200],
    height: [0, 200],
    opacity: [0.6, 0],
    duration: 600,
    easing: 'easeOutCubic',
    complete: () => ripple.remove(),
  })
}

// Volume thumb bounce
export function animateVolumeBounce(thumb: Element) {
  anime({
    targets: thumb,
    scale: [1, 1.3, 1],
    duration: 300,
    easing: 'easeOutElastic(1, .5)',
  })
}

// Floating particles
export function initParticles(container: Element, count = 30) {
  const particles: HTMLDivElement[] = []
  
  Array.from({ length: count }).forEach(() => {
    const particle = document.createElement('div')
    const size = Math.random() * 4 + 2
    particle.style.cssText = `
      position:absolute;border-radius:50%;
      width:${size}px;height:${size}px;
      background:rgba(29,185,84,${Math.random() * 0.3 + 0.05});
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
    `
    container.appendChild(particle)
    particles.push(particle)
    
    anime({
      targets: particle,
      translateX: () => anime.random(-80, 80),
      translateY: () => anime.random(-80, 80),
      opacity: [{ value: 0 }, { value: 1 }, { value: 0 }],
      duration: () => anime.random(4000, 8000),
      delay: () => anime.random(0, 3000),
      loop: true,
      easing: 'easeInOutSine',
      direction: 'alternate',
    })
  })

  // Provide a way to clean up the particles
  return () => {
    anime.remove(particles);
    particles.forEach(p => p.remove());
  }
}
