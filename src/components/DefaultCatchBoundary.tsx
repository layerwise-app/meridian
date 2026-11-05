import { Link, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);

  return (
    <div className='page pt-14 md:pt-24'>
      <div className='section-grid'>
        <p className='label text-accent'>Error</p>
        <div className='max-w-[44rem]'>
          <h1 className='text-[2.2rem] leading-[1.1] md:text-[3rem]'>
            Something went wrong while loading this page.
          </h1>
          <p className='mt-5 text-ink-soft'>
            It is probably temporary. Try again, or go back to the home page.
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <button
              type='button'
              className='btn btn-ink'
              onClick={() => void router.invalidate()}
            >
              Try again
            </button>
            <Link to='/' className='btn btn-quiet'>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
