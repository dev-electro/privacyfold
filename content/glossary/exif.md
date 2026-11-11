---
term: "EXIF"
definition: "Exchangeable Image File Format (EXIF) is a standard specification for storing metadata tags—including GPS coordinates, camera serial numbers, capture timestamps, and exposure settings—inside digital photograph files."
aliases:
  - "EXIF metadata"
  - "Exchangeable Image File Format"
  - "Photo metadata"
related_tools:
  - "exif-strip"
  - "passport-photo"
reviewed: "2026-11-10"
---

## What is EXIF?

Exchangeable Image File Format (EXIF) was established by the Japan Electronics and Information Technology Industries Association (JEITA) to embed capture information into digital images.

When you capture a photograph with an iPhone, Android smartphone, or digital camera, the device automatically records:
- **Geographic Location:** Exact GPS latitude, longitude, and altitude coordinates pointing to where the photo was taken.
- **Hardware Identifiers:** Camera make, lens serial numbers, sensor configuration, and device model.
- **Timestamp:** Precise date and time of capture down to the millisecond.
- **Technical Settings:** Aperture, focal length, shutter speed, ISO rating, and flash mode.

### Privacy Implications

Sharing raw photos on forums, messaging platforms, or public websites leaks your physical location and daily habits. PrivacyFold strips EXIF APP1 segments directly in browser RAM so no location traces remain.
