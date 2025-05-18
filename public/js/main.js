import '../services/init-auth.js'
import { movieService } from '../services/movie-service.js'
import { programService } from '../services/program-service.js'
import { trailerService } from '../services/trailer-service.js'
import { createApp } from 'vue'
import userService from '../services/user-service.js'

console.log("main.js се зарежда");
console.log("movieService:", movieService);

// Глобален обработчик за fetch грешки, които могат да повлияят на автентикацията
async function handleFetchWithAuthRetry(fetchPromise, retryCount = 1) {
  try {
    return await fetchPromise;
  } catch (error) {
    console.error("Fetch error:", error);
    
    if (retryCount > 0 && (error.message.includes('network') || error.message.includes('fetch'))) {
      console.warn("Network error detected, refreshing auth state and retrying...");
      await userService.refreshAuthState();
      
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry with one less retry attempt
      return handleFetchWithAuthRetry(fetchPromise, retryCount - 1);
    }
    
    throw error;
  }
}

// Задаваме всичко да се инициализира след DOM зареждането
document.addEventListener('DOMContentLoaded', async function() {
  console.log("DOM fully loaded");
  
  try {
    console.log("Тестваме дали API за филмите работи:");
    const testMovies = await handleFetchWithAuthRetry(movieService.getUpcomingMovies());
    console.log("Тест резултат:", testMovies);
    console.log("Брой филми:", testMovies ? testMovies.length : 0);
    
    if (testMovies && testMovies.length > 0) {
      console.log("Филми са заредени успешно от API");
      
      // Инициализираме Vue компонентите
      // Създаваме Vue инстанция за филмите
      try {
        console.log("Инициализация на Vue за филми");
        const movieElement = document.getElementById('movie-app');
        if (movieElement) {
          console.log("movie-app елемент намерен, създаваме приложението");
          const movieApp = movieService.initMovieListVue();
          console.log("Vue инстанция за филми създадена:", movieApp);
          movieApp.mount('#movie-app');
          console.log("Монтирането на #movie-app приключи");
        } else {
          console.error("movie-app елемент НЕ Е намерен в DOM!");
        }
        
        // Initialize program page Vue app
        console.log("Инициализация на Vue за програма");
        const programElement = document.getElementById('program-app');
        if (programElement) {
          const programApp = programService.initProgramVue();
          console.log("Vue инстанция за програма създадена");
          programApp.mount('#program-app');
          console.log("Монтирането на #program-app приключи");
        }
      } catch (e) {
        console.error("Грешка при инициализиране на Vue:", e);
        // Ensure auth state is refreshed if there's an error
        userService.refreshAuthState();
      }
      
    } else {
      console.log("Няма филми от API или има грешка при извикването");
      // If we couldn't load movies, ensure auth state is refreshed
      userService.refreshAuthState();
    }
  } catch (e) {
    console.error("Грешка при тестването на API за филми:", e);
    // Ensure auth state is refreshed if there's an error
    userService.refreshAuthState();
  }

  // Load navigation and footer with error handling
  try {
    const navResponse = await handleFetchWithAuthRetry(fetch('/partials/nav.html'));
    
    if (!navResponse.ok) {
      throw new Error(`HTTP error! Status: ${navResponse.status}`);
    }
    
    const navData = await navResponse.text();
    const navElement = document.getElementById('nav');
    
    if (navElement) {
      navElement.innerHTML = navData;
      // Setup tab navigation after nav is loaded
      setupTabNavigation();
      
      // Make sure auth state is applied to the newly loaded nav
      userService.updateUIAuthState();
    } else {
      console.error('Element with id "nav" not found');
    }
  } catch (error) {
    console.error('Error loading navigation:', error);
  }

  try {
    const footerResponse = await handleFetchWithAuthRetry(fetch('/partials/footer.html'));
    
    if (!footerResponse.ok) {
      throw new Error(`HTTP error! Status: ${footerResponse.status}`);
    }
    
    const footerData = await footerResponse.text();
    const footerElement = document.getElementById('footer');
    
    if (footerElement) {
      footerElement.innerHTML = footerData;
    } else {
      console.error('Element with id "footer" not found');
    }
  } catch (error) {
    console.error('Error loading footer:', error);
  }
    
  // Add direct event listener for any links already in the page before nav loads
  setupInitialLinkListeners();
  
  // Setup event listeners for navigation changes to ensure auth state is maintained
  window.addEventListener('popstate', () => {
    setTimeout(() => userService.updateUIAuthState(), 100);
  });
});

