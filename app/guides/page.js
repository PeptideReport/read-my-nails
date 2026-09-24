import { Nav, Footer } from '../../components/Site';

export const metadata = { title: 'Guides — loading tiles, running sessions, pricing a hand · Read My Nails', description: 'How to load the Read My Nails tiles into an O’2NAILS or other inkjet nail printer, run the 12-minute session, and price a hand.', alternates: { canonical: '/guides' } };

export default function Guides() {
return (
<>
<Nav />
<main className="wrap doc">
<p className="eyebrow">Guides</p>
<h1>Loading tiles, running sessions, pricing a hand.</h1>

<h2>Loading the tiles into your printer</h2>
<p>The library is 2,265 PNG files, 1500 × 2250 pixels, black on a transparent background, named by tile code (<span className="mono">W-SLAY.png</span>, <span className="mono">E-1f41d.png</span>). Every nail printer that accepts your own images takes them; how you get them in depends on the model.</p>
<p><b>O’2NAILS with the built-in Android screen (X11 Plus, X12.5, X30):</b> the printer runs the O’2NAILS app itself. Images go into its gallery either through the app&apos;s cloud/import function or from a USB drive plugged into the unit. Copy the <span className="mono">tiles/</span> folder to a USB stick, open the app&apos;s gallery, import the folder. Ask your seller for the exact menu names for your firmware; it changes between versions. If the app only imports one image at a time, load the 60 tiles in Real Puzzles plus your best occasion chapter first and add the rest over the week.</p>
<p><b>O’2NAILS phone-app models (V11, F1, Nailplayer):</b> the tiles live in the phone app&apos;s &ldquo;My Gallery&rdquo;; add them from the phone&apos;s photo library. Save the tiles to the phone (AirDrop, Google Photos or a USB-C drive), then import.</p>
<p><b>Jolimark and other Windows/Android printers:</b> point the printer&apos;s image folder at the tiles directory or import through its gallery. Same files.</p>
<p>Print one tile before you print a hand. If the mark comes out mirrored, faint or off-center, the fix is in the printer&apos;s settings (image fit, density), not the file.</p>

<h2>Running the session</h2>
<p>A Read My Nails session is a lesson. The host sets up the station, demonstrates every step on a practice tip, and the customer does each step on herself: prep, base coat, cure, place her own finger in the printer, top coat, cure. The host taps the tile on the printer screen and talks; her hands stay off the customer&apos;s hands. Twelve minutes for a hand once the customer has done it once. The full script, with what to say when the print smudges and the under-18 rule, is in your downloads.</p>

<h2>Pricing a hand</h2>
<p>Ink and gel per hand cost about $1.50 to $2 at factory consumable prices. The session is what you&apos;re selling: a one-hand session at $25 and both hands at $40 is what the Naples kiosk runs, with a $5 &ldquo;try it&rdquo; single nail as the door-opener and $45 for a Duo or Mom &amp; Me pair. Two prep stations and one printer keep three customers moving; the customer&apos;s learning time, not the printer, is your bottleneck. Add a second host before a second printer.</p>

<h2>Sets with a photo nail</h2>
<p>Sets in the &ldquo;Show Me What You Love&rdquo; and Bride Tribe chapters have a <span className="mono">P-PHOTO</span> nail. The customer adds her own photo (her dog, his last name) in the app; the host prints that image on the marked nail. Keep photos simple and high-contrast: a face or a pet on a plain background prints; a group shot doesn&apos;t.</p>

<p className="muted">Something not covered? <a href="mailto:hello@readmynails.com">hello@readmynails.com</a> with your printer model. A person answers.</p>
</main>
<Footer />
</>
);
}
