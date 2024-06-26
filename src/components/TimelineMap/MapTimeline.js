// MapTimeline.js

/** { Component } MapTimeline
 * @abstract Component rendered on the Homepage that contains the clickable markers on the map for each industrial site,
 * and allows the user to scroll through the timeline
 *
 * @param { Array[Factory] } factories - Array of factories as Factory objects
 * @param { Array[Object] } timeperiods - Array of timeperiods as Dictionaries (Objects)
 * @param { Object } minMaxYear - Object (Dictionary) in the format [ key : val ] => [ min: [int], max: [int] ]
 *                                for the min and max year on the timeline
 * 
 * @exports 
 *      @const { Component } MapTimeline
 */
import React, {useState, useEffect, useRef, useContext} from 'react';

// Stylesheets
import '../../css/components/MapTimeline.css';

// Components/Functions
import { formatTimeperiodString } from '../../ArcGIS.js';
import { LanguageContext } from '../../context/LanguageContext.js';
import { FactoryPin } from './FactoryPin.js';

let currTimeperiodIndex = 0;

const MapTimeline = ({ factories, timeperiods, minMaxYear, language }) => {
    const pageRef = useRef(null);               // Page ref
    const {t} = useContext(LanguageContext);   // Context for translation
    const [year, setYear] = useState(0);        // The year that appears as the timeline scrolls
    const [showScrollArrow] = useState(false); // State for "keep scrolling" animation


    const [activeAdv, setActiveAdv] = useState('');          // Dependent on the num factories (e.g. "There was 1 factory" vs "There were 2 factories")
    const [activeLabel, setActiveLabel] = useState('');      // Dependent on the num factories (e.g. "There is 2 factories" vs "There are 2 factories")
    const [currTimeperiodStr, setTimeperiod] = useState(''); // String representing the current timeperiod that appears on screen
    const [skipTimeline, setSkipTimeline] = useState(false); // State of whether the skipTimeline button is pressed

    const [allFactories, setAllFactories] = useState([]);                   // List of ALL factories as originally passed to MapTimeline

    const currentYear = new Date().getFullYear();   // Current year so the scrolling timeline knows when to stop
    const minYear = minMaxYear.minYear;             // Min year as passed to MapTimeline
    const maxYear = minMaxYear.maxYear;             // Max year as passed to MapTimeline
    const timelineTop = window.innerHeight;         // Top of the timeline (y-pos), i.e. one page height down from the start
    
    // Maptimeline translations 
    const translations = {
        it: {
            clickToLearnMore: "Fare Clic su uno Spillo per Saperne di Più",
            skipTimeline: "Salta la Sequenza Temporale",
            resetTimeline: "Reimpostare la Sequenza Temporale",
            modernDay: "Giorno moderno"

        },
        en: { 
            clickToLearnMore: "Click on a pin to learn more",
            skipTimeline: "Skip Timeline",
            resetTimeline: "Reset Timeline",
            modernDay: "Modern day"
        }
    }

    /** showMarker(fid)
     * @abstract Function that will show the marker for the given factory id (fid)
     * @param { int } fid a factory ID 
     * @returns { null }
     */
    function showMarker(fid) { 
        try { 
            const thisMarker = document.getElementById(`marker-${fid}`);
            thisMarker.style.display = 'block';
        } catch(error) { 
            console.log(`Error setting marker for ${fid}: `, error);
        }
    }

    /** hideMarker(fid)
     * @abstract Function to hide the marker for a give factory ID (fid)
     * @param { int } fid - a factory ID
     * @returns { null }
     */
    function hideMarker(fid) { 
        try { 
            const thisMarker = document.getElementById(`marker-${fid}`);
            thisMarker.style.display = 'none';
        } catch(error) { 
            console.log(`Error setting marker for ${fid}: `, error);
        }
    }

    // Event handler for the wheel event
    const handleWheel = (e) => {
        if (pageRef.current && !skipTimeline) {
            const top = pageRef.current.getBoundingClientRect().top; // Current top of the screen
            const margin = 50;                                       // margin is +/- amount from the top of the timeline to lock scroll

            // Check if the position is within the margin for locking the screen
            // NOTE: <= 0 assumes the timeline top is at pos y = 0
            if(top - margin <= 0) {
                if(!skipTimeline) window.scrollTo(0, timelineTop);
                e.preventDefault();

                // Control the scroll speed in both directions
                const scrollFactor = 0.7;                                       // DECREASE => SLOWER
                const direction = e.deltaY > 0 ? scrollFactor : -scrollFactor;  // Set the scroll speed

                // Calculate the year
                setYear((prevYear) => {
                    const newYear = prevYear + direction;

                    // Scroll is "down" (increase year)
                    if (newYear >= minYear && newYear <= currentYear) return newYear;

                    // We are at the end (current year), so remove the event listener to unlock scroll
                    else if (newYear >= currentYear) {
                        setTimeperiod(`(${currentYear}) ${translations[language].modernDay}.`);
                        window.removeEventListener('wheel', handleWheel);
                        return currentYear;
                    }

                    // Scroll is "up" (decrease year)
                    else return prevYear;
                });
            }
        }
    };

    // useEffect => Init the year as minYear
    useEffect(() => { 
        setAllFactories(factories); 
        setYear(minYear); 
    }, [minMaxYear, allFactories]);

    // Iterate over the factories and give random opening/closing dates to those that don't have them
    factories.forEach(factory => {
        if(!factory.Opening_Year) { factory.Opening_Year = Math.floor(Math.random() * (2000 - minYear + 30 + 1)) + minYear + 30; }
        if(!factory.Closing_Year) { factory.Closing_Year = Math.floor(Math.random() * (2000 - minYear + 30 + 1)) + minYear + 30; }
    });

    // Event handler for the reset button
    const handleResetClick = () => {
        setYear(minYear);           // Set the year back to min year
        setSkipTimeline(false);     // Now using timeline again
        currTimeperiodIndex = 0;    // Reset timeperiod index to 0
        setTimeperiod('');          // Reset the timeperiod
        setActiveAdv('');           // Reset the active adv
        setActiveLabel('');         // Reset the active label

        // Scroll user back to the top of the timeline
        window.scrollTo({   
            top: timelineTop,
            behavior: 'smooth'
        });
        
        // Remove the existing wheel event listener
        window.removeEventListener('wheel', handleWheel);

        // Add a new wheel event listener with the updated skipTimeline state
        window.addEventListener('wheel', handleWheel, { passive: false });
    };

    // Event handler for the skip timeline button
    const handleSkipClick = () => {
        setYear(currentYear);
        pageRef.current.scrollTop = pageRef.current.scrollHeight;
        setSkipTimeline(true);
        setTimeperiod(`(${currentYear}) ${translations[language].modernDay}.`);
        currTimeperiodIndex = timeperiods.length - 1;

        window.scrollTo({
            top: window.innerHeight * 2,
            behavior: 'smooth'
        });
    };

    // useEffect => logic for an event handler to lock the scroll while the timeline is active
    useEffect(() => {
        window.addEventListener('wheel', handleWheel, { passive: false });  // Add event handler by default
        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [skipTimeline, minYear, maxYear]); // Note dependency array contains skipTimeline

    // useEffect ==> on every scroll, check and update the factories that appear on the map
    useEffect(() => {

        // Filter the factories based on the scroll position
        const filterFactories = (year) => {

            // Init the active count to 0
            let activeCount = 0;

            // Set the time period according to the year
            if (timeperiods.length > 0) {

                // Final year
                if (year >= currentYear) {
                    setTimeperiod(`(${currentYear}) ${translations[language].modernDay}.`);
                    currTimeperiodIndex = timeperiods.length - 1;
                } else {
                    const thisTimeperiod = timeperiods[currTimeperiodIndex];                // Current timeperiod displayed
                    const thisTimeperiodStartYear = parseInt(thisTimeperiod.Start_Date);    // Start year of the currently displayed timeperiod
                    const thisTimeperiodEndYear = parseInt(thisTimeperiod.End_Date);        // End year of the currently displayed timeperiod
                    const nextTimeperiod = timeperiods[currTimeperiodIndex + 1];            // Next timeperiod in the sequence

                    // prevTimeperiod is the previous timeperiod if it exists, i.e. if currTimeperiodIndex is > 0
                    const prevTimeperiod = currTimeperiodIndex > 0 ? timeperiods[currTimeperiodIndex - 1] : null;

                    /* If there is a next timeperiod and the start date is less than the current year, i.e. we have passed the start year,
                     * then display the new timeperiod on the screen 
                     */ 
                    if(nextTimeperiod && nextTimeperiod.Start_Date <= year) { 
                        setTimeperiod(formatTimeperiodString(nextTimeperiod, language));
                        currTimeperiodIndex++;
                    } 
                    /* Else if: 
                     * 0. If the current year falls within this timeperiod's start and end year
                     * 
                     * OR ALL THREE OF 
                     * 1. this timeperiod's start year is the same as this timeperiod's end year
                     * 2. this year is after than the current timeperiod's start year 
                     * 3. the current year is less than the next time period's start year
                     */
                    else if( 
                        (year >= thisTimeperiodStartYear && year <= thisTimeperiodEndYear) ||    // 0. Curr year is in this timeperiod
                        (
                            thisTimeperiodStartYear == thisTimeperiodEndYear &&                 // 1. This tp startYear == this tp endYear
                            year >= thisTimeperiodStartYear &&                                  // 2. Curr year is after this tp startYear
                            (nextTimeperiod && year <= parseInt(nextTimeperiod.Start_Date))     // 3. Curr year is before the next tp startYear
                        )
                    ) { 
                        setTimeperiod(formatTimeperiodString(thisTimeperiod, language));
                    }
                    // Timeline is scrolling backwards  
                    else if(prevTimeperiod) { 
                        setTimeperiod(formatTimeperiodString(prevTimeperiod, language));
                        currTimeperiodIndex--;
                    } else { 
                        setTimeperiod('');
                    }
                }
            }

            // Iterate over and filter the factories
            factories.map(factory => {

                // Check that this factory's opening/closing dates are within the current range
                if(factory && factory.Opening_Year <= year && (!factory.Closing_Year || factory.Closing_Year >= year)) {
                    activeCount++;                      // Increment the active count to appear on the screen
                    showMarker(factory.Factory_ID);
                } else { 
                    hideMarker(factory.Factory_ID);
                }
            });

            // Set the number active on the screen
            if (activeCount === 1) {
                // Timeline is at the end
                if (year >= currentYear) {
                    setActiveAdv(t('mapIs'));
                    setTimeperiod(`(${currentYear}) ${translations[language].modernDay}.`);
                } else {
                    setActiveAdv(t('mapWas'));
                }
                setActiveLabel(`${activeCount} ${t("activeLabel")}`);
            } else {
                setActiveAdv(t('mapWere'));
                setActiveLabel(`${activeCount} ${t("activeLabelPlural")}`);
            }
        };

        // Call filterFactories function
        filterFactories(year);
    }, [year, factories, language]);

    return (
        <div ref={pageRef} className='timeline-container'>
            <div className='learn-more-container'><p className='timeline-learn-more'>{t('clickToLearnMore')}</p></div>
            <div className='giudecca-map-timeline' style={{ width: '100%', height: '100%' }}>
                {/* Container for map image */}
                <img src="giudecca-map.png"
                     className='giudecca-map-img'
                     alt="Map"
                     style={{ height: window.innerHeight }}
                />

                {/* Overlayed container for factory pins */}
                <div 
                     id='factory-container'
                     className='factory-container'
                     style={{ height: window.innerHeight }}
                >
                    {
                        allFactories.map(factory => ( 
                            <div className='pin-wrapper' id={`pin-wrapper-${factory.Factory_ID}`}>
                                <FactoryPin id={factory.Factory_ID} name={language == 'en' ? factory.English_Name : factory.Italian_Name} left={factory.x} top={factory.y}/>
                            </div>
                        ))
                    }
                </div>

                {/* Container for the info, including the "In xxxx there was X industrial site" and the context blurb below that */}
                <div className='info-containerb' style={{ height: window.innerHeight * 0.38 }}>
                    <div className='map-row'>
                        <div className='ib'>
                            <h3>
                                {language === 'it' ? (
                                    <>Nel {Math.round(year)}, {activeAdv} {activeLabel} {t("onGiudecca")}.</>
                                ) : (
                                    <>In {Math.round(year)}, there {activeAdv} {activeLabel} {t("onGiudecca")}.</>
                                )}
                            </h3>
                        </div>
                    </div>
                    <div className='map-row'>
                        <div className='context-blurb'>
                            <h4>{currTimeperiodStr}</h4>
                        </div>
                    </div>

                    {/* Buttons and text at bottom of timeline */}
                    <button className='skip-button' onClick={handleSkipClick}>{translations[language]['skipTimeline']}</button>     {/* Bottom left button */}
                    <button className='reset-button' onClick={handleResetClick}>{translations[language].resetTimeline}</button>     {/* Bottom right button */}

                    {/* "Scroll to advance the timeline" */}
                    <div className='timeline-keep-scrolling'>
                        <p className='timeline-keep-scolling-text'>{t('keepScrolling')}</p>
                        <div className={`timeline-scroll-arrow ${showScrollArrow ? 'show' : ''}`} id='timeline-scroll-arrow'></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapTimeline;