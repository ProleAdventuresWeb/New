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
    description: 'Answering the question: Is it possible for a Prole to Escape? Border mechanics, purchasing power, and the maths of leaving.',
    seoTitle: 'Escape Strategy: Border Mechanics & Global Relocation for Proles'
  },
  {
    id: 'prolenomics',
    name: 'Prolenomics',
    icon: '📊',
    description: 'How to survive a hostile financial environment. The structural maths of modern life and the system extraction points.',
    seoTitle: 'Prolenomics: Financial Survival & System Extraction Analysis'
  },
  {
    id: 'decline',
    name: 'Decline',
    icon: '🏚️',
    description: 'Towns, industries, and infrastructure passing into history. Investigations into the absurdity of the dying West.',
    seoTitle: 'Decline & Fall: Investigations into Modern Industrial Decay'
  },
  {
    id: 'freedom',
    name: 'Freedom',
    icon: '🚌',
    description: 'Movement under constraint. Buses, bikes, vans, and unusual transport. A live test of freedom of movement.',
    seoTitle: 'Freedom of Movement: Low-Cost Logistics & Travel Realities'
  },
  {
    id: 'dispatches',
    name: 'Dispatches',
    icon: '📡',
    description: 'Field notes, mission updates, and behind the scenes. The bridge between the analytical and the personal.',
    seoTitle: 'Prole Dispatches: Field Reports & Operations Intelligence'
  },
  {
    id: 'urban-exploration',
    name: 'Urban Exploration',
    icon: '🏢',
    description: 'Venturing into the forgotten and forbidden. Investigations into abandoned spaces and the architecture of the overlooked.',
    seoTitle: 'Urban Exploration: Abandoned Spaces & Architectural Investigations'
  }
];

export const getCategoryById = (id: string) => BLOG_CATEGORIES.find(c => c.id === id);
