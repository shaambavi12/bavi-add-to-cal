import React, { useState, useEffect } from 'react';

// Inline styles object
const styles = {
  appContainer: {
    backgroundColor: '#111827',
    color: 'white',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '28rem',
    margin: '0 auto',
    backgroundColor: '#1f2937',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '1.5rem',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '0.875rem'
  },
  textarea: {
    width: '100%',
    height: '10rem',
    padding: '1rem',
    backgroundColor: '#374151',
    border: '2px solid #4b5563',
    borderRadius: '0.5rem',
    color: 'white',
    resize: 'none',
    marginBottom: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    fontSize: '16px'
  },
  button: {
    width: '100%',
    backgroundColor: '#06b6d4',
    color: '#111827',
    fontWeight: 'bold',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    fontSize: '1rem',
    boxSizing: 'border-box',
    WebkitAppearance: 'none'
  },
  buttonHover: {
    backgroundColor: '#0891b2',
    transform: 'scale(1.05)'
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
    cursor: 'not-allowed'
  },
  buttonSecondary: {
    backgroundColor: '#4b5563'
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
    color: 'white',
    display: 'inline-block',
    padding: '0.5rem 1.5rem',
    textDecoration: 'none',
    marginBottom: '1rem'
  },
  errorBox: {
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    border: '1px solid #991b1b',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    marginTop: '1rem'
  },
  successBox: {
    backgroundColor: 'rgba(20, 83, 45, 0.5)',
    border: '1px solid #166534',
    color: '#86efac',
    padding: '1rem',
    borderRadius: '0.5rem',
    textAlign: 'center'
  },
  editForm: {
    backgroundColor: '#374151',
    padding: '1.5rem',
    borderRadius: '0.5rem'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#9ca3af',
    display: 'block',
    marginBottom: '0.25rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#4b5563',
    border: '1px solid #6b7280',
    borderRadius: '0.25rem',
    color: 'white',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    fontSize: '16px',
    WebkitAppearance: 'none'
  },
  flexRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'nowrap'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.75rem',
    marginTop: '2rem'
  }
};

