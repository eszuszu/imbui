type ViewContainer = 'generic' | 'slot';

interface ViewerOptions {
  type: ViewContainer;
  cachedPages: Map<string, HTMLElement>
  host: HTMLElement | HTMLSlotElement;
  query?: string;
  slot?: HTMLSlotElement;
}

interface Viewer {
  type: ViewContainer;
  currentTag: string | null;
  loadPage: () => void;
  createPage: (tag: string) => HTMLElement;
  unassignPage: () => void;
  assignPage: (page: HTMLElement) => void;
  removePage: () => void;
  appendPage: (page: HTMLElement) => void;
  preRenderedQuery?: string;
  initialTag?: string | null;
}

function isPreRendered(domReference: HTMLElement | null) {
  return domReference != null;
}

export function createViewer(options: ViewerOptions): Viewer {
  
  const { type, cachedPages, host, query, slot } = options;
  let initialTag: string | null = null;
  let currentPage: HTMLElement | null = null;
  let currentTag: string | null = null;

  if (query) {
    currentPage = host.querySelector(query);
    if (isPreRendered(currentPage)) initialTag = currentPage.tagName.toLowerCase();
  }
  function loadPage() {
    if (isPreRendered(currentPage) && type === 'slot') {
      currentTag = currentPage.tagName.toLowerCase();
      assignPage(currentPage);
      cachedPages.set(currentTag, currentPage);
    } else if (isPreRendered(currentPage) && type === 'generic') {
      currentTag = currentPage.tagName.toLowerCase();
      appendPage(currentPage);
      cachedPages.set(currentTag, currentPage);
    }
  }

  function createPage(tag: string): HTMLElement {
    let page: HTMLElement;
    if (!cachedPages.get(tag)) {
      page = document.createElement(tag);
      cachedPages.set(tag, page);
      currentTag = tag;
      return page;
    } else {
      currentTag = tag;
      return page = cachedPages.get(tag) as HTMLElement;
    }
  }

  function unassignPage() {
    if (slot) {
      slot.assign();
    } else {
      console.log(`[Viewer]: Can't un-assign element from non-existent slot.`);
    }
  }

  function assignPage(page: HTMLElement) {
    if (slot) {
      slot.assign(page);
    } else {
      console.log(`[Viewer]: Can't assign element to non-existent slot.`);
    }
  }

  function removePage() {
    if (currentPage) {
      currentPage.remove();
    }
  }

  function appendPage(page: HTMLElement) {
    host.append(page);
  }


  return {
    type: type,
    currentTag: currentTag,
    loadPage: loadPage,
    createPage: createPage,
    unassignPage: unassignPage,
    assignPage: assignPage,
    removePage: removePage,
    appendPage: appendPage,
    initialTag: initialTag,
  }
}