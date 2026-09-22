import { redirect } from 'next/navigation';

// The outside-creator submission program has been discontinued. Redirecting rather than deleting the route
// so an old bookmark or search result lands somewhere useful instead of a 404.
export default function Creators() {
  redirect('/library');
}
