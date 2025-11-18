import type { RouteConfig } from "@imbui/core";
import { DATA_SERVICE_KEY } from "./services/data-service";

export const  APP_ROUTES: RouteConfig[] = [

  //Exact static pages
  {
    path: '/',
    componentTag: 'page-intro',
    dataServiceKey: DATA_SERVICE_KEY,
    title: 'Imbui Docs, introduction',
    isSSRReady: true
  },
  {
    path: '/guide/quick-start',
    componentTag: 'page-start',
    title: '',
    isSSRReady: true
  },

  {
    path: '/api/pulse',
    componentTag: 'page-docs',
    title: '',
    isSSRReady: true
  },
  {
    path: '/api/cast',
    componentTag: 'page-docs',
    title: '',
    isSSRReady: true
  },
  {
    path: '/api/infuse',
    componentTag: 'page-docs',
    title: '',
    isSSRReady: true
  },
  {
    path: '/api/core',
    componentTag: 'page-docs',
    title: '',
    isSSRReady: true
  },
  {
    path: '/about',
    componentTag: 'page-about',
    title: '',
    isSSRReady: true
  },

  //Dynamic collections/index pages (dynamic segments)
  {
    path: '/guide/essentials/:api',
    componentTag: 'page-essentials',
    title: (page) => `imbui / essentials - ${page.api}`,
    isSSRReady: true
  },
  {
    path: '/api/pulse/:api',
    componentTag: 'page-docs',
    title: (page) => `imbui / pulse - ${page.api}`,
    isSSRReady: true
  },
  {
    path: '/api/cast/:api',
    componentTag: 'page-docs',
    title: (page) => `imbui / cast - ${page.api}`,
    isSSRReady: true
  },
  {
    path: '/api/infuse/:api',
    componentTag: 'page-docs',
    title: (page) => `imbui / infuse - ${page.api}`,
    isSSRReady: true
  },
  {
    path: '/api/core/:api',
    componentTag: 'page-docs',
    title: (page) => `imbui / core - ${page.api}`,
    isSSRReady: true
  },
  {
    path: '/api/core/:api',
    componentTag: 'page-docs',
    title: (page) => `imbui / core - ${page.api}`,
    isSSRReady: true
  },
  
  //important! static pages and catch-all, *comes after more specific routes*
  {
    path: '/:api',
    componentTag: (page) => `$'page'-${page.tag}`,
    title: (page) => `imbui / ${page} - ${page.api}`,
    isSSRReady: true
  },

  //404
  {
    path: '*',
    componentTag: 'page-error',
    title: 'Page Not Found',
    isSSRReady: true
  }
  
]