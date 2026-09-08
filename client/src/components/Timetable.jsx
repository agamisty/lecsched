import { useMemo } from 'react';
import './Timetable.css';

function getPeriodIndex(periods, periodId) {
  return periods.findIndex((period) => period.id === periodId);
}

function getDayIndex(days, dayId) {
  return days.findIndex((day) => day.id === dayId);
}

function calculateCourseGeometry(
  course,
  periods,
  days,
  dayColumnWidth,
  periodColumnWidth,
  headerHeight,
  rowHeight
) {
  const startColumn = getPeriodIndex(periods, course.startPeriodId);
  const endColumn = getPeriodIndex(periods, course.endPeriodId);
  const dayIndex = getDayIndex(days, course.day);

  if (startColumn === -1 || endColumn === -1 || dayIndex === -1) {
    return null;
  }

  if (endColumn < startColumn) {
    return null;
  }

  const x = dayColumnWidth + startColumn * periodColumnWidth;
  const y = headerHeight + dayIndex * rowHeight;
  const width = (endColumn - startColumn + 1) * periodColumnWidth;

  return {
    course,
    x,
    y,
    width,
    height: rowHeight,
    startColumn,
    endColumn,
    dayIndex,
  };
}

function isVerticalBoundaryBlocked(boundaryColumn, dayIndex, courseGeometries) {
  return courseGeometries.some((geometry) => {
    if (geometry.dayIndex !== dayIndex) {
      return false;
    }
    return (
      boundaryColumn > geometry.startColumn &&
      boundaryColumn <= geometry.endColumn
    );
  });
}

function createVerticalGridSegments(
  periods,
  days,
  courseGeometries,
  dayColumnWidth,
  periodColumnWidth,
  headerHeight,
  rowHeight
) {
  const segments = [];

  for (let boundaryColumn = 0; boundaryColumn <= periods.length; boundaryColumn++) {
    const x = dayColumnWidth + boundaryColumn * periodColumnWidth;

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const rowTop = headerHeight + dayIndex * rowHeight;
      const rowBottom = rowTop + rowHeight;

      const blocked =
        boundaryColumn > 0 &&
        boundaryColumn < periods.length &&
        isVerticalBoundaryBlocked(boundaryColumn, dayIndex, courseGeometries);

      if (!blocked) {
        segments.push({
          x,
          y1: rowTop,
          y2: rowBottom,
          key: `vertical-${boundaryColumn}-${dayIndex}`,
        });
      }
    }
  }

  return segments;
}

export const Timetable = ({
  title,
  periods,
  days,
  courses,
  dayColumnWidth = 110,
  periodColumnWidth = 130,
  headerHeight = 85,
  rowHeight = 155,
}) => {
  const width = dayColumnWidth + periods.length * periodColumnWidth;
  const height = headerHeight + days.length * rowHeight;

  const courseGeometries = useMemo(
    () =>
      courses
        .map((course) =>
          calculateCourseGeometry(
            course,
            periods,
            days,
            dayColumnWidth,
            periodColumnWidth,
            headerHeight,
            rowHeight
          )
        )
        .filter((geometry) => geometry !== null),
    [courses, periods, days, dayColumnWidth, periodColumnWidth, headerHeight, rowHeight]
  );

  const verticalSegments = useMemo(
    () =>
      createVerticalGridSegments(
        periods,
        days,
        courseGeometries,
        dayColumnWidth,
        periodColumnWidth,
        headerHeight,
        rowHeight
      ),
    [periods, days, courseGeometries, dayColumnWidth, periodColumnWidth, headerHeight, rowHeight]
  );

  const horizontalLines = useMemo(
    () => Array.from({ length: days.length + 1 }, (_, index) => headerHeight + index * rowHeight),
    [days.length, headerHeight, rowHeight]
  );

  if (periods.length === 0 || days.length === 0) {
    return <div className="timetable-empty">No timetable structure available.</div>;
  }

  return (
    <div className="timetable-wrapper">
      {title && <h1 className="timetable-title">{title}</h1>}

      <div className="timetable-scroll">
        <div className="timetable" style={{ width, height }}>
          <svg
            className="timetable-svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <rect x={0} y={0} width={width} height={height} className="timetable-background" />

            <rect
              x={0.5}
              y={0.5}
              width={width - 1}
              height={height - 1}
              className="timetable-outer-border"
            />

            <line
              x1={dayColumnWidth}
              y1={0}
              x2={dayColumnWidth}
              y2={height}
              className="grid-line"
            />

            <line
              x1={0}
              y1={headerHeight}
              x2={width}
              y2={headerHeight}
              className="grid-line"
            />

            {horizontalLines.map((y, index) => (
              <line
                key={`horizontal-${index}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                className="grid-line"
              />
            ))}

            {verticalSegments.map((segment) => (
              <line
                key={segment.key}
                x1={segment.x}
                y1={segment.y1}
                x2={segment.x}
                y2={segment.y2}
                className="grid-line"
              />
            ))}

            {periods.map((period, index) => {
              const centerX =
                dayColumnWidth + index * periodColumnWidth + periodColumnWidth / 2;

              return (
                <g key={period.id}>
                  <text x={centerX} y={34} textAnchor="middle" className="period-number">
                    {period.number}
                  </text>
                  <text x={centerX} y={57} textAnchor="middle" className="period-time">
                    {period.startTime} - {period.endTime}
                  </text>
                </g>
              );
            })}

            {days.map((day, index) => {
              const centerY = headerHeight + index * rowHeight + rowHeight / 2;

              return (
                <text
                  key={day.id}
                  x={dayColumnWidth / 2}
                  y={centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="day-label"
                >
                  {day.shortName}
                </text>
              );
            })}

            {courseGeometries.map((geometry) => {
              const { course, x, y, width: courseWidth, height: courseHeight } = geometry;
              const centerX = x + courseWidth / 2;
              const centerY = y + courseHeight / 2;

              return (
                <g key={course.id} className="course-block">
                  <rect
                    x={x}
                    y={y}
                    width={courseWidth}
                    height={courseHeight}
                    className="course-background"
                  />

                  {course.room && (
                    <text x={x + 10} y={y + 20} className="course-room">
                      {course.room}
                    </text>
                  )}

                  <text
                    x={centerX}
                    y={centerY - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="course-code"
                  >
                    {course.courseCode}
                  </text>

                  {course.lecturer && (
                    <text x={x + 10} y={y + courseHeight - 18} className="course-lecturer">
                      {course.lecturer}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Timetable;