const App = () => {
  const [inputText, setInputText] = useState('');
  const [editableEvent, setEditableEvent] = useState(null);
  const [eventLink, setEventLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState('input');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `* { box-sizing: border-box; margin: 0; padding: 0; } html, body { width: 100%; overflow-x: hidden; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('ServiceWorker registration successful with scope: ', reg.scope))
          .catch(err => console.log('ServiceWorker registration failed: ', err));
      });
    }
  }, []);

  const handleAnalyseText = async () => {
    if (!inputText.trim() || isLoading) {
        if (!inputText.trim()) setErrorMessage('Please paste some text to create an event.');
        return;
    }
    setIsLoading(true);
    setErrorMessage('');
    setEditableEvent(null);
    setAppState('input');

    const prompt = `
      You are an intelligent calendar assistant. Your task is to extract event details from user-provided text and return them as a JSON object.
      The current date is ${new Date().toISOString()}.
      
      **General Rules:**
      1.  **Title:** Create a descriptive title. Include people's names if mentioned.
      2.  **Default Times:** For "dinner", default to "18:30". For "brunch", use "11:00". For "lunch", use "12:30".
      3.  **Location:** Extract physical addresses. If keywords like "meetup", "dinner", etc., are used without an address, set location to an empty string.
      
      **Duration Logic (IMPORTANT):**
      a.  **Explicit End Time:** If the text states an end time or duration (e.g., "from 2-4pm", "for 90 minutes"), always use that to calculate the 'endTime'.
      b.  **Explicit All-Day:** If the text says "all day", set 'time' and 'endTime' to null.
      c.  **Short Events:** For brief events ("call with", "quick sync", "chat"), calculate 'endTime' to be 20 minutes after the start 'time'.
      d.  **Standard Default:** For all other timed events without a duration ("dinner", "meeting"), calculate 'endTime' to be 50 minutes after the start 'time'.
      e.  **MANDATORY RULE:** If a start 'time' is identified, you MUST provide a calculated 'endTime'.
      
      **Specific Event Rules (HIGHEST PRIORITY):**
      1.  **Village Pilates:** Location: "2/15-17 Stanley St, St Ives NSW 2075". Titles: "Village MAT w/ [Name]", "Village REF w/ [Name]", "Village TEACHING".
      2.  **Love Pilates:** Location: "6 Hannah St, Beecroft NSW 2119". Titles: "Love MAT w/ [Name]", "Love Funda REF w/ [Name]", etc.
      3.  **Pilates Boutik:** If text includes "Teaching", "hours", "obs" etc. (but not "phone call"), Location: "Suite 36-38, 12 Waratah St, Mona Vale NSW 2103".

      Text: "${inputText}"
    `;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "title": { "type": "STRING" },
            "date": { "type": "STRING" },
            "time": { "type": "STRING", "description": "HH:mm or null" },
            "endTime": { "type": "STRING", "description": "HH:mm or null" },
            "description": { "type": "STRING" },
            "location": { "type": "STRING" }
          }
        }
      }
    };

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const result = await response.json();
      const parsedData = JSON.parse(result.candidates[0].content.parts[0].text);
      if (!parsedData.title || !parsedData.date) {
        setErrorMessage("Couldn't understand that. Please provide at least a title and a date.");
      } else {
        setEditableEvent(parsedData);
        setAppState('preview');
      }
    } catch (error) {
      console.error("Error analysing text:", error);
      setErrorMessage("An error occurred while analysing the text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); 
      handleAnalyseText();
    }
  };

  const handleEventChange = (field, value) => {
    setEditableEvent(prev => {
      if (field === 'time' && value && prev.time && prev.endTime) {
        try {
          const oldStartDate = new Date(`1970-01-01T${prev.time}`);
          const oldEndDate = new Date(`1970-01-01T${prev.endTime}`);
          const durationMs = oldEndDate.getTime() - oldStartDate.getTime();
          const newStartDate = new Date(`1970-01-01T${value}`);
          const newEndDate = new Date(newStartDate.getTime() + durationMs);
          const newEndTimeString = newEndDate.toTimeString().slice(0, 5);
          return { ...prev, time: value, endTime: newEndTimeString };
        } catch (e) {
            return { ...prev, time: value };
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleConfirmEvent = () => {
    if (!editableEvent || !editableEvent.date) {
      setErrorMessage("Date is a mandatory field.");
      return;
    }
    setErrorMessage('');

    const isAllDay = !editableEvent.time;
    
    // Helper function to format date objects into YYYYMMDDTHHMMSSZ format
    const toGoogleUtcString = (dateObj) => {
        return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    let startDateTimeStr;
    let endDateTimeStr;

    if (isAllDay) {
      startDateTimeStr = editableEvent.date.replace(/-/g, '');
      const nextDay = new Date(`${editableEvent.date}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateTimeStr = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
    } else {
      const localStartDate = new Date(`${editableEvent.date}T${editableEvent.time}`);
      
      let localEndDate;
      if (editableEvent.endTime) {
        if (editableEvent.endTime < editableEvent.time) {
          // If end time is "earlier" than start time, it's the next day
          const endDateObject = new Date(localStartDate);
          endDateObject.setDate(endDateObject.getDate() + 1);
          const endDateString = endDateObject.toISOString().slice(0, 10);
          localEndDate = new Date(`${endDateString}T${editableEvent.endTime}`);
        } else {
          // Otherwise, it's the same day
          localEndDate = new Date(`${editableEvent.date}T${editableEvent.endTime}`);
        }
      } else {
        // Fallback safety net
        console.warn("No endTime provided, using 50-minute fallback.");
        localEndDate = new Date(localStartDate.getTime() + 50 * 60 * 1000);
      }
      
      startDateTimeStr = toGoogleUtcString(localStartDate);
      endDateTimeStr = toGoogleUtcString(localEndDate);
    }

    const dates = `${startDateTimeStr}/${endDateTimeStr}`;
    const gCalUrl = new URL('https://www.google.com/calendar/render');
    gCalUrl.searchParams.append('action', 'TEMPLATE');
    gCalUrl.searchParams.append('text', editableEvent.title);
    gCalUrl.searchParams.append('dates', dates);

    // FIXED: Corrected 'searchparams' to 'searchParams'
    if (editableEvent.description) gCalUrl.searchParams.append('details', editableEvent.description);
    if (editableEvent.location) gCalUrl.searchParams.append('location', editableEvent.location);
    
    setEventLink(gCalUrl.href);
    setAppState('confirmed');
  };
  
  const handleGoBack = () => {
    setEditableEvent(null);
    setAppState('input');
    setErrorMessage('');
  };
  
  const TimeDisplay = ({ time, isEndTime = false }) => {
    if (!time || !time.includes(':')) return isEndTime ? null : <span style={{color: '#9ca3af'}}>All-day</span>;
    const [hour, minute] = time.split(':');
    const hourInt = parseInt(hour, 10);
    if (isNaN(hourInt)) return null;
    const ampm = hourInt >= 12 ? 'PM 🌙💤' : 'AM ☀️';
    const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const renderContent = () => {
    switch(appState) {
      case 'preview':
        return (
          <div style={styles.editForm}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#22d3ee', textAlign: 'center', marginBottom: '1rem'}}>Edit Event</h2>
            {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input type="text" value={editableEvent.title} onChange={e => handleEventChange('title', e.target.value)} style={styles.input} />
            </div>
            <div style={styles.flexRow}>
              <div style={{flex: 2}}><label style={styles.label}>Date</label><input type="date" value={editableEvent.date} onChange={e => handleEventChange('date', e.target.value)} style={styles.input} /></div>
              <div style={{flex: 1}}><label style={styles.label}>Start</label><input type="time" value={editableEvent.time || ''} onChange={e => handleEventChange('time', e.target.value)} style={styles.input} /></div>
              <div style={{flex: 1}}><label style={styles.label}>End</label><input type="time" value={editableEvent.endTime || ''} onChange={e => handleEventChange('endTime', e.target.value)} style={styles.input} /></div>
            </div>
            {editableEvent.time && <div style={{textAlign: 'right', fontSize: '0.875rem', marginTop: '-0.25rem', paddingRight: '0.25rem'}}><TimeDisplay time={editableEvent.time} />{editableEvent.endTime && ' - '}<TimeDisplay time={editableEvent.endTime} isEndTime={true} /></div>}
            <div style={styles.formGroup}><label style={styles.label}>Location</label><input id="location-input" type="text" value={editableEvent.location || ''} onChange={e => handleEventChange('location', e.target.value)} placeholder="e.g., '123 Main St' or 'Zoom'" style={styles.input} /></div>
            <div style={styles.buttonGroup}>
              <button onClick={handleGoBack} style={{...styles.button, ...styles.buttonSecondary}}>Back</button>
              <button onClick={handleConfirmEvent} style={styles.button}>Confirm & Create</button>
            </div>
          </div>
        );
      case 'confirmed':
        return (
          <div style={styles.successBox}>
            <p style={{fontWeight: '600', marginBottom: '1rem'}}>✅ Event is ready!</p>
            <a href={eventLink} target="_blank" rel="noopener noreferrer" style={styles.buttonSuccess}>Save to Calendar</a>
            <div style={styles.buttonGroup}>
              <button onClick={() => setAppState('preview')} style={{...styles.button, ...styles.buttonSecondary}}>Edit</button>
              <button onClick={() => { setInputText(''); setAppState('input'); }} style={{...styles.button, ...styles.buttonSecondary}}>New Event</button>
            </div>
          </div>
        );
      default:
        return (
          <>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyPress} placeholder="e.g., Dinner with the team next Tuesday..." style={styles.textarea} />
            <button onClick={handleAnalyseText} disabled={isLoading} style={isLoading ? {...styles.button, ...styles.buttonDisabled} : styles.button}>{isLoading ? 'Analysing...' : 'Analyse Text'}</button>
          </>
        );
    }
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>BAVI Add to Cal</h1>
          <p style={styles.subtitle}>I'll analyse your text and create an editable event for you.</p>
        </div>
        {renderContent()}
        {errorMessage && appState === 'input' && <div style={styles.errorBox} role="alert"><p>{errorMessage}</p></div>}
      </div>
      <footer style={styles.footer}><p>Powered by Gemini</p></footer>
    </div>
  );
};

export default App;