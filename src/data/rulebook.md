# OpenZoo Rulebook version 0.1

## How to Use This Rulebook

Welcome to OpenZoo! This rulebook explains how to play the OpenZoo TCG and covers advanced topics you'll want to learn to become a Master Caster. 

**If you're a new player:** Start by learning the [Basic OpenZoo Language](#basic-openzoo-language). Then, continue reading from [Page Layout](#page-layout) through [Playing OpenZoo](#playing-openzoo).

**If you're a veteran Caster:** Jump to [Advanced Rules](#advanced-rules) for the full details.

---

## Basic OpenZoo Language

| Term | Definition |
|------|-----------|
| **Caster** | Player |
| **Page** | Card |
| **Spellbook** | Deck of Pages |
| **Chapter** | The Pages in your hand |
| **Bookmark** | Drawing a Page from the top of your Spellbook |
| **Battleground** | The entirety of the playing area |
| **Arena** | The area into which Pages are played and used |
| **Contract** | Playing a Page into the Arena |
| **Aura** | The resource used to pay the cost of Pages |
| **Fatigue** | Turn a Page sideways 90° to the left or right |

A Fatigued Page is turned sideways. An **Awakened** Page is upright and ready to use.

---

## Page Layout

| Component | Description |
|-----------|-------------|
| **Page Type & Tribe** | The Page's type, sometimes followed by a Tribe (Beasties/Artifacts only) |
| **Set Icon & Rarity** | Which set the Page belongs to; Bronze = Common, Silver = Uncommon, Gold = Rare |
| **Page Name** | The name of the Page |
| **Spellbook Limit** | The maximum copies of this Page allowed in your Spellbook and Archive combined. A Page that shares the name with another Page may be included in the same Spellbook if the two Pages are mechanically unique from each other. |
| **Aura Cost & Aura Type** | The resource cost to Contract the Page |
| **Life Points (LP)** | How much Damage the Page can take before being Destroyed |
| **Traits** | Abilities that modify how the Page functions |
| **Terra Bonuses** | Stat boosts granted when specific Terra conditions are active |
| **Metadata** | Real-world information about the cryptid (Beasties only): DOB/Origin, GPS, Weight, Height/Length |
| **Effect Text Box** | All game Effects: 4th Wall, Static, Powers, Attacks, and Status Effects |
| **Attack Name & Base Damage** | The Attack's name and how much Damage it deals |
| **Status Effect** | Conditions inflicted on the target |
| **Aura Attack Advantage** | Bonus Attack Damage (+20) dealt to that Aura Type |
| **Type Advantage** | The Aura Types that this Page deals bonus Damage (+20) |
| **Copyright & Artist** | Attribution for the card |

---

## Page Types

### Aura

All Aura Pages can be Fatigued to generate Aura of that specific type, or through a written Effect on the Page, unless that Page is a Special Aura Type. That Aura is then used to Contract Pages. You can play any number of Basic Aura Pages in your Spellbook, but Special Aura Pages have their own Spellbook Limit. Aura Pages that are Destroyed are placed into their owner's Afterlife.

- **Basic Aura Page:** May be Fatigued to generate 1 Aura of its Aura Type.
- **Special Aura Page:** Attributes are established through its written Effects.

### Beastie

Every time you spend Aura to Contract a Beastie, you Contract a companion into the Arena that does your bidding. Destroyed Beasties go into the owner's Limbo (unless otherwise stated).

### Spell

Contracting a Spell results in the Spell being placed into the Cemetery immediately after it is resolved (unless otherwise stated).

### Potion

Costing 0 Aura to Contract, these single-use Pages have a similar function to Spells. Potions are placed into the Cemetery immediately after they are resolved.

### Artifact

Artifacts have LP and can be Attacked. Some have Traits, Abilities, and/or Powers. Artifacts are placed into the Limbo immediately after they are Destroyed.

### Terra

Terra allows you to define 4th Wall features in the Arena when they lack in your surroundings.

---

## Tokens

Tokens represent a Page in the Arena. They may be represented by items such as a standard-size playing card or other Pages given a proxy role. Tokens are considered Pages for targeting purposes, but they cannot be added to a Spellbook or Archive.

**Token rules:**

- If a Token does not have a name specified by the Effect that creates it, it has no name.
- Tokens are created outside the Arena and enter under the control of the Caster whose Effect generated them (unless otherwise specified or replaced).
- Any Static Effects on a Token are applied before it enters the Arena.
- Tokens are immediately removed from the game when they enter a zone other than the Arena, or when they are placed under another Page in the Arena.
- If a Token is removed from the game, any DESTROYED Effects are considered to activate unless it was removed from the Arena due to Destruction.
- Tokens do not have an Aura Cost.

### Creating a Token Copy of Beasties or Artifacts

Copy the same printed information as the targeted Beastie or Artifact. Any Damage, Status/Losses, inflicted Status Effect Indicators, Set Symbols, Aura Cost, or Pages equipped to it are **not** copied.

### Creating a Copy of Spells or Potions

Copy the same printed information on the targeted Spell or Potion and resolve those Effects as if you were Contracting a normal Spell or Potion Page. These copies are **not** considered token Pages but are considered Pages for targeting purposes.

### 4th Wall Tokens

Some Tokens may be represented by a claimed 4th Wall item. These tokens must be distinguishable from all other tokens in the Arena, must be a standalone Page, and cannot represent multiple tokens with a die placed on top.

---

## Aura Types

| Aura Type | Description | Strong Against (+20 Damage) |
|-----------|-------------|:---------------------------:|
| **Water** | Fluid Beasties who are masters of Bookmarking Pages | Flame, Earth |
| **Flame** | High risk, high reward; known for burning Casters | Forest, Frost |
| **Forest** | Wild Beasties who grow stronger when swarming the Arena | Water |
| **Frost** | A controlling type that freezes all enemies in its path | Water |
| **Lightning** | Quick Beasties that emphasize speed and quickstrike | Water |
| **Earth** | Rock-solid Beasties with tenacity and earth-shaking Spells | Lightning |
| **Cosmic** | Alien Beasties that focus on combos and creative interactions | Spirit |
| **Dark** | Bloodthirsty and demonic Beasties that grow stronger at night | Spirit, Light |
| **Light** | The purest Aura Type; specializes in countering Dark and Spirit | Dark |
| **Spirit** | Forsaken Spirits who exploit enemies with disruptive Spells | Dark |
| **Neutral** | A mixed type that infuses elements from all other Aura. Any Aura can pay a Neutral cost, making it the most versatile type. | N/A |
| **Special** | Takes on characteristics of multiple Aura by conditions. Has no Type Advantage and cannot produce Special Aura by any Aura Effect. | N/A |

<!-- Aura Wheel: Frost/Forest/Lightning → Water, Flame → Forest/Frost, Water → Flame/Earth, Earth → Lightning, Cosmic → Spirit, Dark → Spirit/Light, Light/Spirit → Dark -->

---

## Determining a Page's Aura Type(s)

The **Base Aura Type(s)** of a Page is what Aura Type(s) it belongs to without other Effects or Modifiers.