// Дефиниране на attachLinkHandler като глобална функция, преди да се използва
function attachLinkHandler(link) {
  // Skip if already processed
  if (link.hasAttribute('data-processed')) {
    return;
  }
  
  const href = link.getAttribute('href');
  
  // Skip if null href or special links
  if (!href || 
      href === '#' || 
      href.startsWith('http') || 
      href.startsWith('mailto:') ||
      href.includes('trailer') ||
      link.getAttribute('target') === '_blank') {
    link.setAttribute('data-processed', 'true');
    return;
  }
  
  // Check if this link should be handled by our tab system
  const pathToTabMap = {
    '/': 'content-home',
    '/index.html': 'content-home',
    '/program.html': 'content-program',
    '/program': 'content-program',
    '/4-dx.html': 'content-4dx',
    '/4-dx': 'content-4dx',
    '/imax.html': 'content-imax',
    '/imax': 'content-imax',
    '/offers.html': 'content-offers',
    '/offers': 'content-offers',
    '/about-us.html': 'content-about-us',
    '/about-us': 'content-about-us',
    '/contact-us.html': 'content-contact-us',
    '/contact-us': 'content-contact-us'
  };
  
  if (pathToTabMap[href] || href.startsWith('/about-us') || href.startsWith('/contact-us')) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Find the tab ID
      let tabId = pathToTabMap[href];
      
      // Special handling for about-us and contact-us
      if (href.startsWith('/about-us')) {
        tabId = 'content-about-us';
      } else if (href.startsWith('/contact-us')) {
        tabId = 'content-contact-us';
      }
      
      if (tabId) {
        // Show the tab
        showTab(tabId);
        
        // Update URL without page reload
        history.pushState({}, '', href);
        
        // Update active nav item
        updateActiveNavItem(href);
        
        // Update body ID
        updateBodyId(tabId);
      }
    });
  }
  
  link.setAttribute('data-processed', 'true');
}

// Set up listeners for links that exist in the initial HTML before nav is loaded
function setupInitialLinkListeners() {
  const initialLinks = document.querySelectorAll('a.link1, a.link2, .wrapper a');
  initialLinks.forEach(link => {
    // Ако е линк към трейлър, обработката е в TrailerService
    if (link.getAttribute('href') && link.getAttribute('href').includes('?trailer=')) {
      return; // Тези линкове се обработват от TrailerService
    } 
    
    // Обикновени линкове обработваме нормално
    attachLinkHandler(link);
  });
}

// Function to handle tab navigation
function setupTabNavigation() {
  // Map of paths to tab IDs
  const pathToTabMap = {
    '/': 'content-home',
    '/index.html': 'content-home',
    '/program': 'content-program',
    '/4-dx': 'content-4dx',
    '/imax': 'content-imax',
    '/offers': 'content-offers',
    '/about-us': 'content-about-us',
    '/contact-us': 'content-contact-us',
  };

  // Set the initial active tab based on URL
  const currentPath = window.location.pathname;
  const initialTabId = pathToTabMap[currentPath] || 'content-home';
  showTab(initialTabId);

  // Set the body ID based on the active tab
  updateBodyId(initialTabId);

  // Get all navigation links - use document.body to ensure we catch all links
  const allLinks = document.body.querySelectorAll('a');
  
  // Add click handler to all links
  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes('?trailer=')) {
      return; // Тези линкове се обработват от TrailerService
    } else {
      // Обикновени линкове обработваме нормално
      attachLinkHandler(link);
    }
  });

  // Set up a mutation observer to handle dynamically added links
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const newLinks = node.querySelectorAll('a');
            newLinks.forEach(link => {
              const href = link.getAttribute('href');
              if (href && href.includes('?trailer=')) {
                return; // Тези линкове се обработват от TrailerService
              } else {
                // Обикновени линкове обработваме нормално
                attachLinkHandler(link);
              }
            });
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle browser back/forward navigation
  window.addEventListener('popstate', function() {
    const path = window.location.pathname;
    const tabId = pathToTabMap[path] || 'content-home';
    
    showTab(tabId);
    updateActiveNavItem(path);
    updateBodyId(tabId);
  });
}

// Show the specified tab and hide others
function showTab(tabId) {
  console.log('Showing tab:', tabId);
  
  // Hide all tabs
  const tabs = document.querySelectorAll('.content-section');
  tabs.forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Show the selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  } else {
    console.error('Tab not found:', tabId);
  }
}

// Update active navigation item
function updateActiveNavItem(path) {
  // Remove active class from all nav items
  const navItems = document.querySelectorAll('nav a, header a');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to matching items
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === path) {
      item.classList.add('active');
    }
  });
}

// Update body ID based on active tab
function updateBodyId(tabId) {
  const idMap = {
    'content-home': 'page1',
    'content-program': 'page2',
    'content-4dx': 'page3',
    'content-imax': 'page4',
    'content-offers': 'page5',
    'content-about-us': 'page6',
    'content-contact-us': 'page7'
  };
  
  const bodyId = idMap[tabId] || 'page1';
  document.body.id = bodyId;
}
