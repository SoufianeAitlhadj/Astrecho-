# NASA Space Apps Challenge — reference library

These are the NASA data sources this project was built from. Every section below
is one retrievable chunk. The `source:` comment is what C.U.R.I.O. cites.

## NASA Space Apps Challenge
<!-- source: NASA Space Apps Challenge | https://www.spaceappschallenge.org/ -->
The NASA Space Apps Challenge is NASA's international hackathon. Teams use open
NASA data to build projects over one weekend. This project, C.U.R.I.O. — Caretaker
of Unheard Robots In Orbit — was built for the Storytelling track. Its subject is
the machines humans sent ahead of themselves and then left behind: Apollo 11's
lunar module Eagle on the Moon, the rover Opportunity on Mars, and the probe
Pioneer 10 in deep space. Every fact, photo, 3D model and coordinate in the app
comes from the open NASA sources listed in this reference library.

## NASA Image and Video Library
<!-- source: NASA Image and Video Library | https://images.nasa.gov/ -->
images.nasa.gov is NASA's public archive of photographs, video and audio. Each
item has a NASA ID (for example as11-40-5903, Buzz Aldrin beside Eagle's leg).
The app pulls the archive photographs on every chapter from here, through the
public API at https://images-api.nasa.gov/search?q=... and the per-item asset
list at https://images-api.nasa.gov/asset/{nasa_id}. No API key is needed. When a
photo in the app says "ARCHIVE FRAME OFFLINE", it means the live request to this
archive failed, not that the photo does not exist.

## NASA Open APIs (api.nasa.gov)
<!-- source: NASA Open APIs | https://api.nasa.gov/ -->
api.nasa.gov is the front door to NASA's open APIs — imagery, Mars rover photos,
asteroid data and more. The image and video library endpoints used by this app
need no key; most other endpoints accept the free DEMO_KEY or a personal key.

## NSSDCA Master Catalog
<!-- source: NSSDCA Master Catalog | https://nssdc.gsfc.nasa.gov/nmc/ -->
The NASA Space Science Data Coordinated Archive Master Catalog is the official
registry of spacecraft. Each craft has a COSPAR / international designator, and
that ID is the authoritative record for launch dates, mass, landing coordinates
and mission fate. The three machines in this app:
Apollo 11 lunar module Eagle = 1969-059C,
Opportunity (MER-B) = 2003-032A,
Pioneer 10 = 1972-012A.
Surveyor 3 = 1967-035A and the Apollo 15 descent stage / ALSEP = 1971-063C.

## NASA 3D Resources
<!-- source: NASA 3D Resources | https://science.nasa.gov/3d-resources/ -->
NASA publishes free 3D models of spacecraft as .glb, .usdz and printable .stl
files. The models you can rotate in this app come from here: the Apollo Lunar
Module (about 700 KB, credit NASA/Michael D. Carbajal), the Mars Exploration
Rover (about 11.6 MB, credit NASA/JPL-Caltech, with a 36 KB low-poly fallback
from NASA Ames for slow connections), and Pioneer 10 (about 2 MB, credit
NASA/JPL/Eyes on the Solar System). The same models are mirrored on GitHub at
https://github.com/nasa/NASA-3D-Resources. Spirit and Opportunity were identical
twins, so one rover model stands in for both.

## NASA/JPL Photojournal
<!-- source: NASA/JPL Photojournal | https://photojournal.jpl.nasa.gov/ -->
The Photojournal is JPL's catalog of planetary images, numbered with PIA
identifiers. The app's Mars photographs come from here, including PIA05634 (the
"Berry Bowl" rock brushed clean of blueberries, sol 48), PIA05588 (blueberries
scattered on the plains beyond Eagle Crater, sol 17), PIA19113 (a microscope
close-up of blueberries near Fram Crater, sol 84) and PIA05451 (a 3D model of
the landing site in Eagle Crater with airbag fragments).

## NASA media usage guidelines
<!-- source: NASA Brand Center — images and media | https://www.nasa.gov/nasa-brand-center/images-and-media/ -->
NASA still images, video and audio are generally not copyrighted and may be used
for educational or informational purposes, including this project. NASA asks that
you credit NASA (or NASA/JPL-Caltech where given) and that you do not use the NASA
insignia, logotype or seal in your own designs. The three mission patches in this
app are therefore original artwork with no NASA marks on them.

## Mission pages used
<!-- source: NASA science mission pages | https://science.nasa.gov/ -->
The narrative chapters were written from NASA's own mission pages:
Apollo 11 and the lunar module, https://science.nasa.gov/mission/apollo-11/ ;
Surveyor 3, https://science.nasa.gov/mission/surveyor-3/ ;
Mars Exploration Rovers Spirit and Opportunity,
https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ ;
Pioneer 10, https://science.nasa.gov/mission/pioneer-10/ ;
Voyager, https://science.nasa.gov/mission/voyager/ ;
Lunar Reconnaissance Orbiter, which has photographed the Apollo 11 site from
orbit, https://science.nasa.gov/mission/lro/ .

## Known data caveats
<!-- source: Project data notes | https://nssdc.gsfc.nasa.gov/nmc/ -->
Three honest caveats the team recorded. One: "My battery is low and it's getting
dark" is a reporter's paraphrase of Opportunity's final telemetry, not a message
the rover transmitted. Two: Apollo events cross midnight UT, so US-local dates can
read one day earlier than the UT dates in NSSDCA. Three: Earth-side coordinates
(Grumman Bethpage, JPL, NASA Ames, Cornell) and Opportunity's final resting spot
are approximate and are flagged as approximate in the data.
