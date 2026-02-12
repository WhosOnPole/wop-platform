'use client'

import React, { useState } from 'react'
import { PageBackButton } from '@/components/page-back-button'

// Helper function to convert markdown text to JSX
function formatMarkdownText(text: string) {
  // Split by lines and process
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: string[] = []
  let inList = false

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Handle lists
    if (trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true
        currentList = []
      }
      // Remove markdown list marker and process bold
      const content = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      currentList.push(content)
      return
    }

    // Close list if we were in one
    if (inList && trimmed !== '') {
      elements.push(
        <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-4">
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )
      currentList = []
      inList = false
    }

    // Skip empty lines and horizontal rules
    if (trimmed === '' || trimmed === '---') {
      return
    }

    // Handle headers
    if (trimmed.startsWith('### ')) {
      const content = trimmed.substring(4).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold mb-2 mt-4">
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </h3>
      )
      return
    }

    // Handle bold text in paragraphs
    const processed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    if (processed) {
      elements.push(
        <p key={`p-${index}`} className="mb-3" dangerouslySetInnerHTML={{ __html: processed }} />
      )
    }
  })

  // Close any remaining list
  if (inList && currentList.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc list-inside space-y-1 mb-4">
        {currentList.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ul>
    )
  }

  return elements
}

export default function BeginnersGuidePage() {
  // Top section content (lines 1-24)
  const topSection = {
    title: 'The Complete Beginner\'s Guide to Formula 1',
    welcome: 'Welcome! Formula 1 (F1) is the highest level of open-wheel motorsport: fast cars, elite drivers, and lots of strategy. Here\'s everything you need to follow along without feeling overwhelmed. At least– that\'s the goal.',
    f1In60Seconds: ` **Season length:** roughly **March → early December**  
**Two championships:**  
  * **Drivers' Championship (WDC):** individual points  
  * **Constructors' Championship (WCC):** team points (both drivers combined)  
**Teams:** each team (or constructor) has **2 drivers**  
**Goal on race day:** finish as high as possible (and score points)`,
    howSeasonWorks: 'F1 races around the world, and the calendar changes each year. Sometimes races happen on back-to-back weekends (a **double-header** or **triple-header**), and sometimes there\'s a weekend or two off. Boo. But we suppose they need a break. There\'s usually a **summer break** and a **fall break**, often around **3-4 weeks** each, where we all have to go back to our normal lives.\n\nIn **2026**, there are **11 teams (constructors)** totaling **22 drivers**, and **24 race weekends**.',
  }

  // Accordion sections (each H2 becomes an accordion)
  const accordionSections = [
    {
      title: 'The grid: Teams and drivers (2026)',
      content: `**McLaren** - Lando Norris (1), Oscar Piastri (81)  
**Mercedes** - George Russell (63), Kimi Antonelli (12)  
**Red Bull** - Max Verstappen (3), Isack Hadjar (6)  
**Ferrari** - Charles Leclerc (16), Lewis Hamilton (44)  
**Williams** - Alex Albon (23), Carlos Sainz (55)  
**Racing Bulls** - Liam Lawson (30), Arvid Lindblad (41)  
**Aston Martin** - Fernando Alonso (14), Lance Stroll (18)  
**Haas** - Esteban Ocon (31), Ollie Bearman (87)  
**Audi** - Nico Hulkenberg (27), Gabriel Bortoleto (5)  
**Alpine** - Pierre Gasly (10), Franco Colapinto (43)  
**Cadillac** (brand new team)- Valtteri Bottas (77), Sergio Perez (11)`,
    },
    {
      title: 'How points work',
      content: `### **Race points**

Top **10** drivers score:

* **1st:** 25  
* **2nd:** 18  
* **3rd:** 15  
* **4th:** 12  
* **5th:** 10  
* **6th:** 8  
* **7th:** 6  
* **8th:** 4  
* **9th:** 2  
* **10th:** 1  
* **11th-22nd:** 0 

### **Sprint points (only on some weekends)**

Top **8** drivers score:

* **1st:** 8  
* **2nd:** 7  
* **3rd:** 6  
* **4th:** 5  
* **5th:** 4  
* **6th:** 3  
* **7th:** 2  
* **8th:** 1  
* **9th-22nd:** 0`,
    },
    {
      title: 'What happens on a race weekend',
      content: `### **Standard weekend schedule**

**Thursday - Media day**  
Press conferences + interviews.

**Friday - Practice**

* **FP1** and **FP2** (free practice sessions, ~1 hour each)  
* Teams test setups, gather tire data, and prepare strategy  
  *(Practice times are fun to analyze but can be misleading- teams may not be running at full speed yet.)*

**Saturday - Practice + Qualifying**

* **FP3**, then **Qualifying**  
* Qualifying sets the **starting order** for Sunday

**Sunday - Race day**

* Race length varies, but it's usually around **90 minutes**  
* After the race: interviews + podium (top 3 get trophies)`,
    },
    {
      title: 'Qualifying (explained simply)',
      content: `Qualifying is three short sessions where drivers try to set the **fastest lap time**.

### **Q1 (18 minutes)**

* **All 22** drivers participate  
* The **slowest 6** are eliminated → they start **P17–P22** 

### **Q2 (15 minutes)**

* **16** drivers remain  
* The **slowest 6** are eliminated → they start **P11–P16** 

### **Q3 (12 minutes)**

* **10** drivers remain  
* Fastest time gets **Pole Position (P1)** 

**Important note:** Drivers don't always start exactly where they qualified. Grid positions can change due to:

* **Penalties** (from practice, qualifying, or even a previous race… or a steward having a bad day)  
* **Car changes/repairs** after the allowed time. This usually happens when qualifying didn't go well enough or the driver pushed a TAD too hard and hit something. Hard.   
* **Exceeding allowed parts** for the season`,
    },
    {
      title: 'Sprint weekends (what\'s different?) 2 instead of 1!',
      content: `Sprint weekends add an extra, shorter race. There are typically 6 sprints per season at alternating tracks.

**Friday**

* **FP1**  
* **Sprint Qualifying** (same format as qualifying, but shorter: **12 / 10 / 8 minutes**) 

**Saturday**

* **Sprint race** (usually ~17–24 laps, ~30 minutes)  
* Later in the day: regular **Qualifying** for Sunday 

**Sunday**

* The main race happens as usual`,
    },
    {
      title: 'How races work (the basics)',
      content: `On paper: **first driver to cross the finish line wins.**  
In reality: tires, rules, pit stops, and safety situations can change everything.

### **Common rules you\'ll hear about a lot**

* **Race start ("lights out and away we go")**: five red lights go out → race begins  
  Jumping the start or being out of position can mean a penalty.   
* **"He forced me off!"**  
  If a driver makes a move that pushes another driver off the racing surface, stewards may penalize it.  
* **"He hit me!"**  
  Drivers can be penalized if they cause a crash or contact that didn't need to happen.  
* **Track limits**  
  Drivers must keep at least **one wheel** inside the white lines.  
  * In **qualifying/practice**, going all four wheels off can delete the lap time  
  * In the **race**, drivers usually get warnings, then a penalty   
* **Pit lane speed limit**  
  Drivers must not speed in the pit lane. For obvious reasons.   
* **Impeding**  
  In practice/qualifying, slower cars should get out of the way of fast laps-blocking can earn penalties.   
* **Parc Fermé**  
  Once qualifying begins, teams can't make major setup changes.   
* **Car regulations**  
  Cars must meet *FIA* (F1 governing body) rules; breaking them can mean penalties or disqualification.`,
    },
    {
      title: 'Flags you\'ll see (and what they mean)',
      content: `Flags are how officials communicate with drivers during sessions and races.

* **Yellow:** Careful. slow down, hazard ahead  
* **Green:** Go. hazard cleared, track is clear  
* **Red:** Nope. session stopped; track is unsafe → return to pit lane  
* **Blue:** Move.  
  * Practice/qualifying: faster car approaching, move aside  
  * Race: you\'re about to be lapped → let the faster car through  
* **Black & white:** We\'re not telling you again. warning (often for track limits or driving standards)  
* **Checkered:** The end. race finished`,
    },
    {
      title: 'Penalties (what they mean in real life)',
      content: `* **5-second penalty**  
  Served at the next pit stop (crew waits 5 seconds before touching the car), or added to final race time if they don\'t pit again.   
* **10 / 20-second penalties**  
  Same idea, just bigger consequences.  
* **Drive-through**  
  Must drive through the pit lane (at pit-lane speed) within two laps of being told.   
* **Stop-and-go**  
  Like a drive-through, but they also stop in their pit box and wait **10 seconds**.   
* **Grid drop (next race)**  
  Their next qualifying result gets moved back (often 3, 5, or 10 places).   
* **Disqualification (DSQ)**  
  Removed from results, no points. 

**For most of the 2025 season the grid was so tight (the drivers were all running at times so close together) that even a 5-second penalty could have a big impact on a driver's finish and points.** 

**2026 brings a reset to all teams with the new F1-mandated changes to the cars. Will penalties still be game changers? We will watch and see.**`,
    },
    {
      title: 'Crashes, safety cars, and race interruptions',
      content: `Yes- crashes happen. Modern F1 safety is very strong, but it\'s still a high-risk sport. 

If there\'s debris or danger:

* **Yellow flags** may cover just part of the track while marshals clean up  
* If it's more serious, you may see:

### **Virtual Safety Car (VSC)**

Everyone must slow down and keep to a controlled pace. 

**Safety Car (SC)** 

A real safety car goes on track and the leader follows it. No overtaking until the safety car leaves and racing resumes. Safety cars can be a driver\'s best friend or worst nightmare. They can disrupt strategy and erase significant leads and gap times.`,
    },
    {
      title: 'Tires (the colorful rings matter!)',
      content: `Teams choose tires strategically, and it can decide the race.

### **Slicks (dry weather)**

* **Soft (red):** fastest, wears out quickest  
* **Medium (yellow):** balanced- faster than hards and more durable than softs so they go longer  
* **Hard (white):** lasts longest, usually slower 

### **Wets (rain)**

* **Intermediates (green):** light rain / damp track  
* **Full wets (blue):** heavy rain / very wet track 

**Key rule:** In a dry race, drivers must use **at least two different dry compounds** (for example: Medium + Hard).`,
    },
    {
      title: 'How overtaking works (and why strategy matters)',
      content: `Sometimes it's pure driving skill. Often, it's timing.

### **Tire offset**

If Driver A has **newer tires**, they *usually* have better grip and speed, making passes easier. 

### **The undercut vs. the overcut**

* **Undercut:** pit earlier than the car ahead → use fresh tires to jump them when they pit  
* **Overcut:** pit later than the car ahead → use clean air (and sometimes their tire warm-up time) to stay ahead 

### **New for 2026: Manual Override / "Overtake Mode"**

When a driver is within **one second** of the car ahead, they can deploy extra power to help make a pass- so timing becomes even more important.`,
    },
    {
      title: 'Who should you root for?',
      content: `That\'s the fun part- there are no wrong answers.

F1 fandom can be less "tribal" than some sports because drivers\' personalities are so visible and teams are international. Try:

* picking a driver,  
* picking a team,  
* picking a few favorites,  
* or cheering for chaos (also valid).

Our advice is to watch races, watch interviews, and see who you naturally gravitate towards. It doesn\'t really matter because you\'ll likely end up loving them all on some level- even if it\'s just that you love to hate them.`,
    },
  ]

  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <PageBackButton variant="dark" />
      </div>
      {/* Top Section */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-display">{topSection.title}</h1>
        <p className="mb-6 text-md text-white">{topSection.welcome}</p>

        {/* F1 in 60 seconds */}
        <div className="mb-6 bg-sunset-gradient rounded-lg p-4">
          <h2 className="mb-3 text-2xl text-white text-center font-display">F1 in 60 seconds</h2>
          <div className="text-white text-md">
            {formatMarkdownText(topSection.f1In60Seconds)}
          </div>
        </div>

        {/* How the season works */}
        <div className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold text-white">How the season works</h2>
          <div className="text-white text-md">
            {formatMarkdownText(topSection.howSeasonWorks)}
          </div>
        </div>
      </div>

      {/* Accordion Sections - only one open at a time */}
      <div className="space-y-3">
        {accordionSections.map((section, index) => (
          <details
            key={index}
            open={openAccordionIndex === index}
            className="rounded-lg border border-gray-200 px-4 py-3 bg-white"
          >
            <summary
              className="cursor-pointer text-sm font-semibold text-black hover:text-gray-700"
              onClick={(e) => {
                e.preventDefault()
                setOpenAccordionIndex((prev) => (prev === index ? null : index))
              }}
            >
              {section.title}
            </summary>
            <div
              className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                openAccordionIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
              style={{ transitionProperty: 'grid-template-rows' }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="mt-3 text-xs text-black space-y-3">
                  {formatMarkdownText(section.content)}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
