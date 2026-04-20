// ============================================
// INTERSECTION OBSERVER (Scroll Animations)
// ============================================
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("aos-animate");
      const delay = entry.target.getAttribute("data-aos-delay");
      if (delay) {
        entry.target.style.transitionDelay = delay + "ms";
      }
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
);

document.querySelectorAll("[data-aos]").forEach((el) => {
  observer.observe(el);
});

// ============================================
// WAITLIST COUNTER (Simulated real-time)
// ============================================
let waitlistCount = 2847;

function updateWaitlistCount() {
  const increment = Math.floor(Math.random() * 3) + 1;
  const randomTime = Math.floor(Math.random() * 40000) + 20000;

  setTimeout(() => {
    waitlistCount += increment;
    document.querySelectorAll(".waitlist-count").forEach((el) => {
      el.textContent = waitlistCount.toLocaleString();
    });
    updateWaitlistCount();
  }, randomTime);
}

updateWaitlistCount();

// ============================================
// MAIN WAITLIST FORM SUBMISSION
// ============================================
const waitlistForm = document.getElementById("waitlistForm");
const successState = document.getElementById("successState");
const submitBtn = document.getElementById("submitBtn");

let currentPosition = 246;

if (waitlistForm && successState && submitBtn) {
  waitlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName")?.value?.trim();
    const email = document.getElementById("email")?.value?.trim();
    const jobTitle = document.getElementById("jobTitle")?.value;

    if (!firstName || !email) return;

    submitBtn.innerHTML = `
    <span class="btn-text">Adding you to the list...</span>
    <div class="loading-spinner"></div>
  `;
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.8";

    await simulateApiCall({
      firstName,
      email,
      jobTitle,
      source: "landing_page",
      timestamp: new Date().toISOString(),
    });

    currentPosition++;
    const posEl = document.getElementById("waitlistPosition");
    if (posEl) posEl.textContent = "#" + currentPosition;

    waitlistForm.style.display = "none";
    successState.removeAttribute("hidden");
    successState.classList.add("visible");

    const shareText =
      "I just joined the waitlist for WorkGraph — " +
      "an AI tool that finds jobs from LinkedIn, Reddit, " +
      "Twitter & 50+ sources worldwide. " +
      "Join me: https://workgraph.ai";

    const linkedInEl = document.getElementById("shareLinkedIn");
    if (linkedInEl) {
      linkedInEl.href =
        "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent("https://workgraph.ai");
      linkedInEl.target = "_blank";
      linkedInEl.rel = "noopener noreferrer";
    }

    const twitterEl = document.getElementById("shareTwitter");
    if (twitterEl) {
      twitterEl.href =
        "https://twitter.com/intent/tweet?text=" +
        encodeURIComponent(shareText);
      twitterEl.target = "_blank";
      twitterEl.rel = "noopener noreferrer";
    }

    trackEvent("waitlist_signup", { email, jobTitle });
  });
}

// ============================================
// CTA FORM (Bottom of page)
// ============================================
const ctaForm = document.getElementById("ctaForm");

if (ctaForm) {
  ctaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("ctaEmail")?.value?.trim();
    if (!email) return;

    const btn = ctaForm.querySelector("button[type='submit']");
    if (!btn) return;

    btn.innerHTML = "Adding you... ✓";
    btn.disabled = true;

    await simulateApiCall({ email });

    btn.innerHTML = "🎉 You're on the list!";
    btn.style.background = "linear-gradient(135deg, #10B981, #059669)";

    trackEvent("waitlist_signup_cta", { email });
  });
}

// ============================================
// SIMULATE API CALL
// Replace this with your actual backend call
// ============================================
async function simulateApiCall(data) {
  console.log("Waitlist signup:", data);

  /*
  SUPABASE EXAMPLE:
  const { error } = await supabase
    .from('waitlist')
    .insert([{
      first_name: data.firstName,
      email: data.email,
      job_field: data.jobTitle,
      source: data.source,
      created_at: new Date()
    }]);
  */

  /*
  BREVO EXAMPLE:
  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': 'YOUR_BREVO_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      listIds: [YOUR_LIST_ID],
      attributes: {
        JOB_FIELD: data.jobTitle,
        SOURCE: 'landing_page'
      }
    })
  });
  */

  return new Promise((resolve) => setTimeout(resolve, 1500));
}

// ============================================
// ANALYTICS TRACKING
// Replace with your actual analytics
// ============================================
function trackEvent(eventName, properties = {}) {
  console.log("Track:", eventName, properties);

  if (typeof gtag !== "undefined") {
    gtag("event", eventName, properties);
  }
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
const navbar = document.querySelector(".navbar");

if (navbar) {
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 50) {
        navbar.style.background = "rgba(3, 7, 18, 0.95)";
        navbar.style.boxShadow = "0 4px 30px rgba(0,0,0,0.3)";
      } else {
        navbar.style.background = "rgba(3, 7, 18, 0.8)";
        navbar.style.boxShadow = "none";
      }
    },
    { passive: true }
  );
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

// ============================================
// LOADING SPINNER STYLE
// ============================================
const spinnerStyle = document.createElement("style");
spinnerStyle.textContent = `
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

// ============================================
// TYPING EFFECT FOR HERO
// ============================================
const phrases = [
  "React Developer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "Marketing Lead",
  "DevOps Engineer",
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const typingEl = document.getElementById("typing");
  if (!typingEl) return;

  const currentPhrase = phrases[phraseIndex];

  if (isDeleting) {
    typingEl.textContent = currentPhrase.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingEl.textContent = currentPhrase.substring(0, charIndex + 1);
    charIndex++;
  }

  if (!isDeleting && charIndex === currentPhrase.length) {
    isDeleting = true;
    setTimeout(typeEffect, 2000);
    return;
  }

  if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
  }

  setTimeout(typeEffect, isDeleting ? 60 : 100);
}

typeEffect();

// ============================================
// ENTRANCE ANIMATION ON LOAD
// ============================================
window.addEventListener("load", () => {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease";

  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 100);
});

console.log(
  "%c WorkGraph 🚀 ",
  "background: linear-gradient(135deg, #7C3AED, #2563EB);" +
    "color: white; padding: 8px 16px; border-radius: 8px;" +
    "font-size: 16px; font-weight: bold;"
);
