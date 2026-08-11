# Terminology

Write definitions on the **Definition:** lines below. Leave one blank and that
term is left out of the glossary. Whatever you fill in becomes the in-app
glossary, in this order.

*Currently:* lines are my note on what the term means in the code today — context
for you, not something to keep. Delete them or ignore them.

---

# Part 1 — Likely need a definition

These are the ones a user meets on a data card or a control and can't guess.

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
**Definition:** The real world measurements of the physical seamless body being viewed. These are derived from the manufacturer when no hand measurements are provided. All measurements, from the manufacturer or when done by hand, can vary slightly. 

### Character Measurements
*Currently:* your character divided by the Comparison Scale. Identical across every card.
**Definition:** Your character's measurements as determined by the Scale Reference Selector. This is unchanging across all results cards.

### Difference
*Currently:* Body Measurements minus Character Measurements. Positive means the body is larger.
**Definition:** This is designed to show the difference between the character's chosen scale and the body being viewed. 

### Height Range
*Currently:* the span a body can be posed between, for the head sculpt it was measured with.
**Definition:** A range of estimated heights for the viewed body. As every seamless body has adjustable hips to help users fine tune the body's height, and to allow for increased range of articulation, this range seeks to account for both the shortest and tallest height achievable by a given body. The bodies with a single value have a yet to be determined range, so they run with the manufacturer's stated height with a head sculpt. 

### Head Sculpt
*Currently:* the head fitted to the body. Three sizes — 37.5mm, 38mm, 38.5mm — each changing total height 1:1.
**Definition:** Listed as the "37.5mm/38.0mm/38.5mm" heads on the result cards, these are the sizes, measured from bottom of the chin to the top of the scalp, of the head sculpts used in hand measuring. This works in conjunction with Height Range as not all head sculpts are created equal, just as all bodies are not created equal.

### Seamless Body
*Currently:* the product category the whole app covers. Never actually defined anywhere on the page.
**Definition:** The type of body most commonly used in scale character creation. 

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
*Currently:* TPE or Silicone.
**Definition:** The type of material the body is made of. TPE is the old standard while Platinum Silicone is the new standard.

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

# Part 4 — Anything I missed

Add terms here and I'll wire them in.

### 
**Definition:**
