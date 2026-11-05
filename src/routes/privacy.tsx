import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/site/LegalPage';
import { privacyPage } from '~/content/pages';
import { shareImage } from '~/lib/share';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/privacy')({
  head: () =>
    seo({
      title: privacyPage.seo.title,
      description: privacyPage.seo.description,
      path: '/privacy',
      ...shareImage('privacy')
    }),
  component: () => <LegalPage page={privacyPage} />
});
