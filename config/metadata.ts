import { Metadata } from 'next'

export const siteConfig = {
  name: 'حاسبة الأجرة',
  description: 'تطبيق لحساب أجرة المواصلات العامة وتتبع دفعات الركاب',
  url: 'https://alojra.vercel.app',
  ogImage: 'https://alojra.vercel.app/icon-512x512.png',
  lightOgImage: 'https://alojra.vercel.app/logo-light.png',
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
  keywords: ['مواصلات', 'مواصلات عامة', 'حاسبة أجرة', 'حساب التذاكر', 'باص', 'ميكروباص', 'تاكسي', 'الأجرة', 'مواصلات الرياض', 'مواصلات القاهرة', 'مواصلات الشرقية', 'مواصلات المنصورة', 'مواصلات الجيزة', 'مواصلات الإسكندرية', 'مواصلات الأقصر', 'مواصلات الأسكندرية', 'مواصلات الأسيوط', 'مواصلات البحيرة', 'مواصلات البورسعيد', 'فكة', 'الباقي', 'حساب الاجرة', 'حساب الاجرة', 'الاجرة', 'الأجرة', 'الحاسبة', 'حاسبة'],
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
    images: [{ url: siteConfig.ogImage }, { url: siteConfig.lightOgImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage, siteConfig.lightOgImage],
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