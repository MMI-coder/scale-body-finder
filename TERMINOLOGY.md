# Terminology

Write definitions on the **Definition:** lines below. Leave one blank and that
term is left out of the glossary. Whatever you fill in becomes the in-app
glossary, in this order.

*Currently:* lines are my note on what the term means in the code today — context
for you, not something to keep. Delete them or ignore them.

---

# Part 1 — Likely need a definition

These are the ones a user meets on a data card or a control and can't guess.

### Gender
*Currently:* the control at the top of the page. Picks which catalogue is searched — Female or Male. Nothing is mixed between them. Replaces the old Seamless/Jointed control, which is now just a note on the card.
**Definition:** Is it a Female body, or a Male body? Pick which one you want to look through.

### Build
*Currently:* male bodies only. The physique of the body — the "does it look the part" question, which is what male buyers ask first. Shown on the card and in the export. One of the eight values in Part 4. Does not filter or sort anything.
**Definition:** Male bodies only. This is a general description of the look of the body. Example, the TBL M35 is "Super Heavily Muscled" as it is, well, super heavily muscled.

### Body Type
*Currently:* the control at the very top of the page. Picks which catalogue is searched — Seamless or Jointed. Nothing is ever mixed between the two, and everything below it works the same either way.
**Definition:** Seamless or Jointed body type. 

### Bust Piece
*Currently:* jointed only. Modular bodies ship a frame plus several swappable chest pieces, so their bust is a choice rather than a fixed measurement. A card opens on the piece closest to your character; cycling to another changes only the Bust row — it never reorders results and never moves Actual Body Scale. Also a column in the jointed CSV export.
**Definition:** Interchangable bust piece for WorldBox jointed bodies. Comes in the following sizes: A, C, D, E, and G. Must be purchased seprately.

### Scale Reference Selector
*Currently:* the scale everything is compared at. Dropdown, 1:5 1/2 to 1:6 1/2 in 1/64 steps, 1:6 default. **This control has no name on screen yet — naming it here names it in the app.**
**Definition:** Defaults to 1:6th scale. The selector allows the user to quickly see their character's scaled measurements at various scales.

### Measurement Priority Field
*Currently:* which measurement the results are sorted on. Doesn't filter or exclude anything. **Also unnamed on screen — only described by a sentence.**
**Definition:** This allows the user to choose which measurement is the most important to them when finding a body that will be faithful to their character. Works in conjunction with the Actual Body Scale shown on the results cards.

### Actual Body Scale
*Currently:* the scale at which this body's priority measurement would match your character exactly. Reference only; it doesn't affect results.
**Definition:** The actual scale your character fits into. This is a direct comparison of the measurements from the Scale Reference Selector to the real world measurements of the body being viewed. It is intended to help creators know how they should size the clothing, accessories, props, and/or environments for their character that
may benefit from being made to the same perceived scale as the character itself.

### Scale Multiplier
*Currently:* the `×0.16630` under Closest Scale — the same scale as a decimal. **Unlabelled on screen.**
**Definition:** For easy use in scaling objects to use with your chosen body. To use, take your real world measurement and multiply by this number. Example: 89cm x 0.17191 = 15.31cm.

### Body Measurements
*Currently:* the body's own physical measurements.
**Definition:** The real world measurements of the physical body being viewed. These are derived from the manufacturer when no hand measurements are provided. All measurements, from the manufacturer or when done by hand, can vary slightly. 

### Character Measurements
*Currently:* your character divided by the Comparison Scale. Identical across every card.
**Definition:** Your character's measurements as determined by the Scale Reference Selector. This is unchanging across all results cards.

### Difference
*Currently:* Body Measurements minus Character Measurements. Positive means the body is larger.
**Definition:** This is designed to show the difference between the character's chosen scale and the body being viewed. 

### Height Range
*Currently:* the span a body can be posed between, for the head sculpt it was measured with.
**Definition:** Applies to only the seamless body type. All seamless body types have adjustable hips. This allows users to fine tune the body's height, and allows for increased range of articulation. This range seeks to account for both the shortest and tallest height achievable by a given seamless body. The seamless bodies with a single value have a yet to be determined range, so they run with the manufacturer's stated height with a head sculpt. 

Jointed body heights are static, and based on a standardized 3D printed head sculpt. 

### Head Sculpt
*Currently:* the head fitted to the body. Three sizes — 37.5mm, 38mm, 38.5mm — each changing total height 1:1.
**Definition:** Listed as the "37.5mm/38.0mm/38.5mm" heads on the result cards, these are the sizes, measured from bottom of the chin to the top of the scalp, of the head sculpts used in hand measuring. This works in conjunction with Height Range as not all head sculpts are created equal, just as all bodies are not created equal.

### Seamless Body
*Currently:* one of two catalogues, not the whole app any more. Now named on screen by the Body Type control.
**Definition:** The type of body most commonly used in scale character creation. Characterized by no visible joints outside of wrists, ankles and necks. 

### Jointed Body
*Currently:* the second catalogue, added 2026-08-17. Hard plastic, visible joints, holds a pose. Currently WorldBox only, but built expecting other makers.
**Definition:** Body type with visible joints throughout the body. Elbows, knees, shoulders and more are visible and can only be hidden with clothing.

### Model Line
*Currently:* a group of product codes that are the same sculpt in different skin tones. Appears in card Notes as "Model line includes: …".
**Definition:** Applies to TBLeague more than nearly any other manufacturer, this is to indicate the same body size/shape, but in different skin tones. 

### Neck Peg
*Currently:* the post the head mounts on. Height to the top of it, excluding any head. Behind Height Range but not shown.
**Definition:** The peg that the head sculpt sits on. Helps inform the Height Range calculation in the background.

