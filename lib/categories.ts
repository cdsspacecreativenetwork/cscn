import {
  BarChart3,
  Bot,
  Braces,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Car,
  Clapperboard,
  Code2,
  Coins,
  Cpu,
  CreditCard,
  Dna,
  Factory,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  LayoutGrid,
  Megaphone,
  Newspaper,
  Package,
  Palette,
  PenTool,
  Plane,
  Rocket,
  Scale,
  Search,
  Server,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Sprout,
  Star,
  Stethoscope,
  Store,
  Tag,
  TrendingUp,
  Utensils,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords: string[];
  isQuickFilter?: boolean;
};

export type IndustrySector = {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords: string[];
};

// ── Top Horizontal Rail Categories (Expertise / Function / Quick States) ─────
export const EXPERTISE_CATEGORIES: Category[] = [
  { id: 'all', label: 'All', icon: LayoutGrid, keywords: [] },
  { id: 'new', label: 'New', icon: Sparkles, keywords: [], isQuickFilter: true },
  { id: 'asap', label: 'Available ASAP', icon: Zap, keywords: [], isQuickFilter: true },
  { id: 'notable', label: 'Notable', icon: Star, keywords: [], isQuickFilter: true },
  { id: 'ai', label: 'AI', icon: Bot, keywords: ['artificial intelligence', 'ai ', 'automation', 'machine learning', 'llm', 'chatgpt'] },
  { id: 'soft-skills', label: 'Soft Skills', icon: Users, keywords: ['career', 'leadership', 'interview', 'resume', 'soft skills', 'communication'] },
  { id: 'design', label: 'Design', icon: Palette, keywords: ['design', 'ui/ux', 'ui design', 'ux design', 'user experience', 'product design', 'visual'] },
  { id: 'product', label: 'Product', icon: BriefcaseBusiness, keywords: ['product management', 'product manager', 'product', 'pm', 'agile'] },
  { id: 'engineering', label: 'Engineering', icon: Code2, keywords: ['software engineering', 'software engineer', 'backend', 'developer', 'frontend', 'engineering', 'fullstack'] },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, keywords: ['marketing', 'growth', 'seo', 'social media', 'content strategy', 'brand'] },
  { id: 'data-science', label: 'Data Science', icon: BarChart3, keywords: ['data science', 'data analytics', 'analytics', 'machine learning', 'data engineer'] },
  { id: 'product-research', label: 'Product Research', icon: Search, keywords: ['research', 'user research', 'ux research', 'user testing'] },
  { id: 'content-writing', label: 'Content Writing', icon: FileText, keywords: ['writing', 'content', 'copywriting', 'technical writing'] },
  { id: 'sales-bd', label: 'Sales/BD', icon: TrendingUp, keywords: ['sales', 'business development', 'bd', 'partnership', 'revenue'] },
  { id: 'no-low-code', label: 'No/Low Code', icon: Shapes, keywords: ['no code', 'low code', 'webflow', 'framer', 'bubble', 'zapier'] },
];

// ── ADPList Master Industry Taxonomy (Domain / Sector with Vector Icons) ─────
export const INDUSTRY_SECTORS: IndustrySector[] = [
  { id: 'agri', label: 'Agriculture', icon: Sprout, keywords: ['agriculture', 'agtech', 'farming'] },
  { id: 'arts', label: 'Arts & Entertainment', icon: Clapperboard, keywords: ['arts', 'entertainment', 'music', 'film', 'media'] },
  { id: 'auto', label: 'Automotive', icon: Car, keywords: ['automotive', 'auto', 'car', 'vehicles'] },
  { id: 'b2b', label: 'B2B', icon: Building2, keywords: ['b2b', 'enterprise', 'business to business'] },
  { id: 'b2c', label: 'B2C', icon: Users, keywords: ['b2c', 'consumer', 'business to consumer'] },
  { id: 'biotech', label: 'Biotech', icon: Dna, keywords: ['biotech', 'biotechnology', 'pharma', 'life sciences'] },
  { id: 'c2c', label: 'C2C', icon: ShoppingBag, keywords: ['c2c', 'peer to peer', 'marketplace'] },
  { id: 'consulting', label: 'Consulting', icon: Briefcase, keywords: ['consulting', 'advisory', 'strategy'] },
  { id: 'creatives', label: 'Creatives', icon: Palette, keywords: ['creatives', 'creative', 'agency', 'studio'] },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, keywords: ['ecommerce', 'e-commerce', 'retail', 'shopping'] },
  { id: 'education', label: 'Education', icon: GraduationCap, keywords: ['education', 'edtech', 'learning', 'school'] },
  { id: 'fintech', label: 'Fintech', icon: CreditCard, keywords: ['fintech', 'finance', 'banking', 'crypto', 'payments'] },
  { id: 'food-bev', label: 'Food & Beverage', icon: Utensils, keywords: ['food', 'beverage', 'restaurant', 'foodtech'] },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, keywords: ['gaming', 'games', 'game dev', 'esports'] },
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, keywords: ['healthcare', 'health', 'healthtech', 'medical', 'wellness'] },
  { id: 'iot', label: 'IoT', icon: Cpu, keywords: ['iot', 'hardware', 'embedded', 'smart home'] },
  { id: 'legal', label: 'Legal & Policy', icon: Scale, keywords: ['legal', 'policy', 'law', 'compliance', 'govtech'] },
  { id: 'logistics', label: 'Logistics', icon: Package, keywords: ['logistics', 'supply chain', 'freight', 'delivery'] },
  { id: 'manufacturing', label: 'Manufacturing', icon: Factory, keywords: ['manufacturing', 'factory', 'industrial'] },
  { id: 'media', label: 'Media & Journalism', icon: Newspaper, keywords: ['media', 'journalism', 'news', 'publishing'] },
  { id: 'mobility', label: 'Mobility', icon: Car, keywords: ['mobility', 'transportation', 'ride-sharing', 'ev'] },
  { id: 'nonprofit', label: 'Non Profit', icon: Heart, keywords: ['non profit', 'nonprofit', 'social impact', 'ngo'] },
  { id: 'realestate', label: 'Real Estate', icon: Home, keywords: ['real estate', 'proptech', 'housing'] },
  { id: 'retail', label: 'Retail', icon: Store, keywords: ['retail', 'consumer goods', 'fmcg'] },
  { id: 'saas', label: 'SaaS', icon: Server, keywords: ['saas', 'software as a service', 'cloud', 'software'] },
  { id: 'social', label: 'Social Media', icon: Globe, keywords: ['social media', 'creator economy', 'social'] },
  { id: 'startup', label: 'Start-up', icon: Rocket, keywords: ['startup', 'start-up', 'venture', 'early stage'] },
  { id: 'tech', label: 'Tech', icon: Laptop, keywords: ['tech', 'technology', 'deeptech', 'it'] },
  { id: 'travel', label: 'Travel', icon: Plane, keywords: ['travel', 'hospitality', 'tourism'] },
  { id: 'web3', label: 'Web3', icon: Coins, keywords: ['web3', 'crypto', 'blockchain', 'nft', 'defi'] },
];

export const ALL_MENTOR_CATEGORIES = EXPERTISE_CATEGORIES;
export const INDUSTRY_CATEGORIES = EXPERTISE_CATEGORIES;