- A Page with only a Neutral Aura Cost (of 0 or more) has a Base Aura Type of Neutral.
- A Page with both a Neutral and a non-Neutral Aura Cost (e.g., Flame) has a Base Aura Type of the non-Neutral cost. It is **not** considered a Dual Aura Page.
- A Page with more than 1 non-Neutral Aura Cost belongs to all those Aura Types (e.g., 1 Spirit + 1 Dark = Spirit and Dark Beastie). These are **Dual Aura Pages** with 2 Base Aura Types.

**Additional rules:**

- Aura Costs cannot be changed unless the Effect directly references the Aura Cost of the Page itself.
- Changing the Base Aura Type does not change the overall Aura Cost.
- Adding an Aura Cost does not change the Base Aura Type.
- Dual Aura Pages still fulfill Effects that check for a single Aura Type (e.g., "Flood The Earth" would **not** Destroy a Water/Dark Beastie).

---

## Type Advantage

Some Aura Types have strengths against other Aura Types. Any time a Page deals Damage to another Page of an Aura Type it is strong against, it deals +20 Damage.

Type Advantage includes any Damage done by a Page's Effects and Attacks. Calculation of Type Advantage from Attacks during Combat functions separately from Type Advantage from Spell Damage or other Page Effect Damage. Calculating Type Advantage in Combat is based on the Primary Defender and Attacker within that Combat.

### Multi Aura Type Advantage

Multi Aura Type Pages deal +20 Damage for **each** Aura Type they are strong against from their current Aura Types. For example, a Dark Page deals +40 Damage via Type Advantage against a Light and Spirit Page. Conversely, a Light and Spirit Page deals +40 Damage via Type Advantage against a Dark Page.

---

## Terra Bonuses

Terra Bonuses give you boosts when you are within or nearby a certain place or object in real life. Unless otherwise specified by a Page, "nearby" means within 5 miles or within eyesight.

When an Effect causes a Page to gain a Terra Bonus, it appears as a Terra Symbol followed by any Damage bonus, then followed by the LP bonus. Example: `[Nighttime] +20 ATK/+20 LP`

### Special Terra

Special Terra Pages contain Effects that influence the game for all Casters. They act as Basic Terra Pages, providing the Terra Bonuses listed on the top right of the Page. The Effect text box explains any additional Effects they provide. These Effects can stack if there are multiple Special Terra Pages in the Arena, unless stated otherwise.

---

## Terra Pages and Rotation

Terra Pages activate Terra Bonuses and 4th Wall Effects when you cannot satisfy a Page's requirements with your physical surroundings. For example, if you're playing in a desert but need a River Terra Bonus, you may Contract a River Terra Page to gain it.

### Rotation Rules

- There are **6 Terra slots** in the Arena. All Terra are Contracted and placed into slot 1.
- When a 7th Terra is Contracted, it goes into slot 1 and all existing Terra shift down one slot. Any Terra that would shift past slot 6 is placed into the Afterlife.
- When a Terra between other Terra is Destroyed or removed, all Terra before it slide down to fill the gap. If the first or farthest Terra is Destroyed, no sliding occurs.
- There is no maximum number of Terra you can Contract. You can Contract multiple copies of the same Terra. Terra Bonuses do not stack, but Special Terra Effects do (unless stated otherwise).

### General Terra Rules

- Terra that has been Contracted activates Terra Bonuses for **all** Casters in the game.
- Terra cannot be controlled by any Caster.
- When a Terra Page is Destroyed, it leaves its slot and is placed into the Afterlife.
- Most Terra Pages are considered "Basic" and solely provide the Terra Bonus listed on their name and symbol.
- Non-Terra Pages cannot occupy or share a Terra slot unless a Page Effect says otherwise.

---

## 4th Wall Effects

Some Page text may reference items that wouldn't normally exist in the game, like "dirt" or "a source of fire." Text that interacts with anything outside the game is considered a 4th Wall Effect.

**Examples:**

- A Forest Terra Page OR being within 5 miles of a Forest would activate both the Terra Bonus and the 4th Wall Effect of a Page that references forests.
- Certain physical objects and even the Effects of Pages can activate 4th Wall Effects.
- An Effect stating "A real volcano is considered to be within eyesight" can trigger another Page's Effect for being "Near a Volcano."
- Page names do **not** trigger 4th Wall Effects unless an Effect states otherwise.
- "This Beastie cannot be Contracted if you are wearing pants" is a 4th Wall Effect because it relies on something "outside" of the game.

---

## The Battleground

The Battleground is the entire space in which a game occurs. Pages must remain where they are played. You may not move any Pages in the Arena unless a rule or Page Effect specifically allows it.

### Zones

| Zone | Description |
|------|-------------|
| **Spellbook** | Your collection of Pages built before a game begins. All Pages must remain face down. You may not look at your Spellbook unless directed by a Page Effect. |
| **Chapter** | The Pages you have Bookmarked from your Spellbook. Don't show this to your opponent unless directed by a Page. |
| **Arena** | The shared area between Casters where Pages are played. All Pages enter the Arena **Fatigued**, except Aura and Terra which enter **Awakened**. |
| **Terra Slots** | The part of the Arena where Terra Pages are placed. Shared between all Casters; limited to 6 total. |
| **Limbo** | Where Beasties and Artifacts go when Destroyed. Placed in owner's Limbo. |
| **Cemetery** | Where Spells and Potions go after resolving. Placed in owner's Cemetery. Occasionally, Effects may place other Pages here. |
| **Afterlife** | Where Aura and Terra go when Destroyed. Pages can also be placed here under special conditions. |

---

## Playing OpenZoo

### Win Condition

Reduce the Life Points of all opposing Casters from 1000 to 0 before they reduce yours. Some Pages have Effects with additional win or loss conditions, but these can be challenging to pull off.

### Set-Up

1. All Casters set their Life Points to 1000. Track with calculators, pen and paper, etc.
2. Determine who goes first: the opponent predicts the outcome of a coin flip or die roll. If they predict correctly, they choose who goes first. If incorrect, the choice falls to you.
3. Each Caster shuffles their Spellbook and Bookmarks 7 Pages.
4. Mulligan (optional) as outlined below.
5. The Caster taking the first turn starts the game.

### Mulligan

Each Caster can Mulligan as many times as they like, but at a cost.

1. Place all Pages in your Chapter into your Spellbook.
2. Shuffle your Spellbook.
3. Bookmark **N−1** Pages, where N is the number you Bookmarked previously.

---

## Turn Steps

### 1. Start of Turn

Resolve in this order:

1. Any "start of turn" Effects trigger.
2. The active Caster gains priority 2 to use "any time" Effects, then the opposing Caster gets priority 2.
3. Bookmark a Page from the top of your Spellbook.
4. Awaken any Fatigued Pages under your control (unless otherwise stated).
5. Any Aura not generated from start-of-turn Effects dissolves.

### 2. Active Caster Actions

The active Caster has priority 1 and may take Actions in any order:

