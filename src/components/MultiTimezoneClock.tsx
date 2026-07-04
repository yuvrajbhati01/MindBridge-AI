import React, { useState, useEffect } from 'react';
import '../styles/MultiTimezoneClock.css';

interface TimeZoneData {
  name: string;
  timezone: string;
  offset: string;
}

const MultiTimezoneClock: React.FC = () => {
  const [times, setTimes] = useState<{ [key: string]: string }>({});
  const [currentDate, setCurrentDate] = useState<string>('');

  const timeZones: TimeZoneData[] = [
    { name: 'New York', timezone: 'America/New_York', offset: 'EST/EDT' },
    { name: 'London', timezone: 'Europe/London', offset: 'GMT/BST' },
    { name: 'Paris', timezone: 'Europe/Paris', offset: 'CET/CEST' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo', offset: 'JST' },
    { name: 'Sydney', timezone: 'Australia/Sydney', offset: 'AEDT/AEST' },
    { name: 'Dubai', timezone: 'Asia/Dubai', offset: 'GST' },
    { name: 'Singapore', timezone: 'Asia/Singapore', offset: 'SGT' },
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', offset: 'HKT' },
    { name: 'Mumbai', timezone: 'Asia/Kolkata', offset: 'IST' },
    { name: 'São Paulo', timezone: 'America/Sao_Paulo', offset: 'BRT/BRST' },
    { name: 'Moscow', timezone: 'Europe/Moscow', offset: 'MSK' },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles', offset: 'PST/PDT' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const newTimes: { [key: string]: string } = {};

      timeZones.forEach((tz) => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        newTimes[tz.timezone] = formatter.format(new Date());
      });

      setTimes(newTimes);

      // Update date
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      setCurrentDate(dateFormatter.format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="timezone-clock-container">
      <div className="clock-header">
        <h1>🌍 World Clock</h1>
        <p className="current-date">{currentDate}</p>
      </div>

      <div className="clocks-grid">
        {timeZones.map((tz) => (
          <div key={tz.timezone} className="clock-card">
            <div className="clock-city">{tz.name}</div>
            <div className="clock-time">{times[tz.timezone] || '--:--:--'}</div>
            <div className="clock-offset">{tz.offset}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiTimezoneClock;
