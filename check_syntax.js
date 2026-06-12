const fs = require('fs');
const files = [
  'C:\\Users\\ASUS\\WorkBuddy\\Claw\\globetimezone\\js\\custom-cities.js',
  'C:\\Users\\ASUS\\WorkBuddy\\Claw\\globetimezone\\js\\earth-visual.js',
];
files.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    new Function(code);
    console.log('OK:', f.split('\\').pop());
  } catch(e) {
    console.log('ERROR in', f.split('\\').pop(), ':', e.message);
  }
});
