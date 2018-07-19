# mapline

Create a collection of accurate maps in print quality along your gpx track, in
your scale, your format and the infos you need.

[Demo page](https://sgelb.github.io/demo/mapline/)


### Features
- Accurate scale throughout the whole route
- Printable quality of 300dpi
- Customizable paper format up to A2, page margins and distance markers

Inspired by the [bikeline Cycling
guides](http://www.esterbauer.com/international.html) and
[Openstreetmap](https://www.openstreetmap.org/about), this application uses
[Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/) to create the maps I
need. Vector tiles enable rendering in 300dpi, high enough for printing. There
are different styles available. Paper format, page margins and distance markers
are customizable. You want a map in 1:85.000 on A5 paper along that winding
river? No problem.


### Development

Logic and PDF generation of `mapline` are performed client-side. Main external
libraries are [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/) for map
creation and [jsPDF](https://github.com/MrRio/jsPDF) for PDF generation.

Before you can use `mapline`, you have to get your own [Mapbox access
token](https://www.mapbox.com/help/create-api-access-token/). Save it in
`src/mapboxtoken.js`:

    export default '<your access token here>';

- `yarn install` should install all dependencies
- `yarn serve` to start a dev server
- `yarn build` to bundle for production in `/dist`


### Limitations

An application written in Javascript, using WebGL and running entirely in the
browser has of course some limitations.

- [canvas size](https://webglstats.com/webgl/parameter/MAX_RENDERBUFFER_SIZE)
  and hence the maximum page format depend on your graphics card
- Javascript engines have a hardcoded maximum string size. This limits the size
  of the output PDF to
  [~268.44MB](https://github.com/atom/atom/issues/7210#issuecomment-160994222)

### Missing features and nice-to-haves

- a map style better suited for cycle tours and printing in black&white
- possibility to show points of views like drinking water or camping places
- a scale bar on the printouts
- elevation stats and marking of steep slopes
- support for additional/multiple gpx features like POIs

### Want to participate?

Although development is really slow, this is not a dead project. Pull-requests
are welcome, but please open a ticket before, so we can talk about it before.

