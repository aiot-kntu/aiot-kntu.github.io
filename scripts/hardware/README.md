# Hardware figure

`node scripts/hardware/build.mjs` generates the static artwork. `--audit` additionally verifies the actual solid geometry and its painter's order. Geometry and the audit kit run only during authoring/build, never in the browser.

The illustration is a simplified interpretation of the lab's equipment, not a component placement or wiring schematic.

References:
- https://iot-kntu.github.io/ (equipment and original photos)
- https://docs.nordicsemi.com/r/bundle/ug_nrf52840_dk/page/ug/dk/intro.html
- https://www.nordicsemi.com/-/media/Software-and-other-downloads/Product-Briefs/nRF52840-DK-product-brief.pdf
- https://nrfconnectdocs.nordicsemi.com/ncs/latest/nrf/app_dev/device_guides/thingy91/thingy91_features.html

The geometry helpers in `kit/` are copied from the local Anatomy skill (MIT licensed). They are kept here to make regeneration independent of a developer's skill installation.

Parts: a four-footed base and inset nameplate; four DK standoffs, PCB, four connector housings and their socket contacts, two USB shells and inserts, debug and radio ICs with pads, crystal, reset switch, four user buttons and caps, four LEDs, eight passives and a PCB antenna; four Thingy standoffs, PCB, shield and rim, radio IC, four sensor packages, USB shell, button and antenna; two dongle supports, PCB, USB plug, four contacts, radio IC, switch, three passives and PCB antenna. Surface markings include mounting holes, solder pads, chip orientation marks, connector sockets and closed copper traces.