### Feet Type
*Currently:* `Attached` or `Removable`.
**Definition:** Attached feet are permanently attached and truly seamless, while Removable feet can be swapped between flat feet, heeled feet, or footwear with peg holes.

### Material
*Currently:* TPE, Silicone, or Plastic.
**Definition:** The type of material the body is made of. TPE is the old standard of seamless bodies while Platinum Silicone is the new standard. Jointed bodies utilize hard plastics.

---

# Part 2 — Probably self-explanatory

Define only if you want them in the glossary. Blank is fine.

### Height
*Currently:* on input, your character's real-world height. On a card, the point in the body's Height Range nearest your character's scaled height.
**Definition:** What the real world height is, either for the body or for the character when scaled.

### Bust
**Definition:** Measurement of the chest of the character/body. Measured parallel to the ground and circling the chest at the widest point.

### Waist
**Definition:** Measurement of waist of the character/body. Measured parallel to the ground, crossing the belly button or visually narrowest point.

### Hips
**Definition:** Measurement of the hips of the character/body. Measured parallel to the ground, crossing at the widest point, not lower than the bottom of the crotch.

### Underbust
**Definition:** Measurement of the underbust of the body. Same type of measurement as the bust, but done directly under the breasts, parallel to the ground. Provided for use in making custom clothes and armor.

### Shoulder Width
**Definition:** Measurement of the shoulders of the body. Measured from the widest point straight across, no lower than where the arm pit starts. Provided for use in making custom clothes and armor.

### Arm Length
**Definition:** Measurement of the arm length of the body. Measured by going on a straight line from the middle shoulder to the wrist. Provided for use in making custom clothes and armor.

### Leg Inseam
*Currently:* ankle to crotch.
**Definition:** Measurement of the leg inseam of the body. Measured from the crotch down to the start of the ankle. Provided for use in making custom clothes and armor.

### Manufacturer
*Currently:* TBLeague, VeryCool, Novan Studio.
**Definition:** Body manufacturer. Looking to eventually add more to the possible results.

### Product Name
*Currently:* e.g. S07C, VCD-03, SR-AD01.
**Definition:** The name of the body. Note it, google it, buy it if it works for your character.

### Units
*Currently:* cm / mm. Display only — everything is stored in millimetres.
**Definition:** This hobby does everything in centimeters and millimeters, so we do too. Millimeters is best for really fine tuning things.

### Sort by
*Currently:* Least difference / Greatest difference, on the Priority measurement.
**Definition:** Based on the Measurement Priority Field, this lets you sort by the closest results to your choice, or the greatest difference. Most useful when prioritizing height.

### Show
*Currently:* 3 / 5 / All.
**Definition:** How many results are returned.

---

# Part 3 — Currently hidden, decide before defining

These live in the data and the CSV export but were pulled off the cards. If you
define them, people will look for them on screen and not find them — so either
define *and* put them back, or leave all three blank.

### Hand Measured
*Currently:* whether figures came from your own calipers or the manufacturer. 13 of 23 bodies.
**Definition:**

### Manufacturer Figure
*Currently:* a published measurement rather than a measured one. Height only, 6 bodies.
**Definition:**

### Estimated
*Currently:* a height borrowed from a reference body, where the manufacturer publishes only a neck peg. 4 VeryCool bodies, borrowed from the S07C.
**Definition:**

---

# Part 4 — Male body builds

The eight values `Build` can take. These are judgment calls you will be re-making
months apart, so what each one needs is a line that lets you sort a body you have
never seen before into exactly one of them.

The neighbours are the hard part — several of these sit next to each other and
the definition has to say where one stops. Prompts below are only prompts; ignore
them if you would rather write it your own way.

### Super Tall/Athletic
*Needs to say:* whether this is about height, build, or both — it is the only one of the eight naming height, so does a short athletic body land here or in Athletic?
**Definition:** Bodies that would come in scaled over 6ft tall and have a leaner, but still muscular, build fit this category.

### Super Heavily Muscled
*Needs to say:* what separates it from Heavily Muscled. Bodybuilder versus strongman, a size threshold, a named example body?
**Definition:** Bodies that come in scaled at 6ft or taller and look like they could fit in with the Hulk or Arnold Schwarzenegger in his prime.

### Heavily Muscled
*Needs to say:* the floor — what makes a body heavily muscled rather than Athletic.
**Definition:** Bodies that come in looking like they body build. Can cover a range of heights.

### Average Muscle Build
*Needs to say:* what separates it from Average Build below, and from Athletic. These three are the crowded middle.
**Definition:** Bodies that are toned, and muscular, but not to the point of body builders or super heroes. 

### Average Build
*Needs to say:* the baseline. Is this "no notable musculature", or is it the dad-bod you mentioned?
**Definition:** Bodies that are fit, but not super toned. May or may not have muscle definition, or if they do, it is not sculpted like a greek god. 

### Athletic
*Needs to say:* how it differs from Average Muscle Build on one side and Heavily Muscled on the other.
**Definition:** Bodies that are muscular, lanky, and more akin to a pro athlete in look.

### Asian Athletic
*Needs to say:* what it actually denotes. The hobby knows this term; someone reading the glossary cold will not. Worth being explicit about whether it describes a build, a market, or a manufacturer's line.
**Definition:** Bodies that fit the stereotypical tall, fit, muscular Asian male. Very idealized.

### Heavy
*Needs to say:* whether this means heavyset, tall and broad, or overweight — and how it sits against Average Build.
**Definition:** Bodies that fit the heavier set builds. Can range in height, but have a bit of size in either the gut or overall. Google Eddie Hall for the extreme of this.

---

# Part 5 — Anything I missed

Add terms here and I'll wire them in.

### 
**Definition:**
