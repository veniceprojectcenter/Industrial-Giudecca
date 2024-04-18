// src/components/shapes/TimelineTriangle.js

/** { Component } TimelineTriangle
 * @abstract Component rendered on FactoryTimeline that creates the triangles/arrows on the lines between timeperiod circles. 
 * Renders within TimelineLine.
 */

export default function TimelineTriangle() {
    return (
    <div className='timeline-triangle-container'>
        <hr
            className="triangle"
            style={{
                position: 'relative',
                bottom: 'calc(3vw / 4)',
                width: '3vw',
                transform: 'rotate(45deg)',
                border: '1px solid black'
            }}
            ></hr>
            <hr
            className="triangle"
            style={{
                position: 'relative',
                top: 'calc(3vw / 4)',
                width: '3vw',
                transform: 'rotate(135deg)',
                border: '1px solid black'
            }}
            ></hr>
    </div>
      
    );
  }