| Action | Frequency | Details |
|--------|-----------|---------|
| **Contract an Aura Page** | Once per turn | Place from Chapter into Arena Awakened. Cannot Contract additional Aura unless an Effect specifically mentions it. |
| **Contract a Terra Page** | Unlimited | Place from Chapter into an available Terra slot. |
| **Contract a Beastie, Artifact, Spell, or Potion** | Unlimited | Pay the Aura Cost, then Contract. Beasties/Artifacts enter the Arena. Spells/Potions go to the Cemetery after resolving. |
| **Place a Trap face-down** | Unlimited | Place a Page with the Trap Trait face-down in the Arena. |
| **Move a face-down Trap** | Once per Trap per turn | Move a face-down Trap to under a Beastie or Artifact you control (that doesn't already have one). |
| **Activate a Power** | Unlimited | Fatigue an Awakened Beastie or Artifact to activate a Power on that Page. |
| **Declare an Attack** | Unlimited | Fatigue a Beastie and declare an Attack. See [Combat](#combat). |
| **End your turn** | Once | Declare you are ending your turn. |

### 3. End of Turn

1. The active Caster gains priority 2, then the opposing Caster.
2. Any "end of turn" Effects trigger.
3. Any unused Aura dissolves.
4. The opposing Caster begins their Start of Turn.

---

## Advanced Rules

### Generating Aura

Aura Pages are the most important Pages in OpenZoo. They generate one Aura of their Aura Type. To generate Aura, Fatigue an Awakened Aura Page by rotating it 90°.

**Key distinctions:**

- **Aura** is the resource (currency) used to Contract Pages. It dissolves at the end of each turn.
- **Aura Pages** are the Pages that remain in the Arena and generate Aura.
- Aura Pages may be Fatigued on **any** Caster's turn to generate Aura.
- Generating Aura is **not** considered an Action and does not pass priority.
- Aura Pages Fatigued by an Effect do **not** generate Aura.

### How to Contract a Page

1. **Select a Page:** From your Chapter, choose a Page and reveal it to opposing Casters.
2. **Select targets (if applicable):** Spells and Potions that target another Page must select valid target(s). They cannot target themselves. They may only be Contracted if a valid target is present.
3. **Pay the Aura Cost:** Fatigue Aura Pages (or other sources) to generate the required Aura.
4. **The Page resolves:**
   - If a Beastie or Artifact: resolve any CONTRACT Effects → enter the Arena Fatigued → resolve any ENTER Effects.
   - If a Spell or Potion: resolve Effects → place into owner's Cemetery.
   - CONTRACT and ENTER Effects that trigger simultaneously have their resolution order chosen by the active Caster.

### Actions vs. Game Mechanics

**Actions** are choices made by a Caster: Contracting a Page, using an Effect or Power, declaring an Attack, or moving a Trap Page. After an Action with priority 1, priority 2 is given to the opposing Caster.

**Game Mechanics** occur automatically without active decision-making: Bookmarking, Awakening Pages, resolving Attack Effects/Damage, resolving a Contract, Fatiguing. Game Mechanics are **not** Actions and do **not** pass priority.

**Important:** Fatiguing a Page to generate Aura is **not** an Action. "Any time" Effects cannot be used when an individual Aura Page is Fatigued to generate Aura. Pages that **only** generate Aura (and do nothing else) are known as Aura Effects and do not pass priority.

Note: Convert **cannot** be used on an opposing Caster's turn because it does not have the "any time" clause.

### Ownership vs. Control of a Page

The **owner** is the Caster who brought the Page to the game. The **controller** is the Caster who currently has control. Some Effects can switch control, but never ownership.

- When a Page is placed into a specific zone, it always goes into its **owner's** respective zone.
- "You" or "yours" on a Page refers to the **controller**. If no one controls the Page, it refers to the owner.

**Gaining/Losing Control:**

- You gain control when you Contract a Page from your Chapter.
- If an Effect grants control of another Page, you keep it until the Effect ends or the Page leaves the Arena.
- When a Page enters any zone other than the Arena, all control ceases.

**Determining Control:**

- If a Page enters the Arena without a specified controller, the owner is the controller.
- If a Page Effect creates a Token without specifying control, the controller is the Controller of the Page/Effect that made the Token (unless replaced).

Equipment and Terra follow separate control rules. See their respective sections.

### Priority 1 and 2

**Priority 1** is a Caster's ability to take Actions during their turn as the active Caster.
**Priority 2** is any Caster's ability to use "any time" Actions with a Page or Effect.

**Rules:**

- While you have priority 1, you may take any Action (including "any time" Actions).
- While you have priority 2, you may **only** use "any time" Pages or Effects.
- After the active Caster takes an Action with priority 1, priority 2 passes to the opposing Caster.
- At the start and end of each turn (before Bookmarking and before end-of-turn Effects), the active Caster gains priority 2, followed by the opposing Caster.
- During Game Mechanic Steps (Combat, Trigger Effects, Start/End of Turn steps, etc.), no Caster has priority unless specified.
- After resolving a Resolution Chain or Game Mechanic Step, the active Caster regains priority 1 (unless still resolving game mechanics).
- Only one Caster can possess priority at a time.

---

## Keywords / Static Effects

Keywords appear on Pages to specify when Effects trigger and resolve.

| Keyword | When It Resolves |
|---------|-----------------|
| **CONTRACT** | After a Page is Contracted. |
| **FLIPPED** | After a Page is flipped face-up and Contracted. |
| **ARENA** | Persistent Effects that apply only while the Page is face-up in the Arena. |
| **DESTROYED** | When a Page is Destroyed. |
| **ENTER** | When a Page enters the Arena. (Contracting into the Arena counts as entering, unless the Page is a Spell or Potion.) |
| **REVEAL** | When a Page is shown to all Casters. Revealing a Page does not activate its Effects unless stated otherwise. |
| **DISCARD** | When a Page is placed from your Chapter into its Discard Zone as an Action. Effects with "at any time" may be activated at any time or within a specified window. DISCARD does **not** activate when a Page is Discarded by another Page's Effect. It only activates when Discarded as an Action. Activating DISCARD passes priority 2. |

### Static Effects

Static Effects are Page Effects considered "rules" of the Page. They are constantly applied/checked once a game has begun. They only become active while the Page is known information (e.g., while searching your Spellbook, while in Chapter, or while in a public zone). Some Static Effects only function while in the Arena.

Static Effects are not denoted by a keyword. They appear at the top of the Effect text box and are sometimes bolded or italicized.

### Spellbook Restrictions

A type of Static Effect applied outside the game while constructing your Spellbook and at all times during the game. These include clauses like "You may not include this Page in a Spellbook" or "[Page Name] may not be included in a Spellbook with [other Page]."

---

## Rolling a Die

When rolling a die to inflict a Status Effect, resolve a Page Effect, or determine who goes first, always use a **six-sided die (D6)**. A D6 may also substitute for a coin flip: even numbers = "heads", odd numbers = "tails."

For a roll to be valid, the die must be rolled at least 6 inches above the table and rotate in the air at least twice.

---

## Resolution Chains

Pages with "any time" Effects or Pages that can be played on your opponent's turn can lead to a chain of Pages played in response to one another. Resolution order is **first in, last out**. The last Page played resolves first.

**Example:**

1. Player 1 Contracts Fireball targeting Killer Clown → priority 2 passes
2. Player 2 Contracts Reflection targeting Fireball → priority 2 passes
3. Player 1 Contracts Dampen targeting Reflection → priority 2 passes
4. Player 2 uses Chupacabra's Effect targeting Killer Clown → priority 2 passes
5. Player 1 passes → Resolution Chain begins

**Resolution (last in, first out):**

1. Chupacabra's Effect recovers Killer Clown's LP to 40
2. Dampen stops Reflection from resolving
3. Fireball deals 25 Damage and inflicts Burn on Killer Clown
4. All Effects resolve: Killer Clown is dealt 25 Damage and is inflicted with Burn

---

## Simultaneous Effects

When Effects resolve simultaneously (e.g., the Regen Trait and the Poison Status Effect at end of turn), the active Caster chooses the resolution order. Then non-active Casters resolve clockwise.

When a Spell would inflict Damage and a Status Effect simultaneously, the active Caster may choose the order.

When multiple targets are inflicted with a Status Effect simultaneously, a single coin flip or die roll determines the result for all affected targets. For example, if multiple Beasties are simultaneously inflicted with Burn, a single die roll determines the number of Burn Indicators for all of them.

---

## Targeting / Non-Targeting Effects

**Targeting Effects** specify what Pages or Casters can receive the Effect. If a target is required, you must have a valid target selected to Contract or Activate the Effect. Effects generally specify what can be targeted. Effects that deal Damage or inflict Status Effects cannot target Terra or Aura Pages (neither has LP).

Targeting is assumed to only function within the Arena unless the Effect specifies another zone (Limbo, Cemetery, Afterlife, Spellbook, etc.).

**Non-Targeting Effects** (like "Destroy all Water Beasties") do not specifically target. Traits or Effects that prevent targeting do **not** apply to non-targeting Effects. Non-targeting Effects are also assumed to function within the Arena unless otherwise specified.

**"Target resolving" Effects** (e.g., "Target resolving Spell") may only target Pages or Effects on the Resolution Chain waiting to resolve. Effects without "resolving" may not target Pages on the Resolution Chain. Sources of Effects cannot choose themselves as a target.

---

## LP Loss, Gain, and Recovery

| Term | Meaning |
|------|---------|
| **LP Loss** | Acts like Damage (injuries received), but is **not** the same as receiving Damage. LP Loss does not activate Damage-triggered Effects and does not reduce maximum LP. |
| **LP Gain** | Increases a Beastie's maximum Life Points. The Beastie keeps any existing Damage or LP Loss. |
| **LP Recovery** | Reduces a Beastie or Artifact's Damage by the recovery amount. Cannot recover past maximum LP. Casters can recover any amount and can exceed the starting 1000 LP. |

---

## Shuffling After Searching Your Spellbook

If any Page Effect requires you to search your Spellbook for a specific Page, you must reveal that Page and reshuffle your Spellbook immediately afterwards, unless the Effect specifies otherwise.

---

## Combat

Combat begins when an Attack is declared by Fatiguing a Beastie. During Combat, no Caster has priority except when stated.

### Step 1: Declare an Attack

1. The Beastie's controlling Caster Fatigues the Page and declares an Attack.
2. Select which Attack on the Page to use.
3. Select a target.

**Valid Attack targets (opposing):**
- Caster
- Beastie
- Trap Page (not under another Page)
- Artifact
- Equipment (only if it specifies it can be Attacked)

Face-up Pages without LP cannot be targeted by an Attack (except face-down Trap Pages not under another Page).

**After declaring:** The Caster being targeted (or whose Page is targeted) gains priority 2 to use "any time" Effects.

**Trap interaction:** If the target has a face-down Trap Page under it (or is a Trap Page), flip the Trap face-up. Choose to Contract it or not:
- If Contracted: it enters the Resolution Chain, passes priority 2, and resolves during Combat. If it's a Beastie or Artifact, it enters as a Defender.
- If not Contracted: place it in the Afterlife; the Caster retains priority 2.

### Step 2: Declare Defenders

The opposing Caster controlling the target may declare Defenders by Fatiguing them. The original target cannot be declared as a Defender.

- Select one Attack on one of the Defenders to use. That Defender becomes the **Primary Defender**.
- Only non-Fatigued Beasties may be declared as Defenders. Artifacts and Casters cannot.
- If no Defenders are declared, the original target automatically becomes the Primary Defender (and an Attack on it must be chosen). This does not Fatigue the Primary Defender.

### Step 3: Check for First Strike

| Scenario | Who Attacks First |
|----------|-------------------|
| Neither has First Strike | Attacker |
| Only Attacker has First Strike | Attacker |
| Only Defender has First Strike | Defender |
| Both have First Strike | Coin flip (heads = Attacker, tails = Defender) |

### Step 4: Resolve Attacks

In First Strike order:

1. The first Beastie resolves their chosen Attack (see below).
2. If there are no Defending Pages/Primary Defender/Original Target left in the Arena → Combat ends.
3. If the declaring Beastie is no longer in the Arena → Combat ends.
4. The second Beastie resolves their chosen Attack.

**Resolving a chosen Attack (in order):**

1. Activate any Effects of the Attack and Status Effects (including Effect text and Status Effect icons).
2. Apply Type Advantage and Aura Attack Advantage modifiers.
3. Apply Terra Bonus modifiers.
4. Apply other Page Effect modifiers (not from the Attack Effect itself).
5. Round Damage up to the nearest multiple of 5.
6. Allocate modified Damage to Defender(s):
   - With multiple Defenders: allocate in multiples of 5. At least 5 to each Defender if possible.
   - If all Defenders have Damage ≥ their current LP, remaining Damage goes to the original target.
   - Any Page reduced to 0 LP is immediately Destroyed.
7. Deal the allocated Damage.
8. Any DESTROYED Effects resolve.

### Step 5: End Combat

---

## Tribal Boost

A red bar on a Beastie denoting "Tribal Boost." It is a static text field in the Effect text box. While a Beastie with Tribal Boost is in the Arena, it gains **+10 LP and +10 Attack Damage** for each other Beastie with the matching Tribe in the Arena.

- Counts Beasties controlled by **all** Casters, except the Beastie with Tribal Boost itself.
- Effects that remove Effect text also remove Tribal Boost (e.g., Paralyze).
- Multi-Tribe Tribal Boosts only count Beasties that have **all** listed Tribes. (Example: "Tribal Boost: Beastie Rabbit Wolf" only counts Beasties with both "Rabbit" and "Wolf" Tribes.)

---

## Collector Boost

A green bar denoting "Collector Boost." While the Beastie is in the Arena, it gains **+10 LP and +10 Attack Damage** for each Artifact with the matching Tribe in the Arena. Considers Artifacts controlled by **all** Casters except the Beastie with Collector Boost.

---

## Kinship

An orange bar denoting "Kinship." While the Beastie is in the Arena, it gains **+10 LP and +10 Attack Damage** for each other Beastie whose **name includes** the keyword in the Kinship bar. (Example: Kinship "Moth" counts any Beastie whose name contains "Moth".)

---

## Rounding Damage / LP Loss

When Damage or LP Loss is not divisible by 5, **always round up** to the nearest multiple of 5.

- Attack Damage is rounded during the Damage steps of Combat.
- Effect Damage or LP Loss is rounded before the Damage is dealt or LP is lost.

---

## Tribes

Some Pages have multiple Tribes. Tribes follow **alphabetical order** and are separated by spaces. Multi-word Tribes use a hyphen (e.g., "Fearsome-Critter") to denote they are one connected Tribe.

---

## Aura Attack Advantage

Some Beasties have an Aura Symbol next to their Attack(s). That Attack receives **+20 Damage** when the Primary Defender or Attacker is of the pictured Aura Type.

---

## Status Effects

Status Effects are dangerous conditions that may be inflicted upon Beasties, Artifacts, or Casters. A target may only have **1 Status Effect Indicator** of each type (except Poison, which allows up to 3).

A Page or Caster already inflicted with a Status Effect cannot be inflicted with the same one again until the Indicator is removed.

**General rules:**

- If a Status Effect Indicator is removed in any way, the Status Effect ceases and all Counters are removed.
- All Status Effect Indicators and Counters are removed from a Page when it leaves the Arena.
- When an Attack lists a Status Effect Symbol next to its Damage, the opposing Page in Combat may be inflicted with that Status Effect.
- In Combat with multiple Defenders, Status Effects may only affect the Primary Defender.
- When a Page "automatically" inflicts a Status Effect, place the Indicator unless another Effect modifies the coin flip.

### Frozen (X)

Affects Beasties and Casters. Place a Frozen Indicator on the Page and Fatigue it. Place Counters equal to X.

- At the start of every turn, remove a Counter.
- When the final Counter is removed, remove the Frozen Indicator and Awaken the Page.
- If a Frozen Page takes Damage outside of the Combat in which it was Frozen, remove the Frozen Indicator. The Page does **not** Awaken.
- A Frozen Page **cannot** Awaken under any circumstance.

### Burn (X)

Affects Beasties and Casters. Place a Burn Indicator on the Page (or in front of the Caster). Roll a D6 and place that many Counters on the Indicator.

- At the start of every turn, remove a Counter. The Page or Caster loses 20 LP when a Counter is removed.
- When the final Counter is removed, remove the Burn Indicator.

### Poison

Affects Beasties and Casters. A target may have **up to 3** Poison Indicators. Place a Poison Indicator on the Page (or in front of the Caster).

- Poisoned Pages and Casters lose LP equal to **10 × the number of Poison Indicators** at the end of every turn.
- A Poison Indicator is removed at the start of the turn after the turn it was placed.

### Paralyze

Affects Beasties. When inflicted with Paralyze, flip a coin, and if heads, place a Paralyze Indicator on the target. A Paralyzed Page:

- Cannot declare Attacks, cannot use Attacks as part of an Effect, and cannot be declared as a Defender.
- Remove the Paralyze Indicator from the Page at the end of the next turn from when the Indicator was placed.

### Sleep

Affects Beasties. When inflicted with Sleep, flip a coin, and if heads, place a Sleep Indicator on the Page and Fatigue it. A Sleeping Page cannot be Awakened under any circumstance.

- If a Sleeping Page becomes the target of an Attack, remove the Sleep Indicator first. When a Sleeping Page takes any Damage outside of the Combat in which it was inflicted with Sleep, double the Damage, remove the Sleep Indicator, and Awaken it.

### Scared

Affects Beasties. When inflicted with Scared, place a Scared Indicator on the Page. Any time the Page is Fatigued, flip a coin instead, and if tails, return the Page to its owner's Chapter. If heads, remove the Scared Indicator from the Page.

### Confusion

Affects Beasties. When inflicted with Confusion, place a Confusion Indicator on the Page. Before a Page with Confusion resolves an Attack, flip a coin, and if tails, activate any Effect of the Beastie (except icons) next to the Attack. If an Attack Effect would have you target a Page, you may target any legal target. The Attack occurs as normal.

---

## Traits

Traits grant a Beastie or Artifact special abilities. Pages may have indicators placed on them to show they are using a specific trait or being affected by a specific trait. A Beastie is considered "burrowed" but this indicator is not considered a Status Effect Indicator.

Traits activate at different times depending on their category:

- **Resolve on Contract:** Trap, Equipment
- **Resolve when entering the Arena:** Fear, Flash, Fleet
- **Active while in the Arena:** All other Traits (Blood Sucker, Burrow, Convert, Defender, Destroyer, First Strike, Flight, Immortal, Infectious, Invisible, Magiproof, Regen, Self Destruct, Spectral, Stone Skin, Unblockable, Venomous)

| Trait | Effect |
|-------|--------|
| **Blood Sucker** | Whenever a Beastie with this Trait deals Damage to a Beastie or Caster with an Attack, it recovers LP equal to the total Damage it dealt (including modifiers). Deal Damage is equal to the amount of LP reduced on Beasties and Casters from Attacks (not including Attack Effects). Arena only. |
| **Burrow** | At the start of each turn, you may declare that a Beastie with Burrow is burrowed until the end of that turn. A burrowed Beastie cannot declare an Attack, cannot be declared as a Defender, and cannot activate a Power, any Spell, Artifact, or Power cannot target a burrowed Beastie. Traits, Potions, and Page Effects can still affect burrowed Beasties. A burrowed Beastie may only be targeted for an Attack if the Attacking Beastie has Burrow or a Page Effect says otherwise. Arena only. |
| **Convert** | You may Fatigue a Beastie or Artifact with this Trait on your turn to generate 1 Aura of the same type as the Page. Arena only. |
| **Defender** | A Beastie or Artifact with this Trait doubles its maximum LP at the start of an opposing Caster's turn after all other modifiers. At the end of that turn, that Beastie or Artifact loses all LP gained by this Trait. If Defender is removed or nullified, the Beastie or Artifact loses all LP from this Trait. Arena only. |
| **Destroyer** | If a Beastie with this Trait Damages a Beastie or Artifact with an Attack, the Damaged Beastie or Artifact is Destroyed. Arena only. |
| **Equipment** | If a Beastie, Artifact, or Spell has this Trait, you must equip this Page to a chosen Page based on its written Effects, which activate during Contract, or when another Page Effect would activate it. |
| **Fear** | When a Beastie with this Trait is Contracted, you may target an opposing Beastie and then flip a coin. If heads, it is placed back into its owner's Chapter. Functions on Contract or when another Page Effect would activate it. |
| **First Strike** | A Beastie with this Trait resolves their Attack and Damage first, whether Attacking or Defending. If both Attacker and Defender have First Strike, the controller of the Attacker flips a coin. Arena only. |
| **Flash** | When a Beastie with this Trait is Contracted, you may target an opposing Beastie and then flip a coin. If heads, the controlling Caster cannot declare an Attack with that Beastie until the end of their next turn. Functions on Contract or when another Page Effect would activate it. |
| **Fleet** | A Beastie or Artifact with this Trait does not enter the Arena Fatigued. Functions on Contract or when a Page would enter the Arena. |
| **Flight** | A Beastie or Artifact with this Trait cannot be the target of a declared Attack unless the Beastie declaring the Attack has Flight. Arena only. |
| **Immortal** | The Beastie or Artifact with this Trait is not Destroyed when its LP is reduced to 0, but can be Destroyed by other Page Effects. Arena only. |
| **Infectious** | Every time a Beastie with this Trait Destroys another Beastie with any Page Effect, Attack, Power, or Trait, place a nameless Beastie Token into the Arena with maximum LP equal to this Beastie's maximum LP and Attacks with Damage and Aura Attack Advantage equal to the printed Damage of Attacks on this Beastie. The token is of the same Aura type as the Beastie with this Trait. Functions on Contract, when entering the Arena, or while in the Arena. |
| **Invisible** | Defenders cannot be declared when a Beastie or Artifact with this Trait declares an Attack, and this Beastie or Artifact cannot be the target of a declared Attack. Arena only. |
| **Magiproof** | A Beastie or Artifact with this Trait cannot be targeted by Spells. Arena only. |
| **Regen** | For each Regen Trait a Beastie has, it recovers 10 LP at the end of each turn. Arena only. |
| **Self Destruct** | You may Fatigue this Beastie or Artifact on your turn to Destroy it. Arena only. |
| **Spectral** | A Beastie or Artifact with this Trait cannot be the target of a declared Attack. Arena only. |
| **Stone Skin** | A Beastie with this Trait reduces all Damage (including Damage dealt from Effects during Combat; Stone Skin does not prevent Effects that would cause a Beastie to "lose" LP). Arena only. Reduces Attack Damage to 0. |
| **Trap** | A Page with this Trait may be placed face-down from your Chapter to the Arena or face-down under a Beastie or Artifact without paying its Aura cost (see Trap Pages). Functions while in the Arena, while face down in the Arena, or when a Page with this Trait is Equipped. |
| **Unblockable** | No Defenders may be declared when a Beastie or Artifact with this Trait declares an Attack. Arena only. |
| **Venomous** | If a Beastie or Artifact with this Trait is the Primary Defender, the Attacking Beastie is inflicted with Poison (1). Arena only. |

---

## Changing Page Types

A Page may change type due to another Effect during your game. When this happens, the Page is considered to be a new Page at that point. It will retain any previous Damage on the Page, if able. Any previous Effects that affect that specific Page type (i.e., Beastie, Artifact, etc.) cease to affect any part of a Page that has had their Page type changed and are removed or nullified. No Equipment Pages will Unequip due to a Page changing types unless stated otherwise by an Effect. However, if the Page type can no longer be affected by the Equipped Page, it won't be.

A Page that remains the same Page type throughout an Effect is not considered for the Page to have changed Page types. When a Page is considered or becomes another Page type or Aura type, the previous Page type or Aura type is replaced. If a window is specified for this Effect, the Page types and Aura types revert to the printed types when it ends. If the Effect includes "in addition to" or "also," it will gain the type without replacing its base Page or Aura type.

---

## Equipment Pages

Certain Pages have the Equipment Trait. Pages with Equipment equip to another Page in the Arena (by placing themselves under) by their own Effect (i.e., upon Contract, via a Power, etc.) or from another Page's Effect. Pages Equipped with another Page are considered to be an "Equipped Page" (i.e., an "Equipped Beastie").

**Equipment rules:**

- Any Page Type (Artifacts, Spells, etc.) can be an Equipment.
- After an Equipment has equipped itself to a Page, the controller of that Equipment is the Caster who controls the Equipped Page. The Equipment is still owned by the Caster that Contracted that Page.
- An Equipment chooses a target based on its written Effects, which activate during Contract, or through a Page Effect.
- Afterwards, Equipment Pages are placed under their target Page face-up.
- Equipment Pages with Effect text that targets a Page when Contracting a target to be Contracted must have a valid target in order to be Contracted and may equip at a later time if another Effect would cause it to.
- Pages without Effect text requiring a target to be Contracted may enter the Arena as a Page being Contracted normally and may equip at a later time.
- If the original target for the Equipment Page is removed from the Arena before the Page is equipped, the Equipment will enter its respective Discard Zone unless otherwise specified.
- Equipped Equipment Pages that can be targeted through their own Page Effects are considered in the Arena.
- If the Page on top of the Equipment moves, the Equipment follows.
- Equipment Pages give positive or negative Effects to their equipped Page only while equipped (unless otherwise specified).
- If the Page on top of the Equipment leaves the Arena, the Equipment enters its respective Discard Zone unless otherwise specified (Beasties and Artifacts enter the Limbo, Spells and Potions enter the Cemetery).

---

## Trap Pages

Certain Pages have the Trap Trait, granting the ability to be Contracted as a Trap.

**Placing Traps:**

- All Pages have the option to be placed face-down as a Trap.
- Pages placed face-down as a Trap into the Arena are under the control of the Caster that placed the Page face-down.
- If a face-down Page is revealed during the game and it does not have the Trap Trait, the Caster who placed the Page face-down immediately loses the game.
- If you cannot lose the game, Pages without the Trap Trait that are flipped face-up cannot be Contracted and are immediately placed in their respective Limbo, Cemetery, or Afterlife.
- Only one face-down Page may be under a Page at any time.
- Traps can be placed without paying the Aura Cost (until flipped face-up).
- Any face-down Trap Page will not have an Aura Type.

**Contracting a Trap Page:**

- Paying the Aura Cost of a Trap when it's flipped up is Contracting that Page.
- Failure, inability, or choosing not to Contract a Trap results in the Trap Page being placed into the Afterlife without activating any of its Effects.

**Flipping a Trap Page Face-Up:**

- Declaring a Beastie with a Trap under it as a Defender does not flip the Trap.
- A face-down Trap Page is flipped face-up when it is targeted by an Attack while not under a Page in the Arena.
- Trap Pages under another Page may not be targeted for Attacks.
- A face-down Trap Page is flipped face-up when it is under a Page in the Arena and the Page it is under is targeted for an Attack.
- Unless otherwise stated, you can choose to flip it face-up at another time.
- Some Trap Pages specify you can flip it face-up at another time.
- If a Trap Page is flipped face-up during Combat due to its own Effect and that Page is a Beastie or Artifact Page, it is still considered a Defender in that Combat if Contracted.
- Trap Pages automatically become a Defender after flipping face-up and being Contracted into the Arena (see Combat).

---

## Placement

Placement refers to placing a Page in the Arena via Contracting, an Effect that moves a Page already in the Arena, or placing the Page into the Arena through an Effect. Placement only refers to the Placement of a Page in relation to its being in the Arena by itself, layered, on-top-of, or under another Page.

The placement of a Page in the Arena cannot be on-top-of or under another Page unless stated by a Page Effect. No Pages are to be moved from their position at any time to aid in a specific Caster's placement or layering. Unless stated by a Page Effect, the placement of a Page cannot be entirely covering another Page in the Arena regardless of being in an Awakened or Fatigued position.

### Layering Pages

When unable to place a Page in the Arena without obstructing the view of another Page, you may layer Pages you own as you see as you place them in the Arena. When Layering Pages, you are not allowed to cover half or less than half of a Page(s) in either a Fatigued or Awakened position.

**Layer:** To place a Page in the Arena partially covering another Page or partially under another Page. No mechanics consider the Pages on-top-of or under of each other.

### On-Top-Of and Under

A Page is only considered on-top-of or under a Page if placed there specifically by another Page Effect or its own Effect.

Pages placed under another Page via their own Page Effect are considered in the Arena unless specified otherwise by the Effect.

### Notable Exceptions to Placement

Equipment and Traps function separately from the Placement of other Pages. Refer to the Trap Pages and Equipment sections for their placement rules. Tokens may still be represented by a standard-size playing card or layered Page. These Pages will not be considered on-top-of or under each other and will be considered in the Arena. Aura may still be layered and may be covering over half of another Aura but less than all of the other Aura in any fashion, provided that both players can interpret how many Aura Pages are present within the Arena at any time.

---

## Spellbook Rules and Tips

Your Spellbook must have a minimum of 40 Pages in it, and there's no maximum total number of Pages (but you must be able to shuffle your entire deck with two hands and within 2 minutes). Your Spellbook may comprise Beasties, Spells, Artifacts, Potions, Terra, and Aura. You'll want to include a good combination of these Pages to give yourself options during the game.

**Tips:**

- If you are using Terra to activate 4th Wall Effects, this will affect the type and frequency of combinations you Bookmark.
- You are allowed an Archive of up to 15 Pages that you can use to modify your Spellbook between games.
- Each Page has a maximum number of times it can appear in a Spellbook and Archive combined as indicated by the Spellbook Limit on the Page (this number is another way to balance the other features of the Page).
- Pages with no Spellbook Limit listed may be included any number of times in your Spellbook or Archive.
- A Page that is mechanically identical but from a different set may share the same Spellbook Limit for that Page.

---

## Running Out of Pages

Running out of Pages in your Spellbook does not represent any special win/loss condition. Ignore any instances where you would Bookmark, such as at the start of your turn, or Page Effects. Play continues as normal. If all Casters run out of Pages in their Spellbook, the game ends in a Draw (neither Caster wins nor loses).

---

## Archive

You are allowed an Archive of up to **15 Pages** that you can use to modify your Spellbook between games.

**Archive rules:**

- Archives are not required.
- Each Page has a maximum number of times it can appear in a Spellbook and Archive combined as indicated by the Spellbook Limit.
- Before beginning multiple games with the same opposing Casters, you must show your Archive and the number of Pages in it (you are not required to show which Pages are in it).
- You can only use an Archive after your first game.
- When using an Archive between games to replace Pages in your Spellbook, your Spellbook and Archive must end up with the same number of Pages in it before the start of your next game.
- At the end of each match, all Pages put into the Spellbook from the Archive must be placed back into the Archive.

---

## Glossary

### Action
An Action is something a Caster chooses to do during the game, such as Contracting a Page, using an Effect or Power, declaring an Attack, or moving a Trap Page.

### Afterlife
The area of the Arena reserved for those Pages that have moved on from the current game. Destroyed Terra and Aura are placed here. Special rules can require Pages to be placed in the Afterlife.

### Any Time
The ability to take an Action on your turn or during a generated priority 2 window.

### Anyplace
Your Spellbook, Chapter, Limbo, Cemetery, or Afterlife.

### Archive
A deck of up to 15 Pages that you can use to modify your Spellbook in-between games. Also known as the "Side-Deck."

### Arena
The part of the Battleground into which your Pages are Contracted.

### Artifact
The type of Page that represents an item imbued with magical energy that contains special abilities.

### Attack
The bold text on a Beastie Page, followed by a red number and any Effect text listed under it. A Beastie may have more than 1 Attack. You may pick only 1 Attack to use when Attacking with a Beastie.

### Attack Damage
Any Damage beside the Attack Name that is printed in red. Damage Modifiers are applied in Attack Damage.

### Aura
A resource used to Contract Pages into the Arena. Aura differs from Aura Pages in that Aura dissolves at the end of each turn, whereas Aura Pages remain in the Arena and generate Aura.

### Aura Cost Reducer
Effects that state to Contract a Page for "less" Aura Cost than its Printed Aura Cost. These Effects must include "less" to be treated as an Aura Cost Reducer.

### Aura Cost Setter
Effects that state to Contract a Page for "more" or "additional" Aura than the printed Aura Cost of the Page. These Effects will NOT include "more", "less", or "additional" and will not set the Aura Cost.

### Aura Cost Increaser
Effects that state to Contract a Page for "more" or "additional" Aura than the printed Aura Cost of the Page. These Effects will include "more" or "additional" and will not set the Aura Cost.

### Aura Effects
Effects that ONLY generate Aura and have no other Effects. These Effects can be used without passing priority 2. Only Aura Effects with "any time" clauses, or Aura Pages may be used in a generated priority 2 window. Unless an Effect would state otherwise.

### Automatically
Placing a Status Effect Indicator on a Page instead of performing a coin flip.

### Awaken
Changing the state of a Page active in the Arena to no longer be Fatigued.

### Battleground
The entire area of play encompassing all the areas where Pages used in the game exist.

### Beastie
The type of Page that represents the various cryptids, monsters, and beings that inhabit the world of OpenZoo.

### Bonus LP
Any Life Points added to a Page past the printed Life Points of the Page.

### Bonus Damage
Any Damage added to a Page past the printed Damage of the Page.

### Bookmark
When a Caster puts a Page from the top of their Spellbook into their Chapter. (This is not considered Placing or adding a Page to your Chapter but is rather a separate mechanic.)

### Caster
Each player in the game is a Caster.

### Cemetery
The area of the Arena where Spells and Potions go once they have been used. Occasionally, a Beastie or Artifact will also go to the Cemetery due to an Effect.

### Chapter
The Pages you hold in your hand during the game. Pages may be Contracted from your Chapter. When you Bookmark a Page, it's placed into your Chapter.

### Combat Damage
Any Combat Effect Damage or Attack Damage that an Attacker or Defender in Combat produces.

### Contract
To Contract a Page, you must pay its Aura cost, meet any additional requirements for the Page, and then place it into the Arena.

### Copy
To take the same printed information as the targeted or chosen Page and to apply it in a way a written Effect will specify. Any Damage, Gains/Losses, inflicted Status Effect Indicators, Set Symbols, Aura Cost, or Pages equipped to it will not be copied.

### Counter
Die/Dice used to indicate a number or amount.

### Current LP
How much Damage a Page can currently receive. Current LP can be calculated by subtracting a Page's or Caster's maximum LP by the amount of Damage and/or LP Loss they have received.

### Damage
Damage represents any wounds or injuries a Page or Caster has received. Any time a Caster or Page suffers Damage, they subtract a number of current LP equal to the Damage they received. Damage can also mean the amount of Damage an Attack deals, shown via the red number to the right of an Attack. An Effect that has you lose LP (such as the Poison Effect) or pay LP is not considered Damage.

### Destroyed
When a Page is Destroyed, it's removed from the Arena and placed into one of three zones: Beasties and Artifacts are placed in the Limbo (unless otherwise stated), Spells and Potions are placed in the Cemetery (unless otherwise stated), and Terra and Aura go to the Afterlife. Some Special Effects may call for Pages to be placed in the Afterlife when Destroyed.

### Discard
To place a Page from a specified private zone into its respective Limbo, Cemetery, or Afterlife. (If no zone is specified by a Static Effect, the card being Discarded goes from the Chapter.)

### Discard Zone(s)
(Interchangeable: Discard File) The Limbo, Cemetery, or Afterlife.

### Draw Condition Effect
Some Page Effects will cause the game to end in a draw for both Casters provided that certain special conditions are met.

### Effect Damage
Any Damage from a written Effect on the Page not including Attack Damage.

### Effect Text Box
The Effect Text Box is the box below the Metadata bar on a Page and above the copyright on a Page. All text within the Effect Text Box is considered to be a part of the Effect Text Box.

### Equip
When a Page attaches to another Page in the Arena and grants positive or negative Effects based on its written text.

### Equipment
A Page that equips itself to another Page in the Arena and grants positive or negative Effects. Equipment Pages will have the Equipment Trait.

### Fatigued
A Page that's turned 90° to represent being exhausted or having used its functions. A Fatigued Page cannot be Fatigued again until it's Awakened.

### Flipped
Effects that resolve after a Page is flipped face-up.

### Game Mechanic Steps
Any steps that occur and resolve automatically, such as start of turn, end of turn, combat, a Resolution Chain resolving, etc.

### Immediately
The next Action or event that you may or must take, or resolve.

### Index
To reveal Pages from the top of your Spellbook until a specified Page is revealed. The revealed Page is placed into a specified zone. An opposing Caster is then chosen to place every other revealed Page on top of your Spellbook in any order.

### Inflict
To attempt to affect a Page or Caster by placing a Status Effect Indicator on them.

### Inflicted
A Page or Caster that currently has a Status Effect Indicator on them.

### Known Information
When information is available to you or others. This information does not have to be public information and can be present through searching your Spellbook, while in your Chapter, or when a Page is public information as well.

### Life Points (LP)
The representation of how tough a Page or Caster is. The LP listed on the top right of a Page lists a Page's maximum LP. Maximum LP differs from current LP: Maximum LP is how much Damage a Page can receive, whereas current LP is how much Damage a Page can currently receive. Current LP can be calculated by subtracting a Page's maximum LP by the amount of Damage and/or LP Loss they have received.

- All Casters start the game with 1000 LP. Pages enter the Arena with current and maximum LP equal to the LP listed on it.
- When a Caster's LP is reduced to zero, they lose the game.
- When a Page has Damage equal to or greater than its maximum LP, it's Destroyed.

### Limbo
The Discard Zone where Beasties and Artifacts go when they're Destroyed.

### Look
Some Effects will look at a Page from a specific zone. This is separate from revealing, and the gained information of the Page(s) does not have to be disclosed to other Casters.

### Lose Condition Effect
Some Page Effects will cause you, or other Casters to lose the game based on special conditions within the game.

### Maximum LP
How much Damage a Page can receive. Maximum LP is listed on the top right of the Page. Maximum LP will not be lowered as Damage Counters are placed on a Page. If an Effect lowers Maximum LP as well, that reduction applies separately. When a Page has Damage equal to or greater than its Maximum LP, it's Destroyed. When a Caster has Damage equal to or greater than its Maximum LP, they lose the game.

### Nullify
(Interchangeable: "Do not resolve") To not resolve or inactivate any active Effects/Traits of a Page.

### Page
A card in OpenZoo.

### Page Effect
(Interchangeable: "Effect") A sentence, phrase, or symbol on a Page that creates an outcome after its resolution by affecting something within the game.

### Partial Resolution
When a Page only resolves part of its Effects rather than all of its Effects.

### Potion
Have a one-time Effect and are then sent to the Cemetery.

### Power
Represented by a blue oval in the text box on a Beastie or Artifact Page. Powers are able to be activated on your turn (unless otherwise specified) by Fatiguing the Page and declaring which Power on the Page you will be activating.

### Primary Defender
The Defender in Combat that is inflicted with Status Effects and has an applicable Attack chosen. This is the only Defender in Combat that can use an Attack against a Beastie that declared an Attack. If no Defenders are declared, the original target of the Attack becomes the Primary Defender. Beasties without Attacks can be declared as Primary Defenders, but Artifacts and Casters may not. Artifacts and Casters are considered Primary Defenders if they are the original target of the Attack and do not have any other Defenders declared.

### Private Zone(s)
Archive, Chapter, and Spellbook.

### Public Zone(s)
Arena, Limbo, Cemetery, Afterlife.

### Public Information
When a Page or information is available to all Casters within the game. Usually through a public zone or through revealed Pages.

### Recover
Recovering represents healing any wounds or injuries on a Page or Caster. When a Page recovers LP, a number of Damage is removed from that Page. When a Caster recovers LP, their total LP amount is increased equal to the amount they recovered. Pages and Casters can recover their LP past their LP even if they're at maximum LP.

### Replace
To swap a targeted or chosen Page(s) for a stated object to take its place. You may not choose a new position in the Arena for this new Page and it will enter Fatigued under the control of the Caster who Controlled the Page at the time of being replaced, unless stated otherwise by an Effect.

### Reveal
To show a Page to all Casters. Revealing a Page does not activate its Effects unless stated otherwise.

### Spell
A type of Page that represents magical abilities conjured by a Caster. Spells usually have a one-time Effect and are then sent to the Cemetery.

### Spellbook
This is your primary deck composed of at least 40 Pages.

### Status Effect
A hazardous condition that Beasties, Artifacts, and Casters may suffer from. The Status Effects in OpenZoo are: Frozen, Burn, Paralyze, Poison, Scared, Sleep, and Confusion.

### Status Effect Indicator
A marker placed on a Page to indicate that it's inflicted with a Status Effect.

### Terra
A type of Page that represents a type of terrain, an event, or other situation that may activate Terra Bonuses. While a Terra of a specific type is on the field, the Terra Bonuses that share a name with the Terra are considered active.

### Terra Bonus
An increase in Damage or LP activated by your surroundings or a Terra Page. These bonuses are displayed on the left section of a card. See the Terra Bonuses section for more information.

### Trap
A type of Page that has the Trap Trait. See the Trap Pages section for detailed information.

### Trait
Represented by a special symbol on a Page. Traits give your Pages a special edge in Combat or other situations. See the Traits section for detailed explanation of each Trait.

### Tribe
A Tribe is the collection of Beasties that may be closely related in form, function, or both. For example, both Napa Rebobs and Bigfoot are in the Tribe "Beastie Sasquatch."

### Type Advantage
Represents the special relationship between two Aura Types that indicates whether one type may deal increased Damage to another.

### Unequip
When a Page detaches from another Page and ceases to grant any positive or negative Effects written on the Page.

### Win Condition Effect
Some Page Effects will cause you, or other Casters to win the game based on special conditions within the game.

---

## Changelog

### Version 0.1 ~ March 29, 2026

- Reverted icons back to pre-Wilderness
- Spirit Trait renamed to Spectral
- Forest Terra renamed to Woodlands
- Status Effect icon updated for Sleep
- Trait icons updated for Destroyer, Equipment, Flash, Immortal, Regen, Self Destruct, Unblockable, Venomous
- Terra icons updated for Ground, Raining, Winter
- Cave Terra added
