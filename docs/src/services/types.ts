interface Graphic {
  kind: string;
  ref?: string;
  caption?: string;
}
interface Section {
  subhead: string;
  pullQuote?: string;
  graphics?: Graphic[];
  aside?: string;  
}
interface PageBody {
  headline: string;
  deck: string;
  byline: string;
  dateline: string;
  lede: string;
  body: Section[];
}
export interface Page {
  title: string;
  tag: string;
  api: string,
  id: string;
  created: string; //ISO
  updated?: string;
  canonical_url?: string;
  content: PageBody;
}