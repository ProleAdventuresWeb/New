export interface BlogCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  seoTitle: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: 'escape',
    name: 'Escape',
    icon: '🛂',
    description: 'What it takes to leave: border rules, purchasing power and the practical realities of finding a place where a different life is possible.',
    seoTitle: 'Escape: Borders, Costs and the Reality of Leaving'
  },
  {
    id: 'prolenomics',
    name: 'Prolenomics',
    icon: '📊',
    description: 'The economics of everyday life: rent, food, wages and the pressures that determine whether a place is liveable.',
    seoTitle: 'Prolenomics: The Cost of Everyday Life'
  },
  {
    id: 'decline',
    name: 'Decline',
    icon: '🏚️',
    description: 'Field reports on towns, industries and infrastructure in decline, and what that means for the people still living there.',
    seoTitle: 'Decline: Towns, Industry and Everyday Consequences'
  },
  {
    id: 'freedom',
    name: 'Freedom',
    icon: '🚌',
    description: 'How people actually get around: buses, bikes, vans and other low-cost routes through the practical limits on movement.',
    seoTitle: 'Freedom of Movement: Transport and Travel Realities'
  },
  {
    id: 'dispatches',
    name: 'Dispatches',
    icon: '📡',
    description: 'Field notes, updates and behind-the-scenes reporting from the work of comparing places and everyday possibilities.',
    seoTitle: 'Prole Dispatches: Field Notes and Place Reports'
  },
  {
    id: 'urban-exploration',
    name: 'Urban Exploration',
    icon: '🏢',
    description: 'Reports from overlooked spaces and changing neighbourhoods, documenting how places are used, abandoned and lived in.',
    seoTitle: 'Urban Exploration: Overlooked Places and Changing Neighbourhoods'
  }
];

export const getCategoryById = (id: string) => BLOG_CATEGORIES.find(c => c.id === id);
