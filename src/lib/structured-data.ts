import { modelCard } from '~/content/model-card';
import type { Post } from '~/content/types';
import { siteUrl } from '~/lib/site';
import { siteConfig } from '~/site.config';

/** schema.org data. It must match what the page shows. */

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: siteConfig.company,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    url: siteUrl('/'),
    logo: siteUrl('/logo.png'),
    foundingDate: String(siteConfig.founded),
    numberOfEmployees: { '@type': 'QuantitativeValue', value: 60 },
    location: siteConfig.locations.map((city) => ({
      '@type': 'Place',
      name: city
    }))
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.company,
    url: siteUrl('/')
  };
}

export function softwareApplicationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: modelCard.name,
    softwareVersion: modelCard.version,
    applicationCategory: 'DeveloperApplication',
    description: modelCard.summary[0],
    datePublished: modelCard.released,
    url: siteUrl('/meridian-3'),
    publisher: { '@type': 'Organization', name: siteConfig.company },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
      description: 'Research access by application'
    }
  };
}

export function articleLd(post: Post, image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: post.title,
    abstract: post.abstract,
    datePublished: post.date,
    about: post.topic,
    url: siteUrl(`/research/${post.slug}`),
    ...(image ? { image: siteUrl(image) } : {}),
    author: post.authors.map((name) => ({ '@type': 'Person', name })),
    publisher: {
      '@type': 'Organization',
      name: siteConfig.company,
      logo: { '@type': 'ImageObject', url: siteUrl('/logo.png') }
    }
  };
}
