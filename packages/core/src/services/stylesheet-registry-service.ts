interface CssStringConfig {
  key: string;
  stylesheet: string;
}

interface StylesheetRegistryOptions {
  cssStringConfigs?: CssStringConfig[];
  adoptDocumentStylesheets?: boolean;
}

interface RegisteredStylesheet {
  sheet: CSSStyleSheet;
  origin: 'document' | 'cssString';
}

export class StylesheetRegistryService {
  private _stylesheets = new Map<string, RegisteredStylesheet>();
  private _defaultCSSStringConfigs?: CssStringConfig[];
  private _logger: Console;

  constructor(logger: Console, options: StylesheetRegistryOptions = {}) {
    this._logger = logger;

    const { cssStringConfigs, adoptDocumentStylesheets } = options;

    if (adoptDocumentStylesheets) {
      this.registerDocumentStylesheets();
    }

    if (cssStringConfigs) {
      this._defaultCSSStringConfigs = cssStringConfigs; //Stored for refresh
      for (const config of cssStringConfigs) {
        this.registerCssString(config.key, config.stylesheet)
      }

    }
  }

  /**
   * Registers a CSS string as a new Constructable Stylesheet.
   * Caution: Overwrites if a stylesheet with the same key already exists.
   */
  public registerCssString(key: string, cssString: string) {
    if (this._stylesheets.has(key)) {
      this._logger.warn(`[StylesheetRegistryService] Stylesheet '${key}' already registered. Overwriting.`)
    }
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(cssString);
      this._stylesheets.set(key, { sheet, origin: 'cssString' });
      this._logger.log(`[StylesheetRegistryService] CSS string '${key}' registered.`)
    } catch(e) {
      this._logger.error(`[StylesheetRegistryService] provided CSS string is invalid. `, e);
    }
  }

  /**
   * Experimental API, use with caution, needs review
   * Converts document stylesheets (from <link> or <style> tags) into
   * Constructable Stylesheets and registers them.
   */
  private registerDocumentStylesheets() {
    let index = 0;
    const newlyProcessedSheets = new Set<CSSStyleSheet>();

    for (const sheet of document.styleSheets) {
      // Only process CSSStyleSheet instances and those with rules or a href (to avoid empty/unloaded sheets)
      // And importantly, skip sheets that might already be constructable (e.g., if a polyfill is active, or dynamically created by other means)
      // The `adopted` property is non-standard but often used by polyfills.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (sheet instanceof CSSStyleSheet && (sheet.href !== null || sheet.cssRules.length > 0) && !(sheet as any).adopted) {
        
        let name: string;
        const cssSlug = sheet.href ? new URL(sheet.href).pathname.split('/').pop() : null;

        if (cssSlug === 'root.css') {
          name = `root`
        } else if (cssSlug && cssSlug.startsWith('linked-')) {
          name = cssSlug;
        } else if (cssSlug) {
          name = `linked-${cssSlug}`
        } else {
          name = `inline-${index}`;
          index++;
        }

        if (this._stylesheets.has(name) && this._stylesheets.get(name)?.sheet === sheet) {
          newlyProcessedSheets.add(sheet);
          continue;
        }

        try {
          const constructableSheet = new CSSStyleSheet();

          Array.from(sheet.cssRules).forEach(rule => {
            try {
              constructableSheet.insertRule(rule.cssText);
            } catch (e) {
              this._logger.warn(`[StylesheetRegistryService] Failed to insert rule from document sheet '${name}':`, rule.cssText, e)
            }
          });

          this._stylesheets.set(name, { sheet: constructableSheet, origin: 'document'});
          this._logger.log(`[StylesheetRegistryService] Document stylesheet '${name}' converted to Constructable StyleSheet and registered.`);
        } catch (e) {
          this._logger.error(`[StylesheetRegistryService] Error converting document stylesheet '${name}' to Constructable StyleSheet.`, e);
        }
      }
    }
  }

  /**
   * Retrieves a registered Constructable Stylesheet.
   */
  get(key: string): CSSStyleSheet | undefined {
    return this._stylesheets.get(key)?.sheet;
  }
  /**
   * 
   * @returns Returns all registered Constructable Stylesheets.
   */
  getAllStylesheets(): CSSStyleSheet[] {
    return Array.from(this._stylesheets.values()).map(entry => entry.sheet);
  }

  /**
   * Refreshes all CSS strings that were initially provided.
   * Useful for HMR or dynamic theme changes, etc.
   */
  refreshCssStrings() {
    if (this._defaultCSSStringConfigs) {
      this._logger.log(`[StylesheetRegistryService] Refreshing initial CSS strings.`);
      for (const config of this._defaultCSSStringConfigs) {
        this.registerCssString(config.key, config.stylesheet);
      }
    }
  }

  /**
   * Experimental API use with caution
   * Scans document.styleSheets again to add new ones or update existing ones.
   * Also removes stylesheets that are no longer present in the document.
   */
  refreshDocumentStylesheets() {
    const currentLiveSheets = new Set<CSSStyleSheet>();
    let index = 0;

    for (const sheet of document.styleSheets) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (sheet instanceof CSSStyleSheet && (sheet.href !== null || sheet.cssRules.length > 0) && !(sheet as any).adopted) {

        let name: string;
        const cssSlug = sheet.href ? new URL(sheet.href).pathname.split('/').pop() : null;

        if (cssSlug === 'root.css') {
          name = 'root';
        } else if (cssSlug && cssSlug.startsWith('linked-')) {
          name = cssSlug;
        } else if (cssSlug) {
          name = `linked-${cssSlug}`;
        } else {
          name = `inline-${index}`
          index++;
        }

        // If the registered entry for 'name' is NOT a document origin, or its original sheet reference is different,
        // then we need to re-process it
        const existingRegistered = this._stylesheets.get(name);
        
        if (!existingRegistered || existingRegistered.origin !== 'document' || existingRegistered.sheet.cssRules.length !== sheet.cssRules.length) {
          try {
            const constructableSheet = new CSSStyleSheet();
            Array.from(sheet.cssRules).forEach(rule => {
              try {
                constructableSheet.insertRule(rule.cssText);
              } catch (e) {
                this._logger.warn(`[StylesheetRegistryService] Failed to insert rule during refresh for '${name}':`, rule.cssText, e);
              }
            });
            this._stylesheets.set(name, { sheet: constructableSheet, origin: 'document' });
            this._logger.log(`[StylesheetRegistryService] Document stylesheet '${name}' refreshed (re-converted).`);

          } catch (e) {
            this._logger.error(`[StylesheetRegistryService] Error refreshing document stylesheet '${name}'.`, e);
          }
        } else {
          this._logger.debug(`[StylesheetRegistryService] Document stylesheet '${name}' already up-to-date.`);
        }
        currentLiveSheets.add(sheet);
      }
    }

    for (const [key, registered] of this._stylesheets.entries()) {
      if (registered.origin === 'document' && !currentLiveSheets.has(registered.sheet)) {

        const isPresent = Array.from(document.styleSheets).some(
          docSheet => {
            let docSheetName: string;
            const docCssSlug = docSheet.href ? new URL(docSheet.href).pathname.split('/').pop() : null;
            if (docCssSlug === 'root.css') { docSheetName = 'root'; }
            else if (docCssSlug) { docSheetName = `linked-${docCssSlug}`; }
            else { docSheetName = `inline-${Array.from(document.styleSheets).indexOf(docSheet)}`}

            return docSheetName === key;
          }
        );


        if (registered.origin === 'document' && !isPresent) {
          this._stylesheets.delete(key);
          this._logger.log(`[StylesheetRegistryService] Removed document stylesheet '${key}' no longer present.`)
        }
      }
    }
    
  }


}