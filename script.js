// SCROLL ANIMATIONS
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      const delay = e.target
        .getAttribute('data-aos-delay') || 0;
      setTimeout(() => {
        e.target.classList.add('aos-animate');
      }, parseInt(delay));
    }
  }),
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('[data-aos]')
  .forEach(el => observer.observe(el));

// LIVE WAITLIST COUNTER
let count = 2847;
function bumpCount() {
  count += Math.floor(Math.random() * 3) + 1;
  ['liveCount','finalCount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = count.toLocaleString() + '+';
  });
  setTimeout(bumpCount,
    Math.floor(Math.random() * 45000) + 15000);
}
bumpCount();

// MAIN WAITLIST FORM
const form = document.getElementById('waitlistForm');
const success = document.getElementById('successState');
const btn = document.getElementById('submitBtn');
let position = 247;

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      firstName: document.getElementById('firstName').value,
      email: document.getElementById('email').value,
      jobField: document.getElementById('jobField').value,
      country: document.getElementById('country').value,
      source: 'workgraph_landing',
      timestamp: new Date().toISOString()
    };

    btn.innerHTML = `
      <span>Adding you to the list...</span>
      <div style="width:18px;height:18px;border:2px solid 
      rgba(255,255,255,.3);border-top-color:white;
      border-radius:50%;animation:spin .8s linear infinite">
      </div>`;
    btn.disabled = true;

    await saveToWaitlist(data);

    position++;
    document.getElementById('position')
      .textContent = '#' + position;

    form.style.display = 'none';
    success.style.display = 'block';

    const shareText =
      `I just joined WorkGraph — an AI that finds jobs ` +
      `from LinkedIn, Reddit, Twitter & 50+ sources ` +
      `worldwide and matches them to your resume. ` +
      `Free early access: ` +
      `https://muthuarasu41193.github.io/WorkGraph/`;

    document.getElementById('shareLinkedIn').href =
      `https://www.linkedin.com/sharing/share-offsite/` +
      `?url=https://muthuarasu41193.github.io/WorkGraph/`;

    document.getElementById('shareTwitter').href =
      `https://twitter.com/intent/tweet?text=` +
      encodeURIComponent(shareText);
  });
}

// BOTTOM CTA FORM
const finalForm = document.getElementById('finalForm');
if (finalForm) {
  finalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('finalEmail').value;
    const b = finalForm.querySelector('button');
    b.innerHTML = 'Adding you... ✓';
    b.disabled = true;
    await saveToWaitlist({ email });
    b.innerHTML = '🎉 You\'re on the list!';
    b.style.background =
      'linear-gradient(135deg,#10B981,#059669)';
  });
}

// SAVE TO WAITLIST FUNCTION
async function saveToWaitlist(data) {
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyt3tH5S-BRCFOHDwbj9DBEFhSprQFI9MpQzeqoLEBS8-cMBEZtCnutfApGzGh4nA8P/exec';

  const payload = {
    firstName: data.firstName || '',
    email: data.email || '',
    jobField: data.jobField || '',
    country: data.country || '',
    source: data.source || 'landing_page',
    timestamp: data.timestamp || new Date().toISOString(),
    page: window.location.href
  };

  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams(payload).toString()
  });

  if (!response.ok) {
    throw new Error('Failed to submit waitlist form: HTTP ' + response.status);
  }

  const result = await response.json();
  if (!result || result.ok !== true) {
    throw new Error((result && result.error) || 'Waitlist save failed');
  }

  return true;
}

// COPY LINK
function copyLink() {
  navigator.clipboard.writeText(
    'https://muthuarasu41193.github.io/WorkGraph/'
  );
  const btn = document.getElementById('copyBtn');
  if (btn) {
    btn.textContent = '✅ Copied!';
    btn.style.background = 'rgba(16,185,129,.15)';
    btn.style.color = '#10B981';
    setTimeout(() => {
      btn.textContent = 'Copy Link';
      btn.style.background = '';
      btn.style.color = '';
    }, 2500);
  }
}

// NAVBAR SCROLL
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.style.background = 'rgba(3,7,18,.97)';
    navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,.4)';
  } else {
    navbar.style.background = 'rgba(3,7,18,.85)';
    navbar.style.boxShadow = 'none';
  }
}, { passive: true });

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]')
  .forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  }));

// SPIN ANIMATION
const s = document.createElement('style');
s.textContent = `@keyframes spin {
  to { transform: rotate(360deg); }
}`;
document.head.appendChild(s);

// PAGE LOAD
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity .4s ease';
  setTimeout(() => document.body.style.opacity = '1', 50);
});
