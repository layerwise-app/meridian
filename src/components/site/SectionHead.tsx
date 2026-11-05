/** The margin label of a Home section: its number and a one-word kicker. */
export function SectionHead({ number, kicker }: { number: string; kicker: string }) {
  return (
    <p className='label flex gap-3 text-ink-soft xl:flex-col xl:gap-1 xl:pt-3'>
      <span className='text-accent'>{number}</span>
      <span>{kicker}</span>
    </p>
  );
}
