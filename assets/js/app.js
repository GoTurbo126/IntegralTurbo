let allFormulas = [];
let filteredFormulas = [];
let displayedCount = 6;
let showingAll = false;

let currentFilters = {
    subject: 'all',
    level: 'all',
    search: ''
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    await loadFormulas();
    setupEventListeners();
    applyFilters();
    renderMathFormulas();
    animateCounters();
}

async function loadFormulas() {
    try {
        const response = await fetch('data/formulas.json');
        if (!response.ok) {
            throw new Error('Failed to load formulas');
        }
        const data = await response.json();
        allFormulas = data.formulas;
        console.log(`Loaded ${allFormulas.length} formulas`);
    } catch (error) {
        console.error('Error loading formulas:', error);
        showError('Failed to load formulas. Please refresh the page.');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Show More Button
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', toggleShowMore);
    }
    
    // Banner Close
    const bannerClose = document.querySelector('.banner-close');
    if (bannerClose) {
        bannerClose.addEventListener('click', () => {
            document.querySelector('.announcement-banner').classList.add('hidden');
        });
    }
    
    // Mobile Menu
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    mobileMenuToggle.addEventListener('click', () => {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('active');
    });
    
    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                nav.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function handleFilterClick(e) {
    const button = e.target;
    const filterType = button.dataset.filter;
    const filterValue = button.dataset.value;
    
    const group = button.parentElement;
    group.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    currentFilters[filterType] = filterValue;
    
    // Reset to showing 6 when filters change
    showingAll = false;
    displayedCount = 6;
    
    applyFilters();
}

function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase().trim();
    
    // Reset to showing 6 when search changes
    showingAll = false;
    displayedCount = 6;
    
    applyFilters();
}

function toggleShowMore() {
    showingAll = !showingAll;
    renderFormulas();
    
    const btn = document.getElementById('showMoreBtn');
    const btnText = btn.querySelector('span:first-child');
    
    if (showingAll) {
        btnText.textContent = 'Show Less';
        btn.classList.add('expanded');
    } else {
        btnText.textContent = 'Show More Formulas';
        btn.classList.remove('expanded');
        // Scroll back to formulas section
        document.getElementById('formulas').scrollIntoView({ behavior: 'smooth' });
    }
}

function applyFilters() {
    filteredFormulas = allFormulas.filter(formula => {
        const matchesSubject = currentFilters.subject === 'all' || 
                              formula.subject === currentFilters.subject;
        
        const matchesLevel = currentFilters.level === 'all' || 
                            formula.levels.includes(currentFilters.level);
        
        const matchesSearch = currentFilters.search === '' ||
                             formula.title.toLowerCase().includes(currentFilters.search) ||
                             formula.chapter.toLowerCase().includes(currentFilters.search) ||
                             formula.keywords.some(kw => kw.toLowerCase().includes(currentFilters.search)) ||
                             formula.description.toLowerCase().includes(currentFilters.search);
        
        return matchesSubject && matchesLevel && matchesSearch;
    });
    
    renderFormulas();
    updateResultsCount();
}

function renderFormulas() {
    const container = document.getElementById('formulasContainer');
    const noResults = document.getElementById('noResults');
    const showMoreContainer = document.getElementById('showMoreContainer');
    
    if (filteredFormulas.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('hidden');
        showMoreContainer.classList.add('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    // Determine how many to show
    const formulasToShow = showingAll ? filteredFormulas : filteredFormulas.slice(0, displayedCount);
    
    // Show/hide Show More button
    if (filteredFormulas.length <= displayedCount) {
        showMoreContainer.classList.add('hidden');
    } else {
        showMoreContainer.classList.remove('hidden');
    }
    
    container.innerHTML = formulasToShow.map((formula, index) => `
        <article class="formula-card" data-index="${index}" role="article">
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(formula.title)}</h3>
                <div class="card-tags">
                    <span class="tag tag-subject">${escapeHtml(formula.subject)}</span>
                    ${formula.levels.map(level => 
                        `<span class="tag tag-level">${escapeHtml(level)}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="card-formula katex-formula" data-formula="${escapeHtml(formula.formula)}">
                ${escapeHtml(formula.formula)}
            </div>
            
            ${formula.image ? `
                <img 
                    src="${escapeHtml(formula.image)}" 
                    alt="${escapeHtml(formula.title)} diagram" 
                    class="card-image"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            ` : ''}
            
            <p class="card-description">${escapeHtml(formula.description)}</p>
            
            <div class="card-expandable" id="expandable-${index}">
                <div class="card-details">
                    <div class="detail-item">
                        <span class="detail-label">Chapter:</span> 
                        ${escapeHtml(formula.chapter)}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Keywords:</span> 
                        ${formula.keywords.map(kw => escapeHtml(kw)).join(', ')}
                    </div>
                </div>
            </div>
            
            <div class="card-actions">
                ${formula.pdfLink ? `
                    <a href="${escapeHtml(formula.pdfLink)}" 
                       class="btn btn-primary" 
                       download
                       aria-label="Download PDF for ${escapeHtml(formula.title)}">
                        📥 Download PDF
                    </a>
                ` : ''}
                <button class="btn btn-secondary expand-btn" 
                        data-target="expandable-${index}"
                        aria-expanded="false"
                        aria-controls="expandable-${index}">
                    👁️ Details
                </button>
            </div>
        </article>
    `).join('');
    
    setupExpandButtons();
    
    setTimeout(renderMathFormulas, 100);
}

function setupExpandButtons() {
    const expandButtons = document.querySelectorAll('.expand-btn');
    expandButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.dataset.target;
            const target = document.getElementById(targetId);
            const isExpanded = target.classList.contains('expanded');
            
            target.classList.toggle('expanded');
            btn.setAttribute('aria-expanded', !isExpanded);
            btn.textContent = isExpanded ? '👁️ Details' : '🔼 Hide';
        });
    });
}

function renderMathFormulas() {
    if (typeof renderMathInElement === 'undefined') {
        console.warn('KaTeX not loaded yet, will retry...');
        setTimeout(renderMathFormulas, 500);
        return;
    }
    
    const formulaElements = document.querySelectorAll('.katex-formula');
    formulaElements.forEach(element => {
        const formula = element.dataset.formula;
        try {
            renderMathInElement(element, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        } catch (error) {
            console.error('KaTeX rendering error:', error);
            element.textContent = formula;
        }
    });
}

function updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    const count = filteredFormulas.length;
    const total = allFormulas.length;
    
    countElement.textContent = `Showing ${Math.min(displayedCount, count)} of ${count} formulas (${total} total)`;
}

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
    const container = document.getElementById('formulasContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
            <h3>⚠️ Error</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}s