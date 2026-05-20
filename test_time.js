function testTimeExtraction(text) {
    let timeStr = '12:00:00';
    const timeMatch = text.match(/(?:([0-2]?[0-9])[:]+([0-5][0-9])(?:[:]+([0-5][0-9]))?\s*(AM|PM|am|pm)?)\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      let m = parseInt(timeMatch[2], 10);
      let s = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    console.log(`Original: "${text}" -> Extracted Time: ${timeStr}`);
}

testTimeExtraction('06/05/2026 14:30');
testTimeExtraction('Fecha: 05/05/2026 08:15 PM');
testTimeExtraction('05/05/2026 12:15 AM');
testTimeExtraction('No time here 05/05/2026');
testTimeExtraction('0610512026 20:50:11');
