# Terminology

Every term the app puts in front of a user, grouped by where it appears, with a
one-line note on what it currently means in the code. Definitions are yours to
write — this is the inventory, not the glossary.

Terms marked **(in glossary)** already have a draft definition on the page.

---

## 1. Input controls

| Term | What it currently is |
|---|---|
| **Character** | Free text name. Only used to title the reference panel and name the CSV file. |
| **Units** | `cm` / `mm`. Display only — everything is stored in millimetres. Switching converts what's in the boxes so the measurement doesn't change size. |
| **Height** | Character's real-world height. Required. |
| **Bust** | Character's real-world bust. Required. |
| **Waist** | Character's real-world waist. Required. |
| **Hips** | Character's real-world hips. Required. |
| **Priority** | Which of Height / Bust / Waist / Hips the results are sorted on. Does not filter or exclude anything. |
| **Sort by** | `Least difference` / `Greatest difference` — direction of the sort on the priority measurement. |
| **Show** | `3` / `5` / `All` — how many results are listed. |
| **Comparison scale** | The scale everything is compared at. Dropdown, 1:5 1/2 to 1:6 1/2 in 1/64 steps, 1:6 default. Has no label of its own yet — worth naming. |

## 2. Reference panel

| Term | What it currently is |
|---|---|
| **"*Name* in 1:6th Scale"** | Heading. Follows the comparison scale, so it reads "in 1:5 3/4 Scale" if you change it. |
| **Height / Bust / Waist / Hips** | The character's measurements divided by the comparison scale. |

## 3. Results header

| Term | What it currently is |
|---|---|
| **Results** | Section heading. |
| **"N results based on the data you provided…"** | States the comparison scale, the sort direction and the priority. |

## 4. Data card

| Term | What it currently is |
|---|---|
| **Product name** | e.g. `S07C`, `VCD-03`, `SR-AD01`. |
| **Manufacturer** | TBLeague, VeryCool, Novan Studio. |
| **Material** | TPE or Silicone. |
| **Closest Scale** **(in glossary)** | The scale at which this body's *priority* measurement would match the character exactly. Reference only. |
| **Multiplier** | The `×0.16630` under Closest Scale. Same number expressed as a decimal. Currently unlabelled. |
| **Body Measurements** **(in glossary)** | The body's own measurements. |
| **Character Measurements** **(in glossary)** | The character at the comparison scale. Identical across every card. |
| **Difference** **(in glossary)** | Body minus Character. Positive means the body is larger. |
| **Height** | For a body with a posable span, the point in that span nearest the character's scaled height. Otherwise the single known figure. |
| **"This body can potentially match your character's scaled height."** | Shown when the character's scaled height falls inside the body's Height Range. |
| **Height Range** **(in glossary)** | The span the body can be posed between, for the head sculpt it was measured with. |
| **37.5mm / 38mm / 38.5mm head** | The three head sculpts. Each row is the same body's height with that sculpt fitted. |
| **Underbust** | Body measurement. |
| **Shoulder Width** | Body measurement. |
| **Arm Length** | Body measurement. |
| **Leg Inseam** | Body measurement. Ankle to crotch. |
| **Feet** | `Attached` or `Removable`. |
| **Notes** | Free text, e.g. "Model line includes: S07C, S07D, S09C and S09D". |
| **⤢** | Pops the product image out full size. |

## 5. Words used in the info bubbles

These appear in the two (i) bubbles and may want defining even though they
aren't labels:

- **head sculpt** — the head fitted to the body; changes total height
- **shoeless** — height measured without footwear
- **standardized head sculpt** — one of the three sizes above
- **perceived scale** — the scale something reads as, rather than a true ratio

## 6. Underlying vocabulary

In the data or the wider hobby, not currently shown on a card. Listed because
the glossary may want them and because they may surface later.

| Term | Note |
|---|---|
| **Seamless body** | The product category the whole app covers. |
| **1:1 / real world measurements** | The character's actual-size measurements, as entered. |
| **Scale** | Written `1:6`, `1:5 13/16`. Generated in 1/64 steps. |
| **Neck peg** | The post the head mounts on. Height to the top of it, excluding any head. |
| **Neck peg height, min / max** | The span from the hip joint's travel. |
| **Height with head** | Neck peg height plus the head sculpt, which is what "Height" on a card is built from. |
| **Model line** | A group of product codes that are the same sculpt in different skin tones. |
| **Product code** | The manufacturer's identifier. Currently the same as Product name. |
| **Hand measured** | Whether the figures came from the owner's own calipers or the manufacturer. **Removed from the UI for now** — flagged because the glossary may still want it. |
| **Manufacturer figure** | A published measurement rather than a measured one. Also currently hidden. |
| **Estimated** | A height borrowed from a reference body. Also currently hidden. |

---

## Gaps worth deciding on

1. **The comparison scale control has no name.** It's described by a sentence but never called anything. "Comparison Scale" would let the glossary refer to it.
2. **The multiplier under Closest Scale is unlabelled** — a bare `×0.16630`.
3. **Three data concepts are hidden but not gone**: hand measured, manufacturer figure, estimated. Still in the data and the CSV export. If the glossary defines them, users will look for them on the cards.
4. **"Priority"** is the internal name and appears in the results sentence ("sorted by least difference in bust"), but the control itself is only described by a sentence. Same issue as the comparison scale.
