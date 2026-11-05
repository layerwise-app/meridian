import { Link } from '@tanstack/react-router';
import { notFoundPage } from '~/content/pages';
import { ScreenSlot } from '~/components/figure/ScreenSlot';

export function NotFound() {
  return (
    <div className='page pt-14 md:pt-24'>
      <div className='section-grid'>
        <p className='label text-accent'>{notFoundPage.kicker}</p>
        <div className='max-w-[44rem]'>
          <h1 className='text-[2.4rem] leading-[1.08] tracking-[-0.01em] md:text-[3.4rem]'>
            {notFoundPage.title}
          </h1>
          <p className='mt-5 text-ink-soft'>{notFoundPage.body}</p>
          <ul className='mt-8 flex flex-wrap gap-3'>
            {notFoundPage.links.map((item, i) => (
              <li key={item.href}>
                <Link to={item.href} className={i === 0 ? 'btn btn-ink' : 'btn btn-quiet'}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figure className='mt-14 md:mt-20'>
        <ScreenSlot
          screen={notFoundPage.screen}
          aspect={5 / 2}
          label={notFoundPage.figureLabel}
          className='border-y border-ink'
        />
        <figcaption className='mt-2.5 text-[0.85rem] text-ink-soft'>
          <span className='fig-label'>Plate</span>
          {notFoundPage.caption}
        </figcaption>
      </figure>
    </div>
  );
}
