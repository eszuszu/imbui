export interface DomUpdater {
  updateText: (key: string, value: string | undefined | null) => void;
  updateList: <T>(key: string, items: T[], labelText: string, renderItem: (item: T) => HTMLLIElement) => void;
  updateSummary: (details: string, summary: { key: string; text: string | undefined | null }, label: { key: string; text: string }) => void;
  updateWithRenderer: (key: string, renderer: (target: HTMLElement) => void) => void;
  updateHtmlUnsafe: (key: string, value: string | undefined | null) => void;
};

interface DomUpdaterContext {
  elementsMap: { [key: string]: HTMLElement | HTMLUListElement | HTMLDetailsElement | undefined };
}



export function createDomUpdater(context: DomUpdaterContext): DomUpdater {

  const { elementsMap } = context;

  const getUpdatableElement = <E extends HTMLElement>(key: string): E | undefined => {
    const el = elementsMap[key];
    if (!el) {
      console.warn(`[DomUpdater] Element with key="${key}" not found.`);
      return undefined;
    }
    return el as E;
  };

  const updateText = (key: string, value: string | undefined | null) => {
    const el = getUpdatableElement<HTMLElement>(key);
    if (el) {
      el.textContent = value ?? '';
    }
  };

  const updateList = <T>(key: string, items: T[], labelText: string, renderItem: (item: T) => HTMLLIElement) => {
    const list = getUpdatableElement<HTMLUListElement>(key);
    if (list) {
      [...list.children].forEach(child => {
        if (!child.classList.contains('label')) child.remove();
      });

      let label = list.querySelector('.label');
      if (!label) {
        label = document.createElement('span');
        label.classList.add('label');
        list.prepend(label);
      }
      label.textContent = labelText;

      if (items && items.length > 0) {
        items.forEach(item => {
          list.appendChild(renderItem(<T>item));
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'None';
        list.appendChild(li);
      }
    }
  };
  
  const updateSummary = (details: string, summary: { key: string; text: string | undefined | null }, label: { key: string; text: string }) => {

    const summaryDetails = getUpdatableElement<HTMLDetailsElement>(details);
    const summaryParagraph = getUpdatableElement<HTMLElement>(summary.key);
    const summaryLabel = getUpdatableElement<HTMLElement>(label.key);

    if (summaryDetails && summaryParagraph && summaryLabel) {
      if (summary.text) {
        summaryParagraph.textContent = summary.text;
        summaryDetails.style.display = '';
        summaryLabel.textContent = label.text;
      } else {
        summaryParagraph.textContent = 'No summary available.';
        summaryDetails.style.display = 'none';
        summaryLabel.textContent = 'Summary';
      }
    }
  };

  const updateWithRenderer = (key: string, renderer: (target: HTMLElement) => void) => {
    const el = getUpdatableElement(key);
    if (el) {
      renderer(el);
    }
  }

  const updateHtmlUnsafe = (key: string, value: string | undefined | null) => {
    
    const el = getUpdatableElement<HTMLElement>(key);
    if (el) {
      el.innerHTML = value ?? '';
    }
  };

  return {
    updateText,
    updateList,
    updateSummary,
    updateWithRenderer,
    updateHtmlUnsafe,
  };
}