export interface DomUpdater {
  updateText: (key: string, value: string | undefined | null) => void;
  updateList: <T>(key: string, items: T[], labelText: string, renderItem: (item: T) => HTMLLIElement) => void;
  updateSummary: (summaryText: string | undefined | null) => void;
  updateHtml: (key: string, value: string | undefined | null) => void;
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

  const updateSummary = (summaryText: string | undefined | null) => {

    const summaryDetails = getUpdatableElement<HTMLDetailsElement>('details');
    const summaryParagraph = getUpdatableElement<HTMLElement>('summary');
    const summaryLabel = getUpdatableElement<HTMLElement>('summary-label');

    if (summaryDetails && summaryParagraph && summaryLabel) {
      if (summaryText) {
        summaryParagraph.textContent = summaryText;
        summaryDetails.style.display = '';
        summaryLabel.textContent = 'Summary';
      } else {
        summaryParagraph.textContent = 'No summary available.';
        summaryDetails.style.display = 'none';
        summaryLabel.textContent = 'Summary';
      }
    }
  };

  const updateHtml = (key: string, value: string | undefined | null) => {
    const el = getUpdatableElement<HTMLElement>(key);
    if (el) {
      el.innerHTML = value ?? '';
    }
  };

  return {
    updateText,
    updateList,
    updateSummary,
    updateHtml,
  };
}