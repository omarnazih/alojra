import { Metadata } from 'next'

export const siteConfig = {
  name: 'حاسبة الأجرة',
  description: 'تطبيق لحساب أجرة المواصلات العامة وتتبع دفعات الركاب',
  url: 'https://ojra.vercel.app',
  ogImage: 'https://ojra.vercel.app/og.jpg',
  links: {
    twitter: '@omarnazihcs',
  }
}

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['حاسبة أجرة', 'مواصلات عامة', 'حساب التذاكر', 'باص', 'ميكروباص', 'تاكسي'],
  authors: [{ name: 'Omar Nazih' }],
  creator: 'Omar Nazih',
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: 'ar',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.links.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '072123a6fc07b9e8',
  },
} 