import { createApp, ref, onMounted } from 'vue'
import '../services/init-auth.js'
import { movieService } from '../services/MovieService.js'
import { programService } from '../services/program-service.js'

const MovieListApp = {
  setup() {
    const movies = ref([])
    const isLoading = ref(true)
    const hasError = ref(false)
    const debugInfo = ref('Зареждане...')

    onMounted(async () => {
      try {
        console.log('Зареждане на предстоящи филми...')
        isLoading.value = true
        debugInfo.value = 'Изпращане на заявка към API...'

        // Use the movie service to get upcoming movies (with empty bookingTimes)
        const upcomingMovies = await movieService.getUpcomingMovies()
        console.log('Получени данни за предстоящи филми:', upcomingMovies)
        debugInfo.value = `Получени филми: ${upcomingMovies ? upcomingMovies.length : 0}`
        
        // Директно извеждаме имената на филмите в конзолата за дебъгване
        if (upcomingMovies && upcomingMovies.length > 0) {
          console.log('Имена на заредените филми:')
          upcomingMovies.forEach((movie, index) => {
            console.log(`${index + 1}. ${movie.name} (ID: ${movie.id})`)
          })
        }
        
        movies.value = upcomingMovies
        
        // If no movies were found, provide some fallback data
        if (movies.value.length === 0) {
          console.warn('No upcoming movies found or API not available')
          debugInfo.value = 'Няма намерени филми'
          // Fallback data
          movies.value = []
        } else {
          debugInfo.value = `Успешно заредени ${movies.value.length} филми`
        }
      } catch (error) {
        console.error('Грешка при зареждане на филми:', error)
        hasError.value = true
        debugInfo.value = `Грешка: ${error.message}`
        // Empty array on error
        movies.value = []
      } finally {
        isLoading.value = false
      }
    })

    return { movies, isLoading, hasError, debugInfo }
  }
}

// Създаваме Vue инстанция
const app = createApp(MovieListApp)

// Правим компонент за списъка с филми
app.component('movie-list', {
  props: ['movies'],
  template: `
    <li v-if="movies.length === 0" class="no-movies">
      <p>Няма налични филми за показване.</p>
    </li>
    <template v-else>
      <li v-for="(movie, index) in movies" :key="movie.id || index">
        <h4>{{ movie.name || 'Без име' }}</h4>
        <img class="movie-1-pic" :src="movie.imageUrl" :alt="movie.name" width="224" height="269" />
        <p>{{ movie.description || 'Няма описание' }}</p>
        
        <div class="wrapper">
          <a :href="'/trailer/' + movie.id" class="link2">
            <span><span>See Trailer</span></span>
          </a>
        </div>
      </li>
      <li class="clear">&nbsp;</li>
    </template>
  `
})

// Монтираме приложението
app.mount('#movie-app')

// Initialize program page Vue app
const programApp = programService.initProgramVue()
programApp.mount('#program-app')

document.addEventListener("DOMContentLoaded", function() {
  // Load navigation and footer
  fetch('/partials/nav.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      const navElement = document.getElementById('nav');
      if (navElement) {
        navElement.innerHTML = data;
        // Setup tab navigation after nav is loaded
        setupTabNavigation();
      } else {
        console.error('Element with id "nav" not found');
      }
    })
    .catch(error => {
      console.error('Error loading navigation:', error);
    });

  fetch('/partials/footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      const footerElement = document.getElementById('footer');
      if (footerElement) {
        footerElement.innerHTML = data;
      } else {
        console.error('Element with id "footer" not found');
      }
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });
    
  // Add direct event listener for any links already in the page before nav loads
  setupInitialLinkListeners();
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
      href.includes('trailer/') ||
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
    attachLinkHandler(link);
  });
}

// Function to handle tab navigation
function setupTabNavigation() {
  // Map of paths to tab IDs
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
    attachLinkHandler(link);
  });

  // Set up a mutation observer to handle dynamically added links
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const newLinks = node.querySelectorAll('a');
            newLinks.forEach(link => {
              attachLinkHandler(link);
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
    if (href === path || 
        (path === '/' && href === '/index.html') ||
        (path === '/index.html' && href === '/')) {
      item.classList.add('active');
    }
  });
}

// Update body ID to match the active tab for styling
function updateBodyId(tabId) {
  const bodyIdMap = {
    'content-home': 'page1',
    'content-program': 'page2',
    'content-offers': 'page3',
    'content-4dx': 'page5',
    'content-imax': 'page6',
    'content-about-us': 'page4',
    'content-contact-us': 'page10'
  };
  
  document.body.id = bodyIdMap[tabId] || 'page1';
}
